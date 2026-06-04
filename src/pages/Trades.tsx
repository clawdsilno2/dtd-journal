import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Trade, Settings } from '../types';
import { createEmptyTrade, getWeekday, getNetResult, getNetRR } from '../types';
import TradeForm from '../components/TradeForm';

interface Props {
  trades: Trade[];
  settings: Settings;
  addTrade: (t: Trade) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
}

export default function Trades({ trades, settings, addTrade, updateTrade, deleteTrade }: Props) {
  const [editing, setEditing] = useState<string | null>(null);

  const handleAdd = () => {
    const t = createEmptyTrade(trades.length + 1);
    addTrade(t);
    setEditing(t.id);
  };

  const handleDelete = (id: string) => {
    deleteTrade(id);
    setEditing(null);
  };

  const editingTrade = trades.find(t => t.id === editing);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Trade Log</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} /> New Trade
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-tertiary text-text-secondary text-xs">
              {['#', 'Date', 'Day', 'Pair', 'W/L', 'Buy/Sell', 'Risk', 'Net Result', 'Net RR', 'Entry Type', 'Session'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-12 text-center text-text-secondary">
                  No trades yet. Click "New Trade" to get started.
                </td>
              </tr>
            ) : (
              trades.map(t => {
                const nr = getNetResult(t);
                const nrr = getNetRR(t);
                return (
                  <tr
                    key={t.id}
                    onClick={() => setEditing(t.id)}
                    className="border-t border-border hover:bg-bg-tertiary/50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2 text-text-secondary">{t.tradeNumber}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{t.date}</td>
                    <td className="px-3 py-2 text-text-secondary">{getWeekday(t.date).slice(0, 3)}</td>
                    <td className="px-3 py-2 font-medium">{t.pair}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        t.winLoss === 'Win' ? 'bg-green/20 text-green' :
                        t.winLoss === 'Loss' ? 'bg-red/20 text-red' :
                        t.winLoss === 'BE' ? 'bg-yellow/20 text-yellow' :
                        'text-text-secondary'
                      }`}>
                        {t.winLoss || '--'}
                      </span>
                    </td>
                    <td className="px-3 py-2">{t.buySell || '--'}</td>
                    <td className="px-3 py-2 font-mono">${t.risk.toFixed(2)}</td>
                    <td className={`px-3 py-2 font-mono ${nr > 0 ? 'text-green' : nr < 0 ? 'text-red' : ''}`}>
                      ${nr.toFixed(2)}
                    </td>
                    <td className={`px-3 py-2 font-mono ${nrr > 0 ? 'text-green' : nrr < 0 ? 'text-red' : ''}`}>
                      {nrr.toFixed(2)}R
                    </td>
                    <td className="px-3 py-2">{t.entryType || '--'}</td>
                    <td className="px-3 py-2 text-text-secondary text-xs">
                      {t.entryTime ? t.entryTime : '--'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editingTrade && (
        <TradeForm
          trade={editingTrade}
          settings={settings}
          onChange={updateTrade}
          onClose={() => setEditing(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
