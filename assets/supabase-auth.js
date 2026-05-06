/* ─────────────────────────────────────────────────────────────────────
   Tradexa — Supabase auth bridge
   ─────────────────────────────────────────────────────────────────────
   Exposes window.TxAuth with a stable API used across the app:

     TxAuth.ready()              → Promise<client>            resolves once SDK + session loaded
     TxAuth.getClient()          → SupabaseClient | null
     TxAuth.getSession()         → session | null             (synchronous, latest known)
     TxAuth.getUser()            → user | null                (synchronous)
     TxAuth.getToken()           → Promise<string | null>     (always fresh, auto-refreshed)
     TxAuth.userKey()            → string                     (for per-user localStorage scoping)
     TxAuth.signInWithPassword(email, password)               → Promise<{data,error}>
     TxAuth.signUp(email, password, {fullName})               → Promise<{data,error}>
     TxAuth.signInWithGoogle()                                → Promise<{data,error}>
     TxAuth.signOut()                                         → Promise<void> (redirects to /auth/login.html)

   Side effect on /app/* paths: auto-runs a guard that hides body until
   session is verified, redirects to /auth/login.html if not signed in.
   The guard cooperates with html.tx-auth-pending CSS injected by the
   page's <head> before this script loads.
   ───────────────────────────────────────────────────────────────────── */
(function (global) {
  'use strict';

  if (global.TxAuth) return; /* idempotent — only one client per page */

  /* Which OAuth provider buttons to render in the auth UI.
     Edit to remove any provider you haven't enabled in the Supabase dashboard.
     Supported here: 'google', 'github', 'discord'. */
  var PROVIDERS = ['google', 'github', 'discord'];

  var SUPABASE_URL  = null;
  var SUPABASE_ANON = null;
  var _client       = null;
  var _session      = null;
  var _user         = null;
  var _readyResolve, _readyReject;
  var _ready = new Promise(function (res, rej) { _readyResolve = res; _readyReject = rej; });

  /* ── Load supabase-js v2 UMD bundle from jsDelivr (CSP must allow it) ── */
  function _loadSdk() {
    return new Promise(function (resolve, reject) {
      if (global.supabase && global.supabase.createClient) return resolve();
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
      s.async = true;
      s.onload = function () {
        if (global.supabase && global.supabase.createClient) resolve();
        else reject(new Error('supabase-js failed to expose createClient'));
      };
      s.onerror = function () { reject(new Error('supabase-js script failed to load')); };
      document.head.appendChild(s);
    });
  }

  var _FALLBACK_CFG = {
    supabaseUrl:     'https://uaquknwpxdyujuousqwx.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcXVrbndweGR5dWp1b3VzcXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzNDcsImV4cCI6MjA5MzQyMDM0N30.guRhVgarac8OfxW-5pIyavVPkQIfEtSs-Bfo27FJvHo',
  };

  /* ── Load /api/public-config to get SUPABASE_URL + anon key ── */
  function _loadConfig() {
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem('txSupaCfg') || 'null'); } catch (e) {}
    if (cached && cached.supabaseUrl && cached.supabaseAnonKey) return Promise.resolve(cached);
    return fetch('/api/public-config', { credentials: 'omit' })
      .then(function (r) {
        if (!r.ok) throw new Error('public-config ' + r.status);
        return r.json();
      })
      .then(function (cfg) {
        if (!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
          throw new Error('Supabase config missing on server');
        }
        try { sessionStorage.setItem('txSupaCfg', JSON.stringify(cfg)); } catch (e) {}
        return cfg;
      })
      .catch(function () {
        try { sessionStorage.setItem('txSupaCfg', JSON.stringify(_FALLBACK_CFG)); } catch (e) {}
        return _FALLBACK_CFG;
      });
  }

  function _init() {
    return _loadConfig()
      .then(function (cfg) {
        SUPABASE_URL = cfg.supabaseUrl;
        SUPABASE_ANON = cfg.supabaseAnonKey;
        return _loadSdk();
      })
      .then(function () {
        _client = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
          auth: {
            persistSession:    true,
            autoRefreshToken:  true,
            detectSessionInUrl: true,
            storageKey:        'tx-sb-auth',
            flowType:          'implicit',
          },
        });
        return _client.auth.getSession();
      })
      .then(function (res) {
        _session = (res && res.data && res.data.session) || null;
        _user    = _session ? _session.user : null;
        _client.auth.onAuthStateChange(function (_event, sess) {
          _session = sess || null;
          _user    = _session ? _session.user : null;
          /* Broadcast a DOM event so the nav/sidebar can re-render. */
          try { document.dispatchEvent(new CustomEvent('tx-auth-change', { detail: { user: _user } })); } catch (e) {}
        });
        _readyResolve(_client);
        return _client;
      })
      .catch(function (err) {
        console.error('[TxAuth] init failed:', err);
        _readyReject(err);
        throw err;
      });
  }

  /* If init (CDN/config) fails, _ready rejects. Wrap auth calls so callers
     get a normal {data:null, error} shape instead of an unhandled rejection
     that traps the UI in a loading state forever. */
  function _wrap(promiseFactory) {
    return _ready.then(promiseFactory).catch(function (err) {
      return {
        data:  null,
        error: { message: (err && err.message) || 'Auth service unavailable. Try again in a moment.' },
      };
    });
  }

  /* ── Public API ── */
  var TxAuth = {
    ready:      function () { return _ready; },
    getClient:  function () { return _client; },
    getSession: function () { return _session; },
    getUser:    function () { return _user; },
    userKey:    function () { return _user ? _user.id : 'anon'; },

    getToken: function () {
      if (!_client) {
        return _ready.then(function () { return TxAuth.getToken(); }).catch(function () { return null; });
      }
      return _client.auth.getSession().then(function (r) {
        var s = r && r.data && r.data.session;
        return s ? s.access_token : null;
      }).catch(function () { return null; });
    },

    signInWithPassword: function (email, password) {
      return _wrap(function () {
        return _client.auth.signInWithPassword({ email: email, password: password });
      });
    },

    signUp: function (email, password, opts) {
      opts = opts || {};
      return _wrap(function () {
        return _client.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { full_name: opts.fullName || '' },
            emailRedirectTo: window.location.origin + '/auth/callback.html',
          },
        });
      });
    },

    PROVIDERS: PROVIDERS,

    signInWithOAuth: function (provider) {
      return _wrap(function () {
        return _client.auth.signInWithOAuth({
          provider: provider,
          options: { redirectTo: window.location.origin + '/auth/callback.html' },
        });
      });
    },

    signInWithGoogle:  function () { return TxAuth.signInWithOAuth('google');  },
    signInWithGitHub:  function () { return TxAuth.signInWithOAuth('github');  },
    signInWithDiscord: function () { return TxAuth.signInWithOAuth('discord'); },

    resetPassword: function (email) {
      return _wrap(function () {
        return _client.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/auth/reset.html',
        });
      });
    },

    updatePassword: function (newPassword) {
      return _wrap(function () {
        return _client.auth.updateUser({ password: newPassword });
      });
    },

    /* Post-login perception layer: success → securing → welcome → redirect.
       Total ~2.6s. Animation only — does not delay session creation. */
    runLoginTransition: function (opts) {
      opts = opts || {};
      var redirectTo = opts.redirectTo || '/app/dashboard.html';

      /* Body may not be parsed yet if called extremely early — defer. */
      if (!document.body) {
        return void document.addEventListener('DOMContentLoaded', function () {
          TxAuth.runLoginTransition(opts);
        });
      }
      /* Idempotent — never stack overlays if called twice. */
      if (document.getElementById('tx-login-overlay')) return;

      var user       = opts.user || _user || {};
      var meta       = (user && user.user_metadata) || {};
      var name       = (meta.full_name || meta.name ||
                        (user.email ? user.email.split('@')[0] : 'trader')).trim();
      var firstName  = name.split(/\s+/)[0] || 'trader';
      var avatarUrl  = meta.avatar_url || meta.picture || '';
      var initials   = ((name.split(/\s+/)[0]||'T').charAt(0) +
                        ((name.split(/\s+/)[1]||'').charAt(0))).toUpperCase() || 'TX';

      /* Inject styles once. */
      if (!document.getElementById('tx-login-anim-css')) {
        var s = document.createElement('style');
        s.id = 'tx-login-anim-css';
        s.textContent =
          '#tx-login-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
            'background:rgba(13,15,18,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);' +
            'opacity:0;transition:opacity .25s ease;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;color:#e7e8ea}' +
          '#tx-login-overlay.show{opacity:1}' +
          '#tx-login-overlay.fade-out{opacity:0;transition:opacity .35s ease}' +
          '.tx-anim-card{display:flex;flex-direction:column;align-items:center;gap:18px;padding:36px 40px;min-width:280px;max-width:360px;' +
            'background:rgba(19,22,27,.65);border:1px solid rgba(255,255,255,.08);border-radius:18px;' +
            'box-shadow:0 30px 80px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.02) inset;text-align:center}' +
          '.tx-anim-title{font-size:15.5px;font-weight:600;letter-spacing:-.005em;margin:0}' +
          '.tx-anim-sub{font-size:12.5px;color:#9ca3af;margin:0}' +
          '.tx-anim-check{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;' +
            'background:rgba(34,197,94,.12);border:1.5px solid rgba(34,197,94,.45);' +
            'box-shadow:0 0 0 0 rgba(34,197,94,.6);animation:tx-pulse 1.4s ease-out infinite}' +
          '.tx-anim-check svg{width:32px;height:32px;stroke:#22c55e;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round;' +
            'stroke-dasharray:36;stroke-dashoffset:36;animation:tx-draw .55s .12s ease-out forwards}' +
          '@keyframes tx-pulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)}70%{box-shadow:0 0 0 22px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}' +
          '@keyframes tx-draw{to{stroke-dashoffset:0}}' +
          '.tx-anim-ring{width:54px;height:54px;border:3px solid rgba(255,183,50,.18);border-top-color:#FFB732;border-radius:50%;animation:tx-spin .85s linear infinite}' +
          '@keyframes tx-spin{to{transform:rotate(360deg)}}' +
          '.tx-anim-avatar{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;' +
            'background:linear-gradient(135deg,#1f242c,#13161b);border:1.5px solid rgba(255,183,50,.5);' +
            'color:#FFB732;font-weight:700;font-size:21px;background-size:cover;background-position:center;' +
            'box-shadow:0 0 0 4px rgba(255,183,50,.08)}' +
          '.tx-anim-step{display:none;flex-direction:column;align-items:center;gap:14px;animation:tx-step-in .35s ease-out}' +
          '.tx-anim-step.active{display:flex}' +
          '@keyframes tx-step-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}' +
          '@media(prefers-reduced-motion:reduce){' +
            '.tx-anim-check,.tx-anim-check svg,.tx-anim-ring,.tx-anim-step{animation:none!important}' +
            '#tx-login-overlay,#tx-login-overlay.fade-out{transition:none}' +
          '}';
        document.head.appendChild(s);
      }

      function _esc(x){ return String(x||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
      var avStyle = avatarUrl ? 'background-image:url('+_esc(avatarUrl)+')' : '';
      var avInner = avatarUrl ? '' : _esc(initials);

      var ov = document.createElement('div');
      ov.id = 'tx-login-overlay';
      ov.innerHTML =
        '<div class="tx-anim-card">' +
          '<div class="tx-anim-step active" data-step="1">' +
            '<div class="tx-anim-check"><svg viewBox="0 0 24 24"><polyline points="5 12 10 17 19 8"/></svg></div>' +
            '<p class="tx-anim-title">Authentication successful</p>' +
            '<p class="tx-anim-sub">Establishing secure session…</p>' +
          '</div>' +
          '<div class="tx-anim-step" data-step="2">' +
            '<div class="tx-anim-ring"></div>' +
            '<p class="tx-anim-title">Securing session</p>' +
            '<p class="tx-anim-sub">Verifying credentials with the server</p>' +
          '</div>' +
          '<div class="tx-anim-step" data-step="3">' +
            '<div class="tx-anim-avatar" style="'+avStyle+'">'+avInner+'</div>' +
            '<p class="tx-anim-title">Welcome back, '+_esc(firstName)+'</p>' +
            '<p class="tx-anim-sub">Loading your trading desk…</p>' +
          '</div>' +
        '</div>';
      document.body.appendChild(ov);
      /* Force a reflow then fade in. */
      void ov.offsetWidth;
      ov.classList.add('show');

      function step(n){
        var nodes = ov.querySelectorAll('.tx-anim-step');
        for (var i=0;i<nodes.length;i++) nodes[i].classList.remove('active');
        var t = ov.querySelector('.tx-anim-step[data-step="'+n+'"]');
        if (t) t.classList.add('active');
      }

      var reduced = false;
      try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}
      var T1 = reduced ? 200 : 700;
      var T2 = reduced ? 200 : 950;
      var T3 = reduced ? 200 : 800;
      var T4 = reduced ? 80  : 350;

      setTimeout(function(){ step(2); }, T1);
      setTimeout(function(){ step(3); }, T1 + T2);
      setTimeout(function(){
        ov.classList.add('fade-out');
        setTimeout(function(){ window.location.replace(redirectTo); }, T4);
      }, T1 + T2 + T3);
    },

    signOut: function () {
      var go = function () {
        try {
          sessionStorage.removeItem('txSupaCfg');
          /* Wipe per-user cached AI artifacts so the next user on this
             browser does not inherit them. Add new cache keys here. */
          ['txInsights_v1','txWeeklyReviews_v1','txDailyDigest_v1'].forEach(function(k){
            try { localStorage.removeItem(k); } catch (e) {}
          });
          /* Wipe per-user trade store + cached profile rows. */
          try {
            for (var i = localStorage.length - 1; i >= 0; i--) {
              var k = localStorage.key(i);
              if (k && (k.indexOf('txTrades_v1::') === 0 || k.indexOf('txUserProfile_v1::') === 0)) {
                localStorage.removeItem(k);
              }
            }
          } catch (e) {}
          if (window.TxProfile && window.TxProfile.clearCache) window.TxProfile.clearCache();
        } catch (e) {}
        window.location.href = '/auth/login.html';
      };
      if (!_client) { go(); return Promise.resolve(); }
      return _client.auth.signOut().then(go, go);
    },
  };

  global.TxAuth = TxAuth;

  /* ── Kick off init immediately ── */
  _init();

  /* ── Auth guard — only on /app/* routes ── */
  if (/^\/app\//.test(window.location.pathname)) {
    /* Belt-and-suspenders: ensure body is hidden if the inline CSS didn't load. */
    if (!document.documentElement.classList.contains('tx-auth-pending')) {
      document.documentElement.classList.add('tx-auth-pending');
    }
    _ready.then(function () {
      if (!_session) {
        var next = window.location.pathname + window.location.search;
        window.location.replace('/auth/login.html?next=' + encodeURIComponent(next));
      } else {
        document.documentElement.classList.remove('tx-auth-pending');
      }
    }).catch(function () {
      /* Fail-closed: any init failure → bounce to login. */
      window.location.replace('/auth/login.html');
    });
  }
})(window);
