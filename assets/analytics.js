(function () {
  'use strict';

  var TX_KEY = 'tx_analytics';
  var TX_SESSION = 'tx_session';
  var TX_CONSENT = 'tx_cookie_consent';

  function getConsent() {
    try { return localStorage.getItem(TX_CONSENT); } catch(e) { return null; }
  }

  function store(data) {
    try {
      var existing = JSON.parse(localStorage.getItem(TX_KEY) || '[]');
      existing.push(data);
      if (existing.length > 500) existing = existing.slice(-500);
      localStorage.setItem(TX_KEY, JSON.stringify(existing));
    } catch(e) {}
  }

  function getOrCreateSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem(TX_SESSION) || 'null');
      if (!s) {
        s = { id: Math.random().toString(36).slice(2), start: Date.now(), pageCount: 0 };
        sessionStorage.setItem(TX_SESSION, JSON.stringify(s));
      }
      return s;
    } catch(e) { return { id: 'unknown', start: Date.now(), pageCount: 0 }; }
  }

  function updateSession(s) {
    try { sessionStorage.setItem(TX_SESSION, JSON.stringify(s)); } catch(e) {}
  }

  function event(name, props) {
    if (getConsent() === 'rejected') return;
    var s = getOrCreateSession();
    var payload = {
      event: name,
      page: window.location.pathname,
      session: s.id,
      ts: Date.now(),
      referrer: document.referrer || 'direct',
      props: props || {}
    };
    store(payload);
    // In production, POST to your analytics endpoint:
    // fetch('/api/analytics', { method:'POST', body: JSON.stringify(payload), keepalive: true });
    if (window.__txDebug) console.log('[TxAnalytics]', payload);
  }

  function pageView() {
    var s = getOrCreateSession();
    s.pageCount++;
    updateSession(s);
    event('pageview', {
      title: document.title,
      path: window.location.pathname
    });
  }

  function trackOutbound() {
    document.addEventListener('click', function(e) {
      var a = e.target.closest('a');
      if (a && a.hostname && a.hostname !== window.location.hostname) {
        event('outbound_click', { url: a.href, text: a.innerText.slice(0,60) });
      }
    });
  }

  function trackButtons() {
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-track]');
      if (btn) event('button_click', { label: btn.getAttribute('data-track'), text: btn.innerText.slice(0,60) });
    });
  }

  function trackForms() {
    document.addEventListener('submit', function(e) {
      var form = e.target;
      var name = form.getAttribute('data-track') || form.id || form.className.split(' ')[0] || 'form';
      event('form_submit', { form: name });
    });
  }

  function trackScrollDepth() {
    var depths = [25, 50, 75, 100];
    var fired = {};
    window.addEventListener('scroll', function() {
      var scrollPct = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
      depths.forEach(function(d) {
        if (!fired[d] && scrollPct >= d) {
          fired[d] = true;
          event('scroll_depth', { depth: d + '%' });
        }
      });
    }, { passive: true });
  }

  function trackTiming() {
    window.addEventListener('beforeunload', function() {
      var s = getOrCreateSession();
      var time = Math.round((Date.now() - s.start) / 1000);
      event('session_end', { duration_s: time, pages: s.pageCount });
    });
  }

  function getStats() {
    try {
      var data = JSON.parse(localStorage.getItem(TX_KEY) || '[]');
      var pages = {};
      var events = {};
      data.forEach(function(e) {
        if (e.event === 'pageview') pages[e.page] = (pages[e.page] || 0) + 1;
        events[e.event] = (events[e.event] || 0) + 1;
      });
      return { total: data.length, pages: pages, events: events, raw: data };
    } catch(e) { return {}; }
  }

  // Public API
  window.txTrack = {
    event: event,
    pageView: pageView,
    getStats: getStats,
    version: '1.0.0'
  };

  // Auto-init on DOM ready
  function init() {
    if (getConsent() !== 'rejected') {
      pageView();
      trackOutbound();
      trackButtons();
      trackForms();
      trackScrollDepth();
      trackTiming();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
