/* ═══════════════════════════════════════════════════════════════════
   Tradexa Router — premium SPA-feel for a static MPA
   ───────────────────────────────────────────────────────────────────
   - Intercepts internal <a> clicks
   - fetch()es the destination, parses with DOMParser
   - Swaps <main class="tx-main"> only (sidebar, topbar, FAB persist)
   - Re-injects page-specific <style> blocks from <head>
   - Re-executes inline <script> blocks below </main>, intercepting
     their DOMContentLoaded listeners and firing them immediately
   - Skips re-loading external scripts already in the document
   - Cached destinations (in-memory) → instant back/forward
   - Soft <main> cross-fade (no top progress bar), instant nav highlight,
     scroll memory, staggered card reveal animation
   - Loads BEFORE app-sidebar.js so its capture-phase click handler
     wins via stopImmediatePropagation()
═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  if(window.TxRouter) return;
  if(history.scrollRestoration) history.scrollRestoration = 'manual';

  var pageCache    = new Map();   // url → { title, mainHTML, headStyles, bodyScripts }
  var scrollMap    = new Map();   // url → { x, y }
  var inflight     = null;
  var pendingTimer = null;
  var navigating   = false;
  var CACHE_MAX    = 20;          // LRU cap to bound memory on long sessions

  function cachePut(url, parsed){
    if(pageCache.has(url)) pageCache.delete(url);
    pageCache.set(url, parsed);
    while(pageCache.size > CACHE_MAX){
      var oldest = pageCache.keys().next().value;
      pageCache.delete(oldest);
    }
  }

  /* ═══ Inject runtime CSS (page fade + stagger) ═══
     Premium nav feel: no top progress bar, just a soft cross-fade on
     <main> between pages. Old yellow #txProgressBar removed. */
  var rtCss = document.createElement('style');
  rtCss.id = 'tx-router-css';
  rtCss.textContent =
    '@keyframes tx-stagger-in{from{opacity:0;transform:translateY(8px)}' +
      'to{opacity:1;transform:translateY(0)}}' +
    'html.tx-swapping main.tx-main{opacity:.0;transform:translateY(4px);' +
      'transition:opacity .14s ease,transform .14s ease}' +
    'html.tx-swap-in main.tx-main{opacity:1;transform:none;' +
      'transition:opacity .22s ease,transform .22s cubic-bezier(.2,.8,.2,1)}' +
    '@media(prefers-reduced-motion:reduce){' +
      'html.tx-swapping main.tx-main,html.tx-swap-in main.tx-main{' +
        'opacity:1;transform:none;transition:none}}';
  (document.head || document.documentElement).appendChild(rtCss);

  /* No-op progress hooks (kept so legacy callsites don't throw if any
     out-of-tree code references them). The visible top loading bar
     was removed for a more premium nav feel. */
  function startBar(){}
  function finishBar(){}

  /* ═══ Active link sync (instant feedback) ═══ */
  function setActive(url){
    var dest = url.split('?')[0].split('#')[0];
    document.querySelectorAll('.tx-nav a, .tx-sidebar a[href]').forEach(function(a){
      var h = a.getAttribute('href');
      if(!h) return;
      var p = h.split('?')[0].split('#')[0];
      a.classList.toggle('active', p === dest);
    });
  }

  /* ═══ Stagger card reveal ═══ */
  function staggerIn(){
    var main = document.querySelector('main.tx-main');
    if(!main) return;
    var sel = '.tx-card,.tx-kpi,.kpi-card,.insight-item,.stat-card,' +
              '.tx-grid-3>*,.tx-grid-2>*,.tx-grid-aside-lg>*,.tx-kpi-grid>*,' +
              '.tx-section,.tx-panel';
    var els = main.querySelectorAll(sel);
    if(!els.length) return;
    /* cap stagger length so long pages don't drag */
    var step = Math.min(22, 220 / Math.max(1, els.length));
    els.forEach(function(el, i){
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = 'tx-stagger-in .38s cubic-bezier(.2,.8,.2,1) ' +
        Math.round(i * step) + 'ms both';
    });
  }

  /* ═══ Parse fetched HTML ═══
     We capture ALL direct children of <body> (modals, page styles, <main>,
     scripts) — not just <main> — because pages place modals/overlays as
     siblings of <main>. Shell elements (sidebar, header, FAB, overlay) are
     NOT in source HTML; they are injected at runtime by app-sidebar.js +
     tradebot.js, so they survive the swap automatically. */
  function parseDoc(html){
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var main = doc.querySelector('main.tx-main') || doc.querySelector('main');
    if(!main) return null;

    var headStyles = [];
    doc.head.querySelectorAll('style').forEach(function(s){
      if(s.id === 'tx-critical-bg') return;
      if(s.id === 'tx-router-css') return;
      headStyles.push(s.outerHTML);
    });

    /* Capture body children in order. Non-script nodes get re-inserted as
       page content; scripts are extracted separately so they execute via
       our re-execution path with the DCL patch. */
    var bodyNodes   = [];   // { html: outerHTML }  for non-script children
    var bodyScripts = [];   // { src, text, type, defer, async }
    Array.prototype.forEach.call(doc.body.children, function(node){
      if(node.tagName === 'SCRIPT'){
        bodyScripts.push({
          src:  node.getAttribute('src') || null,
          text: node.textContent || '',
          type: node.getAttribute('type') || null,
          defer: node.hasAttribute('defer'),
          async: node.hasAttribute('async')
        });
      } else {
        bodyNodes.push({ html: node.outerHTML });
      }
    });

    return {
      title: doc.title || document.title,
      bodyNodes: bodyNodes,
      headStyles: headStyles,
      bodyScripts: bodyScripts
    };
  }

  /* ═══ Shell detection ═══
     Shell = persistent runtime-injected UI (sidebar, header, overlay,
     FAB, progress bar, live region). Everything else in <body> is
     "page content" that gets swapped on navigation. */
  var SHELL_SELECTOR =
    '#txSidebar, #txOverlay, #txHeader, .tx-header, ' +
    '#tx-tradebot-root, #tx-tradebot-css, ' +
    '#txNavCurtain, ' +
    '[data-tx-shell="1"], [data-tx-router-ui="1"]';
  function isShell(el){
    if(el.nodeType !== 1) return false;
    if(el === liveRegion) return true;
    try { return el.matches(SHELL_SELECTOR); }
    catch(_){ return false; }
  }

  /* ═══ External-script dedupe (full pathname, not basename) ═══ */
  function resolveSrc(src){
    try { return new URL(src, location.href).href.split('?')[0].split('#')[0]; }
    catch(_){ return src; }
  }
  function alreadyLoaded(src){
    if(!src) return false;
    var target = resolveSrc(src);
    var nodes = document.querySelectorAll('script[src]');
    for(var i = 0; i < nodes.length; i++){
      if(resolveSrc(nodes[i].getAttribute('src') || '') === target) return true;
    }
    return false;
  }

  /* ═══ a11y live-region ═══ */
  var liveRegion = null;
  function announce(msg){
    if(!liveRegion){
      liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;' +
        'padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);' +
        'white-space:nowrap;border:0';
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = '';
    setTimeout(function(){ liveRegion.textContent = msg; }, 50);
  }

  /* ═══ Commit a parsed page into the live DOM ═══ */
  function commit(url, parsed, restoreScroll){
    /* Notify pages of imminent swap so they can clean up
       global listeners / timers / observers if they wish */
    document.dispatchEvent(new CustomEvent('tx:before-swap',
      { detail: { url: url } }));

    /* Title */
    document.title = parsed.title;

    /* Remove previous page-specific head styles + scripts */
    document.querySelectorAll('[data-tx-page]').forEach(function(el){ el.remove(); });

    /* ═══ Body swap: remove all non-shell children, insert new page content ═══
       Modals/overlays in pages live as siblings of <main>, so a main-only swap
       leaves stale modals from the previous page. We instead remove every body
       child that isn't part of the persistent shell (sidebar, header, FAB,
       overlay, progress bar, live region) and insert the new page's body
       children in source order. Shell elements stay mounted across nav. */
    var bodyKids = Array.prototype.slice.call(document.body.children);
    bodyKids.forEach(function(child){
      if(isShell(child)) return;
      if(child.tagName === 'SCRIPT' && child.hasAttribute('data-tx-page')){
        child.remove();
        return;
      }
      if(child.tagName === 'SCRIPT') return; // keep loaded shared scripts
      child.remove();
    });

    /* Insert new page nodes BEFORE the first shell element so page modals
       don't get z-stacked above the sidebar/header. If no shell exists yet
       (early init), append to end. */
    var firstShell = null;
    for(var i = 0; i < document.body.children.length; i++){
      if(isShell(document.body.children[i])){
        firstShell = document.body.children[i];
        break;
      }
    }
    var holder = document.createElement('div');
    parsed.bodyNodes.forEach(function(n){
      holder.innerHTML = n.html;
      var el = holder.firstElementChild;
      if(!el) return;
      if(firstShell) document.body.insertBefore(el, firstShell);
      else           document.body.appendChild(el);
    });

    /* Locate new <main> (now in DOM) for focus + stagger */
    var newMain = document.querySelector('main.tx-main') || document.querySelector('main');
    if(newMain){
      if(!newMain.hasAttribute('tabindex')) newMain.setAttribute('tabindex', '-1');
      try { newMain.focus({ preventScroll: true }); } catch(_){}
    }

    /* Inject head styles (page-scoped) */
    parsed.headStyles.forEach(function(html){
      var w = document.createElement('div');
      w.innerHTML = html;
      var node = w.firstElementChild;
      if(!node) return;
      node.setAttribute('data-tx-page', '1');
      document.head.appendChild(node);
    });

    /* Re-execute body scripts with DCL interception ----------- */
    var origAdd = document.addEventListener;
    var pendingDCL = [];
    document.addEventListener = function(type, cb, opts){
      if(type === 'DOMContentLoaded'){
        pendingDCL.push(cb);
        return;
      }
      return origAdd.call(document, type, cb, opts);
    };

    try {
      parsed.bodyScripts.forEach(function(sd){
        if(sd.src && alreadyLoaded(sd.src)) return;
        var s = document.createElement('script');
        if(sd.type)  s.setAttribute('type', sd.type);
        if(sd.defer) s.defer = true;
        if(sd.async) s.async = true;
        s.setAttribute('data-tx-page', '1');
        if(sd.src){
          s.src = sd.src;
        } else {
          s.text = sd.text;
        }
        document.body.appendChild(s);
      });
    } catch(e){
      console.error('[tx-router] script exec failed:', e);
    } finally {
      document.addEventListener = origAdd;
    }

    /* Fire intercepted DCL listeners synchronously */
    pendingDCL.forEach(function(cb){
      try { cb(new Event('DOMContentLoaded')); }
      catch(e){ console.error('[tx-router] DCL handler error:', e); }
    });

    /* Scroll: restore for back/forward, top for forward nav */
    var sx = restoreScroll ? restoreScroll.x : 0;
    var sy = restoreScroll ? restoreScroll.y : 0;
    window.scrollTo(sx, sy);

    /* Fade in + stagger reveal */
    document.documentElement.classList.remove('tx-swapping');
    document.documentElement.classList.add('tx-swap-in');
    requestAnimationFrame(function(){
      requestAnimationFrame(staggerIn);
    });
    setTimeout(function(){
      document.documentElement.classList.remove('tx-swap-in');
    }, 260);

    /* Notify + a11y announce */
    announce(parsed.title || 'Page loaded');
    document.dispatchEvent(new CustomEvent('tx:navigated',
      { detail: { url: url } }));
  }

  /* ═══ Public navigate ═══ */
  function navigate(url, opts){
    opts = opts || {};
    if(navigating && !opts.popstate) return;

    var current = location.pathname + location.search + location.hash;
    var dest = url.startsWith('/') ? url : new URL(url, location.href).pathname +
               new URL(url, location.href).search + new URL(url, location.href).hash;

    if(dest === current && !opts.replace && !opts.popstate){
      /* same URL → just scroll to top with fade */
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    navigating = true;

    /* Cancel any pending commit from a previous (slow) navigation */
    if(pendingTimer){ clearTimeout(pendingTimer); pendingTimer = null; }

    /* Save current scroll */
    scrollMap.set(current, { x: window.scrollX, y: window.scrollY });

    /* Instant feedback: nav highlight + soft main fade (no top bar).
       Also clear `tx-nav-leaving` (set by the head-injected anti-flash
       script on link click) so we don't end up with body opacity:0 while
       the SPA router is doing its own fade. */
    setActive(dest);
    document.documentElement.classList.remove('tx-nav-leaving');
    document.documentElement.classList.add('tx-swapping');

    /* Cached? */
    if(pageCache.has(dest) && !opts.bypassCache){
      var cached = pageCache.get(dest);
      pendingTimer = setTimeout(function(){
        pendingTimer = null;
        applyHistory(dest, opts);
        commit(dest, cached, opts.popstate ? scrollMap.get(dest) : null);
        navigating = false;
      }, 130);
      return;
    }

    /* Fetch */
    if(inflight) inflight.abort();
    inflight = new AbortController();
    var startedAt = performance.now();

    fetch(dest, { signal: inflight.signal, credentials: 'same-origin',
                  headers: { 'X-Tx-Router': '1' } })
      .then(function(r){
        if(!r.ok) throw new Error('HTTP ' + r.status);
        var ct = r.headers.get('content-type') || '';
        if(ct && ct.indexOf('text/html') === -1) throw new Error('not-html');
        return r.text();
      })
      .then(function(html){
        var parsed = parseDoc(html);
        if(!parsed){
          window.location.href = dest;
          return;
        }
        cachePut(dest, parsed);

        /* enforce minimum 130ms fade-out so transition reads clean */
        var elapsed = performance.now() - startedAt;
        var wait = Math.max(0, 130 - elapsed);
        pendingTimer = setTimeout(function(){
          pendingTimer = null;
          applyHistory(dest, opts);
          commit(dest, parsed, opts.popstate ? scrollMap.get(dest) : null);
          navigating = false;
        }, wait);
      })
      .catch(function(err){
        navigating = false;
        if(err.name === 'AbortError') return;
        console.warn('[tx-router] fetch failed → hard nav:', err);
        window.location.href = dest;
      });
  }

  function applyHistory(url, opts){
    if(opts.popstate) return;
    if(opts.replace) history.replaceState({ tx: 1 }, '', url);
    else             history.pushState   ({ tx: 1 }, '', url);
  }

  /* ═══ Click capture (synchronous, registered first → wins) ═══ */
  document.addEventListener('click', function(e){
    if(e.defaultPrevented) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if(e.button !== 0) return;

    var link = e.target.closest && e.target.closest('a[href]');
    if(!link) return;

    var href = link.getAttribute('href');
    if(!href) return;
    if(link.target && link.target !== '_self') return;
    if(link.hasAttribute('download')) return;
    if(link.getAttribute('data-no-router') === '1') return;
    if(link.getAttribute('rel') === 'external') return;

    /* Skip non-navigational schemes & anchors */
    if(href.startsWith('mailto:') || href.startsWith('tel:') ||
       href.startsWith('javascript') || href === '#' ||
       href.startsWith('#')) return;

    /* External origin? skip */
    if(/^https?:\/\//i.test(href)){
      try {
        var u = new URL(href);
        if(u.origin !== location.origin) return;
      } catch(_){ return; }
    }

    /* Skip non-html assets */
    var path = href.split('?')[0].split('#')[0];
    if(/\.(pdf|png|jpe?g|gif|svg|webp|zip|csv|json|xml|mp4|mp3|wav|woff2?)$/i.test(path)) return;

    /* Take over */
    e.preventDefault();
    e.stopImmediatePropagation();
    navigate(href);
  }, true);

  /* ═══ Back/forward ═══ */
  window.addEventListener('popstate', function(){
    navigate(location.pathname + location.search + location.hash, { popstate: true });
  });

  /* ═══ Hover prefetch (warm cache) ═══ */
  var hoverPrefetched = {};
  function hoverPrefetch(href){
    if(!href || hoverPrefetched[href]) return;
    if(href.startsWith('http') || href.startsWith('mailto:') ||
       href.startsWith('tel:')  || href.startsWith('#')      ||
       href.startsWith('javascript')) return;
    var path = href.split('?')[0].split('#')[0];
    if(path === location.pathname) return;
    if(/\.(pdf|png|jpe?g|gif|svg|webp|zip|csv|json|xml)$/i.test(path)) return;
    hoverPrefetched[href] = true;

    /* Pre-fetch the parsed page into pageCache so click is instant */
    fetch(href, { credentials: 'same-origin', priority: 'low',
                  headers: { 'X-Tx-Prefetch': '1' } })
      .then(function(r){ return r.ok ? r.text() : null; })
      .then(function(html){
        if(!html) return;
        var parsed = parseDoc(html);
        if(parsed) cachePut(href, parsed);
      })
      .catch(function(){ /* silent */ });
  }
  function onHover(e){
    var link = e.target.closest && e.target.closest('a[href]');
    if(!link || (link.target && link.target !== '_self')) return;
    hoverPrefetch(link.getAttribute('href'));
  }
  document.addEventListener('mouseover',  onHover, { passive: true });
  document.addEventListener('touchstart', onHover, { passive: true });

  /* ═══ Cache initial page ═══
     The initial page's scripts have already executed natively — we don't
     have their source structure. Fetch our own URL once (idle) to obtain a
     properly parsed snapshot so back-nav to this URL replays via the same
     code path as any other cached page. */
  function cacheInitial(){
    var main = document.querySelector('main.tx-main') || document.querySelector('main');
    if(!main) return;
    var url = location.pathname + location.search;
    var run = function(){
      fetch(url, { credentials: 'same-origin', headers: { 'X-Tx-Prefetch': '1' } })
        .then(function(r){ return r.ok ? r.text() : null; })
        .then(function(html){
          if(!html) return;
          var parsed = parseDoc(html);
          if(parsed) cachePut(url, parsed);
        })
        .catch(function(){ /* silent */ });
    };
    if(window.requestIdleCallback) requestIdleCallback(run, { timeout: 1500 });
    else setTimeout(run, 200);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', cacheInitial);
  } else {
    cacheInitial();
  }

  /* ═══ Public API ═══ */
  window.TxRouter = {
    navigate: navigate,
    cache:    pageCache,
    invalidate: function(url){
      if(url) pageCache.delete(url); else pageCache.clear();
    }
  };
})();
