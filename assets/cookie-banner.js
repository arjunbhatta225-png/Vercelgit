(function () {
  'use strict';
  var KEY = 'tx_cookie_consent';

  function getConsent() {
    try { return localStorage.getItem(KEY); } catch(e) { return null; }
  }

  function setConsent(val) {
    try {
      localStorage.setItem(KEY, val);
      localStorage.setItem('tx_cookie_ts', Date.now());
    } catch(e) {}
  }

  function removeBanner() {
    var b = document.getElementById('tx-cookie-banner');
    if (b) { b.style.transform = 'translateY(100%)'; setTimeout(function(){ b.remove(); }, 300); }
  }

  function accept() {
    setConsent('accepted');
    removeBanner();
    if (window.txTrack) { window.txTrack.event('cookie_consent', { decision: 'accepted' }); }
  }

  function reject() {
    setConsent('rejected');
    removeBanner();
  }

  function customize() {
    var modal = document.getElementById('tx-cookie-modal');
    if (modal) modal.style.display = 'flex';
  }

  function saveCustom() {
    var analytics = document.getElementById('tx-cookie-analytics');
    var marketing = document.getElementById('tx-cookie-marketing');
    setConsent(analytics && analytics.checked ? 'accepted' : 'analytics_off');
    if (!marketing || !marketing.checked) localStorage.setItem('tx_marketing_off', '1');
    var modal = document.getElementById('tx-cookie-modal');
    if (modal) modal.style.display = 'none';
    removeBanner();
    if (window.txTrack) window.txTrack.event('cookie_consent', { decision: 'customized' });
  }

  function inject() {
    if (getConsent()) return;

    var CSS = `<style id="tx-cookie-css">
#tx-cookie-banner{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#111827;border-top:1px solid #1F2937;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;font-family:'Inter',sans-serif;transform:translateY(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);box-shadow:0 -8px 32px rgba(0,0,0,.5)}
#tx-cookie-banner.show{transform:translateY(0)}
.tx-ck-text{font-size:13px;color:#94A3B8;max-width:680px;line-height:1.6}
.tx-ck-text a{color:#10B981;text-decoration:none}
.tx-ck-text a:hover{text-decoration:underline}
.tx-ck-actions{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap}
.tx-ck-btn{padding:9px 16px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:'Inter',sans-serif;transition:all .15s;white-space:nowrap}
.tx-ck-accept{background:#10B981;color:#fff}
.tx-ck-accept:hover{background:#059669}
.tx-ck-reject{background:transparent;color:#94A3B8;border:1px solid #1F2937}
.tx-ck-reject:hover{color:#F9FAFB;border-color:#374151}
.tx-ck-custom{background:transparent;color:#6B7280;font-size:12px;padding:9px 12px;border:1px solid #1F2937}
.tx-ck-custom:hover{color:#94A3B8}
#tx-cookie-modal{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center;font-family:'Inter',sans-serif}
.tx-ck-modal-box{background:#111827;border:1px solid #1F2937;border-radius:10px;padding:28px;max-width:480px;width:90%;box-shadow:0 24px 64px rgba(0,0,0,.6)}
.tx-ck-modal-title{font-size:16px;font-weight:700;color:#F9FAFB;margin-bottom:6px}
.tx-ck-modal-sub{font-size:12px;color:#6B7280;margin-bottom:20px}
.tx-ck-toggle-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #1F2937}
.tx-ck-toggle-row:last-of-type{border-bottom:none}
.tx-ck-toggle-label{font-size:13px;color:#F9FAFB;font-weight:500}
.tx-ck-toggle-desc{font-size:11px;color:#6B7280;margin-top:2px}
.tx-ck-switch{position:relative;display:inline-block;width:40px;height:22px}
.tx-ck-switch input{opacity:0;width:0;height:0}
.tx-ck-slider{position:absolute;cursor:pointer;inset:0;background:#374151;border-radius:100px;transition:.2s}
.tx-ck-slider:before{position:absolute;content:'';height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s}
.tx-ck-switch input:checked + .tx-ck-slider{background:#10B981}
.tx-ck-switch input:checked + .tx-ck-slider:before{transform:translateX(18px)}
.tx-ck-switch input:disabled + .tx-ck-slider{opacity:.5;cursor:not-allowed}
.tx-ck-modal-footer{margin-top:20px;display:flex;gap:8px;justify-content:flex-end}
@media(max-width:640px){#tx-cookie-banner{flex-direction:column;align-items:flex-start}.tx-ck-actions{width:100%}.tx-ck-accept,.tx-ck-reject{flex:1;text-align:center}}
</style>`;

    var BANNER_HTML = CSS + `
<div id="tx-cookie-banner">
  <div class="tx-ck-text">
    🍪 We use cookies to improve your experience, analyze platform usage, and personalize AI insights. 
    We never sell your data. <a href="/legal/cookies.html">Cookie Policy</a> · <a href="/legal/privacy.html">Privacy Policy</a>
  </div>
  <div class="tx-ck-actions">
    <button class="tx-ck-btn tx-ck-custom" id="tx-ck-customize">Customize</button>
    <button class="tx-ck-btn tx-ck-reject" id="tx-ck-reject">Reject All</button>
    <button class="tx-ck-btn tx-ck-accept" id="tx-ck-accept">Accept All</button>
  </div>
</div>
<div id="tx-cookie-modal">
  <div class="tx-ck-modal-box">
    <div class="tx-ck-modal-title">Cookie Preferences</div>
    <div class="tx-ck-modal-sub">Choose which cookies you allow. Essential cookies are always active.</div>
    <div class="tx-ck-toggle-row">
      <div><div class="tx-ck-toggle-label">Essential Cookies</div><div class="tx-ck-toggle-desc">Required for core platform functionality. Cannot be disabled.</div></div>
      <label class="tx-ck-switch"><input type="checkbox" checked disabled><span class="tx-ck-slider"></span></label>
    </div>
    <div class="tx-ck-toggle-row">
      <div><div class="tx-ck-toggle-label">Analytics Cookies</div><div class="tx-ck-toggle-desc">Help us understand how you use the platform (privacy-first, no PII).</div></div>
      <label class="tx-ck-switch"><input type="checkbox" id="tx-cookie-analytics" checked><span class="tx-ck-slider"></span></label>
    </div>
    <div class="tx-ck-toggle-row">
      <div><div class="tx-ck-toggle-label">Marketing Cookies</div><div class="tx-ck-toggle-desc">Used for personalized ads and retargeting campaigns.</div></div>
      <label class="tx-ck-switch"><input type="checkbox" id="tx-cookie-marketing"><span class="tx-ck-slider"></span></label>
    </div>
    <div class="tx-ck-modal-footer">
      <button class="tx-ck-btn tx-ck-reject" onclick="document.getElementById('tx-cookie-modal').style.display='none'">Cancel</button>
      <button class="tx-ck-btn tx-ck-accept" id="tx-ck-save">Save Preferences</button>
    </div>
  </div>
</div>`;

    document.body.insertAdjacentHTML('beforeend', BANNER_HTML);

    setTimeout(function() {
      var b = document.getElementById('tx-cookie-banner');
      if (b) b.classList.add('show');
    }, 800);

    document.getElementById('tx-ck-accept').addEventListener('click', accept);
    document.getElementById('tx-ck-reject').addEventListener('click', reject);
    document.getElementById('tx-ck-customize').addEventListener('click', customize);
    document.getElementById('tx-ck-save').addEventListener('click', saveCustom);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
