"""Vercel handler for GET /api/public-config — returns Supabase URL + anon key.

Both values are *public* (anon key is meant to be embedded in browser code,
gated by Supabase Row-Level-Security on the data side). This endpoint exists
so the frontend doesn't need build-time templating.
"""
from http.server import BaseHTTPRequestHandler
import json

import _shared as S


class handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args): pass

    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in S.CORS_HEADERS.items(): self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        configured = bool(S.SUPABASE_URL and S.SUPABASE_ANON_KEY)
        body = json.dumps({
            'supabaseUrl':     S.SUPABASE_URL or None,
            'supabaseAnonKey': S.SUPABASE_ANON_KEY or None,
            'configured':      configured,
            'error':           None if configured else 'Supabase is not configured on the server. Set SUPABASE_URL and SUPABASE_ANON_KEY.',
        }).encode('utf-8')
        # 200 if configured, 503 if not — frontend can surface a clear message.
        self.send_response(200 if configured else 503)
        for k, v in S.CORS_HEADERS.items(): self.send_header(k, v)
        # Don't cache an unconfigured response; cache configured for a short while.
        self.send_header('Cache-Control', 'public, max-age=300' if configured else 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
