/**
 * Tradexa Capital Tracker
 * Real-time account capital management with multi-account support,
 * deposit/withdrawal tracking, risk calculator, and audit history.
 */
(function(global){
  var TX_CAPITAL_KEY = 'txCapital_v1';
  var TX_CAP_HIST    = 'txCapitalHistory_v1';

  var CURRENCIES = {
    USD: { symbol: '$',   name: 'US Dollar' },
    GBP: { symbol: '£',   name: 'British Pound' },
    EUR: { symbol: '€',   name: 'Euro' },
    CAD: { symbol: 'CA$', name: 'Canadian Dollar' },
    AUD: { symbol: 'A$',  name: 'Australian Dollar' },
    CHF: { symbol: 'Fr',  name: 'Swiss Franc' },
    JPY: { symbol: '¥',   name: 'Japanese Yen' },
    SGD: { symbol: 'S$',  name: 'Singapore Dollar' }
  };

  var ACCOUNT_TYPES = ['Main', 'Futures', 'Prop Challenge', 'Demo'];

  function _defaultSettings(){
    return {
      isConfigured: false,
      activeAccountId: 'main',
      accounts: [{
        id: 'main',
        name: 'Main Account',
        type: 'Main',
        startingCapital: 10000,
        currency: 'USD',
        targetCapital: 15000,
        maxDrawdownPct: 10,
        startDate: new Date().toISOString().slice(0,10),
        isActive: true
      }]
    };
  }

  function getSettings(){
    try{
      var raw = localStorage.getItem(TX_CAPITAL_KEY);
      if(raw){ var s = JSON.parse(raw); if(s && s.accounts) return s; }
    }catch(e){}
    return _defaultSettings();
  }

  function saveSettings(s){
    try{ localStorage.setItem(TX_CAPITAL_KEY, JSON.stringify(s)); }catch(e){}
  }

  function getHistory(){
    try{ return JSON.parse(localStorage.getItem(TX_CAP_HIST) || '[]'); }catch(e){ return []; }
  }

  function saveHistory(h){
    try{ localStorage.setItem(TX_CAP_HIST, JSON.stringify(h)); }catch(e){}
  }

  function getActiveAccount(){
    var s = getSettings();
    var acct = s.accounts.filter(function(a){ return a.id === s.activeAccountId; })[0];
    return acct || s.accounts[0] || _defaultSettings().accounts[0];
  }

  function setActiveAccount(id){
    var s = getSettings();
    s.activeAccountId = id;
    saveSettings(s);
  }

  function setupCapital(data){
    var s = getSettings();
    var acct = {
      id: data.id || 'main',
      name: data.name || 'Main Account',
      type: data.type || 'Main',
      startingCapital: parseFloat(data.startingCapital) || 10000,
      currency: data.currency || 'USD',
      targetCapital: parseFloat(data.targetCapital) || null,
      maxDrawdownPct: parseFloat(data.maxDrawdownPct) || 10,
      startDate: data.startDate || new Date().toISOString().slice(0,10),
      isActive: true
    };
    var idx = s.accounts.findIndex(function(a){ return a.id === acct.id; });
    if(idx >= 0) s.accounts[idx] = acct;
    else s.accounts.push(acct);
    s.activeAccountId = acct.id;
    s.isConfigured = true;
    saveSettings(s);
  }

  function addAccount(data){
    var s = getSettings();
    var id = 'acct_' + Date.now();
    s.accounts.push({
      id: id,
      name: data.name || 'Account',
      type: data.type || 'Main',
      startingCapital: parseFloat(data.startingCapital) || 0,
      currency: data.currency || 'USD',
      targetCapital: parseFloat(data.targetCapital) || null,
      maxDrawdownPct: parseFloat(data.maxDrawdownPct) || 10,
      startDate: data.startDate || new Date().toISOString().slice(0,10),
      isActive: true
    });
    s.isConfigured = true;
    saveSettings(s);
    return id;
  }

  /* Coerce to number — defaults to 0 if non-numeric (string-typed JSON, etc).
     Guards every arithmetic site below from string concat. */
  function _num(v){ var n = parseFloat(v); return isFinite(n) ? n : 0; }

  /* Local-zone YYYY-MM-DD. Using toISOString().slice(0,10) drifted by a day
     for users west of UTC near local midnight. */
  function _localDateStr(d){
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  function getCurrentCapital(accountId){
    var s = getSettings();
    var acctId = accountId || s.activeAccountId;
    var acct = s.accounts.filter(function(a){ return a.id === acctId; })[0] || s.accounts[0];
    var start = _num(acct.startingCapital);

    var trades = global.TxTradeData ? global.TxTradeData.getTrades() : [];
    /* trades-data.js _normalizeTrade() already coerces pnl; defensive _num still applied. */
    var tradePnL = trades.reduce(function(sum, t){ return sum + _num(t.pnl); }, 0);

    var hist = getHistory();
    /* History records are NOT routed through _normalizeTrade — coerce h.change here. */
    var depWith = hist
      .filter(function(h){ return h.accountId === acctId && (h.source === 'deposit' || h.source === 'withdrawal'); })
      .reduce(function(sum, h){ return sum + _num(h.change); }, 0);

    return Math.round((start + tradePnL + depWith) * 100) / 100;
  }

  function getCapitalStats(accountId){
    var s = getSettings();
    var acctId = accountId || s.activeAccountId;
    var acct = s.accounts.filter(function(a){ return a.id === acctId; })[0] || s.accounts[0];
    var currency   = acct.currency || 'USD';
    /* Coerce numeric account fields — JSON storage can leave them as strings,
       which would silently concat under '+' downstream and break equity math. */
    var startCap   = _num(acct.startingCapital);
    /* targetCap stays null when missing (not 0) — getCapitalStats consumers
       gate on truthiness to decide whether to render the target progress bar. */
    var targetCap  = (acct.targetCapital == null || acct.targetCapital === '') ? null : _num(acct.targetCapital);
    var maxDDLimit = _num(acct.maxDrawdownPct) || 10;
    var currentCap = getCurrentCapital(acctId);

    var trades = global.TxTradeData ? global.TxTradeData.getTrades() : [];

    var now         = new Date();
    /* Local-zone day key — UTC slice was off by a day near local midnight. */
    var todayStr    = _localDateStr(now);
    var dow         = now.getDay();
    var monday      = new Date(now); monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1)); monday.setHours(0,0,0,0);
    var monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);

    function sumPnl(filter){ return Math.round(trades.filter(filter).reduce(function(a,t){ return a+_num(t.pnl); },0)*100)/100; }

    /* Compare against the trade's local-zone day, not its UTC slice. */
    var todayPnL  = sumPnl(function(t){
      if(!t.date) return false;
      var d = new Date(t.date);
      return !isNaN(d) && _localDateStr(d) === todayStr;
    });
    var weekPnL   = sumPnl(function(t){
      if(!t.date) return false;
      var d = new Date(t.date); return !isNaN(d) && d >= monday;
    });
    var monthPnL  = sumPnl(function(t){
      if(!t.date) return false;
      var d = new Date(t.date); return !isNaN(d) && d >= monthStart;
    });
    var allPnL    = sumPnl(function(){ return true; });

    var totalGrowth   = Math.round((currentCap - startCap) * 100) / 100;
    var growthPct     = startCap > 0 ? Math.round(totalGrowth / startCap * 1000) / 10 : 0;
    var todayPct      = startCap > 0 ? Math.round(todayPnL / startCap * 1000) / 10 : 0;
    var weekPct       = startCap > 0 ? Math.round(weekPnL  / startCap * 1000) / 10 : 0;
    var monthPct      = startCap > 0 ? Math.round(monthPnL / startCap * 1000) / 10 : 0;

    /* Sort by date asc with NaN-safe comparator — invalid dates would otherwise
       leave the result order undefined and silently corrupt the equity curve. */
    var sorted = trades.slice().sort(function(a,b){
      var da = new Date(a.date).getTime();
      var db = new Date(b.date).getTime();
      if(isNaN(da)) da = Infinity;   /* push invalid dates to end so they don't affect early-curve math */
      if(isNaN(db)) db = Infinity;
      return da - db;
    });
    var cum = startCap, peak = startCap, maxDDAmt = 0;
    var equityPoints = [{ date: acct.startDate, capital: startCap }];
    sorted.forEach(function(t){
      cum += _num(t.pnl);
      if(cum > peak) peak = cum;
      var dd = peak - cum;
      if(dd > maxDDAmt) maxDDAmt = dd;
      equityPoints.push({ date: t.date, capital: Math.round(cum * 100) / 100 });
    });
    var maxDDPct = peak > 0 ? Math.round(maxDDAmt / peak * 1000) / 10 : 0;

    var targetProgress = (targetCap && targetCap > startCap)
      ? Math.min(100, Math.max(0, Math.round((currentCap - startCap) / (targetCap - startCap) * 1000) / 10))
      : null;

    var risk1   = Math.round(currentCap * 0.01 * 100) / 100;
    var risk2   = Math.round(currentCap * 0.02 * 100) / 100;
    var dailyMax= Math.round(currentCap * (maxDDLimit / 100) * 100) / 100;

    var hist = getHistory();
    var depWith = hist.filter(function(h){ return h.accountId === acctId && (h.source === 'deposit' || h.source === 'withdrawal'); });

    return {
      account: acct, currency, startCap, currentCap,
      totalGrowth, growthPct,
      todayPnL, todayPct, weekPnL, weekPct, monthPnL, monthPct, allPnL,
      peakCapital: Math.round(peak * 100) / 100,
      maxDDAmt: Math.round(maxDDAmt * 100) / 100,
      maxDDPct,
      targetCap, targetProgress,
      risk1, risk2, dailyMax,
      equityPoints,
      deposits: depWith,
      isConfigured: s.isConfigured
    };
  }

  function addTransaction(type, amount, notes){
    var s = getSettings();
    var acctId = s.activeAccountId;
    var prev = getCurrentCapital(acctId);
    var change = type === 'deposit' ? Math.abs(amount) : -Math.abs(amount);
    var hist = getHistory();
    hist.push({
      id: 'h_' + Date.now(),
      accountId: acctId,
      date: new Date().toISOString(),
      previousCapital: prev,
      newCapital: Math.round((prev + change) * 100) / 100,
      change: change,
      source: type,
      notes: notes || ''
    });
    saveHistory(hist);
    return Math.round((prev + change) * 100) / 100;
  }

  function fmtCurrency(amount, currency, compact){
    var cur = CURRENCIES[currency] || CURRENCIES.USD;
    var sym = cur.symbol;
    var abs = Math.abs(amount);
    var str;
    if(compact && abs >= 1000000) str = sym + (abs/1000000).toFixed(2) + 'M';
    else if(compact && abs >= 1000) str = sym + (abs/1000).toFixed(1) + 'k';
    else str = sym + abs.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
    return (amount < 0 ? '-' : '') + str;
  }

  function fmtChange(amount, currency){
    var sym = CURRENCIES[currency] ? CURRENCIES[currency].symbol : '$';
    var abs = Math.abs(amount);
    var str = sym + abs.toFixed(2);
    return (amount >= 0 ? '+' : '-') + str;
  }

  function getCapitalPreview(pnl){
    var acct = getActiveAccount();
    var prev = getCurrentCapital();
    var next = Math.round((prev + pnl) * 100) / 100;
    return { prev: prev, next: next, change: pnl, currency: acct.currency };
  }

  /* ══════════════════════════════════════════════
     SETUP MODAL — injected into app pages
  ══════════════════════════════════════════════ */
  function injectSetupModal(){
    if(document.getElementById('tx-capital-modal')) return;

    var css = '<style id="tx-cap-css">' +
    '#tx-capital-modal{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .2s}' +
    '#tx-capital-modal.open{opacity:1;pointer-events:all}' +
    '.tx-cap-modal{background:#161616;border:1px solid #22262e;border-radius:12px;width:100%;max-width:480px;box-shadow:0 24px 80px rgba(0,0,0,.8)}' +
    '.tx-cap-mhead{padding:20px 24px 16px;border-bottom:1px solid #1E1E1E;display:flex;justify-content:space-between;align-items:center}' +
    '.tx-cap-mbody{padding:24px}' +
    '.tx-cap-mfoot{padding:14px 24px;border-top:1px solid #1E1E1E;display:flex;gap:8px;justify-content:flex-end}' +
    '.tx-cap-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}' +
    '.tx-cap-account-btn{flex:1;padding:8px 4px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid #22262e;background:none;color:#6B7280;font-family:inherit;transition:all .15s;text-align:center}' +
    '.tx-cap-account-btn.sel{border-color:rgba(255,183,50,.5);color:#FFB732;background:rgba(255,183,50,.08)}' +
    '.tx-dep-btn{flex:1;padding:10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid;font-family:inherit;transition:all .15s}' +
    '.tx-dep-btn.deposit{border-color:rgba(34,197,94,.4);color:#22C55E;background:rgba(34,197,94,.08)}' +
    '.tx-dep-btn.deposit:hover{background:rgba(34,197,94,.15)}' +
    '.tx-dep-btn.withdraw{border-color:rgba(239,68,68,.4);color:#EF4444;background:rgba(239,68,68,.08)}' +
    '.tx-dep-btn.withdraw:hover{background:rgba(239,68,68,.15)}' +
    '</style>';

    var html = '<div id="tx-capital-modal">' +
    '<div class="tx-cap-modal">' +
    '<div class="tx-cap-mhead">' +
    '<div><div style="font-size:15px;font-weight:700;color:#F5F5F5">Set Up Capital Tracking</div>' +
    '<div style="font-size:12px;color:#525252;margin-top:2px">Configure your account so the dashboard shows your real balance</div></div>' +
    '<button onclick="TxCapital.closeSetupModal()" style="background:none;border:none;color:#525252;cursor:pointer;font-size:18px">✕</button>' +
    '</div>' +
    '<div class="tx-cap-mbody">' +
    '<div style="margin-bottom:16px">' +
    '<label style="font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px">Account Type</label>' +
    '<div style="display:flex;gap:6px">' +
    ['Main','Futures','Prop Challenge','Demo'].map(function(t,i){
      return '<button class="tx-cap-account-btn' + (i===0?' sel':'') + '" onclick="TxCapital._selType(this)">' + t + '</button>';
    }).join('') +
    '</div></div>' +
    '<div class="tx-cap-grid">' +
    '<div class="tx-form-group"><label class="tx-label">Account Name</label><input class="tx-input" id="cap-name" type="text" placeholder="e.g. IC Markets Main" value="Main Account"></div>' +
    '<div class="tx-form-group"><label class="tx-label">Currency</label><select class="tx-select" id="cap-currency">' +
    Object.keys(CURRENCIES).map(function(k){ return '<option value="'+k+'" '+(k==='USD'?'selected':'')+'>'+k+' — '+CURRENCIES[k].name+'</option>'; }).join('') +
    '</select></div>' +
    '<div class="tx-form-group"><label class="tx-label">Starting / Initial Capital</label><input class="tx-input" id="cap-start" type="number" placeholder="10000" step="0.01"></div>' +
    '<div class="tx-form-group"><label class="tx-label">Target Capital <span style="color:#525252">(optional)</span></label><input class="tx-input" id="cap-target" type="number" placeholder="15000" step="0.01"></div>' +
    '<div class="tx-form-group"><label class="tx-label">Max Drawdown Limit %</label><input class="tx-input" id="cap-dd" type="number" placeholder="10" value="10" step="0.5"></div>' +
    '<div class="tx-form-group"><label class="tx-label">Start Date</label><input class="tx-input" id="cap-startdate" type="date" value="'+new Date().toISOString().slice(0,10)+'"></div>' +
    '</div>' +
    '</div>' +
    '<div class="tx-cap-mfoot">' +
    '<button class="tx-btn tx-btn-ghost" onclick="TxCapital.closeSetupModal()">Cancel</button>' +
    '<button class="tx-btn tx-btn-primary" onclick="TxCapital._saveSetupModal()">Save Capital Settings</button>' +
    '</div></div></div>';

    document.head.insertAdjacentHTML('beforeend', css);
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('tx-capital-modal').addEventListener('click', function(e){
      if(e.target === this) TxCapital.closeSetupModal();
    });
  }

  /* ════════════════════════════════════════
     DEPOSIT / WITHDRAWAL MODAL
  ════════════════════════════════════════ */
  function injectTransactionModal(){
    if(document.getElementById('tx-txn-modal')) return;
    var html = '<div id="tx-txn-modal" style="position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:10001;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .2s">' +
    '<div style="background:#161616;border:1px solid #22262e;border-radius:12px;width:100%;max-width:360px;box-shadow:0 24px 80px rgba(0,0,0,.8)">' +
    '<div style="padding:18px 22px 14px;border-bottom:1px solid #1E1E1E;display:flex;justify-content:space-between;align-items:center">' +
    '<div style="font-size:14px;font-weight:700;color:#F5F5F5" id="txn-modal-title">Add Transaction</div>' +
    '<button onclick="TxCapital.closeTxnModal()" style="background:none;border:none;color:#525252;cursor:pointer;font-size:18px">✕</button></div>' +
    '<div style="padding:22px">' +
    '<div style="display:flex;gap:8px;margin-bottom:16px">' +
    '<button class="tx-dep-btn deposit" onclick="TxCapital._setTxnType(\'deposit\')">+ Deposit</button>' +
    '<button class="tx-dep-btn withdraw" onclick="TxCapital._setTxnType(\'withdrawal\')" style="opacity:.5">− Withdraw</button>' +
    '</div>' +
    '<div class="tx-form-group"><label class="tx-label">Amount</label><input class="tx-input" id="txn-amount" type="number" placeholder="0.00" step="0.01"></div>' +
    '<div class="tx-form-group"><label class="tx-label">Notes <span style="color:#525252">(optional)</span></label><input class="tx-input" id="txn-notes" type="text" placeholder="Broker transfer, salary, etc."></div>' +
    '<div style="margin-top:16px;padding:14px;background:#111;border-radius:8px;border:1px solid #222">' +
    '<div style="font-size:11px;color:#525252;margin-bottom:8px">CAPITAL IMPACT PREVIEW</div>' +
    '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span style="color:#8A8A8A">Current Capital</span><span style="color:#F5F5F5;font-weight:600" id="txn-prev-cap">—</span></div>' +
    '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span style="color:#8A8A8A" id="txn-type-lbl">Deposit</span><span style="font-weight:600" id="txn-change-preview">—</span></div>' +
    '<div style="height:1px;background:#1E1E1E;margin:8px 0"></div>' +
    '<div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#FFB732;font-weight:600">New Capital</span><span style="color:#FFB732;font-weight:700;font-size:15px" id="txn-new-cap">—</span></div>' +
    '</div>' +
    '</div>' +
    '<div style="padding:12px 22px 18px;display:flex;gap:8px;justify-content:flex-end">' +
    '<button class="tx-btn tx-btn-ghost" onclick="TxCapital.closeTxnModal()">Cancel</button>' +
    '<button class="tx-btn tx-btn-primary" onclick="TxCapital._saveTxn()" id="txn-save-btn">Confirm</button>' +
    '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('txn-amount').addEventListener('input', _updateTxnPreview);
  }

  var _txnType = 'deposit';

  function _setTxnType(type){
    _txnType = type;
    var btns = document.querySelectorAll('.tx-dep-btn');
    btns.forEach(function(b){ b.style.opacity = '0.45'; });
    var active = document.querySelector('.tx-dep-btn.' + type);
    if(active) active.style.opacity = '1';
    var lbl = document.getElementById('txn-type-lbl');
    if(lbl) lbl.textContent = type === 'deposit' ? 'Deposit' : 'Withdrawal';
    _updateTxnPreview();
  }

  function _updateTxnPreview(){
    var amtEl = document.getElementById('txn-amount');
    var amt = parseFloat(amtEl ? amtEl.value : 0) || 0;
    var change = _txnType === 'deposit' ? amt : -amt;
    var acct = getActiveAccount();
    var curr = acct.currency || 'USD';
    var prev = getCurrentCapital();
    var next = Math.round((prev + change) * 100) / 100;
    var prevEl = document.getElementById('txn-prev-cap');
    var chgEl  = document.getElementById('txn-change-preview');
    var newEl  = document.getElementById('txn-new-cap');
    if(prevEl) prevEl.textContent = fmtCurrency(prev, curr);
    if(chgEl){ chgEl.textContent = fmtChange(change, curr); chgEl.style.color = change >= 0 ? '#22C55E' : '#EF4444'; }
    if(newEl){ newEl.textContent = fmtCurrency(next, curr); }
  }

  function openSetupModal(prefill){
    injectSetupModal();
    if(prefill){
      var acct = getActiveAccount();
      var el = function(id){ return document.getElementById(id); };
      if(el('cap-name')) el('cap-name').value = prefill.name || acct.name || '';
      if(el('cap-start')) el('cap-start').value = prefill.startingCapital || acct.startingCapital || '';
      if(el('cap-target')) el('cap-target').value = prefill.targetCapital || acct.targetCapital || '';
      if(el('cap-dd')) el('cap-dd').value = prefill.maxDrawdownPct || acct.maxDrawdownPct || 10;
      if(el('cap-currency')) el('cap-currency').value = prefill.currency || acct.currency || 'USD';
      if(el('cap-startdate')) el('cap-startdate').value = prefill.startDate || acct.startDate || new Date().toISOString().slice(0,10);
    }
    document.getElementById('tx-capital-modal').classList.add('open');
  }

  function closeSetupModal(){
    var m = document.getElementById('tx-capital-modal');
    if(m) m.classList.remove('open');
  }

  function _selType(btn){
    document.querySelectorAll('.tx-cap-account-btn').forEach(function(b){ b.classList.remove('sel'); });
    btn.classList.add('sel');
  }

  function _saveSetupModal(){
    var el = function(id){ return document.getElementById(id); };
    var typeBtn = document.querySelector('.tx-cap-account-btn.sel');
    var data = {
      name:            el('cap-name')      ? el('cap-name').value.trim()     : 'Main Account',
      type:            typeBtn             ? typeBtn.textContent              : 'Main',
      startingCapital: el('cap-start')     ? parseFloat(el('cap-start').value)||0  : 10000,
      currency:        el('cap-currency')  ? el('cap-currency').value         : 'USD',
      targetCapital:   el('cap-target')    ? parseFloat(el('cap-target').value)||null : null,
      maxDrawdownPct:  el('cap-dd')        ? parseFloat(el('cap-dd').value)||10      : 10,
      startDate:       el('cap-startdate') ? el('cap-startdate').value         : new Date().toISOString().slice(0,10)
    };
    if(!data.startingCapital){
      el('cap-start') && (el('cap-start').style.borderColor = '#EF4444');
      return;
    }
    setupCapital(data);
    closeSetupModal();
    if(typeof window.txRefreshCapitalDashboard === 'function') window.txRefreshCapitalDashboard();
  }

  function openTxnModal(type){
    injectSetupModal();
    injectTransactionModal();
    _txnType = type || 'deposit';
    var m = document.getElementById('tx-txn-modal');
    if(m){ m.style.opacity = '0'; m.style.pointerEvents = 'none'; m.classList.remove('open'); }
    document.getElementById('txn-amount').value = '';
    document.getElementById('txn-notes').value = '';
    _setTxnType(_txnType);
    _updateTxnPreview();
    setTimeout(function(){ if(m){ m.style.opacity='1'; m.style.pointerEvents='all'; } }, 10);
  }

  function closeTxnModal(){
    var m = document.getElementById('tx-txn-modal');
    if(m){ m.style.opacity = '0'; m.style.pointerEvents = 'none'; }
  }

  function _saveTxn(){
    var amt = parseFloat(document.getElementById('txn-amount').value) || 0;
    var notes = document.getElementById('txn-notes').value.trim();
    if(amt <= 0) return;
    addTransaction(_txnType, amt, notes);
    closeTxnModal();
    if(typeof window.txRefreshCapitalDashboard === 'function') window.txRefreshCapitalDashboard();
  }

  global.TxCapital = {
    getSettings, saveSettings,
    getActiveAccount, setActiveAccount,
    setupCapital, addAccount,
    getCurrentCapital, getCapitalStats,
    addTransaction, fmtCurrency, fmtChange,
    getCapitalPreview, CURRENCIES, ACCOUNT_TYPES,
    openSetupModal, closeSetupModal,
    openTxnModal, closeTxnModal,
    _selType, _setTxnType, _updateTxnPreview, _saveSetupModal, _saveTxn
  };
})(window);
