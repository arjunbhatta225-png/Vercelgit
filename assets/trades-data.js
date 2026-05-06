/**
 * Tradexa Trade Data Store
 * Central localStorage store for all trade journal data.
 * Used by the Trade Bot, Journal, Dashboard, and Analytics pages.
 */
(function(global){
  /* Per-user storage keys — prevents leaking data between accounts on
     a shared browser. Falls back to "anon" before TxAuth resolves; the
     anon row is never persisted across sign-out (signOut() wipes it). */
  function _uid(){
    try{
      if(global.TxAuth && typeof global.TxAuth.userKey === 'function'){
        return global.TxAuth.userKey() || 'anon';
      }
    }catch(e){}
    return 'anon';
  }
  function _tradesKey(){ return 'txTrades_v1::' + _uid(); }
  function _userKey(){   return 'txUserProfile_v1::' + _uid(); }

  /* Back-compat shim — old code reads TX_TRADES_KEY directly. */
  var TX_TRADES_KEY = 'txTrades_v1';
  var TX_USER_KEY   = 'txUserProfile_v1';

  /* Real user data only — no demo seed. Empty accounts show empty states. */
  var SEED_TRADES = [];
  var _LEGACY_SEED_REMOVED = [
    {id:'t001',date:'2026-05-02T09:42',asset:'NQ Futures',direction:'long',entry:18420,exit:18650,size:2,riskPct:1.2,stopLoss:18350,takeProfit:18700,setup:['Breakout'],emotion:['Calm'],rating:4,notes:'Clean breakout above overnight high. Followed plan exactly. Took partial at 1R, let rest run.',pnl:840,rr:2.8},
    {id:'t002',date:'2026-05-02T11:15',asset:'AAPL',direction:'short',entry:182.40,exit:181.62,size:100,riskPct:0.8,stopLoss:183.10,takeProfit:181.00,setup:['Reversal'],emotion:['FOMO'],rating:2,notes:'Entered too early before confirmation. FOMO after seeing it drop — should have waited for the 5min close.',pnl:-220,rr:0.7},
    {id:'t003',date:'2026-05-01T10:30',asset:'ES Futures',direction:'long',entry:5210,exit:5258,size:3,riskPct:1.5,stopLoss:5190,takeProfit:5270,setup:['Breakout'],emotion:['Calm'],rating:5,notes:'Perfect execution. Waited for the retest of breakout level, sized correctly, held to full target.',pnl:1190,rr:3.2},
    {id:'t004',date:'2026-05-01T14:22',asset:'BTC/USD',direction:'long',entry:62100,exit:62850,size:0.05,riskPct:1.0,stopLoss:61600,takeProfit:63100,setup:['Pullback'],emotion:['Confident'],rating:4,notes:'Strong pullback to support. Held through volatility.',pnl:340,rr:2.1},
    {id:'t005',date:'2026-04-30T08:15',asset:'EUR/USD',direction:'short',entry:1.0820,exit:1.0833,size:2,riskPct:0.9,stopLoss:1.0835,takeProfit:1.0790,setup:['Trend Follow'],emotion:['Uncertain'],rating:3,notes:'Not my best entry — moved against me immediately. Should have waited for London close.',pnl:-103,rr:0.8},
    {id:'t006',date:'2026-04-29T09:55',asset:'GLD',direction:'long',entry:218.40,exit:221.80,size:50,riskPct:1.1,stopLoss:216.80,takeProfit:222.00,setup:['Breakout'],emotion:['Calm'],rating:4,notes:'Gold breaking out on inflation data. Clean setup, good R:R.',pnl:170,rr:1.9},
    {id:'t007',date:'2026-04-28T14:30',asset:'TSLA',direction:'short',entry:168.20,exit:164.80,size:75,riskPct:1.4,stopLoss:170.50,takeProfit:164.00,setup:['Gap Fill'],emotion:['Confident'],rating:5,notes:'Gap fill trade after earnings gap up. Classic setup, held through first pullback.',pnl:255,rr:2.4},
    {id:'t008',date:'2026-04-28T10:05',asset:'NQ Futures',direction:'short',entry:18380,exit:18420,size:1,riskPct:0.8,stopLoss:18430,takeProfit:18300,setup:['Reversal'],emotion:['Revenge'],rating:1,notes:'Revenge trade after morning loss. Took this without a setup — pure emotion. Stopped out.',pnl:-180,rr:0.5},
    {id:'t009',date:'2026-04-25T09:30',asset:'SPY',direction:'long',entry:518.50,exit:521.80,size:100,riskPct:1.2,stopLoss:516.00,takeProfit:522.00,setup:['Trend Follow'],emotion:['Calm'],rating:4,notes:'Monday open trend follow. Clean momentum move after gap and go.',pnl:330,rr:1.8},
    {id:'t010',date:'2026-04-24T13:45',asset:'BTC/USD',direction:'long',entry:60400,exit:61200,size:0.08,riskPct:1.0,stopLoss:59800,takeProfit:61600,setup:['Pullback'],emotion:['Confident'],rating:4,notes:'Support bounce. Entered on 4H bullish engulfing.',pnl:506,rr:2.0},
    {id:'t011',date:'2026-04-23T11:30',asset:'MSFT',direction:'long',entry:412.00,exit:418.50,size:50,riskPct:1.3,stopLoss:408.00,takeProfit:420.00,setup:['Breakout'],emotion:['Calm'],rating:5,notes:'All-time high breakout. Let it breathe, no premature exit.',pnl:325,rr:2.9},
    {id:'t012',date:'2026-04-22T08:45',asset:'EUR/USD',direction:'long',entry:1.0755,exit:1.0790,size:3,riskPct:1.0,stopLoss:1.0730,takeProfit:1.0800,setup:['Pullback'],emotion:['Calm'],rating:4,notes:'ECB day trade. Clean setup with tight stop.',pnl:218,rr:2.4},
    {id:'t013',date:'2026-04-21T14:00',asset:'AAPL',direction:'long',entry:178.20,exit:176.80,size:80,riskPct:0.9,stopLoss:177.00,takeProfit:181.00,setup:['Reversal'],emotion:['FOMO'],rating:2,notes:'Bought the dip too early. FOMO on the drop, no confirmation. Stopped out.',pnl:-225,rr:0.6},
    {id:'t014',date:'2026-04-18T10:15',asset:'ES Futures',direction:'short',entry:5185,exit:5160,size:2,riskPct:1.5,stopLoss:5205,takeProfit:5155,setup:['Breakout'],emotion:['Confident'],rating:4,notes:'Friday sell-off anticipation. Clean break below 5190 support.',pnl:820,rr:2.1},
    {id:'t015',date:'2026-04-17T09:45',asset:'GLD',direction:'long',entry:215.80,exit:217.20,size:60,riskPct:1.1,stopLoss:214.60,takeProfit:218.00,setup:['Trend Follow'],emotion:['Calm'],rating:4,notes:'Gold in clear uptrend. Entered on EMA pullback.',pnl:84,rr:1.7},
    {id:'t016',date:'2026-04-16T11:00',asset:'NVDA',direction:'long',entry:880,exit:865,size:20,riskPct:1.4,stopLoss:875,takeProfit:900,setup:['Breakout'],emotion:['Greedy'],rating:2,notes:'Chased a breakout that was already extended. Greed made me ignore the overextension. Loss.',pnl:-300,rr:0.6},
    {id:'t017',date:'2026-04-15T13:30',asset:'NQ Futures',direction:'long',entry:18150,exit:18290,size:2,riskPct:1.2,stopLoss:18090,takeProfit:18310,setup:['Pullback'],emotion:['Calm'],rating:5,notes:'Tax day volatility fade. Held through noise, target hit.',pnl:490,rr:3.1},
    {id:'t018',date:'2026-04-14T09:30',asset:'BTC/USD',direction:'short',entry:63500,exit:62800,size:0.06,riskPct:1.0,stopLoss:64100,takeProfit:62500,setup:['Reversal'],emotion:['Confident'],rating:4,notes:'Lower high confirmed on 1H. Shorted the retest.',pnl:420,rr:1.9},
    {id:'t019',date:'2026-04-11T10:00',asset:'TSLA',direction:'long',entry:162.40,exit:165.80,size:100,riskPct:1.3,stopLoss:160.50,takeProfit:166.00,setup:['Gap Fill'],emotion:['Calm'],rating:4,notes:'Gap fill setup on Friday. Entered at gap support.',pnl:340,rr:2.2},
    {id:'t020',date:'2026-04-10T14:15',asset:'EUR/USD',direction:'short',entry:1.0910,exit:1.0890,size:2,riskPct:0.8,stopLoss:1.0930,takeProfit:1.0870,setup:['Trend Follow'],emotion:['Calm'],rating:3,notes:'CPI reaction short. Partial close too early, left money on table.',pnl:125,rr:1.5},
    {id:'t021',date:'2026-04-09T11:30',asset:'SPY',direction:'short',entry:522.00,exit:524.50,size:80,riskPct:1.0,stopLoss:523.50,takeProfit:518.00,setup:['Reversal'],emotion:['Fearful'],rating:2,notes:'Shorted into strength. Fear of missing the reversal made me enter without proper setup.',pnl:-200,rr:0.7},
    {id:'t022',date:'2026-04-08T09:45',asset:'MSFT',direction:'long',entry:406.50,exit:411.20,size:60,riskPct:1.2,stopLoss:403.00,takeProfit:412.00,setup:['Pullback'],emotion:['Calm'],rating:5,notes:'Textbook pullback to 20EMA. Patience paid off.',pnl:282,rr:2.6},
    {id:'t023',date:'2026-04-07T13:00',asset:'NQ Futures',direction:'long',entry:18050,exit:17980,size:1,riskPct:0.9,stopLoss:17990,takeProfit:18150,setup:['Reversal'],emotion:['Revenge'],rating:1,notes:'Revenge after earlier loss. No real setup, just wanted to make money back. Failed.',pnl:-245,rr:0.4},
    {id:'t024',date:'2026-04-04T10:30',asset:'ES Futures',direction:'long',entry:5160,exit:5192,size:3,riskPct:1.4,stopLoss:5145,takeProfit:5200,setup:['Breakout'],emotion:['Confident'],rating:4,notes:'NFP day breakout. Good setup, held through pullback.',pnl:840,rr:2.8},
    {id:'t025',date:'2026-04-03T11:00',asset:'AAPL',direction:'long',entry:176.80,exit:179.60,size:100,riskPct:1.1,stopLoss:175.00,takeProfit:180.00,setup:['Pullback'],emotion:['Calm'],rating:4,notes:'EMA retest on rising market. Clean entry, good follow-through.',pnl:280,rr:2.1},
    {id:'t026',date:'2026-04-02T09:35',asset:'BTC/USD',direction:'long',entry:61800,exit:62400,size:0.07,riskPct:1.0,stopLoss:61200,takeProfit:62800,setup:['Trend Follow'],emotion:['Calm'],rating:4,notes:'Momentum continuation trade. Held through minor pullback.',pnl:420,rr:1.8},
    {id:'t027',date:'2026-04-01T14:00',asset:'GLD',direction:'long',entry:214.00,exit:212.80,size:50,riskPct:0.8,stopLoss:213.20,takeProfit:216.00,setup:['Breakout'],emotion:['Greedy'],rating:2,notes:'Tried to buy too early at false breakout. Greed — should have waited for confirmation.',pnl:-60,rr:0.5},
    {id:'t028',date:'2026-03-31T10:15',asset:'TSLA',direction:'short',entry:172.50,exit:169.80,size:80,riskPct:1.3,stopLoss:174.50,takeProfit:169.00,setup:['Gap Fill'],emotion:['Confident'],rating:4,notes:'End of quarter position. Gap fill to support zone.',pnl:216,rr:2.1},
    {id:'t029',date:'2026-03-28T09:30',asset:'NQ Futures',direction:'long',entry:17950,exit:18120,size:2,riskPct:1.2,stopLoss:17880,takeProfit:18150,setup:['Trend Follow'],emotion:['Calm'],rating:5,notes:'Weekly open momentum. Perfect entry at breakout retest.',pnl:595,rr:3.5},
    {id:'t030',date:'2026-03-27T13:45',asset:'EUR/USD',direction:'long',entry:1.0840,exit:1.0870,size:2,riskPct:0.9,stopLoss:1.0815,takeProfit:1.0880,setup:['Pullback'],emotion:['Calm'],rating:4,notes:'Clean setup into NY session. Followed rules perfectly.',pnl:188,rr:2.0}
  ];

  /* Coerce a single trade record to predictable types. JSON storage (CSV
     import, manual edits, older save formats) can leave numerics as strings
     or omitted, which corrupts downstream arithmetic via string concat.
     Mutates and returns the same object. */
  function _normalizeTrade(t){
    if(!t || typeof t !== 'object') return t;
    var numKeys = ['pnl','rr','entry','exit','size','riskPct','stopLoss','takeProfit','rating','fees'];
    for(var i=0;i<numKeys.length;i++){
      var k = numKeys[i];
      if(t[k] === undefined || t[k] === null || t[k] === '') continue;
      var n = parseFloat(t[k]);
      t[k] = isFinite(n) ? n : 0;
    }
    /* String fields — type-guard for safe downstream use. */
    if(t.asset != null && typeof t.asset !== 'string') t.asset = String(t.asset);
    if(t.direction != null && typeof t.direction !== 'string') t.direction = String(t.direction);
    if(t.notes != null && typeof t.notes !== 'string') t.notes = String(t.notes);
    if(t.date != null && typeof t.date !== 'string') t.date = String(t.date);
    /* Array fields — coerce to array if scalar. */
    if(t.setup != null && !Array.isArray(t.setup)) t.setup = [String(t.setup)];
    if(t.emotion != null && !Array.isArray(t.emotion)) t.emotion = [String(t.emotion)];
    return t;
  }

  function getTrades(){
    try{
      var raw = localStorage.getItem(_tradesKey());
      if(raw){
        var parsed = JSON.parse(raw);
        if(Array.isArray(parsed) && parsed.length > 0){
          for(var i=0;i<parsed.length;i++) _normalizeTrade(parsed[i]);
          return parsed;
        }
      }
    }catch(e){}
    seedTrades();
    return SEED_TRADES.slice();
  }

  function seedTrades(){
    try{ localStorage.setItem(_tradesKey(), JSON.stringify(SEED_TRADES)); }catch(e){}
  }

  function saveTrade(trade){
    var trades = getTrades();
    /* Normalize first so _calcPnl/_calcRR get numbers, not CSV-imported strings. */
    _normalizeTrade(trade);
    trade.id = 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
    if(!trade.date) trade.date = new Date().toISOString().slice(0,16);
    trade.pnl = trade.pnl || _calcPnl(trade);
    trade.rr  = trade.rr  || _calcRR(trade);
    trades.unshift(trade);
    try{ localStorage.setItem(_tradesKey(), JSON.stringify(trades)); }catch(e){}
    return trade;
  }

  function deleteTrade(id){
    var trades = getTrades().filter(function(t){ return t.id !== id; });
    try{ localStorage.setItem(_tradesKey(), JSON.stringify(trades)); }catch(e){}
  }

  function _calcPnl(t){
    if(!t.entry || !t.exit || !t.size) return 0;
    var diff = t.direction === 'long' ? (t.exit - t.entry) : (t.entry - t.exit);
    return Math.round(diff * t.size * 100) / 100;
  }

  function _calcRR(t){
    if(!t.entry || !t.stopLoss || !t.pnl) return 0;
    /* abs(size) — some brokers represent shorts as a negative size. */
    var risk = Math.abs(t.entry - t.stopLoss) * Math.abs(t.size);
    return risk > 0 ? Math.round((Math.abs(t.pnl) / risk) * 10) / 10 : 0;
  }

  function getStats(trades){
    if(!trades) trades = getTrades();
    var wins   = trades.filter(function(t){ return t.pnl > 0; });
    var losses = trades.filter(function(t){ return t.pnl < 0; });
    var totalPnl    = trades.reduce(function(s,t){ return s + (t.pnl||0); }, 0);
    var totalWinPnl = wins.reduce(function(s,t){ return s + t.pnl; }, 0);
    var totalLossPnl= losses.reduce(function(s,t){ return s + t.pnl; }, 0);
    var avgWin  = wins.length  ? totalWinPnl  / wins.length  : 0;
    var avgLoss = losses.length? totalLossPnl / losses.length: 0;
    var avgRR   = trades.filter(function(t){ return t.rr>0; })
                        .reduce(function(s,t,_,a){ return s + t.rr/a.length; }, 0);
    /* Profit factor: |gross win| / |gross loss|.
       - If no losses but wins exist → Infinity (unbounded edge); UI clamps display.
       - If no trades / no wins / no losses → 0.
       Avoids the previous magic 999 which leaked into UI as a real number. */
    var profitFactor;
    if(totalLossPnl !== 0)      profitFactor = Math.abs(totalWinPnl / totalLossPnl);
    else if(totalWinPnl > 0)    profitFactor = Infinity;
    else                        profitFactor = 0;
    var fomoCount    = trades.filter(function(t){ return (t.emotion||[]).indexOf('FOMO')    > -1; }).length;
    var revengeCount = trades.filter(function(t){ return (t.emotion||[]).indexOf('Revenge') > -1; }).length;
    var greedyCount  = trades.filter(function(t){ return (t.emotion||[]).indexOf('Greedy')  > -1; }).length;
    var calmCount    = trades.filter(function(t){ return (t.emotion||[]).indexOf('Calm')    > -1; }).length;

    var emotionPnl = {};
    trades.forEach(function(t){
      (t.emotion||[]).forEach(function(e){
        if(!emotionPnl[e]) emotionPnl[e] = {pnl:0,count:0,wins:0};
        emotionPnl[e].pnl += (t.pnl||0);
        emotionPnl[e].count++;
        if(t.pnl > 0) emotionPnl[e].wins++;
      });
    });

    var setupWinRates = {};
    trades.forEach(function(t){
      (t.setup||[]).forEach(function(s){
        if(!setupWinRates[s]) setupWinRates[s] = {wins:0,total:0,pnl:0};
        setupWinRates[s].total++;
        setupWinRates[s].pnl += (t.pnl||0);
        if(t.pnl > 0) setupWinRates[s].wins++;
      });
    });

    var assetStats = {};
    trades.forEach(function(t){
      if(!t.asset) return;
      if(!assetStats[t.asset]) assetStats[t.asset] = {pnl:0,count:0,wins:0};
      assetStats[t.asset].pnl += (t.pnl||0);
      assetStats[t.asset].count++;
      if(t.pnl > 0) assetStats[t.asset].wins++;
    });

    /* "Recent 10" is date-derived, not insertion-derived — the array order
       can drift if records were imported in batch or hand-edited in storage. */
    var recent10 = trades.slice().sort(function(a,b){
      var da = new Date(a.date).getTime();
      var db = new Date(b.date).getTime();
      if(isNaN(da)) da = 0;
      if(isNaN(db)) db = 0;
      return db - da;
    }).slice(0,10);
    var recent10Wins = recent10.filter(function(t){ return t.pnl > 0; }).length;
    var recent10Pnl  = recent10.reduce(function(s,t){ return s + (t.pnl||0); }, 0);

    /* Streak — count consecutive wins or losses from the most recent trade
       backward. Don't rely on insertion order: sort by date desc so the
       streak is correct even if records were imported out of order or
       a user-edited localStorage broke the unshift invariant. Breakeven
       trades (pnl===0) are skipped — they neither extend nor break a streak. */
    var streak = 0, streakType = '';
    var byDateDesc = trades.slice().sort(function(a,b){
      var da = new Date(a.date).getTime();
      var db = new Date(b.date).getTime();
      if(isNaN(da)) da = 0;
      if(isNaN(db)) db = 0;
      return db - da;
    });
    for(var i = 0; i < byDateDesc.length; i++){
      var p = byDateDesc[i].pnl;
      if(p === 0) continue;
      var isWin = p > 0;
      if(streakType === ''){ streak = 1; streakType = isWin ? 'win' : 'loss'; }
      else if((isWin && streakType === 'win') || (!isWin && streakType === 'loss')){ streak++; }
      else break;
    }

    return {
      total: trades.length,
      wins:  wins.length,
      losses: losses.length,
      winRate: trades.length ? Math.round(wins.length / trades.length * 1000) / 10 : 0,
      totalPnl: Math.round(totalPnl * 100) / 100,
      avgWin:   Math.round(avgWin  * 100) / 100,
      avgLoss:  Math.round(avgLoss * 100) / 100,
      avgRR:    Math.round(avgRR   * 10)  / 10,
      /* Preserve Infinity through to UI — Math.round(Infinity)=Infinity, /100=Infinity. */
      profitFactor: isFinite(profitFactor) ? Math.round(profitFactor * 100) / 100 : Infinity,
      fomoCount, revengeCount, greedyCount, calmCount,
      emotionPnl, setupWinRates, assetStats,
      recent10, recent10Wins, recent10Pnl,
      currentStreak: streak, currentStreakType: streakType
    };
  }

  function getTradeContext(){
    var trades = getTrades();
    if(trades.length === 0){
      return 'NO_TRADES: The user has not logged any trades yet. Encourage them to add their first trade in the Trade Journal.';
    }

    var s = getStats(trades);
    var recent30 = trades.slice(0, Math.min(30, trades.length));
    var s30 = getStats(recent30);

    var topAssets = Object.entries(s.assetStats)
      .sort(function(a,b){ return Math.abs(b[1].pnl) - Math.abs(a[1].pnl); })
      .slice(0,5)
      .map(function(e){
        return e[0] + ': ' + e[1].count + ' trades, ' + Math.round(e[1].wins/e[1].count*100) + '% WR, $' + Math.round(e[1].pnl) + ' P&L';
      }).join('; ');

    var topSetups = Object.entries(s.setupWinRates)
      .sort(function(a,b){ return b[1].total - a[1].total; })
      .slice(0,5)
      .map(function(e){
        return e[0] + ': ' + e[1].total + ' trades, ' + Math.round(e[1].wins/e[1].total*100) + '% WR';
      }).join('; ');

    var emotionSummary = Object.entries(s.emotionPnl)
      .map(function(e){
        var wr = Math.round(e[1].wins / e[1].count * 100);
        return e[0] + ' (' + e[1].count + ' trades, ' + wr + '% WR, $' + Math.round(e[1].pnl) + ')';
      }).join('; ');

    var recentTradesList = s.recent10.slice(0,5).map(function(t){
      var outcome = t.pnl > 0 ? 'WIN +$'+t.pnl : 'LOSS $'+t.pnl;
      var emotStr = (t.emotion||[]).join('/') || 'Unknown';
      return '  - ' + (t.date||'').slice(0,10) + ' | ' + t.asset + ' ' + (t.direction||'').toUpperCase() + ' | ' + (t.setup||[]).join('/') + ' | ' + emotStr + ' | ' + outcome + ' | R:R ' + t.rr + ' | Notes: "' + (t.notes||'').slice(0,80) + '"';
    }).join('\n');

    var streakMsg = s.currentStreak >= 2
      ? 'Currently on a ' + s.currentStreak + '-trade ' + s.currentStreakType + ' streak.'
      : 'No notable current streak.';

    var context = [
      '=== TRADEXA JOURNAL DATA FOR THIS USER ===',
      '',
      'OVERVIEW (All Time):',
      '  Total trades: ' + s.total,
      '  Wins: ' + s.wins + ' | Losses: ' + s.losses,
      '  Win rate: ' + s.winRate + '%',
      '  Total P&L: $' + s.totalPnl,
      '  Avg win: $' + s.avgWin + ' | Avg loss: $' + s.avgLoss,
      '  Avg R:R: ' + s.avgRR,
      '  Profit factor: ' + s.profitFactor,
      '',
      'LAST 30 TRADES:',
      '  Win rate: ' + s30.winRate + '%',
      '  P&L: $' + s30.totalPnl,
      '  Avg R:R: ' + s30.avgRR,
      '  ' + streakMsg,
      '',
      'LAST 10 TRADES (most recent first):',
      '  Win rate: ' + (s.recent10Wins) + '/' + s.recent10.length,
      '  P&L: $' + s.recent10Pnl,
      '',
      'RECENT TRADE DETAILS:',
      recentTradesList,
      '',
      'BEHAVIORAL PATTERNS:',
      '  FOMO trades: ' + s.fomoCount + ' (out of ' + s.total + ')',
      '  Revenge trades: ' + s.revengeCount,
      '  Greedy trades: ' + s.greedyCount,
      '  Calm trades: ' + s.calmCount,
      '  Emotion breakdown: ' + emotionSummary,
      '',
      'SETUP PERFORMANCE:',
      '  ' + topSetups,
      '',
      'ASSET PERFORMANCE:',
      '  ' + topAssets,
      '',
      '=== END OF JOURNAL DATA ===',
      'Use this data to give specific, personalized coaching. Reference actual numbers from their journal. Be direct and specific.'
    ].join('\n');

    return context;
  }

  function getUserProfile(){
    try{ return JSON.parse(localStorage.getItem(_userKey()) || '{}'); }catch(e){ return {}; }
  }

  function saveUserProfile(profile){
    try{ localStorage.setItem(_userKey(), JSON.stringify(profile)); }catch(e){}
  }

  /* Format profit factor for display.
     - Infinity (wins, no losses) → '∞'
     - 0 / NaN / no data           → '—'
     - Otherwise                   → number rounded as-is */
  function formatPF(pf){
    if(pf === Infinity) return '∞';
    var n = parseFloat(pf);
    if(!isFinite(n) || n === 0) return '—';
    return n;
  }

  global.TxTradeData = {
    getTrades: getTrades,
    saveTrade: saveTrade,
    deleteTrade: deleteTrade,
    getStats: getStats,
    getTradeContext: getTradeContext,
    getUserProfile: getUserProfile,
    saveUserProfile: saveUserProfile,
    formatPF: formatPF,
    TX_TRADES_KEY: TX_TRADES_KEY
  };

  getTrades();

})(window);
