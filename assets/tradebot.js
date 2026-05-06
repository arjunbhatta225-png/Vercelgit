(function(){
  if(document.getElementById('tx-tradebot-root')) return;
  var API_BASE = (window.TX_API_BASE || '').replace(/\/$/, '');

  var QUOTES = [
    "The market rewards discipline, not brilliance.",
    "Your worst trades teach more than your best ones.",
    "Consistency beats intensity. Log every trade.",
    "A trading plan ignored is capital surrendered.",
    "Risk management is not optional â€” it's the strategy.",
    "The trader who reviews loses less than the one who doesn't.",
    "Patience is your edge in a world of impatient traders.",
    "Your journal is your best trading tool.",
    "Process over outcome. Every single time.",
    "One good trade executed perfectly beats ten average ones.",
    "Fear and greed are signals â€” recognize them, don't follow them.",
    "The best traders aren't the most confident â€” they're the most prepared.",
    "A disciplined loss is still a win.",
    "Your P&L is a lagging indicator of your habits."
  ];

  var todayQuote = QUOTES[new Date().getDate() % QUOTES.length];

  var SUGGESTED_WITH_DATA = [
    "Why am I losing lately?",
    "What's my biggest behavioral mistake?",
    "Which setup works best for me?",
    "Analyze my FOMO trades",
    "Review my recent 10 trades",
    "What emotion hurts my trading most?",
    "Which asset am I best at?",
    "How do I break my losing streak?",
    "Give me a weekly review summary",
    "What should I focus on improving?"
  ];

  var SUGGESTED_NO_DATA = [
    "What is a Sharpe ratio?",
    "How do I reduce overtrading?",
    "What does max drawdown mean?",
    "What is R:R and why does it matter?",
    "How do I build a trading routine?",
    "Help me build a weekly review habit"
  ];

  var CSS = `
<style id="tx-tradebot-css">
#tx-tradebot-root *{box-sizing:border-box;margin:0;padding:0}
#tx-tradebot-fab{
  position:fixed;bottom:28px;right:28px;z-index:9000;
  width:52px;height:52px;border-radius:50%;
  background:linear-gradient(135deg,#FFB732,#b08c1f);
  border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 24px rgba(255,183,50,.45),0 2px 8px rgba(0,0,0,.4);
  transition:all .2s cubic-bezier(.34,1.56,.64,1);
  color:#0d0f12;
}
#tx-tradebot-fab:hover{transform:scale(1.08);box-shadow:0 6px 32px rgba(255,183,50,.6)}
#tx-tradebot-fab.open{transform:scale(0.9);background:linear-gradient(135deg,#22262e,#1a1d23);color:#A1A1AA;box-shadow:0 2px 12px rgba(0,0,0,.5)}
#tx-tradebot-fab .fab-icon-chat{transition:all .2s;display:flex}
#tx-tradebot-fab .fab-icon-close{transition:all .2s;display:none}
#tx-tradebot-fab.open .fab-icon-chat{display:none}
#tx-tradebot-fab.open .fab-icon-close{display:flex}
#tx-tradebot-badge{
  position:absolute;top:-3px;right:-3px;
  width:16px;height:16px;border-radius:50%;
  background:#FFB732;border:2px solid #0d0f12;
  font-size:9px;font-weight:700;color:#0d0f12;
  display:flex;align-items:center;justify-content:center;
  font-family:'Inter',sans-serif;
}
#tx-tradebot-panel{
  position:fixed;bottom:92px;right:28px;z-index:8999;
  width:390px;height:580px;max-height:calc(100vh - 120px);
  background:#111111;border:1px solid #22262e;border-radius:16px;
  display:flex;flex-direction:column;overflow:hidden;
  box-shadow:0 24px 80px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.04);
  transform:translateY(16px) scale(0.97);opacity:0;pointer-events:none;
  transition:all .22s cubic-bezier(.4,0,.2,1);
  font-family:'Inter',sans-serif;
}
#tx-tradebot-panel.open{transform:none;opacity:1;pointer-events:all}
@media(max-width:480px){
  #tx-tradebot-panel{right:12px;left:12px;width:auto;bottom:84px;border-radius:14px}
  #tx-tradebot-fab{right:16px;bottom:20px}
}
.txb-head{
  padding:14px 16px 12px;
  border-bottom:1px solid #1E1E1E;
  display:flex;align-items:center;gap:10px;flex-shrink:0;
}
.txb-head-avatar{
  width:34px;height:34px;border-radius:10px;flex-shrink:0;
  background:linear-gradient(135deg,rgba(255,183,50,.15),rgba(255,183,50,.05));
  border:1px solid rgba(255,183,50,.3);
  display:flex;align-items:center;justify-content:center;
}
.txb-head-info{flex:1;min-width:0}
.txb-head-name{font-size:13px;font-weight:700;color:#F5F5F5;letter-spacing:-.01em}
.txb-head-sub{font-size:10.5px;color:#525252;margin-top:1px;display:flex;align-items:center;gap:5px}
.txb-online-dot{width:6px;height:6px;border-radius:50%;background:#22C55E;flex-shrink:0;animation:txbPulse 2s infinite}
@keyframes txbPulse{0%,100%{opacity:1}50%{opacity:.5}}
.txb-data-badge{
  font-size:9.5px;font-weight:600;padding:2px 7px;border-radius:4px;
  background:rgba(255,183,50,.1);color:#FFB732;border:1px solid rgba(255,183,50,.25);
  white-space:nowrap;
}
.txb-head-clear{
  background:none;border:1px solid #22262e;border-radius:6px;color:#525252;
  cursor:pointer;font-size:11px;padding:4px 8px;transition:all .15s;font-family:inherit;
}
.txb-head-clear:hover{color:#A1A1AA;border-color:#3A3A3A}
.txb-quote{
  padding:9px 14px;background:#0D0D0D;border-bottom:1px solid #1A1A1A;
  font-size:11px;color:#6B7280;font-style:italic;line-height:1.5;flex-shrink:0;
}
.txb-messages{
  flex:1;overflow-y:auto;padding:14px 14px 6px;
  display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth;
}
.txb-messages::-webkit-scrollbar{width:3px}
.txb-messages::-webkit-scrollbar-track{background:transparent}
.txb-messages::-webkit-scrollbar-thumb{background:#22262e;border-radius:2px}
.txb-msg{max-width:90%;animation:txbFadeIn .2s ease}
@keyframes txbFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.txb-msg.user{align-self:flex-end}
.txb-msg.bot{align-self:flex-start}
.txb-bubble{
  padding:9px 13px;border-radius:12px;font-size:12.5px;line-height:1.6;word-break:break-word;
}
.txb-msg.user .txb-bubble{
  background:linear-gradient(135deg,#FFB732,#b08c1f);
  color:#0d0f12;font-weight:500;border-radius:12px 12px 4px 12px;
}
.txb-msg.bot .txb-bubble{
  background:#1a1d23;color:#E5E5E5;border:1px solid #252525;
  border-radius:12px 12px 12px 4px;white-space:pre-line;
}
.txb-msg.bot .txb-bubble.error{border-color:#EF444430;color:#EF4444;background:#1B0E0F}
.txb-typing{display:flex;align-items:center;gap:4px;padding:10px 13px;background:#1a1d23;border:1px solid #252525;border-radius:12px 12px 12px 4px;align-self:flex-start}
.txb-typing span{width:5px;height:5px;border-radius:50%;background:#525252;animation:txbBounce 1.2s infinite}
.txb-typing span:nth-child(2){animation-delay:.15s}
.txb-typing span:nth-child(3){animation-delay:.3s}
@keyframes txbBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
.txb-suggestions{
  padding:6px 14px 10px;display:flex;flex-wrap:wrap;gap:5px;flex-shrink:0;
}
.txb-suggestion{
  background:#171717;border:1px solid #22262e;border-radius:16px;
  padding:5px 11px;font-size:11px;color:#8A8A8A;cursor:pointer;
  transition:all .15s;font-family:inherit;white-space:nowrap;
}
.txb-suggestion:hover{background:#1E1E1E;border-color:#3A3A3A;color:#FFB732}
.txb-input-area{
  padding:10px 14px 14px;border-top:1px solid #1E1E1E;display:flex;gap:8px;flex-shrink:0;
}
.txb-input{
  flex:1;background:#1A1A1A;border:1px solid #22262e;border-radius:10px;
  padding:9px 13px;font-size:13px;color:#F5F5F5;font-family:inherit;
  outline:none;resize:none;min-height:38px;max-height:100px;line-height:1.45;
  transition:border-color .15s;
}
.txb-input::placeholder{color:#3A3A3A}
.txb-input:focus{border-color:#FFB73250}
.txb-send{
  width:38px;height:38px;border-radius:10px;border:none;cursor:pointer;flex-shrink:0;
  background:linear-gradient(135deg,#FFB732,#b08c1f);color:#0d0f12;
  display:flex;align-items:center;justify-content:center;transition:all .15s;
  align-self:flex-end;
}
.txb-send:hover{transform:scale(1.05)}
.txb-send:disabled{opacity:.4;cursor:default;transform:none}
.txb-footer-note{
  text-align:center;font-size:10px;color:#333;padding:4px 14px 8px;flex-shrink:0;
}
</style>`;

  var PANEL_HTML = `
<div id="tx-tradebot-root">
  <button id="tx-tradebot-fab" title="Trade Bot â€” AI Coach">
    <span class="fab-icon-chat">
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v2.5"/>
        <circle cx="12" cy="1.5" r="1" fill="currentColor" stroke="none"/>
        <rect x="2.5" y="4.5" width="19" height="14" rx="3.5"/>
        <rect x="6.5" y="9.5" width="3" height="3.5" rx="1" fill="currentColor" stroke="none"/>
        <rect x="14.5" y="9.5" width="3" height="3.5" rx="1" fill="currentColor" stroke="none"/>
        <path d="M8.5 16.5h7"/>
        <path d="M2.5 12H1M22.5 12H23"/>
      </svg>
    </span>
    <span class="fab-icon-close">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </span>
    <span id="tx-tradebot-badge" style="display:none">1</span>
  </button>
  <div id="tx-tradebot-panel">
    <div class="txb-head">
      <div class="txb-head-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB732" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v2"/>
          <circle cx="12" cy="1.5" r="1" fill="#FFB732" stroke="none"/>
          <rect x="3" y="4" width="18" height="13" rx="3"/>
          <rect x="7" y="8.5" width="3" height="3" rx=".8" fill="#FFB732" stroke="none"/>
          <rect x="14" y="8.5" width="3" height="3" rx=".8" fill="#FFB732" stroke="none"/>
          <path d="M8.5 14.5h7"/>
          <path d="M3 11H1.5M22.5 11H21"/>
        </svg>
      </div>
      <div class="txb-head-info">
        <div class="txb-head-name">Trade Bot <span id="txb-data-badge" class="txb-data-badge" style="display:none"></span></div>
        <div class="txb-head-sub"><span class="txb-online-dot"></span>Powered by Gemini Â· AI Coach</div>
      </div>
      <button class="txb-head-clear" id="txb-clear-btn">Clear</button>
    </div>
    <div class="txb-quote" id="txb-quote"></div>
    <div class="txb-messages" id="txb-messages"></div>
    <div class="txb-suggestions" id="txb-suggestions"></div>
    <div class="txb-input-area">
      <textarea class="txb-input" id="txb-input" placeholder="Ask about your trades, metrics, or habits..." rows="1"></textarea>
      <button class="txb-send" id="txb-send" disabled>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
      </button>
    </div>
    <div class="txb-footer-note">Educational analysis only &middot; Not financial advice</div>
  </div>
</div>`;

  document.head.insertAdjacentHTML('beforeend', CSS);
  document.body.insertAdjacentHTML('beforeend', PANEL_HTML);

  var fab       = document.getElementById('tx-tradebot-fab');
  var panel     = document.getElementById('tx-tradebot-panel');
  var badge     = document.getElementById('tx-tradebot-badge');
  var dataBadge = document.getElementById('txb-data-badge');
  var messagesEl= document.getElementById('txb-messages');
  var inputEl   = document.getElementById('txb-input');
  var sendBtn   = document.getElementById('txb-send');
  var suggestEl = document.getElementById('txb-suggestions');
  var clearBtn  = document.getElementById('txb-clear-btn');
  var quoteEl   = document.getElementById('txb-quote');

  quoteEl.textContent = '"' + todayQuote + '"';

  var isOpen = false;
  var isLoading = false;
  var history = [];
  var tradeContext = null;
  var hasData = false;

  var STORAGE_KEY = 'txb_history_v2';

  function historyUserKey(){
    try {
      if(window.TxAuth && window.TxAuth.userKey) return window.TxAuth.userKey() || 'anon';
    } catch(e){}
    return 'anon';
  }

  function historyStorageKey(){
    return STORAGE_KEY + '::' + historyUserKey();
  }

  function loadHistory(){
    try {
      var saved = localStorage.getItem(historyStorageKey());
      history = saved ? JSON.parse(saved) : [];
      if(!Array.isArray(history)) history = [];
    } catch(e){
      history = [];
    }
  }

  loadHistory();
  if(window.TxAuth && window.TxAuth.ready){
    window.TxAuth.ready().then(loadHistory).catch(function(){});
    document.addEventListener('tx-auth-change', loadHistory);
  }

  function saveHistory(){
    try{ localStorage.setItem(historyStorageKey(), JSON.stringify(history.slice(-24))); }catch(e){}
  }

  function loadTradeContext(){
    if(window.TxTradeData){
      tradeContext = window.TxTradeData.getTradeContext();
      hasData = tradeContext.indexOf('NO_TRADES') === -1;
      var trades = window.TxTradeData.getTrades();
      if(hasData && trades.length > 0){
        var s = window.TxTradeData.getStats(trades);
        dataBadge.textContent = trades.length + ' trades Â· ' + s.winRate + '% WR';
        dataBadge.style.display = 'inline-flex';
      }
      /* Append Trading Math Engine context */
      if(window.TxMath){
        try {
          var bal = 0;
          if(window.TxCapital){
            var cs = window.TxCapital.getCapitalStats();
            if(cs && cs.isConfigured) bal = cs.startCap;
          }
          tradeContext += '\n\n' + window.TxMath.getMathContext(trades, bal);
        } catch(e){}
      }
    }
  }

  function getWelcomeMessage(){
    if(!window.TxTradeData || !hasData){
      return (
        "Hello! I'm Trade Bot â€” your AI trading coach powered by Gemini.\n\n" +
        "I can help you understand trading metrics, build better habits, and improve your consistency.\n\n" +
        "Log your first trade in the Trade Journal and I'll give you fully personalized coaching based on your actual data."
      );
    }
    var trades = window.TxTradeData.getTrades();
    var s = window.TxTradeData.getStats(trades);
    var streak = s.currentStreak >= 3
      ? '\n\nYou\'re on a ' + s.currentStreak + '-trade ' + s.currentStreakType + ' streak â€” I have thoughts on that.'
      : '';
    return (
      "I've read your journal â€” " + s.total + " trades, " + s.winRate + "% win rate, $" + s.totalPnl.toLocaleString() + " total P&L.\n\n" +
      "I can see your behavioral patterns, your best setups, and where you're losing edge." + streak + "\n\n" +
      "What do you want to dig into?"
    );
  }

  function togglePanel(){
    isOpen = !isOpen;
    fab.classList.toggle('open', isOpen);
    panel.classList.toggle('open', isOpen);
    if(isOpen){
      badge.style.display = 'none';
      loadTradeContext();
      renderHistory();
      renderSuggestions();
      setTimeout(function(){ scrollToBottom(); inputEl.focus(); }, 100);
    }
  }

  function renderHistory(){
    messagesEl.innerHTML = '';
    if(history.length === 0){
      addBotMessage(getWelcomeMessage(), false);
      return;
    }
    history.forEach(function(msg){
      addMessageEl(msg.role, msg.content, false);
    });
    scrollToBottom();
  }

  function renderSuggestions(){
    suggestEl.innerHTML = '';
    var pool = hasData ? SUGGESTED_WITH_DATA : SUGGESTED_NO_DATA;
    var picks = shuffleArr(pool.slice()).slice(0, 4);
    picks.forEach(function(s){
      var btn = document.createElement('button');
      btn.className = 'txb-suggestion';
      btn.textContent = s;
      btn.addEventListener('click', function(){ sendMessage(s); });
      suggestEl.appendChild(btn);
    });
  }

  function shuffleArr(arr){
    for(var i = arr.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function addMessageEl(role, text, animate){
    var wrapper = document.createElement('div');
    wrapper.className = 'txb-msg ' + role;
    if(!animate) wrapper.style.animation = 'none';
    var bubble = document.createElement('div');
    bubble.className = 'txb-bubble';
    bubble.textContent = text;
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    return wrapper;
  }

  function addBotMessage(text, saveToHist){
    addMessageEl('bot', text, true);
    if(saveToHist !== false){
      history.push({role:'model', content:text});
      saveHistory();
    }
    scrollToBottom();
  }

  function addErrorMessage(text){
    var wrapper = document.createElement('div');
    wrapper.className = 'txb-msg bot';
    var bubble = document.createElement('div');
    bubble.className = 'txb-bubble error';
    bubble.textContent = text;
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    scrollToBottom();
  }

  function showTyping(){
    var el = document.createElement('div');
    el.className = 'txb-typing';
    el.id = 'txb-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(el);
    scrollToBottom();
    return el;
  }

  function removeTyping(){
    var el = document.getElementById('txb-typing');
    if(el) el.remove();
  }

  function scrollToBottom(){
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setLoading(v){
    isLoading = v;
    sendBtn.disabled = v || inputEl.value.trim() === '';
    inputEl.disabled = v;
  }

  function sendMessage(text){
    text = (text || inputEl.value).trim();
    if(!text || isLoading) return;

    suggestEl.innerHTML = '';
    inputEl.value = '';
    inputEl.style.height = 'auto';
    sendBtn.disabled = true;

    addMessageEl('user', text, true);
    history.push({role:'user', content:text});
    saveHistory();
    scrollToBottom();

    setLoading(true);
    showTyping();

    loadTradeContext();

    var apiMessages = history.map(function(m){
      return {role: m.role === 'model' ? 'assistant' : 'user', content: m.content};
    });

    /* Attach the Supabase access token so the protected /api/chat
       endpoint can authorize the request. Falls through silently when
       TxAuth isn't loaded (chat will then fail with 401 â€” by design). */
    var _hdrs = {'Content-Type': 'application/json'};
    var _tokenP = (window.TxAuth && window.TxAuth.getToken)
      ? window.TxAuth.getToken().catch(function(){ return null; })
      : Promise.resolve(null);

    _tokenP.then(function(token){
      if (token) _hdrs['Authorization'] = 'Bearer ' + token;
    return fetch((API_BASE || '') + '/api/chat?stream=1', {
        method: 'POST',
        headers: _hdrs,
        body: JSON.stringify({
          messages: apiMessages,
          tradeContext: tradeContext || null
        })
      });
    })
    .then(function(resp){
      if (!resp.ok) {
        return resp.json().then(function(d){
          removeTyping(); setLoading(false);
          addErrorMessage(d.error || 'Trade Bot is unavailable right now.');
        }).catch(function(){
          removeTyping(); setLoading(false);
          addErrorMessage('Trade Bot is unavailable right now.');
        });
      }
      /* Some fallback paths (e.g. no GEMINI_API_KEY) may return JSON instead
         of SSE â€” detect via Content-Type and degrade gracefully. */
      var ct = (resp.headers.get('content-type') || '').toLowerCase();
      if (ct.indexOf('text/event-stream') === -1) {
        return resp.json().then(function(d){
          removeTyping(); setLoading(false);
          if (d.error){ addErrorMessage(d.error); return; }
          if (d.reply){ addBotMessage(d.reply, true); renderSuggestions(); return; }
          addErrorMessage('Trade Bot returned an empty response.');
        }).catch(function(){
          removeTyping(); setLoading(false);
          addErrorMessage('Trade Bot returned an unreadable response.');
        });
      }
      if (!resp.body){
        removeTyping(); setLoading(false);
        addErrorMessage('Streaming is not supported in this browser.');
        return;
      }
      removeTyping();
      var bubbleWrap = addMessageEl('bot', '', true);
      var bubble = bubbleWrap.querySelector('.txb-bubble');
      var fullText = '';
      var streamErr = null;
      var reader = resp.body.getReader();
      var decoder = new TextDecoder('utf-8');
      var buffer = '';

      function pump(){
        return reader.read().then(function(chunk){
          if (chunk.done){
            setLoading(false);
            if (fullText){
              history.push({role:'model', content:fullText});
              saveHistory();
              renderSuggestions();
            } else if (streamErr){
              bubble.textContent = 'Trade Bot error: ' + streamErr;
            } else {
              bubble.textContent = '(no response)';
            }
            return;
          }
          buffer += decoder.decode(chunk.value, {stream:true});
          var parts = buffer.split('\n\n');
          buffer = parts.pop();
          parts.forEach(function(evt){
            var line = evt.split('\n').find(function(l){ return l.indexOf('data:') === 0; });
            if (!line) return;
            var raw = line.slice(5).trim();
            if (!raw) return;
            try {
              var obj = JSON.parse(raw);
              if (obj.chunk){
                fullText += obj.chunk;
                bubble.textContent = fullText;
                scrollToBottom();
              } else if (obj.error){
                streamErr = obj.error;
                if (!fullText) bubble.textContent = 'Trade Bot error: ' + obj.error;
              }
            } catch(e){}
          });
          return pump();
        });
      }
      return pump();
    })
    .catch(function(){
      removeTyping();
      setLoading(false);
      addErrorMessage('Could not reach Trade Bot. Check your connection and try again.');
    });
  }

  fab.addEventListener('click', togglePanel);
  sendBtn.addEventListener('click', function(){ sendMessage(); });

  inputEl.addEventListener('input', function(){
    sendBtn.disabled = isLoading || this.value.trim() === '';
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  inputEl.addEventListener('keydown', function(e){
    if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }
  });

  clearBtn.addEventListener('click', function(){
    history = [];
    saveHistory();
    renderHistory();
    renderSuggestions();
  });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && isOpen) togglePanel();
  });

  setTimeout(function(){
    if(!localStorage.getItem('txb_seen_v2')){
      badge.style.display = 'flex';
      localStorage.setItem('txb_seen_v2','1');
    }
  }, 1800);

  loadTradeContext();
})();
