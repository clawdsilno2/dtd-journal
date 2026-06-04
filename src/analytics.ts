import type { Trade, Settings } from './types';
import { getNetResult } from './types';

export interface EquityPoint {
  date: string;
  equity: number;
  balance: number;
  returnPct: number; // cumulative % return from start
}

export interface DrawdownPoint {
  date: string;
  drawdownPct: number; // negative number
  drawdown$: number;
}

export interface DrawdownPeriod {
  start: string;
  end: string;
  recovery: string;
  maxDrawdownPct: number;
  maxDrawdown$: number;
  length: number; // trading days
  recovered: boolean;
}

export interface RollingReturn {
  date: string;
  daily: number;
  weekly: number;
  monthly: number;
}

// Build equity curve from trades sorted by date
export function buildEquityCurve(trades: Trade[], startingBalance: number): EquityPoint[] {
  if (!trades.length || !startingBalance) return [];

  const sorted = [...trades].filter(t => t.date).sort((a, b) => a.date.localeCompare(b.date));

  // Group trades by date
  const dailyPnL: Record<string, number> = {};
  for (const t of sorted) {
    dailyPnL[t.date] = (dailyPnL[t.date] || 0) + getNetResult(t);
  }

  const points: EquityPoint[] = [];
  let equity = startingBalance;

  // Add starting point
  const dates = Object.keys(dailyPnL).sort();
  if (dates.length === 0) return [];

  // Starting point (day before first trade)
  points.push({ date: 'Start', equity: startingBalance, balance: startingBalance, returnPct: 0 });

  for (const date of dates) {
    equity += dailyPnL[date];
    points.push({
      date,
      equity,
      balance: equity, // for this journal they're the same since no open positions
      returnPct: ((equity - startingBalance) / startingBalance) * 100,
    });
  }

  return points;
}

// Compute drawdown series from equity curve
export function computeDrawdowns(curve: EquityPoint[]): DrawdownPoint[] {
  if (curve.length < 2) return [];

  const points: DrawdownPoint[] = [];
  let peak = curve[0].equity;

  for (let i = 1; i < curve.length; i++) {
    const p = curve[i];
    if (p.equity > peak) peak = p.equity;
    const dd$ = p.equity - peak;
    const ddPct = peak > 0 ? (dd$ / peak) * 100 : 0;
    points.push({ date: p.date, drawdownPct: ddPct, drawdown$: dd$ });
  }

  return points;
}

// Find discrete drawdown periods
export function findDrawdownPeriods(curve: EquityPoint[]): DrawdownPeriod[] {
  if (curve.length < 2) return [];

  const periods: DrawdownPeriod[] = [];
  let peak = curve[0].equity;
  let peakDate = curve[0].date;
  let inDrawdown = false;
  let currentStart = '';
  let currentMaxPct = 0;
  let currentMax$ = 0;
  let currentLength = 0;

  for (let i = 1; i < curve.length; i++) {
    const p = curve[i];
    if (p.equity >= peak) {
      // New peak or recovery
      if (inDrawdown) {
        periods.push({
          start: currentStart,
          end: curve[i - 1].date,
          recovery: p.date,
          maxDrawdownPct: currentMaxPct,
          maxDrawdown$: currentMax$,
          length: currentLength,
          recovered: true,
        });
        inDrawdown = false;
      }
      peak = p.equity;
      peakDate = p.date;
    } else {
      const dd$ = p.equity - peak;
      const ddPct = peak > 0 ? (dd$ / peak) * 100 : 0;
      if (!inDrawdown) {
        inDrawdown = true;
        currentStart = peakDate;
        currentMaxPct = ddPct;
        currentMax$ = dd$;
        currentLength = 1;
      } else {
        if (ddPct < currentMaxPct) {
          currentMaxPct = ddPct;
          currentMax$ = dd$;
        }
        currentLength++;
      }
    }
  }

  // If still in drawdown at end
  if (inDrawdown) {
    const last = curve[curve.length - 1];
    periods.push({
      start: currentStart,
      end: last.date,
      recovery: '--',
      maxDrawdownPct: currentMaxPct,
      maxDrawdown$: currentMax$,
      length: currentLength,
      recovered: false,
    });
  }

  return periods.sort((a, b) => a.maxDrawdownPct - b.maxDrawdownPct);
}

// Rolling returns
export function computeRollingReturns(curve: EquityPoint[]): RollingReturn[] {
  if (curve.length < 2) return [];

  const results: RollingReturn[] = [];

  for (let i = 1; i < curve.length; i++) {
    const current = curve[i].equity;

    // Daily: vs previous point
    const prev = curve[i - 1].equity;
    const daily = prev > 0 ? ((current - prev) / prev) * 100 : 0;

    // Weekly: vs 5 trading days ago
    const w = Math.max(0, i - 5);
    const weekAgo = curve[w].equity;
    const weekly = weekAgo > 0 ? ((current - weekAgo) / weekAgo) * 100 : 0;

    // Monthly: vs 21 trading days ago
    const m = Math.max(0, i - 21);
    const monthAgo = curve[m].equity;
    const monthly = monthAgo > 0 ? ((current - monthAgo) / monthAgo) * 100 : 0;

    results.push({ date: curve[i].date, daily, weekly, monthly });
  }

  return results;
}

// Overall stats
export function computeOverallStats(trades: Trade[], settings: Settings, curve: EquityPoint[]) {
  if (!trades.length || !curve.length) return null;

  const startBal = settings.startingBalance;
  const currentEquity = curve[curve.length - 1].equity;
  const totalReturn = startBal > 0 ? ((currentEquity - startBal) / startBal) * 100 : 0;
  const totalProfit = currentEquity - startBal;

  // YTD return
  const currentYear = new Date().getFullYear().toString();
  const ytdTrades = trades.filter(t => t.date?.startsWith(currentYear));
  const ytdPnL = ytdTrades.reduce((s, t) => s + getNetResult(t), 0);
  const ytdReturn = startBal > 0 ? (ytdPnL / startBal) * 100 : 0;

  // Max drawdown
  const dds = computeDrawdowns(curve);
  const maxDDPct = dds.length ? Math.min(...dds.map(d => d.drawdownPct)) : 0;
  const maxDD$ = dds.length ? Math.min(...dds.map(d => d.drawdown$)) : 0;

  // Drawdown periods for avg stats
  const periods = findDrawdownPeriods(curve);
  const avgDDPct = periods.length ? periods.reduce((s, p) => s + p.maxDrawdownPct, 0) / periods.length : 0;
  const avgDDLength = periods.length ? periods.reduce((s, p) => s + p.length, 0) / periods.length : 0;

  // Winrate
  const wins = trades.filter(t => t.winLoss === 'W').length;
  const winrate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  // Sharpe ratio (simplified: mean daily return / std dev of daily returns)
  const dailyReturns: number[] = [];
  for (let i = 1; i < curve.length; i++) {
    const prev = curve[i - 1].equity;
    if (prev > 0) dailyReturns.push((curve[i].equity - prev) / prev);
  }
  const meanReturn = dailyReturns.length ? dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length : 0;
  const variance = dailyReturns.length > 1
    ? dailyReturns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) / (dailyReturns.length - 1)
    : 0;
  const stdDev = Math.sqrt(variance);
  const annualizedSharpe = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

  // Avg monthly return
  const monthlyReturns: Record<string, number> = {};
  for (const t of trades) {
    if (!t.date) continue;
    const m = t.date.slice(0, 7);
    monthlyReturns[m] = (monthlyReturns[m] || 0) + getNetResult(t);
  }
  const monthVals = Object.values(monthlyReturns);
  const avgMonthlyReturn = monthVals.length && startBal > 0
    ? (monthVals.reduce((s, v) => s + v, 0) / monthVals.length / startBal) * 100
    : 0;

  return {
    totalReturn,
    totalProfit,
    ytdReturn,
    currentEquity,
    balance: currentEquity,
    startingBalance: startBal,
    maxDDPct,
    maxDD$,
    avgDDPct,
    avgDDLength,
    winrate,
    sharpe: annualizedSharpe,
    avgMonthlyReturn,
    totalTrades: trades.length,
    worstDrawdowns: periods.slice(0, 5),
  };
}
