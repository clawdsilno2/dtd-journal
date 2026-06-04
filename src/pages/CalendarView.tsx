import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Trade } from '../types';
import { getNetRR } from '../types';

interface Props {
  trades: Trade[];
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarView({ trades }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const dailyR = useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach(t => {
      if (!t.date) return;
      map[t.date] = (map[t.date] || 0) + getNetRR(t);
    });
    return map;
  }, [trades]);

  const { firstDay, daysInMonth } = getMonthDays(year, month);

  const monthTotal = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return Object.entries(dailyR)
      .filter(([d]) => d.startsWith(prefix))
      .reduce((s, [, v]) => s + v, 0);
  }, [dailyR, year, month]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Calendar</h2>

      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"><ChevronLeft size={20} /></button>
        <div className="text-center">
          <h3 className="text-lg font-semibold">{MONTH_NAMES[month]} {year}</h3>
          <p className={`text-sm font-mono ${monthTotal >= 0 ? 'text-green' : 'text-red'}`}>
            Month Total: {monthTotal.toFixed(2)}R
          </p>
        </div>
        <button onClick={next} className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"><ChevronRight size={20} /></button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-xs text-text-secondary text-center py-2 font-medium">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const r = dailyR[dateStr];
          const hasData = r !== undefined;
          return (
            <div
              key={dateStr}
              className={`rounded-lg border p-2 min-h-[70px] text-xs ${
                hasData
                  ? r > 0
                    ? 'border-green/30 bg-green/5'
                    : r < 0
                      ? 'border-red/30 bg-red/5'
                      : 'border-yellow/30 bg-yellow/5'
                  : 'border-border bg-bg-secondary'
              }`}
            >
              <div className="text-text-secondary">{day}</div>
              {hasData && (
                <div className={`font-mono font-bold mt-1 text-sm ${r > 0 ? 'text-green' : r < 0 ? 'text-red' : 'text-yellow'}`}>
                  {r > 0 ? '+' : ''}{r.toFixed(2)}R
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Yearly overview */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold mb-4">Yearly Overview — {year}</h3>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {MONTH_NAMES.map((name, m) => {
            const prefix = `${year}-${String(m + 1).padStart(2, '0')}`;
            const total = Object.entries(dailyR)
              .filter(([d]) => d.startsWith(prefix))
              .reduce((s, [, v]) => s + v, 0);
            const count = trades.filter(t => t.date?.startsWith(prefix)).length;
            return (
              <div
                key={name}
                onClick={() => setMonth(m)}
                className={`bg-bg-secondary rounded-lg border border-border p-3 cursor-pointer hover:border-accent/50 transition-colors ${m === month ? 'border-accent' : ''}`}
              >
                <p className="text-xs text-text-secondary">{name.slice(0, 3)}</p>
                <p className={`text-sm font-mono font-bold ${total > 0 ? 'text-green' : total < 0 ? 'text-red' : 'text-text-secondary'}`}>
                  {total.toFixed(2)}R
                </p>
                <p className="text-xs text-text-secondary">{count} trades</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
