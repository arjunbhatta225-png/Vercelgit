/**
 * TxInsights — shared "AI insights" panel used by Dashboard, Journal, Analytics.
 *
 * Calls POST /api/insights with the user's trade context and renders a small
 * Edge / Leak / Action / Focus card. Results cached for 30 minutes per scope
 * so we don't hammer Gemini on every page navigation.
 *
 * Public API:
 *   TxInsights.mount(scope, container)
 *     scope: 'dashboard' | 'journal' | 'analytics'
 *     container: an element to render into
 *   TxInsights.refresh(scope)   — clear cache for that scope
 *   TxInsights.load(scope)      — returns Promise<insightData>
 */
(function(global){
  var KEY = 'txInsights_v1';
  var TTL = 30 * 60 * 1000;          // 30 min
  var API_BASE = (global.TX_API_BASE || '').replace(/\/$/, '');

  /* Per-user scoping so two accounts on the same browser don't see each
     other's cached insights. Uses Supabase user id when available. */
  function _userKey(){
    try { if (global.TxAuth && global.TxAuth.userKey) return global.TxAuth.userKey() || 'anon'; }
    catch(e){}
    return 'anon';
  }
  function _scopeKey(scope){ return _userKey() + '::' + scope; }

  function _readCache(){
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e){ return {}; }
  }
  function _writeCache(scope, data){
    try {
      var c = _readCache();
      c[_scopeKey(scope)] = { ts: Date.now(), data: data };
      localStorage.setItem(KEY, JSON.stringify(c));
    } catch(e){}
  }

  function _esc(s){
    return String(s == null ? '' : s).replace(/[<>&"']/g, function(c){
      return ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  function _fetch(scope){
    var ctx = '';
    if (global.TxTradeData) {
      try { ctx = global.TxTradeData.getTradeContext(); } catch(e){}
    }
    var hdrs = {'Content-Type': 'application/json'};
    var tokenP = (global.TxAuth && global.TxAuth.getToken)
      ? global.TxAuth.getToken().catch(function(){ return null; })
      : Promise.resolve(null);
    return tokenP.then(function(tok){
      if (tok) hdrs['Authorization'] = 'Bearer ' + tok;
      return fetch((API_BASE || '') + '/api/insights', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ scope: scope, tradeContext: ctx })
      }).then(function(r){
        /* Guard against non-JSON responses (static host returning HTML 404). */
        return r.text().then(function(raw){
          var d = {};
          try { d = raw ? JSON.parse(raw) : {}; }
          catch(e){
            throw new Error(r.status === 404
              ? 'AI Coach is not available on this deployment.'
              : 'AI service returned an unreadable response (' + r.status + ').');
          }
          if (!r.ok) throw new Error(d.error || ('HTTP ' + r.status));
          return d;
        });
      });
    });
  }

  function load(scope, opts){
    opts = opts || {};
    if (!opts.fresh) {
      var entry = _readCache()[_scopeKey(scope)];
      if (entry && (Date.now() - entry.ts) < TTL) {
        return Promise.resolve(entry.data);
      }
    }
    return _fetch(scope).then(function(data){
      _writeCache(scope, data);
      return data;
    });
  }

  function _injectSpinnerCSS(){
    if (document.getElementById('tx-insights-style')) return;
    var st = document.createElement('style');
    st.id = 'tx-insights-style';
    st.textContent =
      '@keyframes tx-ins-spin{to{transform:rotate(360deg)}}' +
      '.tx-ins-spin{width:10px;height:10px;border:2px solid rgba(255,183,50,.22);border-top-color:#FFB732;border-radius:50%;display:inline-block;animation:tx-ins-spin .8s linear infinite;vertical-align:-1px}' +
      '.tx-ins-row{display:flex;gap:9px;align-items:flex-start}' +
      '.tx-ins-arrow{flex-shrink:0;font-size:12px;line-height:18px;font-weight:700}' +
      '.tx-ins-text{font-size:12px;color:var(--muted);line-height:1.5}' +
      '.tx-ins-foot{margin-top:4px;padding-top:8px;border-top:1px solid rgba(255,255,255,.06);font-size:11px;color:var(--dim);display:flex;justify-content:space-between;align-items:center;gap:6px}' +
      '.tx-ins-live{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#86efac;display:inline-flex;align-items:center;gap:4px}' +
      '.tx-ins-live::before{content:"";width:5px;height:5px;border-radius:50%;background:#22C55E;display:inline-block;animation:tx-ins-spin 0s,pulse2 2s infinite}';
    document.head.appendChild(st);
  }

  function render(container, data){
    if (!container) return;
    _injectSpinnerCSS();
    if (!data || data.error) {
      container.innerHTML =
        '<div style="font-size:12px;color:var(--muted)">' +
          _esc((data && data.error) || 'AI insight is offline. Local stats still available.') +
        '</div>';
      return;
    }
    var head     = _esc(data.headline || '');
    var strength = data.strength    ? '<div class="tx-ins-row"><span class="tx-ins-arrow" style="color:#22C55E">▲</span><div class="tx-ins-text"><b style="color:#86efac">Edge:</b> '   + _esc(data.strength)   + '</div></div>' : '';
    var weakness = data.weakness    ? '<div class="tx-ins-row"><span class="tx-ins-arrow" style="color:#EF4444">▼</span><div class="tx-ins-text"><b style="color:#fca5a5">Leak:</b> '   + _esc(data.weakness)   + '</div></div>' : '';
    var action   = data.suggestion  ? '<div class="tx-ins-row"><span class="tx-ins-arrow" style="color:#FFB732">→</span><div class="tx-ins-text"><b style="color:#FFB732">Action:</b> ' + _esc(data.suggestion) + '</div></div>' : '';
    var liveTag  = data.empty ? '' : '<span class="tx-ins-live">Live AI</span>';
    var foot     = data.focus_metric
      ? '<div class="tx-ins-foot"><span>' + _esc(data.focus_metric) + '</span>' + liveTag + '</div>'
      : '';
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:9px">' +
        '<div style="font-size:13px;font-weight:600;color:var(--text);line-height:1.4">' + head + '</div>' +
        strength + weakness + action + foot +
      '</div>';
  }

  function mount(scope, container){
    if (!container) return;
    _injectSpinnerCSS();
    container.innerHTML =
      '<div style="font-size:12px;color:var(--dim);display:flex;align-items:center;gap:8px">' +
        '<span class="tx-ins-spin"></span>AI is reading your journal…' +
      '</div>';
    load(scope, { fresh: true })
      .then(function(data){ render(container, data); })
      .catch(function(err){
        var msg = (err && err.message) ? err.message : 'try again later.';
        container.innerHTML =
          '<div style="display:flex;flex-direction:column;gap:6px">' +
            '<div style="font-size:12px;color:var(--muted);line-height:1.5">' +
              '<span style="color:#fca5a5">AI insight offline</span> — ' + _esc(msg) +
            '</div>' +
            '<button type="button" data-tx-ins-retry="1" style="align-self:flex-start;font-size:11px;font-weight:600;color:#FFB732;background:rgba(255,183,50,.08);border:1px solid rgba(255,183,50,.25);border-radius:4px;padding:3px 10px;cursor:pointer">Retry</button>' +
          '</div>';
        var btn = container.querySelector('[data-tx-ins-retry="1"]');
        if (btn) btn.addEventListener('click', function(){ refresh(scope); mount(scope, container); });
      });
  }

  function refresh(scope){
    try {
      var c = _readCache();
      delete c[_scopeKey(scope)];
      localStorage.setItem(KEY, JSON.stringify(c));
    } catch(e){}
  }

  global.TxInsights = { load: load, render: render, mount: mount, refresh: refresh };
})(window);
