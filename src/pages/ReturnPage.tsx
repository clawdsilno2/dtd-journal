import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Trade, Settings } from '../types';
import { buildEquityCurve, computeRollingReturns } from '../analytics';

interface Props {
  trades: Trade[];
  settings: Settings;
}

export default function ReturnPage({ trades, settings }: Props) {
  const curve = useMemo(() => buildEquityCurve(trades, settings.startingBalance), [trades, settings]);
  const rollingReturns = useMemo(() => computeRollingReturns(curve), [curve]);

  // Cumulative return % series
  const cumulativeData = useMemo(() => {
    return curve.slice(1).map(p => ({
      date: p.date,
      return: +p.returnPct.toFixed(2),
    }));
  }, [curve]);

  // S&P 500 benchmark: ~10.5% annualized, simple daily compound
  const benchmarkData = useMemo(() => {
    if (curve.length < 2) return [];
    const dailyRate = Math.pow(1.105, 1 / 252) - 1; // ~10.5% annual
    return curve.slice(1).map((p, i) => ({
      date: p.date,
      strategy: +p.returnPct.toFixed(2),
      sp500: +((Math.pow(1 + dailyRate, i + 1) - 1) * 100).toFixed(2),
    }));
  }, [curve]);

  if (!trades.length) {
    return <div className="p-6 text-center text-text-secondary mt-20">No trades to analyze.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Return</h2>

      {/* Cumulative Equity Returns */}
      <div className="bg-bg-secondary rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-1">Cumulative Equity Returns</h3>
        <p className="text-xs text-text-secondary mb-4">Growth of the portfolio over time, accounting for all gains and losses.</p>
        {(() => {
          const vals = cumulativeData.map(d => d.return);
          const minV = Math.min(...vals, 0);
          const maxV = Math.max(...vals, 0);
          const margin = 3;
          return (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3347" />
                <XAxis dataKey="date" tick={{ fill: '#8b90a5', fontSize: 10 }} />
                <YAxis domain={[Math.floor(minV - margin), Math.ceil(maxV + margin)]} tick={{ fill: '#8b90a5', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: '#1a1d27', border: '1px solid #2e3347', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e1e4ed' }}
                  formatter={(v: unknown) => [`${Number(v).toFixed(2)}%`, 'Return']}
                />
                <Line type="monotone" dataKey="return" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      {/* Rolling Returns */}
      <div className="bg-bg-secondary rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-1">Rolling Returns</h3>
        <p className="text-xs text-text-secondary mb-4">Performance over the last day, week, and month to track short-term gains and identify return patterns.</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={rollingReturns}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3347" />
            <XAxis dataKey="date" tick={{ fill: '#8b90a5', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b90a5', fontSize: 10 }} tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={{ background: '#1a1d27', border: '1px solid #2e3347', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e1e4ed' }}
              formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(3)}%`, String(name)]}
            />
            <Legend />
            <Line type="monotone" dataKey="daily" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Daily" />
            <Line type="monotone" dataKey="weekly" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Weekly" />
            <Line type="monotone" dataKey="monthly" stroke="#eab308" strokeWidth={1.5} dot={false} name="Monthly" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Return vs Benchmark */}
      <div className="bg-bg-secondary rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-1">Return vs Benchmark (S&P 500)</h3>
        <p className="text-xs text-text-secondary mb-4">Compares cumulative returns against the S&P 500 (~10.5% annualized), showing relative performance over time.</p>
        {(() => {
          const allVals = benchmarkData.flatMap(d => [d.strategy, d.sp500]);
          const minV = Math.min(...allVals, 0);
          const maxV = Math.max(...allVals, 0);
          const margin = 3;
          return (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={benchmarkData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3347" />
                <XAxis dataKey="date" tick={{ fill: '#8b90a5', fontSize: 10 }} />
                <YAxis domain={[Math.floor(minV - margin), Math.ceil(maxV + margin)]} tick={{ fill: '#8b90a5', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: '#1a1d27', border: '1px solid #2e3347', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e1e4ed' }}
                  formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(2)}%`, String(name)]}
                />
                <Legend />
                <Line type="monotone" dataKey="strategy" stroke="#6366f1" strokeWidth={2} dot={false} name="Strategy" />
                <Line type="monotone" dataKey="sp500" stroke="#8b90a5" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="S&P 500" />
              </LineChart>
            </ResponsiveContainer>
          );
        })()}
      </div>
    </div>
  );
}
