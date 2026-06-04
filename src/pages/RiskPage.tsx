import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Trade, Settings } from '../types';
import { buildEquityCurve, computeDrawdowns, findDrawdownPeriods } from '../analytics';

interface Props {
  trades: Trade[];
  settings: Settings;
}

export default function RiskPage({ trades, settings }: Props) {
  const curve = useMemo(() => buildEquityCurve(trades, settings.startingBalance), [trades, settings]);
  const drawdowns = useMemo(() => computeDrawdowns(curve), [curve]);
  const periods = useMemo(() => findDrawdownPeriods(curve), [curve]);

  const maxDDPct = drawdowns.length ? Math.min(...drawdowns.map(d => d.drawdownPct)) : 0;
  const maxDD$ = drawdowns.length ? Math.min(...drawdowns.map(d => d.drawdown$)) : 0;
  const avgDDPct = periods.length ? periods.reduce((s, p) => s + p.maxDrawdownPct, 0) / periods.length : 0;
  const avgDDLength = periods.length ? periods.reduce((s, p) => s + p.length, 0) / periods.length : 0;
  const worst5 = periods.slice(0, 5);

  if (!trades.length) {
    return <div className="p-6 text-center text-text-secondary mt-20">No trades to analyze.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Risk</h2>

      {/* Drawdown Comparison */}
      <div className="bg-bg-secondary rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-1">Drawdown Comparison</h3>
        <p className="text-xs text-text-secondary mb-4">Percentage decline from peak equity values, helping assess risk and recovery patterns.</p>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={drawdowns}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3347" />
            <XAxis dataKey="date" tick={{ fill: '#8b90a5', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b90a5', fontSize: 10 }} tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={{ background: '#1a1d27', border: '1px solid #2e3347', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e1e4ed' }}
              formatter={(v: unknown) => [`${Number(v).toFixed(2)}%`, 'Drawdown']}
            />
            <Area type="monotone" dataKey="drawdownPct" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Underwater Plot */}
      <div className="bg-bg-secondary rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-1">Underwater Plot</h3>
        <p className="text-xs text-text-secondary mb-4">Equity drawdowns below the high-water mark in dollar terms, highlighting recovery periods and depth.</p>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={drawdowns}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3347" />
            <XAxis dataKey="date" tick={{ fill: '#8b90a5', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b90a5', fontSize: 10 }} tickFormatter={v => `$${v.toLocaleString()}`} />
            <Tooltip
              contentStyle={{ background: '#1a1d27', border: '1px solid #2e3347', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e1e4ed' }}
              formatter={(v: unknown) => [`$${Number(v).toFixed(2)}`, 'Drawdown']}
            />
            <Area type="monotone" dataKey="drawdown$" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Metrics */}
      <div className="bg-bg-secondary rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-4">Risk Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-text-secondary mb-1">Max Drawdown ($)</p>
            <p className="text-xl font-bold font-mono text-red">${maxDD$.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Max Drawdown (%)</p>
            <p className="text-xl font-bold font-mono text-red">{maxDDPct.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Avg Drawdown (%)</p>
            <p className="text-xl font-bold font-mono text-yellow">{avgDDPct.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Avg Drawdown Length</p>
            <p className="text-xl font-bold font-mono text-text-primary">{avgDDLength.toFixed(1)} days</p>
          </div>
        </div>
      </div>

      {/* Worst 5 Drawdowns */}
      <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
        <h3 className="text-sm font-semibold px-4 py-3 border-b border-border">Worst 5 Drawdowns</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-bg-tertiary text-text-secondary">
                {['#', 'Start', 'End', 'Recovery', 'Max DD %', 'Max DD $', 'Length', 'Recovered'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {worst5.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-text-secondary">No drawdowns recorded.</td></tr>
              ) : (
                worst5.map((dd, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2 text-text-secondary">{i + 1}</td>
                    <td className="px-3 py-2">{dd.start}</td>
                    <td className="px-3 py-2">{dd.end}</td>
                    <td className="px-3 py-2">{dd.recovery}</td>
                    <td className="px-3 py-2 font-mono text-red">{dd.maxDrawdownPct.toFixed(2)}%</td>
                    <td className="px-3 py-2 font-mono text-red">${dd.maxDrawdown$.toFixed(2)}</td>
                    <td className="px-3 py-2">{dd.length} days</td>
                    <td className="px-3 py-2">
                      <span className={dd.recovered ? 'text-green' : 'text-yellow'}>{dd.recovered ? 'Yes' : 'No'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
