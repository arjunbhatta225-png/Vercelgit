/* ════════════════════════════════════════════════════════════════
   TxMath — Trading Math Engine
   Auto-calculates position size, risk, R:R, expectancy, drawdown,
   break-even win rate, compounding projections, and avg return per
   setup. Provides warnings to protect users from over-risking and
   poor R:R setups.

   Exposes window.TxMath
════════════════════════════════════════════════════════════════ */
(function(global){
  'use strict';

  /* ── Number helpers ────────────────────────────────────────── */
  function r(v, d){ d = d == null ? 2 : d; var p = Math.pow(10, d); return Math.round((+v || 0) * p) / p; }
  function safe(v){ var n = +v; return isFinite(n) ? n : 0; }

  /* ════════════════════════════════════════════════════════════
     CORE CALCULATIONS
  ════════════════════════════════════════════════════════════ */

  /** Dollar risk for a given account balance and risk %.
   *  $1000 @ 1% → $10
   */
  function riskPerTrade(accountBalance, riskPct){
    return r(safe(accountBalance) * (safe(riskPct) / 100));
  }

  /** Recommended position size given account balance, risk %,
   *  entry price, and stop-loss price.
   *
   *  size = (accountBalance × riskPct%) / |entry − stop|
   *
   *  Returns: { size, riskDollars, perUnitRisk, valid }
   */
  function positionSize(accountBalance, riskPct, entry, stopLoss){
    var riskDollars = riskPerTrade(accountBalance, riskPct);
    var perUnit = Math.abs(safe(entry) - safe(stopLoss));
    if(!perUnit || !riskDollars){
      return { size: 0, riskDollars: riskDollars, perUnitRisk: perUnit, valid: false };
    }
    var size = riskDollars / perUnit;
    return {
      size:        r(size, 4),
      riskDollars: r(riskDollars),
      perUnitRisk: r(perUnit, 6),
      valid:       true
    };
  }

  /** Risk:Reward ratio. Returns reward-per-1-unit-of-risk.
   *  RR = |target − entry| / |entry − stop|
   *
   *  Direction-aware: long needs target > entry, short needs target < entry.
   */
  function riskRewardRatio(entry, stopLoss, takeProfit, direction){
    var e = safe(entry), s = safe(stopLoss), t = safe(takeProfit);
    if(!e || !s || !t) return 0;
    var risk = Math.abs(e - s);
    if(!risk) return 0;
    // direction sanity: target should be on the favorable side
    var dir = (direction || 'long').toLowerCase();
    var reward = dir === 'short' ? (e - t) : (t - e);
    if(reward <= 0) return 0;
    return r(reward / risk, 2);
  }

  /** Break-even win rate (%) for a given R:R.
   *  BE_WR = 1 / (1 + RR) × 100
   *
   *  RR 1   → 50%
   *  RR 2   → 33.3%
   *  RR 3   → 25%
   */
  function breakEvenWinRate(rr){
    var v = safe(rr);
    if(v <= 0) return 100;
    return r(100 / (1 + v), 1);
  }

  /** Expectancy ($ per trade).
   *  E = (winRate × avgWin) − (lossRate × |avgLoss|)
   *
   *  winRate as 0–100. avgLoss should be negative or absolute (we abs it).
   */
  function expectancy(winRate, avgWin, avgLoss){
    var wr = safe(winRate) / 100;
    var lr = 1 - wr;
    var aw = Math.abs(safe(avgWin));
    var al = Math.abs(safe(avgLoss));
    return r(wr * aw - lr * al);
  }

  /** Drawdown % from peak to current.
   *  Returns a positive number (e.g. 12.5 means -12.5% from peak).
   */
  function drawdownPct(peak, current){
    var p = safe(peak), c = safe(current);
    if(p <= 0 || c >= p) return 0;
    return r((p - c) / p * 100, 2);
  }

  /** Compounding projection.
   *  Monthly returns reinvested over `months` months.
   *
   *  Returns: [{ month: 0, value: startCap }, { month: 1, value: ... }, ...]
   */
  function compoundProjection(startCap, monthlyReturnPct, months){
    var out = [];
    var v = safe(startCap);
    var rate = safe(monthlyReturnPct) / 100;
    var n = Math.max(1, Math.min(120, parseInt(months) || 12));
    out.push({ month: 0, value: r(v) });
    for(var i = 1; i <= n; i++){
      v = v * (1 + rate);
      out.push({ month: i, value: r(v) });
    }
    return out;
  }

  /** Average return per setup tag across an array of trades.
   *  Returns: { setupName: { count, wins, losses, totalPnl, avgPnl, winRate, avgRR, expectancy } }
   */
  function avgReturnPerSetup(trades){
    var map = {};
    (trades || []).forEach(function(t){
      var setups = (t.setup && t.setup.length) ? t.setup : ['Unspecified'];
      setups.forEach(function(name){
        if(!name) return;
        if(!map[name]) map[name] = { count:0, wins:0, losses:0, totalPnl:0, sumWin:0, sumLoss:0, sumRR:0, rrCount:0 };
        var m = map[name];
        m.count++;
        m.totalPnl += safe(t.pnl);
        if(t.pnl > 0){ m.wins++;   m.sumWin  += t.pnl; }
        if(t.pnl < 0){ m.losses++; m.sumLoss += Math.abs(t.pnl); }
        if(t.rr > 0){ m.sumRR += t.rr; m.rrCount++; }
      });
    });
    Object.keys(map).forEach(function(k){
      var m = map[k];
      m.avgPnl     = r(m.totalPnl / m.count);
      m.winRate    = r(m.wins / m.count * 100, 1);
      m.avgWin     = m.wins   ? r(m.sumWin  / m.wins)   : 0;
      m.avgLoss    = m.losses ? r(m.sumLoss / m.losses) : 0;
      m.avgRR      = m.rrCount ? r(m.sumRR / m.rrCount, 2) : 0;
      m.expectancy = expectancy(m.winRate, m.avgWin, m.avgLoss);
      m.totalPnl   = r(m.totalPnl);
    });
    return map;
  }

  /* ════════════════════════════════════════════════════════════
     TRADE ASSESSMENT — warnings shown to user before they log
  ════════════════════════════════════════════════════════════ */

  /**
   *  Input: { entry, stopLoss, takeProfit, size, accountBalance,
   *           riskPct, direction }
   *
   *  Returns:
   *  {
   *    warnings: [{ level: 'high'|'med'|'info'|'good', title, message }],
   *    metrics:  { rr, riskDollars, riskPctActual, recommendedSize, beWR }
   *  }
   */
  function assessTrade(input){
    input = input || {};
    var entry   = safe(input.entry);
    var sl      = safe(input.stopLoss);
    var tp      = safe(input.takeProfit);
    var size    = safe(input.size);
    var bal     = safe(input.accountBalance);
    var riskPct = safe(input.riskPct);
    var dir     = (input.direction || 'long').toLowerCase();

    var warnings = [];
    var metrics  = {
      rr: 0, riskDollars: 0, riskPctActual: 0,
      recommendedSize: 0, beWR: 0
    };

    /* No stop loss */
    if(!sl){
      warnings.push({
        level: 'high',
        title: 'No stop loss set',
        message: 'Trading without a stop loss exposes you to unlimited risk. Always define your exit before entering.'
      });
    }

    /* Stop on wrong side of entry */
    if(entry && sl){
      if(dir === 'long' && sl >= entry){
        warnings.push({
          level: 'high',
          title: 'Stop loss is above entry on a LONG',
          message: 'For a long trade, your stop must be below entry. Double-check direction or stop price.'
        });
      } else if(dir === 'short' && sl <= entry){
        warnings.push({
          level: 'high',
          title: 'Stop loss is below entry on a SHORT',
          message: 'For a short trade, your stop must be above entry. Double-check direction or stop price.'
        });
      }
    }

    /* Wrong-side take profit — must run independently of RR
       (RR returns 0 for wrong-side targets, so this can't be gated on rr > 0) */
    if(entry && tp){
      if(dir === 'long' && tp <= entry){
        warnings.push({
          level: 'high',
          title: 'Take profit is below entry on a LONG',
          message: 'For a long trade, your target must be above entry. Double-check direction or target price.'
        });
      } else if(dir === 'short' && tp >= entry){
        warnings.push({
          level: 'high',
          title: 'Take profit is above entry on a SHORT',
          message: 'For a short trade, your target must be below entry. Double-check direction or target price.'
        });
      }
    }

    /* Risk:Reward */
    var rr = riskRewardRatio(entry, sl, tp, dir);
    metrics.rr   = rr;
    metrics.beWR = breakEvenWinRate(rr);

    if(tp && rr > 0){
      if(rr < 1){
        warnings.push({
          level: 'high',
          title: 'Risk-to-Reward is below 1:1',
          message: 'You are risking more than you stand to gain. You\'d need a >' + breakEvenWinRate(rr) + '% win rate just to break even. Consider a wider target or tighter stop.'
        });
      } else if(rr < 1.5){
        warnings.push({
          level: 'med',
          title: 'Poor R:R ratio (1:' + rr + ')',
          message: 'You need a ' + breakEvenWinRate(rr) + '% win rate to break even. Aim for at least 1:1.5 — ideally 1:2 or better.'
        });
      } else if(rr >= 3){
        warnings.push({
          level: 'good',
          title: 'Excellent R:R ratio (1:' + rr + ')',
          message: 'A high-quality setup. Even a ' + breakEvenWinRate(rr) + '% win rate is profitable here.'
        });
      }
    }

    /* Position size & risk vs account */
    if(entry && sl && size){
      var perUnit = Math.abs(entry - sl);
      var riskDollars = perUnit * size;
      metrics.riskDollars = r(riskDollars);

      if(bal > 0){
        var pctActual = riskDollars / bal * 100;
        metrics.riskPctActual = r(pctActual, 2);

        if(pctActual > 5){
          warnings.push({
            level: 'high',
            title: 'Risking ' + r(pctActual,1) + '% of your account on a single trade',
            message: 'Professional traders keep per-trade risk under 2%. At ' + r(pctActual,1) + '%, a 5-trade losing streak would cost ' + r(pctActual*5,1) + '% of your capital.'
          });
        } else if(pctActual > 2){
          warnings.push({
            level: 'med',
            title: 'Risk is ' + r(pctActual,1) + '% of your account',
            message: 'Consider reducing position size. The 2% rule is a widely-tested ceiling for sustainable growth.'
          });
        }

        /* Recommended size based on declared riskPct */
        if(riskPct > 0){
          var rec = positionSize(bal, riskPct, entry, sl);
          metrics.recommendedSize = rec.size;
          if(rec.valid && Math.abs(size - rec.size) / rec.size > 0.2){
            warnings.push({
              level: 'med',
              title: 'Position size doesn\'t match your ' + riskPct + '% risk plan',
              message: 'Recommended size: ' + rec.size + ' units (which would risk ~$' + rec.riskDollars + '). You entered ' + size + '.'
            });
          }
        }
      }
    }

    return { warnings: warnings, metrics: metrics };
  }

  /* ════════════════════════════════════════════════════════════
     AGGREGATED MATH STATS — for dashboard / analytics
  ════════════════════════════════════════════════════════════ */

  function getMathStats(trades, accountBalance){
    trades = trades || [];
    var n = trades.length;
    if(!n){
      return {
        total: 0, winRate: 0, avgWin: 0, avgLoss: 0, avgRR: 0,
        expectancy: 0, breakEvenWR: 0, edge: 0,
        avgReturnPct: 0, maxDD: 0, maxDDPct: 0, peak: 0,
        bestSetup: null, worstSetup: null, setupStats: {}
      };
    }

    var wins   = trades.filter(function(t){ return t.pnl > 0; });
    var losses = trades.filter(function(t){ return t.pnl < 0; });
    var sumWin   = wins.reduce(function(s,t){ return s + t.pnl; }, 0);
    var sumLoss  = losses.reduce(function(s,t){ return s + Math.abs(t.pnl); }, 0);
    var avgWin   = wins.length   ? sumWin  / wins.length   : 0;
    var avgLoss  = losses.length ? sumLoss / losses.length : 0;
    var winRate  = wins.length / n * 100;

    var rrTrades = trades.filter(function(t){ return t.rr > 0; });
    var avgRR    = rrTrades.length
      ? rrTrades.reduce(function(s,t){ return s + t.rr; }, 0) / rrTrades.length
      : 0;

    var exp = expectancy(winRate, avgWin, avgLoss);
    var beWR = breakEvenWinRate(avgRR);
    var edge = winRate - beWR;  // positive = profitable edge

    /* Max drawdown over equity curve */
    var sorted = trades.slice().sort(function(a,b){ return new Date(a.date) - new Date(b.date); });
    var startCap = safe(accountBalance);
    var equity = startCap, peak = startCap, maxDD = 0;
    sorted.forEach(function(t){
      equity += safe(t.pnl);
      if(equity > peak) peak = equity;
      var dd = peak - equity;
      if(dd > maxDD) maxDD = dd;
    });
    var maxDDPct = peak > 0 ? maxDD / peak * 100 : 0;

    /* Avg return % per trade (vs starting capital) */
    var totalPnl = trades.reduce(function(s,t){ return s + safe(t.pnl); }, 0);
    var avgReturnPct = (startCap > 0)
      ? (totalPnl / n) / startCap * 100
      : 0;

    /* Best / worst setup */
    var setupStats = avgReturnPerSetup(trades);
    var best = null, worst = null;
    Object.keys(setupStats).forEach(function(k){
      var m = setupStats[k];
      if(m.count < 2) return; // need at least 2 trades to be meaningful
      if(!best  || m.expectancy > best.expectancy)  best  = Object.assign({ name:k }, m);
      if(!worst || m.expectancy < worst.expectancy) worst = Object.assign({ name:k }, m);
    });

    return {
      total: n,
      winRate:    r(winRate, 1),
      avgWin:     r(avgWin),
      avgLoss:    r(avgLoss),
      avgRR:      r(avgRR, 2),
      expectancy: r(exp),
      breakEvenWR: beWR,
      edge:        r(edge, 1),
      avgReturnPct: r(avgReturnPct, 3),
      maxDD:    r(maxDD),
      maxDDPct: r(maxDDPct, 2),
      peak:     r(peak),
      bestSetup:  best,
      worstSetup: worst,
      setupStats: setupStats
    };
  }

  /* ════════════════════════════════════════════════════════════
     AI COACH CONTEXT
  ════════════════════════════════════════════════════════════ */

  function getMathContext(trades, accountBalance){
    var s = getMathStats(trades, accountBalance);
    if(s.total === 0){
      return '\n=== TRADING MATH ENGINE ===\nNo trades to analyze yet.';
    }

    var lines = [
      '',
      '=== TRADING MATH ENGINE ===',
      'Expectancy per trade: $' + s.expectancy + ' (positive = profitable system)',
      'Actual win rate: ' + s.winRate + '%  vs  break-even WR needed: ' + s.breakEvenWR + '%  →  edge: ' + (s.edge >= 0 ? '+' : '') + s.edge + ' pts',
      'Avg R:R: 1:' + s.avgRR + '  ·  Avg win: $' + s.avgWin + '  ·  Avg loss: $' + s.avgLoss,
      'Max drawdown: $' + s.maxDD + ' (-' + s.maxDDPct + '% from peak)'
    ];

    if(accountBalance > 0){
      lines.push('Avg return per trade: ' + s.avgReturnPct + '% of starting capital ($' + accountBalance + ')');
      var monthly = s.avgReturnPct * Math.min(60, s.total / Math.max(1, monthsSpanning(trades))) ;
      // Skip projection if we can't compute meaningful months
    }

    if(s.bestSetup){
      lines.push('Best setup: ' + s.bestSetup.name + ' — ' + s.bestSetup.count + ' trades · ' +
                 s.bestSetup.winRate + '% WR · expectancy $' + s.bestSetup.expectancy + '/trade');
    }
    if(s.worstSetup && s.worstSetup.name !== (s.bestSetup && s.bestSetup.name)){
      lines.push('Worst setup: ' + s.worstSetup.name + ' — ' + s.worstSetup.count + ' trades · ' +
                 s.worstSetup.winRate + '% WR · expectancy $' + s.worstSetup.expectancy + '/trade');
    }

    /* Verdict */
    if(s.expectancy > 0 && s.edge > 0){
      lines.push('VERDICT: System is mathematically profitable. Stick to the process.');
    } else if(s.expectancy > 0 && s.edge <= 0){
      lines.push('VERDICT: Positive expectancy but win rate below break-even — vulnerable to variance.');
    } else if(s.expectancy <= 0){
      lines.push('VERDICT: Negative expectancy — current system loses money over time. Improve R:R or win rate before scaling.');
    }
    lines.push('=== END MATH ENGINE ===');
    return lines.join('\n');
  }

  function monthsSpanning(trades){
    if(!trades || trades.length < 2) return 1;
    var dates = trades.map(function(t){ return new Date(t.date).getTime(); }).filter(function(v){ return !isNaN(v); });
    if(dates.length < 2) return 1;
    var span = (Math.max.apply(null, dates) - Math.min.apply(null, dates)) / (1000*60*60*24*30);
    return Math.max(1, span);
  }

  /* ════════════════════════════════════════════════════════════
     EXPORT
  ════════════════════════════════════════════════════════════ */
  global.TxMath = {
    // primitives
    riskPerTrade:      riskPerTrade,
    positionSize:      positionSize,
    riskRewardRatio:   riskRewardRatio,
    breakEvenWinRate:  breakEvenWinRate,
    expectancy:        expectancy,
    drawdownPct:       drawdownPct,
    compoundProjection: compoundProjection,
    avgReturnPerSetup: avgReturnPerSetup,
    // assessment
    assessTrade:       assessTrade,
    // aggregates
    getMathStats:      getMathStats,
    getMathContext:    getMathContext
  };

})(window);
