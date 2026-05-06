"""Vercel handler for POST /api/insights — shared AI insight panel data."""
from http.server import BaseHTTPRequestHandler
import json
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
            self._respond(401, {'error': 'Authentication required.'}); return
        if not S.GEMINI_API_KEY:
            self._respond(503, {'error': 'AI is not configured on this server.'}); return
        try:
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length))
        except Exception:
            self._respond(400, {'error': 'Invalid request body'}); return

        scope         = (data.get('scope') or 'dashboard').strip()
        trade_context = (data.get('tradeContext') or '').strip()
        if not trade_context or 'NO_TRADES' in trade_context:
            self._respond(200, {
                'headline':     'Log a few trades to unlock insights',
                'strength':     'No trades yet — your insight engine activates after 5+ logged trades.',
                'weakness':     'Without data, AI can only give generic advice.',
                'suggestion':   'Open the Journal and log your most recent trade.',
                'focus_metric': 'Trades logged: 0',
                'empty':        True,
            })
            return

        scope_hint = {
            'dashboard': 'Focus on overall performance and the single biggest pattern.',
            'journal':   'Focus on recent trades and immediate behavioral patterns.',
            'analytics': 'Focus on setup/asset edges and statistical leaks.',
        }.get(scope, 'Give a balanced overview.')

        user_text = (
            f'Scope: {scope}. {scope_hint}\n\n'
            'Return a tight insight panel for this trader based on the journal data below.\n\n'
            + trade_context
        )
        payload = S.gemini_payload(
            S.INSIGHTS_SYSTEM, user_text,
            json_mode=True, schema=S.INSIGHTS_SCHEMA,
            temperature=0.4, max_tokens=600,
        )
        try:
            text = S.gemini_call(payload, timeout=25)
            parsed = S.safe_json_loads(text)
            if not isinstance(parsed, dict) or 'headline' not in parsed:
                self._respond(502, {'error': 'AI insights returned an unreadable response — please retry'})
                return
            self._respond(200, parsed)
        except urllib.error.HTTPError as e:
            print(f'Insights Gemini error {e.code}: {e.read().decode("utf-8") if e.fp else ""}')
            self._respond(502, {'error': 'AI insights service temporarily unavailable'})
        except Exception as e:
            print(f'Insights error: {e}')
            self._respond(500, {'error': 'Could not generate insights — please try again'})
