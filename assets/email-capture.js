/* Tradexa Email Capture — Exit-intent + timed overlay — IIFE */
(function(){
  'use strict';

  /* Skip on auth/app/admin pages */
  var path = window.location.pathname;
  if(/\/(auth|app|admin)\//.test(path)) return;
  /* Skip if already captured or dismissed in last 3 days.
     Bare JSON.parse used to crash the entire IIFE on a single corrupt entry,
     which stopped the rest of the email-capture script from registering. */
  var store = {};
  try { store = JSON.parse(localStorage.getItem('txEmailCapture') || '{}') || {}; }
  catch(e){ try { localStorage.removeItem('txEmailCapture'); } catch(_){} }
  if(store.captured) return;
  if(store.dismissed && (Date.now() - store.dismissed) < 259200000) return; /* 3 days */

  var CSS = `
  #txec-overlay{
    position:fixed;inset:0;z-index:10000;background:rgba(6,8,13,.75);
    backdrop-filter:blur(8px);opacity:0;pointer-events:none;
    transition:opacity .3s;display:flex;align-items:center;justify-content:center;
    padding:24px;
  }
  #txec-overlay.show{opacity:1;pointer-events:auto}
  #txec-modal{
    width:100%;max-width:520px;background:#0B1220;
    border:1px solid rgba(255,255,255,.1);border-radius:20px;
    box-shadow:0 32px 100px rgba(0,0,0,.8),0 0 0 1px rgba(0,224,138,.06);
    transform:translateY(20px) scale(.96);transition:all .3s cubic-bezier(.4,0,.2,1);
    position:relative;overflow:hidden;
  }
  #txec-overlay.show #txec-modal{transform:none}
  #txec-modal::before{
    content:'';position:absolute;top:0;left:0;right:0;height:1px;
    background:linear-gradient(90deg,transparent,rgba(0,224,138,.5),rgba(77,163,255,.3),transparent);
  }
  .txec-glow{
    position:absolute;top:-60px;left:50%;transform:translateX(-50%);
    width:300px;height:200px;
    background:radial-gradient(ellipse,rgba(0,224,138,.12),transparent 70%);
    pointer-events:none;
  }
  .txec-close{
    position:absolute;top:16px;right:16px;width:30px;height:30px;border-radius:50%;
    border:1px solid rgba(255,255,255,.1);background:none;color:#94A3B8;cursor:pointer;
    display:flex;align-items:center;justify-content:center;transition:all .15s;z-index:1;
  }
  .txec-close:hover{background:rgba(255,255,255,.08);color:#fff}
  .txec-body{padding:40px 40px 36px;position:relative;z-index:1;text-align:center}
  .txec-badge{
    display:inline-flex;align-items:center;gap:8px;
    background:rgba(0,224,138,.07);border:1px solid rgba(0,224,138,.2);
    border-radius:100px;padding:6px 16px 6px 10px;font-size:10px;
    color:#00E08A;font-weight:700;margin-bottom:20px;letter-spacing:.08em;text-transform:uppercase;
  }
  .txec-badge-dot{width:6px;height:6px;border-radius:50%;background:#00E08A;flex-shrink:0;position:relative}
  .txec-badge-dot::after{content:'';position:absolute;inset:-2px;border-radius:50%;background:#00E08A;opacity:.4;animation:txecPulse 1.6s infinite}
  @keyframes txecPulse{0%{transform:scale(1);opacity:.4}100%{transform:scale(2.2);opacity:0}}
  .txec-h2{font-size:28px;font-weight:900;color:#fff;letter-spacing:-.04em;line-height:1.1;margin-bottom:12px;font-family:'Inter',sans-serif}
  .txec-h2 span{background:linear-gradient(135deg,#00E08A,#4DA3FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .txec-p{font-size:14px;color:#94A3B8;line-height:1.7;margin-bottom:24px;font-family:'Inter',sans-serif}
  .txec-perks{
    display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:24px;
  }
  .txec-perk{
    display:inline-flex;align-items:center;gap:6px;font-size:11px;
    color:#6EE7B7;background:rgba(0,224,138,.06);border:1px solid rgba(0,224,138,.15);
    border-radius:100px;padding:4px 12px;font-family:'Inter',sans-serif;font-weight:500;
  }
  .txec-perk::before{content:'✓';font-weight:800}
  .txec-form{display:flex;flex-direction:column;gap:10px}
  .txec-input{
    background:rgba(6,8,13,.8);border:1px solid rgba(255,255,255,.1);
    border-radius:10px;padding:14px 18px;color:#fff;font-size:14px;
    font-family:'Inter',sans-serif;outline:none;transition:border-color .15s;
    text-align:center;
  }
  .txec-input:focus{border-color:rgba(0,224,138,.35)}
  .txec-input::placeholder{color:#374151}
  .txec-submit{
    background:linear-gradient(135deg,#00E08A,#00c47a);color:#000;border:none;
    border-radius:10px;padding:15px;font-size:15px;font-weight:700;
    cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;letter-spacing:-.01em;
  }
  .txec-submit:hover{background:linear-gradient(135deg,#00f09a,#00E08A);transform:translateY(-1px)}
  .txec-trust{font-size:11px;color:#4B5563;margin-top:14px;font-family:'Inter',sans-serif}
  .txec-skip{
    margin-top:14px;background:none;border:none;font-size:12px;color:#4B5563;
    cursor:pointer;font-family:'Inter',sans-serif;transition:color .15s;text-decoration:underline;
  }
  .txec-skip:hover{color:#94A3B8}
  /* Success */
  .txec-success{display:none;padding:40px}
  .txec-success.show{display:block;text-align:center}
  .txec-success-icon{width:64px;height:64px;border-radius:50%;background:rgba(0,224,138,.1);border:1px solid rgba(0,224,138,.25);display:flex;align-items:center;justify-content:center;margin:0 auto 20px}
  .txec-success h3{font-size:22px;font-weight:800;color:#fff;margin-bottom:10px;font-family:'Inter',sans-serif;letter-spacing:-.03em}
  .txec-success p{font-size:14px;color:#94A3B8;line-height:1.7;font-family:'Inter',sans-serif}
  `;

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var html = `
  <div id="txec-overlay" role="dialog" aria-modal="true" aria-label="Get early access">
    <div id="txec-modal">
      <div class="txec-glow"></div>
      <button class="txec-close" onclick="txEmailCapture.dismiss()" aria-label="Close">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div class="txec-body">
        <div class="txec-badge"><span class="txec-badge-dot"></span>Free — No Card Required</div>
        <h2 class="txec-h2">Don't trade blind.<br><span>Get your edge back.</span></h2>
        <p class="txec-p">Join 14,000+ traders using Tradexa to journal every trade, surface their real edge, and build consistency through AI-powered performance reviews.</p>
        <div class="txec-perks">
          <span class="txec-perk">AI Coach Dashboard</span>
          <span class="txec-perk">50+ Broker Sync</span>
          <span class="txec-perk">Free 14-day Pro trial</span>
        </div>
        <div class="txec-form">
          <input type="email" class="txec-input" id="txecEmail" placeholder="Your email address" autocomplete="email"/>
          <button class="txec-submit" onclick="txEmailCapture.submit()">Start Free — Get Instant Access →</button>
        </div>
        <div class="txec-trust">No spam. Unsubscribe anytime. Takes 30 seconds to set up.</div>
        <button class="txec-skip" onclick="txEmailCapture.dismiss()">No thanks, I'll keep guessing</button>
      </div>
      <div class="txec-success" id="txecSuccess">
        <div class="txec-success-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E08A" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h3>You're in!</h3>
        <p>Check your inbox — we've sent your login link and a guide to getting the most out of Tradexa in your first week.</p>
      </div>
    </div>
  </div>`;

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  window.txEmailCapture = {
    show: function(){
      document.getElementById('txec-overlay').classList.add('show');
      setTimeout(function(){ document.getElementById('txecEmail').focus(); }, 300);
    },
    dismiss: function(){
      document.getElementById('txec-overlay').classList.remove('show');
      try { localStorage.setItem('txEmailCapture', JSON.stringify({ dismissed: Date.now() })); } catch(_){}
    },
    submit: function(){
      var email = document.getElementById('txecEmail').value.trim();
      if(!email || !email.includes('@')){ document.getElementById('txecEmail').focus(); return; }
      try { localStorage.setItem('txEmailCapture', JSON.stringify({ captured: true, email: email, ts: Date.now() })); } catch(_){}
      document.querySelector('.txec-body').style.display = 'none';
      document.getElementById('txecSuccess').classList.add('show');
      setTimeout(function(){ txEmailCapture.dismiss(); }, 3200);
      /* Fire analytics event if available */
      if(window.txTrack) window.txTrack('email_capture', { email: email, trigger: window._txecTrigger || 'unknown' });
    }
  };

  /* Keyboard */
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') txEmailCapture.dismiss();
  });

  /* Click outside */
  document.getElementById('txec-overlay').addEventListener('click', function(e){
    if(e.target === this) txEmailCapture.dismiss();
  });

  /* Triggers */
  /* 1. Exit-intent (desktop only) */
  var exitFired = false;
  document.addEventListener('mouseleave', function(e){
    if(exitFired || e.clientY > 10) return;
    exitFired = true;
    window._txecTrigger = 'exit_intent';
    setTimeout(function(){ txEmailCapture.show(); }, 300);
  });

  /* 2. Time-on-page: 45s fallback */
  var timerFired = false;
  setTimeout(function(){
    if(timerFired || exitFired) return;
    timerFired = true;
    window._txecTrigger = 'time_45s';
    txEmailCapture.show();
  }, 45000);

  /* 3. Scroll depth: 70% */
  var scrollFired = false;
  window.addEventListener('scroll', function(){
    if(scrollFired || exitFired || timerFired) return;
    var pct = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
    if(pct >= 0.7){
      scrollFired = true;
      window._txecTrigger = 'scroll_70';
      txEmailCapture.show();
    }
  }, { passive: true });
})();
