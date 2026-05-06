(function () {
  'use strict';

  /* ── Article registry (slug, title, category, path) ──────────────── */
  var ARTICLES = [
    { slug: 'ai-pattern-recognition',  title: 'How AI Pattern Recognition Is Changing the Way Individual Traders Compete', cat: 'AI & Technology' },
    { slug: 'dynamic-position-sizing', title: 'The 2% Rule Isn\'t Enough: How to Build a Dynamic Position Sizing Framework', cat: 'Risk Management' },
    { slug: 'backtesting-mistakes',    title: 'Backtesting Your Way to an Edge: The 5 Most Common Mistakes', cat: 'Strategy' },
    { slug: 'optimal-entry-timing',    title: 'What Trade Data Reveals About Optimal Entry Timing', cat: 'Market Analysis' },
    { slug: 'ai-coach-3-update',       title: 'Tradexa AI Coach 3.0: What\'s New and How to Use the New Features', cat: 'Product Updates' },
    { slug: 'trading-journal-framework', title: 'Building a Trading Journal That Actually Makes You Better', cat: 'Education' },
    { slug: 'beyond-sharpe-ratio',     title: 'The Sharpe Ratio Is Overrated: Better Metrics for Your Strategy', cat: 'Strategy' },
    { slug: 'psychology-losing-streaks', title: 'Why Traders Self-Destruct During Losing Streaks (And How to Break the Pattern)', cat: 'Education' }
  ];

  /* ── Detect current article slug from URL ─────────────────────────── */
  function getSlug() {
    var m = window.location.pathname.match(/\/([^\/]+)\.html$/);
    return m ? m[1] : null;
  }

  /* ── Reading progress bar ─────────────────────────────────────────── */
  function initProgressBar() {
    var bar = document.createElement('div');
    bar.id = 'read-progress';
    document.body.insertBefore(bar, document.body.firstChild);
    function update() {
      var body = document.body;
      var html = document.documentElement;
      var total = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight) - window.innerHeight;
      var pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      bar.style.width = Math.min(pct, 100) + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ── Table of Contents ────────────────────────────────────────────── */
  function buildTOC() {
    var articleBody = document.querySelector('.article-body');
    if (!articleBody) return;
    var container = articleBody.querySelector('.container');
    if (!container) return;

    /* Collect h2 headings; assign IDs */
    var headings = Array.prototype.slice.call(container.querySelectorAll('h2'));
    if (headings.length < 2) return; /* not worth showing for tiny articles */

    headings.forEach(function (h, i) {
      if (!h.id) {
        h.id = 'section-' + i + '-' + h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    });

    /* Build TOC markup */
    var aside = document.createElement('aside');
    aside.className = 'toc-sidebar';
    var items = headings.map(function (h) {
      return '<li><a href="#' + h.id + '">' + h.textContent + '</a></li>';
    }).join('');
    aside.innerHTML = '<div class="toc-inner"><div class="toc-label">In This Article</div><ul class="toc-list">' + items + '</ul></div>';

    /* Wrap container + aside in grid wrapper */
    var wrapper = document.createElement('div');
    wrapper.className = 'article-layout-inner';
    articleBody.insertBefore(wrapper, container);
    wrapper.appendChild(container);
    wrapper.appendChild(aside);

    /* Scroll spy */
    var links = Array.prototype.slice.call(aside.querySelectorAll('a'));
    function spy() {
      var scrollY = window.scrollY + 120;
      var active = null;
      headings.forEach(function (h) {
        if (h.offsetTop <= scrollY) active = h.id;
      });
      links.forEach(function (a) {
        a.classList.toggle('toc-active', a.getAttribute('href') === '#' + active);
      });
    }
    window.addEventListener('scroll', spy, { passive: true });
    spy();

    /* Smooth scroll */
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(this.getAttribute('href').slice(1));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ── Share buttons ─────────────────────────────────────────────────── */
  function buildShareButtons() {
    var meta = document.querySelector('.article-meta');
    if (!meta) return;

    var url = encodeURIComponent(window.location.href);
    var title = encodeURIComponent(document.title.replace(' — Tradexa Blog', '').replace(' — Tradexa', ''));

    var row = document.createElement('div');
    row.className = 'share-row';
    row.innerHTML =
      '<span class="share-label">Share</span>' +
      '<a class="share-btn" href="https://twitter.com/intent/tweet?url=' + url + '&text=' + title + '" target="_blank" rel="noopener" aria-label="Share on X">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.845L1.254 2.25H8.08l4.259 5.634zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' +
        'X / Twitter' +
      '</a>' +
      '<a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=' + url + '" target="_blank" rel="noopener" aria-label="Share on LinkedIn">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' +
        'LinkedIn' +
      '</a>' +
      '<button class="share-btn" id="copy-link-btn" aria-label="Copy link">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>' +
        'Copy Link' +
      '</button>';

    meta.parentNode.insertBefore(row, meta.nextSibling);

    var copyBtn = document.getElementById('copy-link-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(window.location.href).then(function () {
          copyBtn.classList.add('copied');
          copyBtn.innerHTML = copyBtn.innerHTML.replace('Copy Link', 'Copied!');
          setTimeout(function () {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = copyBtn.innerHTML.replace('Copied!', 'Copy Link');
          }, 2200);
        });
      });
    }
  }

  /* ── Prev / Next navigation ────────────────────────────────────────── */
  function buildPrevNext() {
    var slug = getSlug();
    if (!slug) return;
    var idx = -1;
    ARTICLES.forEach(function (a, i) { if (a.slug === slug) idx = i; });
    if (idx === -1) return;

    var prev = idx > 0 ? ARTICLES[idx - 1] : null;
    var next = idx < ARTICLES.length - 1 ? ARTICLES[idx + 1] : null;

    var nav = document.createElement('div');
    nav.className = 'prev-next-nav';

    if (prev) {
      nav.innerHTML += '<a href="/resources/blog/' + prev.slug + '.html"><div class="pn-direction">← Previous</div><div class="pn-title">' + prev.title + '</div></a>';
    } else {
      nav.innerHTML += '<div class="pn-placeholder"></div>';
    }

    if (next) {
      nav.innerHTML += '<a href="/resources/blog/' + next.slug + '.html" class="pn-next"><div class="pn-direction">Next →</div><div class="pn-title">' + next.title + '</div></a>';
    } else {
      nav.innerHTML += '<div class="pn-placeholder"></div>';
    }

    /* Insert before .related-posts section */
    var relatedSection = document.querySelector('.related-posts');
    if (relatedSection) {
      relatedSection.parentNode.insertBefore(nav, relatedSection);
    } else {
      document.body.appendChild(nav);
    }
  }

  /* ── Init ──────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initProgressBar();
    buildTOC();
    buildShareButtons();
    buildPrevNext();
  });

})();
