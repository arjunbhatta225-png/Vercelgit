/* Tradexa In-App Feedback Widget — IIFE */
(function(){
  'use strict';

  var CSS = `
  #tx-feedback-btn{
    position:fixed;bottom:24px;right:24px;z-index:9000;
    display:flex;align-items:center;gap:8px;
    background:linear-gradient(135deg,#00E08A,#00c47a);
    color:#000;border:none;border-radius:100px;
    padding:10px 18px 10px 14px;font-size:13px;font-weight:700;
    cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:-.01em;
    box-shadow:0 4px 20px rgba(0,224,138,.3);transition:all .2s;
    white-space:nowrap;
  }
  #tx-feedback-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,224,138,.4)}
  #tx-feedback-btn svg{flex-shrink:0}

  #tx-feedback-overlay{
    position:fixed;inset:0;z-index:8999;background:rgba(6,8,13,.5);
    backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .2s;
  }
  #tx-feedback-overlay.open{opacity:1;pointer-events:auto}

  #tx-feedback-modal{
    position:fixed;bottom:80px;right:24px;z-index:9001;
    width:360px;background:#0B1220;border:1px solid rgba(255,255,255,.1);
    border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.7);
    transform:translateY(16px) scale(.97);opacity:0;
    pointer-events:none;transition:all .22s cubic-bezier(.4,0,.2,1);
    overflow:hidden;
  }
  #tx-feedback-modal.open{transform:none;opacity:1;pointer-events:auto}
  .txfb-header{
    padding:18px 20px 16px;border-bottom:1px solid rgba(255,255,255,.07);
    display:flex;align-items:center;justify-content:space-between;
  }
  .txfb-title{font-size:14px;font-weight:700;color:#F8FAFC;letter-spacing:-.01em}
  .txfb-close{
    width:28px;height:28px;border-radius:50%;border:none;background:rgba(255,255,255,.05);
    color:#94A3B8;cursor:pointer;display:flex;align-items:center;justify-content:center;
    transition:all .15s;flex-shrink:0;
  }
  .txfb-close:hover{background:rgba(255,255,255,.1);color:#fff}

  .txfb-body{padding:20px}

  /* Category chips */
  .txfb-cats{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
  .txfb-cat{
    padding:5px 12px;border-radius:100px;font-size:11px;font-weight:600;
    border:1px solid rgba(255,255,255,.1);color:#94A3B8;background:none;
    cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;
  }
  .txfb-cat:hover{border-color:rgba(255,255,255,.2);color:#fff}
  .txfb-cat.sel{border-color:rgba(0,224,138,.35);color:#00E08A;background:rgba(0,224,138,.07)}

  /* Stars */
  .txfb-rating-label{font-size:11px;color:#4B5563;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:10px}
  .txfb-stars{display:flex;gap:6px;margin-bottom:16px}
  .txfb-star{
    font-size:24px;cursor:pointer;transition:transform .1s;color:#1F2937;line-height:1;
    background:none;border:none;padding:0;
  }
  .txfb-star:hover,.txfb-star.lit{color:#F5B942;transform:scale(1.15)}

  /* Textarea */
  .txfb-textarea{
    width:100%;background:rgba(6,8,13,.8);border:1px solid rgba(255,255,255,.08);
    border-radius:8px;padding:12px;color:#F8FAFC;font-size:13px;font-family:'Inter',sans-serif;
    resize:none;height:100px;outline:none;transition:border-color .15s;line-height:1.6;
    margin-bottom:6px;
  }
  .txfb-textarea:focus{border-color:rgba(0,224,138,.3)}
  .txfb-textarea::placeholder{color:#374151}
  .txfb-char{font-size:10px;color:#4B5563;text-align:right;margin-bottom:14px}

  /* Screenshot toggle */
  .txfb-extras{display:flex;align-items:center;gap:10px;margin-bottom:16px}
  .txfb-checkbox{display:flex;align-items:center;gap:7px;font-size:12px;color:#94A3B8;cursor:pointer}
  .txfb-checkbox input{accent-color:#00E08A;width:14px;height:14px;cursor:pointer}

  /* Submit */
  .txfb-submit{
    width:100%;background:linear-gradient(135deg,#00E08A,#00c47a);color:#000;
    border:none;border-radius:8px;padding:12px;font-size:14px;font-weight:700;
    cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;letter-spacing:-.01em;
  }
  .txfb-submit:hover{background:linear-gradient(135deg,#00f09a,#00E08A)}
  .txfb-submit:disabled{opacity:.5;cursor:not-allowed}

  /* Success */
  .txfb-success{
    padding:32px 20px;text-align:center;display:none;
  }
  .txfb-success.show{display:block}
  .txfb-success-icon{
    width:56px;height:56px;border-radius:50%;background:rgba(0,224,138,.1);
    border:1px solid rgba(0,224,138,.25);display:flex;align-items:center;
    justify-content:center;margin:0 auto 16px;
  }
  .txfb-success h3{font-size:16px;font-weight:700;color:#fff;margin-bottom:8px}
  .txfb-success p{font-size:13px;color:#94A3B8;line-height:1.6}
  `;

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  /* Build HTML */
  var html = `
  <button id="tx-feedback-btn" onclick="txFeedback.toggle()" aria-label="Send feedback">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
    Feedback
  </button>
  <div id="tx-feedback-overlay" onclick="txFeedback.close()"></div>
  <div id="tx-feedback-modal" role="dialog" aria-modal="true" aria-label="Send feedback">
    <div class="txfb-header">
      <span class="txfb-title">Share feedback</span>
      <button class="txfb-close" onclick="txFeedback.close()" aria-label="Close">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="txfb-body">
      <!-- Category -->
      <div class="txfb-cats">
        <button class="txfb-cat sel" data-cat="general" onclick="txFeedback.selectCat(this)">General</button>
        <button class="txfb-cat" data-cat="bug" onclick="txFeedback.selectCat(this)">Bug Report</button>
        <button class="txfb-cat" data-cat="feature" onclick="txFeedback.selectCat(this)">Feature Request</button>
        <button class="txfb-cat" data-cat="ux" onclick="txFeedback.selectCat(this)">UX / Design</button>
      </div>
      <!-- Stars -->
      <div class="txfb-rating-label">How's your experience?</div>
      <div class="txfb-stars" id="txfbStars">
        <button class="txfb-star" data-val="1" onclick="txFeedback.rate(1)">★</button>
        <button class="txfb-star" data-val="2" onclick="txFeedback.rate(2)">★</button>
        <button class="txfb-star" data-val="3" onclick="txFeedback.rate(3)">★</button>
        <button class="txfb-star" data-val="4" onclick="txFeedback.rate(4)">★</button>
        <button class="txfb-star" data-val="5" onclick="txFeedback.rate(5)">★</button>
      </div>
      <!-- Message -->
      <textarea class="txfb-textarea" id="txfbMsg" placeholder="Tell us what's on your mind…" maxlength="500" oninput="txFeedback.updateChar()"></textarea>
      <div class="txfb-char"><span id="txfbCharCount">0</span> / 500</div>
      <!-- Extras -->
      <div class="txfb-extras">
        <label class="txfb-checkbox">
          <input type="checkbox" id="txfbPage" checked/>
          Include current page URL
        </label>
      </div>
      <!-- Submit -->
      <button class="txfb-submit" id="txfbSubmit" onclick="txFeedback.submit()">Send Feedback</button>
    </div>
    <div class="txfb-success" id="txfbSuccess">
      <div class="txfb-success-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00E08A" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <h3>Thanks for the feedback!</h3>
      <p>We read every submission and use it to improve Tradexa for traders like you.</p>
    </div>
  </div>`;

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  /* State */
  var state = { open: false, rating: 0, category: 'general' };

  window.txFeedback = {
    toggle: function(){ state.open ? this.close() : this.open_(); },
    open_: function(){
      state.open = true;
      document.getElementById('tx-feedback-modal').classList.add('open');
      document.getElementById('tx-feedback-overlay').classList.add('open');
      setTimeout(function(){ document.getElementById('txfbMsg').focus(); }, 220);
    },
    close: function(){
      state.open = false;
      document.getElementById('tx-feedback-modal').classList.remove('open');
      document.getElementById('tx-feedback-overlay').classList.remove('open');
    },
    selectCat: function(el){
      document.querySelectorAll('.txfb-cat').forEach(function(c){ c.classList.remove('sel'); });
      el.classList.add('sel');
      state.category = el.dataset.cat;
    },
    rate: function(val){
      state.rating = val;
      document.querySelectorAll('.txfb-star').forEach(function(s){
        s.classList.toggle('lit', parseInt(s.dataset.val) <= val);
      });
    },
    updateChar: function(){
      var len = document.getElementById('txfbMsg').value.length;
      document.getElementById('txfbCharCount').textContent = len;
    },
    submit: function(){
      var msg = document.getElementById('txfbMsg').value.trim();
      if(!msg){ document.getElementById('txfbMsg').focus(); return; }
      var btn = document.getElementById('txfbSubmit');
      btn.textContent = 'Sending…';
      btn.disabled = true;

      var payload = {
        category: state.category,
        rating: state.rating,
        message: msg,
        page: document.getElementById('txfbPage').checked ? window.location.pathname : null,
        ts: new Date().toISOString(),
        ua: navigator.userAgent.substring(0, 120),
      };

      /* Store locally (replace with real API endpoint).
         Wrapped — a corrupt log entry would otherwise throw mid-submit and
         leave the widget stuck on the loading state with no feedback. */
      try {
        var existing = [];
        try { existing = JSON.parse(localStorage.getItem('txFeedbackLog') || '[]') || []; }
        catch(_){ existing = []; }
        existing.push(payload);
        localStorage.setItem('txFeedbackLog', JSON.stringify(existing.slice(-50)));
      } catch(e){ /* quota or storage disabled — submission still proceeds visually */ }

      /* Simulate send */
      setTimeout(function(){
        document.querySelector('.txfb-body').style.display = 'none';
        document.getElementById('txfbSuccess').classList.add('show');
        setTimeout(function(){ window.txFeedback.close(); }, 3000);
        /* Reset for next use */
        setTimeout(function(){
          document.querySelector('.txfb-body').style.display = '';
          document.getElementById('txfbSuccess').classList.remove('show');
          document.getElementById('txfbMsg').value = '';
          document.getElementById('txfbCharCount').textContent = '0';
          btn.textContent = 'Send Feedback';
          btn.disabled = false;
          state.rating = 0;
          document.querySelectorAll('.txfb-star').forEach(function(s){ s.classList.remove('lit'); });
        }, 3500);
      }, 900);
    }
  };

  /* Keyboard close */
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && state.open) window.txFeedback.close();
  });
})();
