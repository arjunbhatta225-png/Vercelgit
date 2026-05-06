/* Tradexa Client Monitoring — Error tracking + performance — IIFE */
(function(){
  'use strict';

  var VERSION = '1.0.0';
  var SESSION_ID = (function(){
    var s = sessionStorage.getItem('txSid');
    if(!s){ s = 'tx_' + Math.random().toString(36).slice(2,11) + '_' + Date.now(); sessionStorage.setItem('txSid',s); }
    return s;
  })();

  /* ── Storage helpers ── */
  function store(key, val){
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){}
  }
  function load(key, fallback){
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch(e){ return fallback; }
  }

  /* ── Event log (ring buffer, last 200) ── */
  var eventLog = load('txMonLog', []);
  function log(type, data){
    var entry = { type: type, ts: Date.now(), sid: SESSION_ID, path: location.pathname, data: data };
    eventLog.push(entry);
    if(eventLog.length > 200) eventLog = eventLog.slice(-200);
    store('txMonLog', eventLog);
    if(window.console && window._txDebug) console.log('[Tradexa Monitor]', entry);
  }

  /* ── Error capturing ── */
  window.addEventListener('error', function(e){
    log('js_error', {
      msg: e.message,
      file: e.filename,
      line: e.lineno,
      col: e.colno,
      stack: e.error && e.error.stack ? e.error.stack.substring(0,500) : null,
    });
    updateErrorBadge();
  });

  window.addEventListener('unhandledrejection', function(e){
    log('promise_rejection', {
      reason: e.reason ? String(e.reason).substring(0,300) : 'unknown',
    });
    updateErrorBadge();
  });

  /* ── Network errors (fetch/XHR intercept) ── */
  var _origFetch = window.fetch;
  window.fetch = function(input, init){
    var url = typeof input === 'string' ? input : (input && input.url);
    var start = Date.now();
    return _origFetch.apply(this, arguments).then(function(res){
      var dur = Date.now() - start;
      if(!res.ok){
        log('net_error', { url: url, status: res.status, dur: dur });
      } else if(dur > 3000){
        log('slow_request', { url: url, dur: dur });
      }
      return res;
    }).catch(function(err){
      log('fetch_fail', { url: url, err: String(err) });
      throw err;
    });
  };

  /* ── Performance metrics ── */
  window.addEventListener('load', function(){
    setTimeout(function(){
      if(!window.performance || !window.performance.timing) return;
      var t = window.performance.timing;
      var nav = window.performance.getEntriesByType('navigation')[0];
      var metrics = {
        dns: t.domainLookupEnd - t.domainLookupStart,
        tcp: t.connectEnd - t.connectStart,
        ttfb: t.responseStart - t.requestStart,
        dom_load: t.domContentLoadedEventEnd - t.navigationStart,
        page_load: t.loadEventEnd - t.navigationStart,
      };
      if(nav){
        metrics.lcp_approx = Math.round(nav.responseEnd - nav.startTime);
      }
      log('perf', metrics);

      /* Alert on very slow loads */
      if(metrics.page_load > 5000){
        log('perf_warning', { type: 'slow_load', val: metrics.page_load });
      }
    }, 0);
  });

  /* ── Core Web Vitals (if PerformanceObserver available) ── */
  if(window.PerformanceObserver){
    try {
      new PerformanceObserver(function(list){
        list.getEntries().forEach(function(entry){
          if(entry.entryType === 'largest-contentful-paint'){
            log('cwv_lcp', { value: Math.round(entry.startTime) });
          }
          if(entry.entryType === 'layout-shift' && !entry.hadRecentInput){
            log('cwv_cls', { value: entry.value });
          }
          if(entry.entryType === 'first-input'){
            log('cwv_fid', { value: Math.round(entry.processingStart - entry.startTime) });
          }
        });
      }).observe({ entryTypes: ['largest-contentful-paint','layout-shift','first-input'] });
    } catch(e){}
  }

  /* ── Page visibility / session tracking ── */
  var pageStart = Date.now();
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'hidden'){
      log('session_pause', { dwell: Date.now() - pageStart });
    } else {
      pageStart = Date.now();
    }
  });

  /* ── Session summary on unload ── */
  window.addEventListener('beforeunload', function(){
    var clicks = load('txClickCount', 0);
    log('session_end', {
      dwell: Date.now() - pageStart,
      clicks: clicks,
      scroll_max: load('txScrollMax', 0),
    });
  });

  /* Click counter */
  var clicks = 0;
  document.addEventListener('click', function(e){
    clicks++;
    store('txClickCount', clicks);
    var el = e.target.closest('[data-track]');
    if(el) log('click', { action: el.dataset.track });
  });

  /* Max scroll depth */
  window.addEventListener('scroll', function(){
    var pct = Math.round(((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100);
    var max = load('txScrollMax', 0);
    if(pct > max) store('txScrollMax', pct);
  }, { passive: true });

  /* ── Error badge for admin (only on admin pages) ── */
  function updateErrorBadge(){
    if(!/\/admin\//.test(location.pathname)) return;
    var errors = eventLog.filter(function(e){ return e.type === 'js_error' || e.type === 'promise_rejection'; });
    var badge = document.getElementById('txMonErrorBadge');
    if(!badge) return;
    badge.textContent = errors.length;
    badge.style.display = errors.length > 0 ? 'inline-block' : 'none';
  }

  /* ── Health check ping ── */
  function healthCheck(){
    var start = Date.now();
    fetch('/', { method: 'HEAD', cache: 'no-store' }).then(function(res){
      var dur = Date.now() - start;
      var ok = res.ok && dur < 5000;
      log('health_check', { ok: ok, dur: dur, status: res.status });
      if(!ok) log('health_warning', { dur: dur, status: res.status });
    }).catch(function(err){
      log('health_fail', { err: String(err) });
    });
  }
  setTimeout(healthCheck, 5000);
  setInterval(healthCheck, 300000); /* Every 5 minutes */

  /* ── Public API ── */
  window.txMonitor = {
    log: log,
    getLogs: function(type){
      return type ? eventLog.filter(function(e){ return e.type === type; }) : eventLog;
    },
    getErrors: function(){
      return eventLog.filter(function(e){ return ['js_error','promise_rejection','net_error','fetch_fail'].includes(e.type); });
    },
    clearLogs: function(){ eventLog = []; store('txMonLog', []); },
    sessionId: SESSION_ID,
    version: VERSION,
  };

  /* Fire analytics track helper (used by other modules) */
  window.txTrack = function(event, props){
    log('user_event', Object.assign({ event: event }, props || {}));
  };

  log('monitor_init', { version: VERSION, path: location.pathname });
})();
