"""Vercel handler for POST /api/weekly-review — real Gemini weekly review."""
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

        week_start = data.get('weekStart', '')
        week_end   = data.get('weekEnd', '')
        stats      = data.get('stats', {})
        trades     = data.get('trades', []) or []
        if not trades:
            self._respond(400, {'error': 'No trades in the requested week'}); return

        lines = [
            f'WEEK: {week_start} → {week_end}',
            f'Trades: {len(trades)}',
            f'Win rate: {stats.get("winRate","?")}%',
            f'Net P&L: ${stats.get("totalPnl","?")}',
            f'Avg R:R: {stats.get("avgRR","?")}',
            f'Profit factor: {stats.get("profitFactor","?")}',
            f'Calm: {stats.get("calmCount",0)}, FOMO: {stats.get("fomoCount",0)}, '
            f'Revenge: {stats.get("revengeCount",0)}, Greedy: {stats.get("greedyCount",0)}',
            '', 'TRADES THIS WEEK:'
        ]
        for t in trades[:40]:
            outcome = f'+${t.get("pnl",0)}' if (t.get('pnl') or 0) > 0 else f'${t.get("pnl",0)}'
            lines.append(
                f'- {(t.get("date") or "")[:10]} {t.get("asset","?")} '
                f'{(t.get("direction") or "").upper()} | '
                f'setup: {",".join(t.get("setup") or [])} | '
                f'emotion: {",".join(t.get("emotion") or [])} | '
                f'{outcome} | R:R {t.get("rr",0)} | rating {t.get("rating",0)}/5 | '
                f'note: "{(t.get("notes") or "")[:120]}"'
            )
        user_text = (
            'Generate a structured weekly performance review for this trader. '
            'Cite specific trades, emotions, and numbers from the data. Be honest about both wins and mistakes.\n\n'
            + '\n'.join(lines)
        )
        payload = S.gemini_payload(
            S.WEEKLY_REVIEW_SYSTEM, user_text,
            json_mode=True, schema=S.WEEKLY_REVIEW_SCHEMA,
            temperature=0.5, max_tokens=1400,
        )
        try:
            text = S.gemini_call(payload, timeout=45)
            review = S.safe_json_loads(text)
            if not isinstance(review, dict) or 'summary' not in review:
                self._respond(502, {'error': 'AI review returned an unreadable response — please retry'})
                return
            review['weekStart']  = week_start
            review['weekEnd']    = week_end
            review['tradeCount'] = len(trades)
            review['netPnl']     = stats.get('totalPnl', 0)
            self._respond(200, review)
        except urllib.error.HTTPError as e:
            print(f'Weekly review Gemini error {e.code}: {e.read().decode("utf-8") if e.fp else ""}')
            self._respond(502, {'error': 'AI review service temporarily unavailable'})
        except Exception as e:
            print(f'Weekly review error: {e}')
            self._respond(500, {'error': 'Could not generate review — please try again'})
