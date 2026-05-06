/* ─────────────────────────────────────────────────────────────────────
   Tradexa — TxProfile (role + plan resolver)
   ─────────────────────────────────────────────────────────────────────
   Reads the signed-in user's row from public.profiles via Supabase
   and exposes a stable API for guarding UI by role/plan.

     TxProfile.ready()        → Promise<profile|null>
     TxProfile.get()          → {id,email,role,plan,full_name} | null   (sync, last known)
     TxProfile.isAdmin()      → boolean
     TxProfile.getPlan()      → 'free' | 'premium'
     TxProfile.applyGuards()  → hides [data-tx-admin] for non-admins,
                                hides [data-tx-plan="premium"] for free users.
                                On /admin/* pages, redirects non-admins to /app/dashboard.html.
                                Auto-runs on DOMContentLoaded.

   Also exports a CSS rule that hides guarded elements until profile
   resolves, preventing a flash of restricted UI.
   ───────────────────────────────────────────────────────────────────── */
(function (global) {
  'use strict';
  if (global.TxProfile) return;

  /* Hide guarded UI until resolution. Removed by applyGuards(). */
  try {
    var s = document.createElement('style');
    s.id = 'tx-profile-guard-css';
    s.textContent =
      '[data-tx-admin],[data-tx-plan="premium"]{visibility:hidden!important}' +
      'html.tx-profile-resolved [data-tx-admin],' +
      'html.tx-profile-resolved [data-tx-plan]{visibility:visible!important}';
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {}

  var _profile = null;
  var _readyResolve;
  var _ready = new Promise(function (res) { _readyResolve = res; });

  function _cacheKey(uid) { return 'tx-profile::' + uid; }

  function _readCache(uid) {
    try {
      var raw = sessionStorage.getItem(_cacheKey(uid));
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function _writeCache(uid, p) {
    try { sessionStorage.setItem(_cacheKey(uid), JSON.stringify(p)); } catch (e) {}
  }

  function _fetchProfile() {
    if (!global.TxAuth) {
      _readyResolve(null); return Promise.resolve(null);
    }
    return global.TxAuth.ready()
      .then(function () {
        var u = global.TxAuth.getUser();
        var client = global.TxAuth.getClient();
        if (!u || !client) { _readyResolve(null); return null; }

        /* Show cached row immediately so the UI doesn't flash. */
        var cached = _readCache(u.id);
        if (cached) {
          _profile = cached;
          _markResolved();
        }

        return client
          .from('profiles')
          .select('id,email,role,plan,full_name')
          .eq('id', u.id)
          .maybeSingle()
          .then(function (r) {
            if (r && r.data) {
              _profile = r.data;
              _writeCache(u.id, _profile);
            } else if (!cached) {
              /* Profile row missing — treat as a regular free user.
                 The DB trigger should have created it; this is a
                 fail-soft so the UI never breaks. */
              _profile = {
                id: u.id, email: u.email, role: 'user',
                plan: 'free', full_name: ''
              };
            }
            _markResolved();
            _readyResolve(_profile);
            return _profile;
          })
          .catch(function (err) {
            console.warn('[TxProfile] fetch failed:', err && err.message);
            if (!_profile) {
              _profile = {
                id: u.id, email: u.email, role: 'user',
                plan: 'free', full_name: ''
              };
            }
            _markResolved();
            _readyResolve(_profile);
            return _profile;
          });
      })
      .catch(function () { _readyResolve(null); return null; });
  }

  function _markResolved() {
    try {
      document.documentElement.classList.add('tx-profile-resolved');
      /* On /admin/* the auth-guard <style> hides body until tx-auth-pending
         is removed. supabase-auth.js only clears that class on /app/*, so
         admin pages would stay invisible forever otherwise. Clear it here
         once the profile has resolved (or failed) — applyGuards will then
         either reveal the admin UI or redirect non-admins away. */
      document.documentElement.classList.remove('tx-auth-pending');
    } catch (e) {}
  }

  /* Hard failsafe: if Supabase is wedged and TxProfile never resolves
     within 6s, drop the pending class so the page is at least visible
     (the guard redirect would still fire later if a profile arrives). */
  setTimeout(function () {
    try { document.documentElement.classList.remove('tx-auth-pending'); } catch (e) {}
    if (!_profile) _readyResolve(null);
  }, 6000);

  /* ── Guard utility ── */
  function applyGuards() {
    var isAdminPath = /^\/admin(\/|$)/.test(window.location.pathname);

    return _ready.then(function (p) {
      var admin = !!(p && p.role === 'admin');
      var plan  = (p && p.plan) || 'free';

      /* Hide admin-only UI for non-admins. */
      if (!admin) {
        var adminEls = document.querySelectorAll('[data-tx-admin]');
        for (var i = 0; i < adminEls.length; i++) {
          adminEls[i].style.display = 'none';
        }
      }

      /* Hide premium-only UI for free users. */
      if (plan !== 'premium') {
        var premiumEls = document.querySelectorAll('[data-tx-plan="premium"]');
        for (var j = 0; j < premiumEls.length; j++) {
          premiumEls[j].style.display = 'none';
        }
      }

      /* Tag <body> with current plan/role for CSS hooks. */
      try {
        document.body.setAttribute('data-tx-role', admin ? 'admin' : 'user');
        document.body.setAttribute('data-tx-plan', plan);
      } catch (e) {}

      _markResolved();

      /* Hard redirect non-admins off any /admin/* page. */
      if (isAdminPath && !admin) {
        window.location.replace('/app/dashboard.html');
      }
      return p;
    });
  }

  global.TxProfile = {
    ready:        function () { return _ready; },
    get:          function () { return _profile; },
    isAdmin:      function () { return !!(_profile && _profile.role === 'admin'); },
    getPlan:      function () { return (_profile && _profile.plan) || 'free'; },
    applyGuards:  applyGuards,
    /* Clear cache on signout — called from supabase-auth.js. */
    clearCache:   function () {
      try {
        for (var i = sessionStorage.length - 1; i >= 0; i--) {
          var k = sessionStorage.key(i);
          if (k && k.indexOf('tx-profile::') === 0) sessionStorage.removeItem(k);
        }
      } catch (e) {}
      _profile = null;
    },
  };

  /* Kick off the fetch as soon as TxAuth is available (poll briefly). */
  function _kick() {
    if (global.TxAuth) return _fetchProfile();
    setTimeout(_kick, 50);
  }
  _kick();

  /* Auto-apply guards on DOMContentLoaded. Pages can opt out by
     calling TxProfile.applyGuards() manually if they need ordering. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGuards);
  } else {
    applyGuards();
  }
})(window);
