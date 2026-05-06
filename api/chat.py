"""Vercel handler for POST /api/chat â€” Trade Bot. Supports ?stream=1 SSE."""
from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.error

import _shared as S


class handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args): pass

    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in S.CORS_HEADERS.items(): self.send_header(k, v)
        self.end_headers()

    def _respond(self, status, data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        for k, v in S.CORS_HEADERS.items(): self.send_header(k, v)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if S.verify_supabase_jwt(self.headers) is None:
            self._respond(401, {'error': 'Authentication required. Please sign in to use Trade Bot.'}); return
        try:
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length))
        except Exception:
            self._respond(400, {'error': 'Invalid request body'}); return

        messages      = data.get('messages', [])
        trade_context = data.get('tradeContext', None)
        if not messages:
            self._respond(400, {'error': 'No messages provided'}); return

        want_stream = '?stream=1' in self.path or '&stream=1' in self.path

        if not S.GEMINI_API_KEY:
            self._respond(503, {'error': 'AI is not configured on this server.'}); return

        system_prompt = S.TRADEBOT_SYSTEM
        if trade_context and trade_context.strip() and 'NO_TRADES' not in trade_context:
            system_prompt = (
                S.TRADEBOT_SYSTEM + "\n\n"
                "IMPORTANT: The following is real trade journal data for this specific user. "
                "Use it to give highly personalized, data-driven coaching. "
                "Reference their actual numbers, setups, emotions, and patterns directly.\n\n"
                + trade_context
            )

        gemini_contents = [
            {'role': 'user' if m.get('role') == 'user' else 'model',
             'parts': [{'text': m.get('content', '')}]}
            for m in messages
        ]
        payload = {
            'system_instruction': {'parts': [{'text': system_prompt}]},
            'contents': gemini_contents,
            'generationConfig': {'temperature': 0.7, 'maxOutputTokens': 700, 'topP': 0.95},
        }

        if want_stream:
            self._stream(payload); return

        try:
            text = S.gemini_call(payload)
            self._respond(200, {'reply': text})
        except urllib.error.HTTPError as e:
            print(f'Gemini HTTP error {e.code}: {e.read().decode("utf-8") if e.fp else ""}')
            if e.code == 429:
                self._respond(429, {'error': 'Trade Bot is busy â€” rate limit reached. Try again in a moment.'})
            else:
                self._respond(502, {'error': 'AI service temporarily unavailable â€” please try again shortly'})
        except Exception as e:
            print(f'Chat error: {e}')
            self._respond(500, {'error': 'Something went wrong â€” please try again'})

    def _stream(self, payload):
        try:
            req = urllib.request.Request(
                f'{S.GEMINI_STREAM_URL}?alt=sse&key={S.GEMINI_API_KEY}',
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST',
            )
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('X-Accel-Buffering', 'no')
            for k, v in S.CORS_HEADERS.items():
                if k != 'Content-Type':
                    self.send_header(k, v)
            self.end_headers()

            with urllib.request.urlopen(req, timeout=60) as resp:
                for raw in resp:
                    line = raw.decode('utf-8', errors='ignore').strip()
                    if not line.startswith('data:'): continue
                    body = line[5:].strip()
                    if not body: continue
                    try: obj = json.loads(body)
                    except Exception: continue
                    cands = obj.get('candidates', [])
                    if not cands: continue
                    parts = cands[0].get('content', {}).get('parts', [])
                    text = ''.join(p.get('text', '') for p in parts)
                    if text:
                        self.wfile.write(b'data: ' + json.dumps({'chunk': text}).encode() + b'\n\n')
                        self.wfile.flush()
            self.wfile.write(b'data: ' + json.dumps({'done': True}).encode() + b'\n\n')
            self.wfile.flush()
        except Exception as e:
            print(f'Stream error: {e}')
            try: self.wfile.write(b'data: ' + json.dumps({'error': 'stream_failed'}).encode() + b'\n\n')
            except Exception: pass
