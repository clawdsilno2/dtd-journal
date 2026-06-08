import { useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import type { Trade, Settings } from '../types';
import { ACCOUNT_LABELS, getNetResult, getNetRR, getSession } from '../types';
import { buildEquityCurve, computeOverallStats } from '../analytics';

interface Props {
  trades: Trade[];
  settings: Settings;
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-bg-secondary rounded-lg border border-border p-3 overflow-hidden">
      <p className="text-[10px] text-text-secondary mb-1 truncate">{label}</p>
      <p className={`text-sm font-bold font-mono truncate ${color || ''}`}>{value}</p>
      {sub && <p className="text-[10px] text-text-secondary mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

type BreakdownRow = { label: string; indent?: boolean; trades: number; wins: number; be: number; losses: number; totalR: number; winPct: number; avgWinR: number; avgLossR: number };

function BreakdownTable({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  return (
    <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
      <h3 className="text-sm font-semibold px-4 py-3 border-b border-border">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-bg-tertiary text-text-secondary">
              {['', 'Trades', 'Wins', 'BE', 'Losses', 'Total R', '%Win', 'Avg W', 'Avg L'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.label}-${i}`} className={`border-t border-border ${r.indent ? 'bg-bg-primary/30' : ''}`}>
                <td className={`px-3 py-2 font-medium ${r.indent ? 'pl-6 text-text-secondary' : ''}`}>{r.label}</td>
                <td className="px-3 py-2">{r.trades}</td>
                <td className="px-3 py-2 text-green">{r.wins}</td>
                <td className="px-3 py-2 text-yellow">{r.be}</td>
                <td className="px-3 py-2 text-red">{r.losses}</td>
                <td className={`px-3 py-2 font-mono ${r.totalR >= 0 ? 'text-green' : 'text-red'}`}>{r.totalR.toFixed(2)}R</td>
                <td className="px-3 py-2">{r.winPct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-green font-mono">{r.avgWinR.toFixed(2)}R</td>
                <td className="px-3 py-2 text-red font-mono">{r.avgLossR.toFixed(2)}R</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function computeRow(group: Trade[]): Omit<BreakdownRow, 'label' | 'indent'> {
  const wins = group.filter(t => t.winLoss === 'W').length;
  const be = group.filter(t => t.winLoss === 'BE').length;
  const losses = group.filter(t => t.winLoss === 'L').length;
  const totalR = group.reduce((sum, t) => sum + getNetRR(t), 0);
  const winTrades = group.filter(t => t.winLoss === 'W');
  const lossTrades = group.filter(t => t.winLoss === 'L');
  const avgWinR = winTrades.length ? winTrades.reduce((s, t) => s + getNetRR(t), 0) / winTrades.length : 0;
  const avgLossR = lossTrades.length ? lossTrades.reduce((s, t) => s + getNetRR(t), 0) / lossTrades.length : 0;
  return {
    trades: group.length, wins, be, losses, totalR,
    winPct: group.length ? (wins / group.length) * 100 : 0,
    avgWinR, avgLossR,
  };
}

function computeBreakdown(trades: Trade[], groupBy: (t: Trade) => string) {
  const groups: Record<string, Trade[]> = {};
  trades.forEach(t => {
    const key = groupBy(t);
    if (!key) return;
    (groups[key] ??= []).push(t);
  });
  return Object.entries(groups).map(([label, group]) => ({
    label, ...computeRow(group),
  }));
}

function computePairBreakdownWithBuySell(trades: Trade[], pairs: string[]): BreakdownRow[] {
  const rows: BreakdownRow[] = [];
  // Total row
  const allWithPair = trades.filter(t => t.pair);
  rows.push({ label: 'TOTAL', ...computeRow(allWithPair) });

  for (const pair of pairs) {
    const pairTrades = trades.filter(t => t.pair === pair);
    if (pairTrades.length === 0) continue;
    rows.push({ label: pair, ...computeRow(pairTrades) });
    const buys = pairTrades.filter(t => t.buySell === 'Buy');
    const sells = pairTrades.filter(t => t.buySell === 'Sell');
    if (buys.length > 0) rows.push({ label: 'Buy', indent: true, ...computeRow(buys) });
    if (sells.length > 0) rows.push({ label: 'Sell', indent: true, ...computeRow(sells) });
  }
  return rows;
}

// CPG: compound periodic growth rate
// Equivalent to Excel's RATE(nper, 0, -pv, fv)
// Solves: pv * (1 + rate)^nper = fv
function computeCPG(startBalance: number, endBalance: number, periods: number): number {
  if (periods <= 0 || startBalance <= 0 || endBalance <= startBalance) return 0;
  return Math.pow(endBalance / startBalance, 1 / periods) - 1;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const QUARTER_MONTHS = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]];

export default function Dashboard({ trades: allTrades, settings }: Props) {
  const [accountFilter, setAccountFilter] = useState<string>('ALL');

  const trades = useMemo(() => {
    if (accountFilter === 'ALL') return allTrades;
    return allTrades.filter(t => (t.labels || []).includes(accountFilter as never));
  }, [allTrades, accountFilter]);

  const stats = useMemo(() => {
    if (!trades.length) return null;

    const totalR = trades.reduce((s, t) => s + getNetRR(t), 0);
    const wins = trades.filter(t => t.winLoss === 'W').length;
    const losses = trades.filter(t => t.winLoss === 'L').length;
    const be = trades.filter(t => t.winLoss === 'BE').length;
    const totalNet = trades.reduce((s, t) => s + getNetResult(t), 0);
    const avgPerTrade = totalR / trades.length;
    const winPct = (wins / trades.length) * 100;
    const lossPct = 100 - winPct;

    // Winnings & commissions/swaps
    const totalWinnings = trades.reduce((s, t) => s + t.result, 0);
    const totalCommSwap = trades.reduce((s, t) => s + t.commissions + t.swaps, 0);

    const balance = settings.startingBalance + totalNet;

    // Best/worst with trade # reference
    let bestTrade = trades[0];
    let worstTrade = trades[0];
    for (const t of trades) {
      if (getNetRR(t) > getNetRR(bestTrade)) bestTrade = t;
      if (getNetRR(t) < getNetRR(worstTrade)) worstTrade = t;
    }

    // Consistency: 1 - (max single trade net result / total positive net results)
    const positiveResults = trades.filter(t => getNetResult(t) > 0);
    const totalPositive = positiveResults.reduce((s, t) => s + getNetResult(t), 0);
    const maxSingle = positiveResults.length ? Math.max(...positiveResults.map(t => getNetResult(t))) : 0;
    const consistency = totalPositive > 0 ? 1 - (maxSingle / totalPositive) : 0;

    // CPG calculations
    const dates = trades.map(t => t.date).filter(Boolean).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    let tradingDays = 0;
    if (firstDate && lastDate) {
      const uniqueDays = new Set(trades.map(t => t.date));
      tradingDays = uniqueDays.size;
    }
    const tradingWeeks = Math.max(1, tradingDays / 5);
    const tradingMonths = Math.max(1, tradingDays / 21);

    const dailyCPG = computeCPG(settings.startingBalance, balance, tradingDays);
    const weeklyCPG = computeCPG(settings.startingBalance, balance, tradingWeeks);
    const monthlyCPG = computeCPG(settings.startingBalance, balance, tradingMonths);

    // Monthly PnL
    const monthlyPnL: Record<string, number> = {};
    trades.forEach(t => {
      const key = t.date.slice(0, 7);
      monthlyPnL[key] = (monthlyPnL[key] || 0) + getNetRR(t);
    });
    const monthlyData = Object.entries(monthlyPnL)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, r]) => ({ month, r: +r.toFixed(2) }));

    // Yearly PnL
    const yearlyPnL: Record<string, number> = {};
    trades.forEach(t => {
      const year = t.date.slice(0, 4);
      yearlyPnL[year] = (yearlyPnL[year] || 0) + getNetRR(t);
    });
    const yearlyData = Object.entries(yearlyPnL).sort(([a], [b]) => a.localeCompare(b));

    // Quarterly PnL (for current/each year)
    const quarterlyPnL: Record<string, { label: string; r: number }[]> = {};
    trades.forEach(t => {
      const year = t.date.slice(0, 4);
      const month = parseInt(t.date.slice(5, 7));
      const qi = QUARTER_MONTHS.findIndex(ms => ms.includes(month));
      if (qi === -1) return;
      if (!quarterlyPnL[year]) quarterlyPnL[year] = QUARTERS.map(q => ({ label: q, r: 0 }));
      quarterlyPnL[year][qi].r += getNetRR(t);
    });

    return {
      totalR, wins, losses, be, totalNet, avgPerTrade, winPct, lossPct,
      totalWinnings, totalCommSwap, balance,
      bestTrade, worstTrade, consistency,
      dailyCPG, weeklyCPG, monthlyCPG,
      monthlyData, yearlyData, quarterlyPnL,
    };
  }, [trades, settings]);

  const dayBreakdown = useMemo(() => {
    const getDay = (t: Trade) => {
      if (!t.date) return '';
      const d = new Date(t.date + 'T12:00:00');
      return DAYS[d.getDay() - 1] || '';
    };
    const rows = computeBreakdown(trades, getDay);
    return DAYS.map(d => rows.find(r => r.label === d) || { label: d, trades: 0, wins: 0, be: 0, losses: 0, totalR: 0, winPct: 0, avgWinR: 0, avgLossR: 0 });
  }, [trades]);

  const sessionBreakdown = useMemo(() => {
    return computeBreakdown(trades, t => getSession(t.entryTime, settings.sessions));
  }, [trades, settings]);

  const pairBreakdown = useMemo(() => {
    return computePairBreakdownWithBuySell(trades, settings.pairs);
  }, [trades, settings]);

  const strategyBreakdown = useMemo(() => {
    return computeBreakdown(trades, t => t.entryType);
  }, [trades]);

  const equityCurve = useMemo(() => buildEquityCurve(trades, settings.startingBalance), [trades, settings]);
  const overallStats = useMemo(() => computeOverallStats(trades, settings, equityCurve), [trades, settings, equityCurve]);

  if (!stats) {
    return (
      <div className="p-6 text-center text-text-secondary mt-20">
        No trades to analyze. Add trades from the Trades page.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <h2 className="text-xl font-bold">Overview</h2>
        <div className="flex flex-wrap gap-1.5">
          {['ALL', ...ACCOUNT_LABELS].map(label => (
            <button
              key={label}
              onClick={() => setAccountFilter(label)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                accountFilter === label
                  ? 'bg-accent/20 border-accent text-accent-hover'
                  : 'bg-bg-tertiary border-border text-text-secondary hover:border-accent/40'
              }`}
            >
              {label === 'ALL' ? 'All Accounts' : label}
            </button>
          ))}
        </div>
      </div>

      {/* Equity Curve + Overall Return */}
      {overallStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-bg-secondary rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold mb-4">Account Performance</h3>
            {(() => {
              const data = equityCurve.slice(1);
              const returns = data.map(p => p.returnPct);
              const minR = Math.min(...returns, 0);
              const maxR = Math.max(...returns, 0);
              const margin = 3;
              const yMin = Math.floor(minR - margin);
              const yMax = Math.ceil(maxR + margin);
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e3347" />
                    <XAxis dataKey="date" tick={{ fill: '#8b90a5', fontSize: 10 }} />
                    <YAxis domain={[yMin, yMax]} tick={{ fill: '#8b90a5', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: '#1a1d27', border: '1px solid #2e3347', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#e1e4ed' }}
                      formatter={(v: unknown) => [`${Number(v).toFixed(2)}%`, '']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="returnPct" stroke="#6366f1" strokeWidth={2} dot={false} name="Return %" />
                  </LineChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
          <div className="bg-bg-secondary rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold mb-1">Overall Return</h3>
            <p className={`text-2xl font-bold font-mono mb-4 ${overallStats.totalReturn >= 0 ? 'text-green' : 'text-red'}`}>
              {overallStats.totalReturn >= 0 ? '+' : ''}{overallStats.totalReturn.toFixed(2)}%
            </p>
            <div className="space-y-2.5 text-xs">
              {[
                ['YTD Return', `${overallStats.ytdReturn >= 0 ? '+' : ''}${overallStats.ytdReturn.toFixed(2)}%`, overallStats.ytdReturn >= 0 ? 'text-green' : 'text-red'],
                ['Max Drawdown', `${overallStats.maxDDPct.toFixed(2)}%`, 'text-red'],
                ['Balance', `$${overallStats.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, ''],
                ['Equity', `(${overallStats.totalReturn >= 0 ? '+' : ''}${overallStats.totalReturn.toFixed(2)}%) $${overallStats.currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, ''],
                ['All-time Winrate', `${overallStats.winrate.toFixed(1)}%`, ''],
                ['All-time Sharpe', overallStats.sharpe.toFixed(2), ''],
                ['Avg. Monthly Return', `${overallStats.avgMonthlyReturn >= 0 ? '+' : ''}${overallStats.avgMonthlyReturn.toFixed(2)}%`, overallStats.avgMonthlyReturn >= 0 ? 'text-green' : 'text-red'],
                ['Total Profit', `$${overallStats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, overallStats.totalProfit >= 0 ? 'text-green' : 'text-red'],
              ].map(([label, value, color]) => (
                <div key={label} className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-text-secondary">{label}</span>
                  <span className={`font-mono ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Account Details */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary mb-3">ACCOUNT DETAILS</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard label="Gain (R)" value={`${stats.totalR.toFixed(2)}R`} color={stats.totalR >= 0 ? 'text-green' : 'text-red'} />
          <StatCard label="Avg / Trade" value={`${stats.avgPerTrade.toFixed(2)}R`} color={stats.avgPerTrade >= 0 ? 'text-green' : 'text-red'} />
          <StatCard label="Daily CPG" value={`${(stats.dailyCPG * 100).toFixed(3)}%`} color={stats.dailyCPG >= 0 ? 'text-green' : 'text-red'} />
          <StatCard label="Weekly CPG" value={`${(stats.weeklyCPG * 100).toFixed(3)}%`} color={stats.weeklyCPG >= 0 ? 'text-green' : 'text-red'} />
          <StatCard label="Monthly CPG" value={`${(stats.monthlyCPG * 100).toFixed(2)}%`} color={stats.monthlyCPG >= 0 ? 'text-green' : 'text-red'} />
          <StatCard label="Starting Balance" value={`$${settings.startingBalance.toLocaleString()}`} />
          <StatCard label="Winnings" value={`$${stats.totalWinnings.toFixed(2)}`} color={stats.totalWinnings >= 0 ? 'text-green' : 'text-red'} />
          <StatCard label="Commissions/Swap" value={`$${stats.totalCommSwap.toFixed(2)}`} color="text-red" />
          <StatCard label="Balance" value={`$${stats.balance.toFixed(2)}`} color={stats.balance >= settings.startingBalance ? 'text-green' : 'text-red'} />
          <StatCard label="Highest Trade" value={`$${(getNetResult(stats.bestTrade)).toFixed(2)}`} sub={`${getNetRR(stats.bestTrade).toFixed(2)}R`} color="text-green" />
          <StatCard label="Lowest Trade" value={`$${(getNetResult(stats.worstTrade)).toFixed(2)}`} sub={`${getNetRR(stats.worstTrade).toFixed(2)}R`} color="text-red" />
        </div>
      </div>

      {/* Trade Stats */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary mb-3">TRADE STATS</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard label="Wins" value={String(stats.wins)} color="text-green" />
          <StatCard label="Losses" value={String(stats.losses)} color="text-red" />
          <StatCard label="Breakeven" value={String(stats.be)} color="text-yellow" />
          <StatCard label="Profitability" value={`${stats.winPct.toFixed(1)}%`} />
          <StatCard label="Loss Rate" value={`${stats.lossPct.toFixed(1)}%`} />
          <StatCard label="Consistency" value={`${(stats.consistency * 100).toFixed(1)}%`} />
        </div>
      </div>

      {/* Hall of Fame */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary mb-3">HALL OF FAME</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-bg-secondary rounded-lg border border-border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary mb-1">Best Trade</p>
              <p className="text-lg font-bold text-green font-mono">{getNetRR(stats.bestTrade).toFixed(2)}R</p>
              <p className="text-xs text-text-secondary mt-1">
                Trade #{stats.bestTrade.tradeNumber} &middot; {stats.bestTrade.pair} &middot; {stats.bestTrade.date}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono text-green">${getNetResult(stats.bestTrade).toFixed(2)}</p>
              <p className="text-xs text-text-secondary">{stats.bestTrade.buySell} &middot; {stats.bestTrade.entryType}</p>
            </div>
          </div>
          <div className="bg-bg-secondary rounded-lg border border-border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary mb-1">Worst Loss</p>
              <p className="text-lg font-bold text-red font-mono">{getNetRR(stats.worstTrade).toFixed(2)}R</p>
              <p className="text-xs text-text-secondary mt-1">
                Trade #{stats.worstTrade.tradeNumber} &middot; {stats.worstTrade.pair} &middot; {stats.worstTrade.date}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono text-red">${getNetResult(stats.worstTrade).toFixed(2)}</p>
              <p className="text-xs text-text-secondary">{stats.worstTrade.buySell} &middot; {stats.worstTrade.entryType}</p>
            </div>
          </div>
        </div>
      </div>

      {/* PnL Section */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary mb-3">PNL</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Yearly */}
          <div className="bg-bg-secondary rounded-lg border border-border p-4">
            <h4 className="text-xs font-semibold text-text-secondary mb-3">YEARLY</h4>
            <div className="space-y-2">
              {stats.yearlyData.map(([year, r]) => (
                <div key={year} className="flex items-center justify-between">
                  <span className="text-sm">{year}</span>
                  <span className={`font-mono font-bold ${r >= 0 ? 'text-green' : 'text-red'}`}>{r.toFixed(2)}R</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quarterly */}
          <div className="bg-bg-secondary rounded-lg border border-border p-4">
            <h4 className="text-xs font-semibold text-text-secondary mb-3">QUARTERLY</h4>
            {Object.entries(stats.quarterlyPnL).sort(([a], [b]) => a.localeCompare(b)).map(([year, quarters]) => (
              <div key={year} className="mb-3 last:mb-0">
                <p className="text-xs text-text-secondary mb-1">{year}</p>
                <div className="grid grid-cols-4 gap-2">
                  {quarters.map(q => (
                    <div key={q.label} className="text-center">
                      <p className="text-xs text-text-secondary">{q.label}</p>
                      <p className={`font-mono text-sm font-bold ${q.r > 0 ? 'text-green' : q.r < 0 ? 'text-red' : 'text-text-secondary'}`}>
                        {q.r !== 0 ? `${q.r.toFixed(2)}R` : '--'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly PnL Chart */}
      <div className="bg-bg-secondary rounded-lg border border-border p-4">
        <h4 className="text-xs font-semibold text-text-secondary mb-3">MONTHLY</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3347" />
            <XAxis dataKey="month" tick={{ fill: '#8b90a5', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8b90a5', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1a1d27', border: '1px solid #2e3347', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e1e4ed' }}
            />
            <Bar dataKey="r" radius={[4, 4, 0, 0]}>
              {stats.monthlyData.map((entry, i) => (
                <Cell key={i} fill={entry.r >= 0 ? '#22c55e' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownTable title="Profitability by Day" rows={dayBreakdown} />
        <BreakdownTable title="Time of Trade (Session)" rows={sessionBreakdown} />
        <BreakdownTable title="Trade Pair (Buy/Sell Split)" rows={pairBreakdown} />
        <BreakdownTable title="Strategy (Entry Type)" rows={strategyBreakdown} />
      </div>
    </div>
  );
}
