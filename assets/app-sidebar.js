(function () {

  /* ── User info: hardcoded placeholder; updated from Supabase after init ── */
  var _uName   = 'Trader';
  var _uEmail  = '';
  var _uInits  = 'TR';

  /* Once Supabase auth resolves, re-render the avatar / sidebar profile name. */
  function _refreshUserChrome(){
    if (!window.TxAuth) return;
    var u = window.TxAuth.getUser();
    if (!u) return;
    var meta = u.user_metadata || {};
    var name = (meta.full_name || meta.name || (u.email ? u.email.split('@')[0] : 'Trader')).trim();
    var parts = name.split(/\s+/);
    var ini = ((parts[0]||'T').charAt(0) + (parts[1]?parts[1].charAt(0):'')).toUpperCase() || 'TR';
    var avatar = document.getElementById('txHeaderAvatar');
    if (avatar) {
      avatar.textContent = ini;
      avatar.title = name;
      var pic = meta.avatar_url || meta.picture;
      if (pic) {
        avatar.style.backgroundImage = 'url(' + pic + ')';
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.textContent = '';
      }
    }
    /* Sidebar footer profile name (if present) */
    var nm = document.querySelector('[data-tx-user-name]');
    var em = document.querySelector('[data-tx-user-email]');
    var si = document.querySelector('[data-tx-user-initials]');
    if (nm) nm.textContent = name;
    if (em) em.textContent = u.email || '';
    if (si) si.textContent = ini;
    /* Sidebar inline name (default markup uses #txSidebarName / #txSidebarAvatar). */
    var sn = document.getElementById('txSidebarName');
    var sa = document.getElementById('txSidebarAvatar');
    if (sn) sn.textContent = name;
    if (sa) {
      sa.textContent = ini;
      var pic2 = meta.avatar_url || meta.picture;
      if (pic2) {
        sa.style.backgroundImage = 'url(' + pic2 + ')';
        sa.style.backgroundSize = 'cover';
        sa.style.backgroundPosition = 'center';
        sa.textContent = '';
      }
    }
  }

  /* When TxProfile resolves, swap the plan label and surface admin chrome. */
  function _refreshProfileChrome(){
    if (!window.TxProfile) return;
    window.TxProfile.ready().then(function (p) {
      var planEl = document.getElementById('txSidebarPlan');
      if (planEl) {
        var plan = (p && p.plan) || 'free';
        planEl.textContent = plan === 'premium' ? 'Premium Plan' : 'Free Plan';
      }
    }).catch(function(){});
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _refreshProfileChrome);
  } else {
    _refreshProfileChrome();
  }

  function _bindAuthChrome(){
    if (window.TxAuth && window.TxAuth.ready) {
      window.TxAuth.ready().then(_refreshUserChrome).catch(function(){});
      document.addEventListener('tx-auth-change', _refreshUserChrome);
    } else {
      /* Try again shortly in case supabase-auth.js loads later. */
      setTimeout(_bindAuthChrome, 200);
    }
  }
  /* Defer chrome bind until after the DOM is ready so the avatar element exists. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bindAuthChrome);
  } else {
    _bindAuthChrome();
  }

  var CSS = `<style>
/* ── RESET & VARS ── */
*{box-sizing:border-box}
:root{
  --bg:#0d0f12;--surface:#13161b;--surface2:#1a1d23;
  --border:#22262e;--border2:#2c3038;
  --green:#22C55E;--green-dim:rgba(34,197,94,.08);--green-border:rgba(34,197,94,.22);
  --blue:#5E81AC;--red:#EF4444;--profit:#22C55E;--loss:#EF4444;--warn:#FFB732;
  --gold:#FFB732;--gold-dim:rgba(255,183,50,.09);--gold-border:rgba(255,183,50,.28);
  --text:#FAFAFA;--muted:#A1A1AA;--dim:#525252;
  --mono:'JetBrains Mono','SFMono-Regular',ui-monospace,Menlo,monospace;
  --sidebar-w:224px;--header-h:52px;
  --r-sm:4px;--r-md:6px;--r-lg:8px;
}

/* ── BODY LAYOUT ── */
body{
  background:var(--bg);color:var(--text);
  font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;
  margin:0;padding:0;
  padding-left:var(--sidebar-w);padding-top:var(--header-h);
  overflow-x:hidden;
}

/* ── SIDEBAR ── */
.tx-sidebar{
  position:fixed;top:0;left:0;width:var(--sidebar-w);height:100vh;
  background:var(--surface);border-right:1px solid var(--border);
  display:flex;flex-direction:column;z-index:200;overflow-y:auto;overflow-x:hidden;
}
.tx-sidebar::-webkit-scrollbar{width:4px}
.tx-sidebar::-webkit-scrollbar-track{background:transparent}
.tx-sidebar::-webkit-scrollbar-thumb{background:#1F2937;border-radius:2px}

/* ── SIDEBAR LOGO ── */
.tx-logo{
  display:flex;align-items:center;gap:8px;padding:0 16px;
  height:var(--header-h);border-bottom:1px solid var(--border);flex-shrink:0;
  text-decoration:none;
}
.tx-logo-icon{width:24px;height:24px;flex-shrink:0;display:block}
.tx-logo-text{font-size:13px;font-weight:700;color:var(--text);letter-spacing:.02em;line-height:1;text-transform:uppercase}
.tx-logo-badge{font-size:9px;color:var(--muted);font-weight:500;letter-spacing:.08em;text-transform:uppercase;margin-left:4px}

/* ── SIDEBAR NAV ── */
.tx-nav{flex:1;padding:12px 0}
.tx-nav-section{padding:0 12px;margin-bottom:4px}
.tx-nav-label{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--dim);padding:8px 8px 4px;display:block}
.tx-nav a{
  display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:6px;
  font-size:13px;font-weight:500;color:var(--muted);text-decoration:none;
  transition:all .12s;position:relative;margin-bottom:1px;
}
.tx-nav a:hover{background:rgba(255,255,255,.04);color:var(--text)}
.tx-nav a.active{background:var(--surface2);color:var(--text)}
.tx-nav a.active .tx-nav-icon{color:var(--gold);opacity:1}
.tx-nav a.active::before{display:none}
.tx-nav-icon{width:16px;height:16px;flex-shrink:0;opacity:.7}
.tx-nav a.active .tx-nav-icon{opacity:1}
.tx-nav a:hover .tx-nav-icon{opacity:.9}
.tx-nav-badge{
  margin-left:auto;font-size:10px;font-weight:700;padding:2px 7px;border-radius:100px;
  background:var(--gold);color:#0d0f12;min-width:18px;text-align:center;
}
.tx-nav-badge.red{background:var(--red)}
.tx-nav-badge.dim{background:rgba(255,255,255,.08);color:var(--muted)}

/* ── SIDEBAR USER ── */
.tx-sidebar-user{
  padding:12px;border-top:1px solid var(--border);flex-shrink:0;
}
.tx-user-card{
  display:flex;align-items:center;gap:10px;padding:10px;border-radius:6px;
  background:rgba(255,255,255,.03);border:1px solid var(--border);cursor:pointer;
  transition:background .12s;text-decoration:none;
}
.tx-user-card:hover{background:rgba(255,255,255,.06)}
.tx-user-avatar{
  width:34px;height:34px;border-radius:50%;background:var(--surface2);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;font-size:13px;
  font-weight:700;color:var(--text);flex-shrink:0;
}
.tx-user-name{font-size:13px;font-weight:600;color:var(--text);line-height:1.2}
.tx-user-plan{font-size:10px;color:var(--gold);font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.tx-user-chevron{margin-left:auto;color:var(--dim);flex-shrink:0}

/* ── TOP HEADER ── */
.tx-header{
  position:fixed;top:0;left:var(--sidebar-w);right:0;height:var(--header-h);
  background:rgba(13,15,18,.85);border-bottom:1px solid var(--border);
  display:flex;align-items:center;padding:0 16px;gap:12px;z-index:99;
  backdrop-filter:blur(20px);
}
.tx-header-title{font-size:13px;font-weight:600;color:var(--text);letter-spacing:-.005em;flex:1}
.tx-header-title span{color:var(--muted);font-weight:400}
.tx-header-search{
  display:flex;align-items:center;gap:8px;background:var(--surface);
  border:1px solid var(--border);border-radius:6px;padding:7px 12px;
  width:220px;transition:border-color .15s;
}
.tx-header-search:focus-within{border-color:var(--gold)}
.tx-header-search input{
  background:none;border:none;outline:none;font-size:13px;color:var(--text);
  font-family:'Inter',sans-serif;width:100%;
}
.tx-header-search input::placeholder{color:var(--dim)}
.tx-header-icon-btn{
  width:36px;height:36px;border-radius:6px;display:flex;align-items:center;justify-content:center;
  background:transparent;border:1px solid var(--border);cursor:pointer;
  color:var(--muted);transition:all .12s;position:relative;flex-shrink:0;text-decoration:none;
}
.tx-header-icon-btn:hover{background:var(--surface);color:var(--text);border-color:var(--border2)}
.tx-notif-dot{
  position:absolute;top:7px;right:7px;width:6px;height:6px;
  border-radius:50%;background:var(--red);border:1px solid var(--bg);
}
.tx-header-avatar{
  width:34px;height:34px;border-radius:50%;background:var(--surface2);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;font-size:13px;
  font-weight:700;color:var(--text);cursor:pointer;flex-shrink:0;
}
.tx-header-divider{width:1px;height:24px;background:var(--border);flex-shrink:0}

/* ── HAMBURGER ── */
.tx-hamburger{
  display:none;width:36px;height:36px;border-radius:6px;
  border:1px solid var(--border);background:transparent;cursor:pointer;
  align-items:center;justify-content:center;color:var(--muted);flex-shrink:0;padding:0;
}
.tx-hamburger:hover{background:var(--surface);color:var(--text)}

/* ── SIDEBAR OVERLAY ── */
.tx-sidebar-overlay{
  display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:150;
  backdrop-filter:blur(2px);
}
.tx-sidebar-overlay.show{display:block}

/* ── MAIN CONTENT ── */
.tx-main{padding:28px 28px 48px;min-height:calc(100vh - var(--header-h))}
.tx-page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:28px;flex-wrap:wrap}
.tx-page-title{font-size:22px;font-weight:700;color:var(--text);letter-spacing:-.02em;margin-bottom:4px}
.tx-page-sub{font-size:13px;color:var(--muted)}

/* ── CARDS ── */
.tx-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:20px}
.tx-card-sm{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:16px}
.tx-card-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:12px}
.tx-mono{font-family:var(--mono);font-variant-numeric:tabular-nums}

/* ── KPI / HERO GRID ── */
.tx-kpi-grid{display:grid;gap:14px;grid-template-columns:repeat(3,1fr)}
.tx-kpi{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:20px 22px;transition:border-color .15s}
.tx-kpi:hover{border-color:var(--border2)}
.tx-kpi-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-bottom:10px}
.tx-kpi-value{font-family:var(--mono);font-size:32px;font-weight:500;color:var(--text);letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums}
.tx-kpi-change{font-size:11px;font-weight:500;margin-top:8px;font-family:var(--mono);font-variant-numeric:tabular-nums}
.tx-kpi-change.pos{color:var(--profit)}
.tx-kpi-change.neg{color:var(--loss)}
.tx-kpi-change.neu{color:var(--muted)}

/* ── TABLES ── */
.tx-table-wrap{overflow-x:auto;border-radius:8px;border:1px solid var(--border)}
.tx-table{width:100%;border-collapse:collapse;font-size:13px}
.tx-table th{
  background:rgba(255,255,255,.025);padding:11px 16px;text-align:left;
  font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
  color:var(--dim);border-bottom:1px solid var(--border);white-space:nowrap;
}
.tx-table td{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.04);color:var(--text);vertical-align:middle}
.tx-table tr:last-child td{border-bottom:none}
.tx-table tbody tr:hover td{background:rgba(255,255,255,.02)}

/* ── BADGES ── */
.tx-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
.tx-badge-green{background:rgba(34,197,94,.12);color:var(--profit)}
.tx-badge-red{background:rgba(239,68,68,.12);color:var(--loss)}
.tx-badge-blue{background:rgba(59,130,246,.12);color:var(--blue)}
.tx-badge-yellow{background:rgba(234,179,8,.12);color:var(--warn)}
.tx-badge-gray{background:rgba(255,255,255,.07);color:var(--muted)}
.tx-badge-green-border{background:var(--green-dim);border:1px solid var(--green-border);color:var(--green)}

/* ── BUTTONS ── */
.tx-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:var(--r-sm);font-size:12.5px;font-weight:500;border:none;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;text-decoration:none;letter-spacing:-.005em;white-space:nowrap}
.tx-btn-primary{background:var(--gold);color:#0d0f12;font-weight:600}
.tx-btn-primary:hover{background:#ffc55c}
.tx-btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border)}
.tx-btn-ghost:hover{color:var(--text);border-color:var(--border2);background:rgba(255,255,255,.04)}
.tx-btn-danger{background:rgba(239,68,68,.12);color:var(--red);border:1px solid rgba(239,68,68,.2)}
.tx-btn-danger:hover{background:rgba(239,68,68,.2)}
.tx-btn-sm{padding:7px 12px;font-size:12px}
.tx-btn-icon{width:34px;height:34px;padding:0;justify-content:center;border:1px solid var(--border);background:transparent;color:var(--muted)}
.tx-btn-icon:hover{background:rgba(255,255,255,.04);color:var(--text)}

/* ── FORM ELEMENTS ── */
.tx-input{
  width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;
  padding:10px 12px;font-size:13px;color:var(--text);font-family:'Inter',sans-serif;
  outline:none;transition:border-color .15s;
}
.tx-input:focus{border-color:var(--gold);box-shadow:0 0 0 2px rgba(201,162,39,.08)}
.tx-input::placeholder{color:var(--dim)}
.tx-select{
  width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;
  padding:10px 12px;font-size:13px;color:var(--text);font-family:'Inter',sans-serif;
  outline:none;transition:border-color .15s;cursor:pointer;
  appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;
}
.tx-select:focus{border-color:var(--gold)}
.tx-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--dim);display:block;margin-bottom:6px}
.tx-form-group{margin-bottom:16px}
.tx-toggle{position:relative;display:inline-block;width:44px;height:24px}
.tx-toggle input{opacity:0;width:0;height:0}
.tx-toggle-slider{position:absolute;cursor:pointer;inset:0;background:var(--border);border-radius:100px;transition:.2s}
.tx-toggle-slider:before{position:absolute;content:'';height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s}
.tx-toggle input:checked + .tx-toggle-slider{background:var(--gold)}
.tx-toggle input:checked + .tx-toggle-slider:before{transform:translateX(20px)}

/* ── CHART PLACEHOLDER ── */
.tx-chart-box{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:16px;overflow:hidden}

/* ── SECTION DIVIDER ── */
.tx-divider{height:1px;background:var(--border);margin:24px 0}

/* ── STATUS DOT ── */
.tx-dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0}
.tx-dot-green{background:var(--profit)}
.tx-dot-red{background:var(--loss)}
.tx-dot-yellow{background:var(--warn)}
.tx-dot-gray{background:var(--dim)}
.tx-dot-blue{background:var(--blue)}

/* ── PROGRESS BAR ── */
.tx-progress-bg{background:var(--bg);border-radius:100px;height:6px;overflow:hidden}
.tx-progress-fill{height:100%;border-radius:100px;transition:width .3s}

/* ── GRID HELPERS ── */
.tx-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.tx-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.tx-grid-4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px}
.tx-grid-aside{display:grid;grid-template-columns:1fr 320px;gap:16px}
.tx-grid-aside-lg{display:grid;grid-template-columns:1fr 380px;gap:16px}

/* ── RESPONSIVE ── */
@media(max-width:1024px){
  .tx-grid-aside,.tx-grid-aside-lg{grid-template-columns:1fr}
  .tx-grid-3{grid-template-columns:1fr 1fr}
}
@media(max-width:768px){
  body{padding-left:0}
  .tx-sidebar{transform:translateX(calc(-1 * var(--sidebar-w)));transition:transform .25s cubic-bezier(.4,0,.2,1)}
  .tx-sidebar.open{transform:translateX(0)}
  .tx-header{left:0}
  .tx-header-search{display:none}
  .tx-kpi-grid{grid-template-columns:1fr 1fr}
  .tx-grid-2,.tx-grid-3,.tx-grid-4{grid-template-columns:1fr}
  .tx-hamburger{display:flex}
  .tx-main{padding:20px 16px 48px}
}
@media(max-width:480px){
  .tx-kpi-grid{grid-template-columns:1fr 1fr}
  .tx-page-title{font-size:18px}
}

/* ── PAGE TRANSITIONS ── */
@keyframes tx-page-in{
  from{opacity:0;transform:translateY(6px)}
  to{opacity:1;transform:translateY(0)}
}
.tx-main{animation:tx-page-in .24s cubic-bezier(.16,1,.3,1) both}
.tx-nav-curtain{
  position:fixed;inset:0;background:var(--bg);z-index:9000;
  pointer-events:none;opacity:0;
  transition:opacity .17s ease;
}
.tx-nav-curtain.show{opacity:1;pointer-events:all}

/* ── SKELETON SHIMMER ── */
@keyframes tx-shimmer{
  0%{background-position:-600px 0}
  100%{background-position:600px 0}
}
.tx-skeleton{
  border-radius:4px;
  background:linear-gradient(90deg,#1a1a1a 25%,#222 50%,#1a1a1a 75%);
  background-size:600px 100%;
  animation:tx-shimmer 1.4s infinite linear;
}
</style>`;

  var FONT = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">`;

  var NAV_ITEMS = [
    /* 0  */ { href:'/app/dashboard.html',    icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label:'Dashboard' },
    /* 1  */ { href:'/app/journal.html',       icon:'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z', label:'Trade Journal' },
    /* 2  */ { href:'/app/analytics.html',     icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label:'Analytics' },
    /* 3  */ { href:'/app/portfolio.html',     icon:'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', label:'Portfolio' },
    /* 4  */ { href:'/app/weekly-reviews.html',icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label:'Weekly Reviews' },
    /* 5  */ { href:'/app/ai-coach.html',      icon:'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', label:'AI Coach' },
    /* 6  */ { href:'/app/backtesting.html',   icon:'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', label:'Backtesting' },
    /* 7  */ { href:'/app/calendar.html',      icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label:'Calendar' },
    /* 8  */ { href:'/app/onboarding.html',    icon:'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', label:'Get Started', badge:'new' },
    /* 9  */ { href:'/app/reports.html',       icon:'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label:'Reports' },
    /* 10 */ { href:'/app/billing.html',       icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label:'Billing' },
    /* 11 */ { href:'/app/notifications.html', icon:'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label:'Notifications', badge:'3' },
    /* 12 */ { href:'/app/settings.html',      icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label:'Settings' },
    /* 13 */ { href:'/app/help.html',          icon:'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label:'Help Center' },
    /* 14 */ { href:'/app/referrals.html',     icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label:'Referrals' },
    /* 15 */ { href:'/app/security.html',      icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', label:'Security' },
    /* 16 */ { href:'/app/backups.html',       icon:'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', label:'Backups' },
    /* 17 */ { href:'/admin/',                 icon:'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label:'Admin Panel', badge:'admin' },
    /* 18 */ { href:'/app/daily-digest.html',  icon:'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h6', label:'Daily Digest', badge:'new' },
    /* 19 */ { href:'/app/capital.html',       icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label:'Capital Tracker' },
  ];

  function icon(d){
    return '<svg class="tx-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="'+d+'"/></svg>';
  }

  var path = window.location.pathname;

  function isActive(item){
    return path === item.href || path.endsWith(item.href.split('/').pop());
  }

  function renderLink(item, isAdmin){
    var active = isActive(item) ? ' active' : '';
    var badge = '';
    if(item.badge === 'admin'){
      badge = '<span class="tx-nav-badge dim">Owner</span>';
    } else if(item.badge === 'new'){
      badge = '<span class="tx-nav-badge" style="background:var(--gold);color:#0d0f12;font-size:9px">NEW</span>';
    } else if(item.badge){
      badge = '<span class="tx-nav-badge red">'+item.badge+'</span>';
    }
    return '<a href="'+item.href+'"'+active+'>' + icon(item.icon) + item.label + badge + '</a>';
  }

  function navHtml(){
    var html = '<nav class="tx-nav">';

    // MAIN
    html += '<div class="tx-nav-section">';
    html += '<span class="tx-nav-label">Main</span>';
    [0,1,2,3,4,18,19,5,6,7,8].forEach(function(i){ html += renderLink(NAV_ITEMS[i]); });
    html += '</div>';

    // ACCOUNT
    html += '<div class="tx-nav-section">';
    html += '<span class="tx-nav-label">Account</span>';
    [9,10,11,12,13,14,15,16].forEach(function(i){ html += renderLink(NAV_ITEMS[i]); });
    html += '</div>';

    // SYSTEM (admin-only — TxProfile.applyGuards hides this for non-admins)
    var adminItem = NAV_ITEMS[17];
    var adminActive = path.includes('/admin') ? ' active' : '';
    html += '<div class="tx-nav-section" data-tx-admin>';
    html += '<span class="tx-nav-label">System</span>';
    html += '<a href="'+adminItem.href+'"'+adminActive+'>' + icon(adminItem.icon) + adminItem.label + '<span class="tx-nav-badge dim">Owner</span></a>';
    html += '</div>';

    html += '</nav>';
    return html;
  }

  var SIDEBAR_HTML =
    '<aside class="tx-sidebar" id="txSidebar">' +
      '<a href="/" class="tx-logo" aria-label="Tradexa — home">' +
        '<img src="/assets/brand/tradexa-logo-icon.png" alt="" class="tx-logo-icon" width="24" height="24" decoding="async"/>' +
        '<div>' +
          '<div class="tx-logo-text">Tradexa</div>' +
          '<div class="tx-logo-badge">PRO</div>' +
        '</div>' +
      '</a>' +
      navHtml() +
      '<div class="tx-sidebar-user">' +
        '<a href="/app/settings.html" class="tx-user-card">' +
          '<div class="tx-user-avatar" id="txSidebarAvatar">' + _uInits + '</div>' +
          '<div>' +
            '<div class="tx-user-name" id="txSidebarName">' + _uName + '</div>' +
            '<div class="tx-user-plan" id="txSidebarPlan">Free Plan</div>' +
          '</div>' +
          '<svg class="tx-user-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>' +
        '</a>' +
      '</div>' +
    '</aside>';

  var OVERLAY_HTML = '<div class="tx-sidebar-overlay" id="txOverlay"></div>';

  var HEADER_HTML =
    '<header class="tx-header">' +
      '<button class="tx-hamburger" id="txHamburger" aria-label="Open menu">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' +
      '</button>' +
      '<div class="tx-header-title" id="txPageTitle">Dashboard</div>' +
      '<div class="tx-header-search">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
        '<input type="text" placeholder="Search trades, tags, notes..." id="txSearch">' +
      '</div>' +
      '<div class="tx-header-divider"></div>' +
      '<a href="/app/notifications.html" class="tx-header-icon-btn" title="Notifications">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>' +
        '<span class="tx-notif-dot"></span>' +
      '</a>' +
      '<a href="/app/settings.html" class="tx-header-icon-btn" title="Settings">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>' +
      '</a>' +
      '<div class="tx-header-divider"></div>' +
      '<button class="tx-header-avatar" id="txHeaderAvatar" title="' + _uName + '" style="cursor:pointer;border:none" onclick="if(window.TxAuth)window.TxAuth.signOut()">' + _uInits + '</button>' +
    '</header>';

  document.head.insertAdjacentHTML('beforeend', FONT);
  document.head.insertAdjacentHTML('beforeend', CSS);
  document.body.insertAdjacentHTML('afterbegin', OVERLAY_HTML);
  document.body.insertAdjacentHTML('afterbegin', HEADER_HTML);
  document.body.insertAdjacentHTML('afterbegin', SIDEBAR_HTML);

  // Mobile sidebar toggle
  document.addEventListener('DOMContentLoaded', function(){
    var sidebar = document.getElementById('txSidebar');
    var overlay = document.getElementById('txOverlay');
    var hamburger = document.getElementById('txHamburger');

    function openSidebar(){
      sidebar.classList.add('open');
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function closeSidebar(){
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    }

    if(hamburger) hamburger.addEventListener('click', openSidebar);
    if(overlay) overlay.addEventListener('click', closeSidebar);

    // Close on nav link click (mobile)
    if(sidebar){
      sidebar.querySelectorAll('a[href]').forEach(function(link){
        link.addEventListener('click', function(){
          if(window.innerWidth <= 768) closeSidebar();
        });
      });
    }

    // ESC key closes
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeSidebar();
    });

    /* ── PAGE TRANSITION SYSTEM ── */
    var curtain = document.createElement('div');
    curtain.className = 'tx-nav-curtain';
    curtain.id = 'txNavCurtain';
    document.body.appendChild(curtain);

    /* Reveal current page: curtain starts transparent, just ensure it's not blocking */
    curtain.style.opacity = '0';

    /* ── HOVER PREFETCH ─────────────────────────────────────
       On link hover/touchstart, inject <link rel="prefetch">
       so the next page is in browser cache before click.
       Each href is prefetched at most once per session.
    ───────────────────────────────────────────────────────── */
    var _prefetched = {};
    function _prefetch(href){
      if(!href || _prefetched[href]) return;
      if(href.startsWith('http') || href.startsWith('mailto:') ||
         href.startsWith('tel:')  || href.startsWith('#')      ||
         href.startsWith('javascript')) return;
      var destPath = href.split('?')[0].split('#')[0];
      if(destPath === window.location.pathname) return;
      _prefetched[href] = true;
      var l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = href;
      l.as = 'document';
      document.head.appendChild(l);
    }
    function _onHover(e){
      var link = e.target.closest && e.target.closest('a[href]');
      if(!link || link.target === '_blank') return;
      _prefetch(link.getAttribute('href'));
    }
    document.addEventListener('mouseover',  _onHover, { passive: true });
    document.addEventListener('touchstart', _onHover, { passive: true });

    /* Intercept all internal link clicks */
    document.addEventListener('click', function(e){
      /* Only handle plain left-clicks (no modifier keys = open in new tab intent) */
      if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      var link = e.target.closest('a[href]');
      if(!link) return;

      var href = link.getAttribute('href');
      if(!href) return;

      /* Skip: external, mailto, tel, anchor-only, target="_blank" */
      if(href.startsWith('http') || href.startsWith('mailto:') ||
         href.startsWith('tel:')  || href.startsWith('#')       ||
         link.target === '_blank') return;

      /* Skip: same page (just a path match) */
      var destPath = href.split('?')[0].split('#')[0];
      if(destPath === window.location.pathname) return;

      /* Skip: javascript: links */
      if(href.startsWith('javascript')) return;

      e.preventDefault();

      /* Fade curtain in, then navigate */
      curtain.classList.add('show');
      setTimeout(function(){
        window.location.href = href;
      }, 175);
    }, true); /* capture phase so modal overlays etc. still work */
  });
})();
