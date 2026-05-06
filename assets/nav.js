/* Anti-flash nav layer is now inlined into every page's <head>
   via the tx-noflash-js snippet (set via patch script). It runs
   pre-parse and covers all pages including those without nav.js. */
(function () {
  const p = window.location.pathname;

  const LOGO = `<a href="/" class="tx-logo" aria-label="Tradexa — home">
    <img src="/assets/brand/tradexa-logo-full.png" alt="Tradexa" class="tx-logo-img" width="132" height="35" decoding="async"/>
    <em class="tx-logo-pro">PRO</em>
  </a>`;

  const NAV_HTML = `<nav id="tx-nav">
  <div class="tx-nav-inner">
    ${LOGO}
    <div class="tx-nav-links">
      <div class="tx-dd">
        <button>Product ▾</button>
        <div class="tx-dd-menu">
          <a href="/product/">Overview</a>
          <a href="/product/dashboard.html">Dashboard</a>
          <a href="/product/ai-coach.html">AI Coach</a>
          <a href="/product/analytics.html">Performance Analytics</a>
          <a href="/product/backtesting.html">Backtesting Module</a>
          <a href="/product/strategy-lab.html">Strategy Lab</a>
          <a href="/product/trade-replay.html">Trade Replay</a>
          <a href="/product/risk-controls.html">Risk Controls</a>
          <a href="/product/trading-journal.html">Trading Journal</a>
          <a href="/product/broker-sync.html">Broker Sync</a>
          <div class="tx-dd-divider"></div>
          <a href="/#outcomes">The Transformation</a>
        </div>
      </div>
      <div class="tx-dd">
        <button>Solutions ▾</button>
        <div class="tx-dd-menu tx-mega tx-mega-2col">
          <div class="tx-mega-head">Who Tradexa is built for</div>
          <div class="tx-mega-grid">
            <a href="/solutions/beginner-traders.html" class="tx-mega-card">
              <div class="tx-mega-icon">🌱</div>
              <div><div class="tx-mega-title">Beginner Traders</div><div class="tx-mega-desc">Build good habits from day one</div></div>
            </a>
            <a href="/solutions/losing-traders.html" class="tx-mega-card">
              <div class="tx-mega-icon">🔄</div>
              <div><div class="tx-mega-title">Losing Traders</div><div class="tx-mega-desc">Turn losses into structured learning</div></div>
            </a>
            <a href="/solutions/prop-firm-traders.html" class="tx-mega-card">
              <div class="tx-mega-icon">🏆</div>
              <div><div class="tx-mega-title">Prop Firm Traders</div><div class="tx-mega-desc">Track drawdowns and pass evaluations</div></div>
            </a>
            <a href="/solutions/crypto-traders.html" class="tx-mega-card">
              <div class="tx-mega-icon">₿</div>
              <div><div class="tx-mega-title">Crypto Traders</div><div class="tx-mega-desc">Multi-chain analysis and tracking</div></div>
            </a>
          </div>
          <div class="tx-mega-footer"><a href="/solutions/">View all solutions →</a></div>
        </div>
      </div>
      <div class="tx-dd">
        <button>Problems ▾</button>
        <div class="tx-dd-menu tx-mega tx-mega-2col">
          <div class="tx-mega-head">Common trader pain points we solve</div>
          <div class="tx-mega-grid">
            <a href="/problems/overtrading.html" class="tx-mega-card">
              <div class="tx-mega-icon">📉</div>
              <div><div class="tx-mega-title">Overtrading</div><div class="tx-mega-desc">Stop impulse trades that hurt your P&L</div></div>
            </a>
            <a href="/problems/breaking-rules.html" class="tx-mega-card">
              <div class="tx-mega-icon">🚫</div>
              <div><div class="tx-mega-title">Breaking Rules</div><div class="tx-mega-desc">See exactly where your rules break down</div></div>
            </a>
            <a href="/problems/no-consistency.html" class="tx-mega-card">
              <div class="tx-mega-icon">📊</div>
              <div><div class="tx-mega-title">No Consistency</div><div class="tx-mega-desc">Identify what actually works for you</div></div>
            </a>
            <a href="/problems/risk-management.html" class="tx-mega-card">
              <div class="tx-mega-icon">🛡️</div>
              <div><div class="tx-mega-title">Poor Risk Management</div><div class="tx-mega-desc">Track risk and manage your exposure</div></div>
            </a>
            <a href="/problems/emotional-trading.html" class="tx-mega-card">
              <div class="tx-mega-icon">🧠</div>
              <div><div class="tx-mega-title">Emotional Trading</div><div class="tx-mega-desc">Separate feelings from your execution</div></div>
            </a>
          </div>
          <div class="tx-mega-footer"><a href="/problems/">View all problems →</a></div>
        </div>
      </div>
      <a href="/pricing/">Pricing</a>
      <a href="/tools/" style="color:var(--tx-gold);font-weight:500">Free Tools</a>
      <div class="tx-dd">
        <button>Resources ▾</button>
        <div class="tx-dd-menu">
          <a href="/resources/help-center.html">Help Center</a>
          <a href="/resources/blog.html">Blog</a>
          <a href="/resources/faq.html">FAQ</a>
          <a href="/changelog.html">Changelog</a>
          <a href="/roadmap.html">Roadmap</a>
        </div>
      </div>
    </div>
    <div class="tx-nav-cta" id="tx-nav-cta">
      <a href="/auth/login.html" class="tx-btn-ghost">Login</a>
      <a href="/auth/register.html" class="tx-btn-primary">
        <span>Start Free</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
    </div>
    <button class="tx-hamburger" id="tx-hamburger">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
  </div>
  <div class="tx-mobile-menu" id="tx-mobile-menu">
    <a href="/product/">Product</a>
    <a href="/product/dashboard.html" style="padding-left:28px;font-size:13px">↳ Dashboard</a>
    <a href="/product/ai-coach.html" style="padding-left:28px;font-size:13px">↳ AI Coach</a>
    <a href="/product/analytics.html" style="padding-left:28px;font-size:13px">↳ Performance Analytics</a>
    <a href="/product/backtesting.html" style="padding-left:28px;font-size:13px">↳ Backtesting</a>
    <a href="/product/strategy-lab.html" style="padding-left:28px;font-size:13px">↳ Strategy Lab</a>
    <a href="/product/trade-replay.html" style="padding-left:28px;font-size:13px">↳ Trade Replay</a>
    <a href="/product/risk-controls.html" style="padding-left:28px;font-size:13px">↳ Risk Controls</a>
    <a href="/product/trading-journal.html" style="padding-left:28px;font-size:13px">↳ Trading Journal</a>
    <a href="/product/broker-sync.html" style="padding-left:28px;font-size:13px">↳ Broker Sync</a>
    <a href="/solutions/">Solutions</a>
    <a href="/solutions/beginner-traders.html" style="padding-left:28px;font-size:13px">↳ Beginner Traders</a>
    <a href="/solutions/losing-traders.html" style="padding-left:28px;font-size:13px">↳ Losing Traders</a>
    <a href="/solutions/prop-firm-traders.html" style="padding-left:28px;font-size:13px">↳ Prop Firm Traders</a>
    <a href="/solutions/crypto-traders.html" style="padding-left:28px;font-size:13px">↳ Crypto Traders</a>
    <a href="/problems/">Problems We Solve</a>
    <a href="/problems/overtrading.html" style="padding-left:28px;font-size:13px">↳ Overtrading</a>
    <a href="/problems/breaking-rules.html" style="padding-left:28px;font-size:13px">↳ Breaking Rules</a>
    <a href="/problems/no-consistency.html" style="padding-left:28px;font-size:13px">↳ No Consistency</a>
    <a href="/problems/risk-management.html" style="padding-left:28px;font-size:13px">↳ Risk Management</a>
    <a href="/problems/emotional-trading.html" style="padding-left:28px;font-size:13px">↳ Emotional Trading</a>
    <a href="/pricing/">Pricing</a>
    <a href="/tools/" style="color:#FFB732">Free Tools</a>
    <a href="/resources/blog.html">Blog</a>
    <a href="/resources/faq.html">FAQ</a>
    <a href="/roadmap.html">Roadmap</a>
    <hr/>
    <div id="tx-mobile-auth">
      <a href="/auth/login.html">Login</a>
      <a href="/auth/register.html" style="color:#FFB732;font-weight:600">Start Free →</a>
    </div>
  </div>
</nav>`;

  const FOOTER_HTML = `<footer id="tx-footer">
  <div class="tx-footer-glow"></div>
  <div class="tx-footer-inner">
    <div class="tx-footer-brand">
      ${LOGO}
      <p>Professional trading journal &amp; performance analytics.<br>Track trades. Build consistency. Trade smarter.</p>
      <div class="tx-social">
        <a href="https://twitter.com/TradexaHQ" target="_blank" rel="noopener" aria-label="X/Twitter"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.76l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
        <a href="https://linkedin.com/company/tradexa" target="_blank" rel="noopener" aria-label="LinkedIn"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
        <a href="https://discord.gg/tradexa" target="_blank" rel="noopener" aria-label="Discord"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg></a>
        <a href="https://instagram.com/tradexa" target="_blank" rel="noopener" aria-label="Instagram"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.069 1.646.069 4.849 0 3.205-.012 3.584-.069 4.849-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.645.07-4.85.07-3.204 0-3.584-.012-4.849-.07-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.175 15.647 2.163 15.268 2.163 12s.012-3.584.07-4.849c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.175 8.796 2.163 12 2.163zm0 1.838c-3.142 0-3.503.011-4.737.067-.954.043-1.504.198-1.857.328-.466.181-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.13.353-.285.903-.328 1.857C3.124 8.497 3.113 8.858 3.113 12s.011 3.503.067 4.737c.043.954.198 1.504.328 1.857.182.466.398.8.748 1.15.35.35.684.566 1.15.748.353.13.903.285 1.857.328 1.234.056 1.595.067 4.737.067 3.142 0 3.503-.011 4.737-.067.954-.043 1.504-.198 1.857-.328.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.13-.353.285-.903.328-1.857.056-1.234.067-1.595.067-4.737s-.011-3.503-.067-4.737c-.043-.954-.198-1.504-.328-1.857-.182-.466-.398-.8-.748-1.15-.35-.35-.684-.566-1.15-.748-.353-.13-.903-.285-1.857-.328C15.503 4.012 15.142 4.001 12 4.001zm0 3.139A4.86 4.86 0 1112 16.86 4.86 4.86 0 0112 7.14zm0 8.018A3.158 3.158 0 1012 8.842a3.158 3.158 0 000 6.316zm6.406-8.205a1.135 1.135 0 11-2.27 0 1.135 1.135 0 012.27 0z"/></svg></a>
      </div>
    </div>
    <div class="tx-footer-cols">
      <div><h5>Product</h5>
        <a href="/product/">Overview</a>
        <a href="/product/dashboard.html">Dashboard</a>
        <a href="/product/ai-coach.html">AI Coach</a>
        <a href="/product/analytics.html">Analytics</a>
        <a href="/product/backtesting.html">Backtesting</a>
        <a href="/product/strategy-lab.html">Strategy Lab</a>
        <a href="/product/trade-replay.html">Trade Replay</a>
        <a href="/product/risk-controls.html">Risk Controls</a>
        <a href="/product/trading-journal.html">Trading Journal</a>
        <a href="/product/broker-sync.html">Broker Sync</a>
      </div>
      <div><h5>Solutions</h5>
        <a href="/solutions/">All Solutions</a>
        <a href="/solutions/beginner-traders.html">Beginners</a>
        <a href="/solutions/losing-traders.html">Losing Traders</a>
        <a href="/solutions/prop-firm-traders.html">Prop Firms</a>
        <a href="/solutions/crypto-traders.html">Crypto Traders</a>
      </div>
      <div><h5>Resources</h5>
        <a href="/resources/blog.html">Blog</a>
        <a href="/resources/help-center.html">Help Center</a>
        <a href="/resources/faq.html">FAQ</a>
        <a href="/changelog.html">Changelog</a>
        <a href="/roadmap.html">Roadmap</a>
        <a href="/tools/">Free Tools</a>
        <a href="/pricing/">Pricing</a>
      </div>
      <div><h5>Company</h5>
        <a href="/company/about.html">About Us</a>
        <a href="/company/contact.html">Contact</a>
        <a href="/legal/privacy.html">Privacy Policy</a>
        <a href="/legal/terms.html">Terms of Service</a>
        <a href="/legal/risk.html">Risk Disclosure</a>
        <a href="/legal/cookies.html">Cookies</a>
      </div>
    </div>
  </div>
  <div class="tx-footer-bar">
    <div class="tx-footer-bar-inner">
      <span>&copy; 2026 Tradexa. All rights reserved.</span>
      <span>Trading involves substantial risk. Past performance does not guarantee future results.</span>
    </div>
  </div>
</footer>`;

  const CSS = `<style id="tx-global-css">
*{box-sizing:border-box}
:root{
  --tx-green:#22C55E;--tx-green-hover:#16A34A;--tx-green-dim:rgba(34,197,94,.08);--tx-green-border:rgba(34,197,94,.2);
  --tx-blue:#5E81AC;--tx-blue-hover:#4a6b94;--tx-blue-dim:rgba(94,129,172,.08);
  --tx-gold:#FFB732;--tx-gold-dim:rgba(255,183,50,.09);--tx-gold-border:rgba(255,183,50,.28);
  --tx-red:#EF4444;--tx-amber:#FFB732;
  --tx-bg:#0d0f12;--tx-surface:#13161b;--tx-surface2:#1a1d23;
  --tx-border:#22262e;--tx-border-strong:#353535;
  --tx-glass:rgba(255,255,255,0.02);
  --tx-text:#F5F5F5;--tx-muted:#A1A1AA;--tx-dim:#525252;
  --tx-profit:#22C55E;--tx-loss:#EF4444;--tx-warn:#FFB732;
}
body{margin:0;padding-top:64px;font-family:'Inter',sans-serif;background:var(--tx-bg);color:var(--tx-text);-webkit-font-smoothing:antialiased}
#tx-nav{
  position:fixed;top:0;left:0;right:0;z-index:1000;
  background:rgba(10,10,10,0.97);
  backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
  border-bottom:1px solid var(--tx-border);
}
.tx-nav-inner{max-width:1300px;margin:0 auto;display:flex;align-items:center;gap:4px;padding:0 28px;height:64px}
.tx-logo{display:flex;align-items:center;gap:8px;text-decoration:none;flex-shrink:0;color:var(--tx-text);margin-right:20px}
.tx-logo-img{display:block;height:32px;width:auto;flex-shrink:0}
.tx-logo-pro{
  font-style:normal;font-size:10px;font-weight:600;color:var(--tx-gold);
  background:var(--tx-gold-dim);border:1px solid var(--tx-gold-border);
  padding:2px 7px;border-radius:4px;letter-spacing:.04em;line-height:1;
}
.tx-nav-links{display:flex;align-items:center;gap:1px;flex:1}
.tx-nav-links>a,.tx-nav-links>div>button{
  color:var(--tx-muted);text-decoration:none;font-size:13.5px;font-weight:400;
  padding:7px 12px;border-radius:6px;transition:all .15s;
  background:none;border:none;cursor:pointer;font-family:inherit;
  display:flex;align-items:center;gap:5px;white-space:nowrap;
}
.tx-nav-links>a:hover,.tx-nav-links>div>button:hover,.tx-dd:hover>button{color:var(--tx-text);background:rgba(255,255,255,.05)}
.tx-nav-cta{display:flex;align-items:center;gap:10px;margin-left:auto;flex-shrink:0}
.tx-btn-ghost{
  color:var(--tx-muted);text-decoration:none;font-size:13px;font-weight:500;
  padding:8px 18px;border-radius:8px;border:1px solid var(--tx-border);transition:all .15s;
}
.tx-btn-ghost:hover{color:var(--tx-text);border-color:var(--tx-border-strong);background:var(--tx-glass)}
.tx-btn-primary{
  display:inline-flex;align-items:center;gap:8px;
  color:#0d0f12;text-decoration:none;font-size:13px;font-weight:700;
  padding:8px 20px;border-radius:6px;
  background:#FFB732;
  transition:all .2s;white-space:nowrap;letter-spacing:-.01em;
}
.tx-btn-primary:hover{background:#b08c1f;transform:translateY(-1px)}

/* ── Standard dropdown ── */
.tx-dd{position:relative}
.tx-dd-menu{
  position:absolute;top:calc(100% + 8px);left:0;
  background:#13161b;border:1px solid var(--tx-border);
  border-radius:12px;padding:6px;min-width:215px;
  opacity:0;visibility:hidden;transform:translateY(-6px);
  transition:all .18s cubic-bezier(.4,0,.2,1);z-index:500;
  box-shadow:0 20px 60px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.04);
}
.tx-dd:hover .tx-dd-menu{opacity:1;visibility:visible;transform:none}
.tx-dd-menu>a{
  display:block;padding:8px 12px;color:var(--tx-muted);
  text-decoration:none;font-size:13px;border-radius:6px;transition:all .1s;
}
.tx-dd-menu>a:hover{color:var(--tx-text);background:rgba(255,255,255,.05)}
.tx-dd-divider{height:1px;background:var(--tx-border);margin:6px 14px}
.tx-dd-menu>a[href*="#outcomes"]{color:var(--tx-gold)}
.tx-dd-menu>a[href*="#outcomes"]:hover{color:var(--tx-gold);background:rgba(255,183,50,.08)}

/* ── Mega menu ── */
.tx-mega{min-width:460px;padding:16px}
.tx-mega-head{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--tx-dim);margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--tx-border)}
.tx-mega-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px}
.tx-mega-card{
  display:flex;align-items:flex-start;gap:11px;padding:11px 12px;border-radius:9px;
  text-decoration:none;transition:all .15s;border:1px solid transparent;
}
.tx-mega-card:hover{background:rgba(255,255,255,.04);border-color:var(--tx-border)}
.tx-mega-icon{
  width:32px;height:32px;border-radius:7px;flex-shrink:0;font-size:14px;
  background:var(--tx-surface2);border:1px solid var(--tx-border);
  display:flex;align-items:center;justify-content:center;
}
.tx-mega-title{font-size:13px;font-weight:600;color:var(--tx-text);margin-bottom:2px}
.tx-mega-desc{font-size:11.5px;color:var(--tx-dim);line-height:1.45}
.tx-mega-footer{border-top:1px solid var(--tx-border);padding-top:10px}
.tx-mega-footer a{font-size:12px;color:var(--tx-gold);text-decoration:none;font-weight:500;transition:color .15s}
.tx-mega-footer a:hover{color:#d4ad2e}

/* ── Auth-state user button ── */
.tx-user-btn{position:relative;display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.04);border:1px solid var(--tx-border);color:var(--tx-text);padding:5px 12px 5px 5px;border-radius:100px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;transition:all .15s}
.tx-user-btn:hover{background:rgba(255,255,255,.07);border-color:var(--tx-border-strong)}
.tx-user-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#FFB732,#b08c1f);color:#0d0f12;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;background-size:cover;background-position:center}
.tx-user-name{max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tx-user-caret{color:var(--tx-dim)}
.tx-user-menu{position:absolute;top:calc(100% + 8px);right:0;min-width:230px;background:#13161b;border:1px solid var(--tx-border);border-radius:12px;padding:6px;opacity:0;visibility:hidden;transform:translateY(-6px);transition:all .18s cubic-bezier(.4,0,.2,1);z-index:500;box-shadow:0 20px 60px rgba(0,0,0,.7)}
.tx-user-wrap:hover .tx-user-menu,.tx-user-wrap:focus-within .tx-user-menu{opacity:1;visibility:visible;transform:none}
.tx-user-wrap{position:relative}
.tx-user-menu-head{padding:10px 12px 8px;border-bottom:1px solid var(--tx-border);margin-bottom:4px}
.tx-user-menu-name{font-size:13px;font-weight:600;color:var(--tx-text);margin-bottom:2px}
.tx-user-menu-email{font-size:11.5px;color:var(--tx-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tx-user-menu>a,.tx-user-menu>button{display:flex;align-items:center;gap:9px;width:100%;padding:8px 12px;color:var(--tx-muted);text-decoration:none;font-size:13px;border-radius:6px;transition:all .1s;background:none;border:none;cursor:pointer;font-family:inherit;text-align:left}
.tx-user-menu>a:hover,.tx-user-menu>button:hover{color:var(--tx-text);background:rgba(255,255,255,.05)}
.tx-user-menu-divider{height:1px;background:var(--tx-border);margin:4px 8px}
.tx-user-menu-signout{color:#EF4444 !important}

/* ── Mobile ── */
.tx-hamburger{display:none;background:none;border:1px solid var(--tx-border);cursor:pointer;color:var(--tx-muted);padding:7px;border-radius:7px;margin-left:auto}
.tx-mobile-menu{display:none;flex-direction:column;padding:0 24px 20px;border-top:1px solid var(--tx-border)}
.tx-mobile-menu.open{display:flex}
.tx-mobile-menu a{padding:11px 0;color:var(--tx-muted);text-decoration:none;font-size:14px;border-bottom:1px solid var(--tx-border)}
.tx-mobile-menu a:last-child{border-bottom:none}
.tx-mobile-menu a:hover{color:var(--tx-text)}
.tx-mobile-menu hr{border:none;border-top:1px solid var(--tx-border);margin:8px 0}

/* ── Footer ── */
#tx-footer{background:#0d0f12;border-top:1px solid var(--tx-border);margin-top:80px;position:relative;overflow:hidden}
.tx-footer-glow{display:none}
.tx-footer-inner{max-width:1300px;margin:0 auto;padding:64px 28px 48px;display:flex;gap:72px}
.tx-footer-brand{flex:0 0 240px}
.tx-footer-brand .tx-logo{margin-bottom:16px}
.tx-footer-brand p{font-size:13px;color:var(--tx-dim);line-height:1.7;margin:0 0 22px}
.tx-social{display:flex;gap:10px}
.tx-social a{
  width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;
  color:var(--tx-dim);border:1px solid var(--tx-border);transition:all .15s;
}
.tx-social a:hover{color:var(--tx-gold);border-color:var(--tx-gold-border);background:var(--tx-gold-dim)}
.tx-footer-cols{flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:40px}
.tx-footer-cols h5{font-size:10px;font-weight:700;color:var(--tx-text);text-transform:uppercase;letter-spacing:.1em;margin:0 0 18px}
.tx-footer-cols a{display:block;font-size:13px;color:var(--tx-dim);text-decoration:none;margin-bottom:11px;transition:color .15s}
.tx-footer-cols a:hover{color:var(--tx-muted)}
.tx-footer-bar{border-top:1px solid var(--tx-border)}
.tx-footer-bar-inner{max-width:1300px;margin:0 auto;padding:16px 28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.tx-footer-bar-inner span{font-size:11.5px;color:var(--tx-dim)}
@media(max-width:900px){
  .tx-nav-links{display:none}.tx-nav-cta{display:none}.tx-hamburger{display:flex}
  .tx-footer-inner{flex-direction:column;gap:40px}.tx-footer-brand{flex:none}
  .tx-footer-cols{grid-template-columns:repeat(2,1fr);gap:24px}
}
</style>`;

  document.head.insertAdjacentHTML('beforeend', `<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap" rel="stylesheet">`);
  document.head.insertAdjacentHTML('beforeend', CSS);
  document.body.insertAdjacentHTML('afterbegin', NAV_HTML);
  document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);

  document.getElementById('tx-hamburger').addEventListener('click', function () {
    document.getElementById('tx-mobile-menu').classList.toggle('open');
  });

  /* ── Auth-aware nav: swap Login/Start Free for user menu when signed in (Supabase) ── */
  (function () {
    function _esc(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

    function renderSignedIn(user){
      var cta = document.getElementById('tx-nav-cta');
      var mob = document.getElementById('tx-mobile-auth');
      if(!cta) return;
      var meta = (user && user.user_metadata) || {};
      var name  = _esc(meta.full_name || meta.name || (user.email ? user.email.split('@')[0] : 'Account'));
      var email = _esc(user.email || '');
      var parts = name.trim().split(/\s+/);
      var ini   = ((parts[0]||'T').charAt(0) + (parts[1]?parts[1].charAt(0):'')).toUpperCase() || 'TX';
      var avatar = meta.avatar_url || meta.picture || '';
      var avatarStyle = avatar ? 'background-image:url(' + _esc(avatar) + ');background-size:cover;background-position:center' : '';
      var avatarInner = avatar ? '' : ini;

      cta.innerHTML =
        '<div class="tx-user-wrap" tabindex="0">' +
          '<button class="tx-user-btn" type="button" aria-label="Account menu">' +
            '<span class="tx-user-avatar" style="' + avatarStyle + '">' + avatarInner + '</span>' +
            '<span class="tx-user-name">' + name + '</span>' +
            '<svg class="tx-user-caret" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>' +
          '</button>' +
          '<div class="tx-user-menu" role="menu">' +
            '<div class="tx-user-menu-head">' +
              '<div class="tx-user-menu-name">' + name + '</div>' +
              (email ? '<div class="tx-user-menu-email">' + email + '</div>' : '') +
            '</div>' +
            '<a href="/app/dashboard.html">Dashboard</a>' +
            '<a href="/app/journal.html">Trade Journal</a>' +
            '<a href="/app/settings.html">Settings</a>' +
            '<a href="/app/billing.html">Billing</a>' +
            '<div class="tx-user-menu-divider"></div>' +
            '<button type="button" class="tx-user-menu-signout" id="tx-signout">Sign out</button>' +
          '</div>' +
        '</div>';

      var btn = document.getElementById('tx-signout');
      if (btn) btn.addEventListener('click', function(){ window.TxAuth && window.TxAuth.signOut(); });

      if (mob) {
        mob.innerHTML =
          '<a href="/app/dashboard.html" style="color:#FFB732;font-weight:600">→ Dashboard</a>' +
          '<a href="/app/settings.html">Settings</a>' +
          '<a href="#" id="tx-mobile-signout" style="color:#EF4444">Sign out</a>';
        var ms = document.getElementById('tx-mobile-signout');
        if (ms) ms.addEventListener('click', function(e){ e.preventDefault(); window.TxAuth && window.TxAuth.signOut(); });
      }
    }

    function renderSignedOut(){
      var cta = document.getElementById('tx-nav-cta');
      var mob = document.getElementById('tx-mobile-auth');
      if (cta) cta.innerHTML =
        '<a href="/auth/login.html" class="tx-btn-ghost">Login</a>' +
        '<a href="/auth/register.html" class="tx-btn-primary"><span>Start Free</span>' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>';
      if (mob) mob.innerHTML =
        '<a href="/auth/login.html">Login</a>' +
        '<a href="/auth/register.html" style="color:#FFB732;font-weight:600">Start Free →</a>';
    }

    function update(){
      if (!window.TxAuth) return;
      var u = window.TxAuth.getUser();
      if (u) renderSignedIn(u); else renderSignedOut();
    }

    function bootstrap(){
      if (!window.TxAuth) {
        /* Lazy-load supabase-auth.js if this page didn't include it. */
        var s = document.createElement('script');
        s.src = '/assets/supabase-auth.js';
        s.onload = bootstrap;
        document.head.appendChild(s);
        return;
      }
      window.TxAuth.ready().then(update).catch(function(){ /* keep signed-out CTAs */ });
      document.addEventListener('tx-auth-change', update);
    }
    bootstrap();
  })();

  /* ── Load monitoring on all pages ── */
  (function(){
    var s = document.createElement('script');
    s.src = '/assets/monitoring.js';
    s.defer = true;
    document.head.appendChild(s);
  })();

  /* ── Email-capture popup removed per user request ── */
  var _p = window.location.pathname;

  /* ── Load feedback widget on app pages only ── */
  if(/\/app\//.test(_p)){
    (function(){
      var s = document.createElement('script');
      s.src = '/assets/feedback-widget.js';
      s.defer = true;
      document.head.appendChild(s);
    })();
  }

  /* ── Load Capital Tracker → Trade Data → Trade Bot on app pages ── */
  if(/\/app\//.test(_p)){
    (function(){
      var sc = document.createElement('script');
      sc.src = '/assets/capital-tracker.js';
      sc.onload = function(){
        var sd = document.createElement('script');
        sd.src = '/assets/trades-data.js';
        sd.onload = function(){
          var sb = document.createElement('script');
          sb.src = '/assets/tradebot.js';
          document.head.appendChild(sb);
        };
        document.head.appendChild(sd);
      };
      document.head.appendChild(sc);
    })();
  }

  /* Demo-mode banner removed — auth was stripped, app is always open. */
})();
