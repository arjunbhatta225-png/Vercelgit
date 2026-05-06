"""
Shared helpers for Vercel /api Python serverless functions.

Filename starts with underscore â†’ Vercel does not route it.
Each handler can `import _shared` to reuse the Gemini call helper, the
JSON-mode prompts/schemas, and the Supabase JWT verifier.
"""
import os
import re
import json
import time
import hmac
import hashlib
import base64
import urllib.request
import urllib.error

GEMINI_API_KEY     = os.environ.get('GEMINI_API_KEY', '')
GEMINI_MODEL       = 'gemini-2.5-flash'
GEMINI_BASE        = f'https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}'
GEMINI_URL         = f'{GEMINI_BASE}:generateContent'
GEMINI_STREAM_URL  = f'{GEMINI_BASE}:streamGenerateContent'

SUPABASE_URL         = os.environ.get('SUPABASE_URL', '')
SUPABASE_ANON_KEY    = os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_JWT_SECRET  = os.environ.get('SUPABASE_JWT_SECRET', '')

def _https_origin(host):
    host = (host or '').strip().rstrip('/')
    if not host:
        return ''
    return host if host.startswith(('http://', 'https://')) else f'https://{host}'


CORS_ALLOWED_ORIGIN = (
    os.environ.get('CORS_ALLOWED_ORIGIN', '').strip().rstrip('/')
    or _https_origin(os.environ.get('VERCEL_PROJECT_PRODUCTION_URL', ''))
    or _https_origin(os.environ.get('VERCEL_URL', ''))
)
CORS_HEADERS = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type':                 'application/json',
}


if CORS_ALLOWED_ORIGIN:
    CORS_HEADERS['Access-Control-Allow-Origin'] = CORS_ALLOWED_ORIGIN

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Supabase JWT verification (stdlib HS256) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _b64url_decode(s):
    """Decode a base64url string with missing padding."""
    s += '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)


def verify_supabase_jwt(headers):
    """Verify a Supabase JWT from an HTTP `Authorization: Bearer <token>` header.

    Returns the decoded payload dict (with `sub`, `email`, etc.) on success,
    or None if missing / invalid / expired. Uses HS256 with SUPABASE_JWT_SECRET.

    If SUPABASE_JWT_SECRET is not configured, returns None and the caller
    should treat that as fail-closed."""
    if not SUPABASE_JWT_SECRET:
        return None
    auth = headers.get('Authorization') or headers.get('authorization') or ''
    if not auth.startswith('Bearer '):
        return None
    token = auth[7:].strip()
    try:
        h_b64, p_b64, sig_b64 = token.split('.')
        msg = (h_b64 + '.' + p_b64).encode('ascii')
        expected = hmac.new(SUPABASE_JWT_SECRET.encode('utf-8'), msg, hashlib.sha256).digest()
        actual = _b64url_decode(sig_b64)
        if not hmac.compare_digest(expected, actual):
            return None
        header = json.loads(_b64url_decode(h_b64))
        if header.get('alg') != 'HS256':
            return None
        payload = json.loads(_b64url_decode(p_b64))
        # Expiry check (with small clock-skew tolerance).
        if payload.get('exp', 0) < (time.time() - 5):
            return None
        # Supabase access tokens carry aud='authenticated'.
        if payload.get('aud') and payload.get('aud') != 'authenticated':
            return None
        return payload
    except Exception:
        return None


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Gemini helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def gemini_payload(system_prompt, user_text, *, json_mode=False, schema=None,
                   temperature=0.4, max_tokens=900):
    cfg = {'temperature': temperature, 'maxOutputTokens': max_tokens, 'topP': 0.95}
    if json_mode:
        cfg['responseMimeType'] = 'application/json'
        if schema:
            cfg['responseSchema'] = schema
    return {
        'system_instruction': {'parts': [{'text': system_prompt}]},
        'contents': [{'role': 'user', 'parts': [{'text': user_text}]}],
        'generationConfig': cfg,
    }


def gemini_call(payload, timeout=30, retries=2):
    """POST to Gemini with retry-with-backoff on transient 429 / 5xx errors."""
    delay = 0.6
    last_err = None
    for attempt in range(retries + 1):
        req = urllib.request.Request(
            f'{GEMINI_URL}?key={GEMINI_API_KEY}',
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                result = json.loads(resp.read().decode('utf-8'))
            candidates = result.get('candidates', [])
            if not candidates:
                raise ValueError('No candidates returned from Gemini')
            return candidates[0]['content']['parts'][0]['text']
        except urllib.error.HTTPError as e:
            last_err = e
            transient = e.code == 429 or 500 <= e.code < 600
            if not transient or attempt == retries:
                raise
            time.sleep(delay); delay *= 2
        except (urllib.error.URLError, TimeoutError) as e:
            last_err = e
            if attempt == retries:
                raise
            time.sleep(delay); delay *= 2
    if last_err: raise last_err
    raise RuntimeError('gemini_call exhausted retries')


def safe_json_loads(text, fallback=None):
    if not text: return fallback
    try: return json.loads(text)
    except Exception: pass
    m = re.search(r'```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```', text, re.DOTALL)
    if m:
        try: return json.loads(m.group(1))
        except Exception: pass
    for opener, closer in (('{', '}'), ('[', ']')):
        i = text.find(opener)
        j = text.rfind(closer)
        if 0 <= i < j:
            try: return json.loads(text[i:j+1])
            except Exception: continue
    return fallback


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Prompts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

TRADEBOT_SYSTEM = (
    "You are Trade Bot, the AI assistant built into Tradexa â€” a professional trading journal "
    "and performance analytics platform. You help traders understand their journal data, "
    "analyze performance, identify behavioral mistakes, and improve consistency.\n\n"
    "CAPABILITIES:\n"
    "- Explain trading metrics: Sharpe ratio, R:R, max drawdown, expectancy, win rate, profit factor\n"
    "- Analyze behavioral patterns: FOMO entries, revenge trading, overtrading, emotional decisions\n"
    "- Review recent trades and suggest discipline improvements\n"
    "- Help users navigate the Tradexa platform\n"
    "- Generate weekly performance review summaries and action steps\n"
    "- Identify repeated mistakes and how to fix them\n\n"
    "RULES:\n"
    "- Never provide live trade signals or specific buy/sell recommendations\n"
    "- Never guarantee profits or predict market direction\n"
    "- Always frame advice as educational analysis, not financial advice\n"
    "- Be concise, direct, and actionable â€” like a real trading coach\n"
    "- If no trade data is provided in the conversation, encourage the user to log trades first\n"
    "- Use bullet points for clarity when listing multiple insights\n"
    "- Keep responses under 300 words unless a detailed analysis is explicitly requested\n\n"
    "TONE: Professional, calm, honest. Like a coach who respects the trader's intelligence."
)

WEEKLY_REVIEW_SYSTEM = (
    "You are Tradexa's weekly performance reviewer. You analyze a trader's week and produce "
    "a brutally honest, specific, structured review. Reference real numbers from the data. "
    "Wins must cite actual trades or behaviors. Mistakes must reference specific trades or patterns. "
    "Focus items must be concrete actions for next week, not platitudes. "
    "If data is sparse, say so honestly instead of inventing detail."
)

WEEKLY_REVIEW_SCHEMA = {
    "type": "object",
    "properties": {
        "title":   {"type": "string"},
        "score":   {"type": "integer"},
        "summary": {"type": "string"},
        "wins": {
            "type": "array",
            "items": {"type":"object","properties":{"title":{"type":"string"},"detail":{"type":"string"}},"required":["title","detail"]}
        },
        "mistakes": {
            "type": "array",
            "items": {"type":"object","properties":{"title":{"type":"string"},"detail":{"type":"string"},"severity":{"type":"string","enum":["red","yellow"]}},"required":["title","detail","severity"]}
        },
        "focus": {
            "type": "array",
            "items": {"type":"object","properties":{"title":{"type":"string"},"detail":{"type":"string"}},"required":["title","detail"]}
        }
    },
    "required": ["title","score","summary","wins","mistakes","focus"]
}

INSIGHTS_SYSTEM = (
    "You are Tradexa's insights engine. Given a trader's journal data, return a tight, "
    "specific insight panel for the requested scope. Cite real numbers. Be direct. "
    "Never invent metrics that aren't in the data."
)

INSIGHTS_SCHEMA = {
    "type": "object",
    "properties": {
        "headline":     {"type": "string"},
        "strength":     {"type": "string"},
        "weakness":     {"type": "string"},
        "suggestion":   {"type": "string"},
        "focus_metric": {"type": "string"}
    },
    "required": ["headline","strength","weakness","suggestion","focus_metric"]
}
