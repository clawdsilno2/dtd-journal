import { useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import type { Trade, Settings } from '../types';
import { createEmptyTrade, getWeekday, getNetResult, getNetRR, getPlannedRR, getMfpPercent, getMapPercent, getDuration, getSession } from '../types';
import TradeForm from '../components/TradeForm';

interface Props {
  trades: Trade[];
  settings: Settings;
  addTrade?: (t: Trade) => void;
  updateTrade?: (id: string, updates: Partial<Trade>) => void;
  deleteTrade?: (id: string) => void;
  getDeletedTrades?: () => Trade[];
  restoreTrade?: (id: string) => void;
  viewOnly?: boolean;
}

// Section header spanning multiple columns
function SectionHeader({ label, colSpan }: { label: string; colSpan: number }) {
  return <th colSpan={colSpan} className="px-2 py-1.5 text-center font-semibold text-accent text-[10px] border-x border-border bg-bg-secondary">{label}</th>;
}

function TH({ children }: { children: string }) {
  return <th className="px-2 py-1.5 text-left font-medium whitespace-nowrap text-[10px]">{children}</th>;
}

function TD({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2 py-1.5 whitespace-nowrap text-[11px] ${className}`}>{children}</td>;
}

function AutoTD({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2 py-1.5 whitespace-nowrap text-[11px] text-accent-hover bg-bg-primary/30 ${className}`}>{children}</td>;
}

function BoolTD({ value }: { value: boolean }) {
  return <TD>{value ? 'X' : ''}</TD>;
}

export default function Trades({ trades, settings, addTrade, updateTrade, deleteTrade, getDeletedTrades, restoreTrade, viewOnly }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  const handleAdd = () => {
    if (!addTrade) return;
    const t = createEmptyTrade(trades.length + 1);
    addTrade(t);
    setEditing(t.id);
  };

  const handleDelete = (id: string) => {
    if (!deleteTrade) return;
    deleteTrade(id);
    setEditing(null);
  };

  const editingTrade = trades.find(t => t.id === editing);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Trade Log</h2>
        {!viewOnly && (
          <div className="flex items-center gap-2">
            {getDeletedTrades && getDeletedTrades().length > 0 && (
              <button
                onClick={() => setShowArchive(!showArchive)}
                className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-secondary rounded-lg text-sm font-medium hover:text-accent transition-colors"
              >
                <RotateCcw size={16} /> Restore ({getDeletedTrades().length})
              </button>
            )}
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              <Plus size={16} /> New Trade
            </button>
          </div>
        )}
      </div>

      {showArchive && getDeletedTrades && restoreTrade && (
        <div className="mb-4 p-3 bg-bg-secondary rounded-lg border border-border">
          <h3 className="text-sm font-semibold text-text-secondary mb-2">Recently Deleted (max 3)</h3>
          <div className="space-y-2">
            {getDeletedTrades().map(t => (
              <div key={t.id} className="flex items-center justify-between text-xs bg-bg-primary rounded px-3 py-2">
                <span>#{t.tradeNumber} — {t.pair} {t.buySell} {t.date} {t.entryTime}</span>
                <button
                  onClick={() => { restoreTrade(t.id); if (getDeletedTrades().length <= 1) setShowArchive(false); }}
                  className="text-accent hover:text-accent-hover transition-colors text-xs font-medium"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="text-xs border-collapse">
          {/* Section headers row */}
          <thead>
            <tr className="bg-bg-secondary">
              <SectionHeader label="General Information" colSpan={14} />
              <SectionHeader label="Trade Specifics" colSpan={5} />
              <SectionHeader label="Entry Specifics" colSpan={5} />
              <SectionHeader label="Time Specifics" colSpan={4} />
              <SectionHeader label="MAP/MFP" colSpan={4} />
              <SectionHeader label="Exit Specifics" colSpan={7} />
              <SectionHeader label="Market Sentiment" colSpan={4} />
              <SectionHeader label="Narrative" colSpan={6} />
            </tr>
            {/* Column headers */}
            <tr className="bg-bg-tertiary text-text-secondary">
              {/* General Information */}
              <TH>Trade</TH>
              <TH>Account</TH>
              <TH>Date</TH>
              <TH>Weekday</TH>
              <TH>Pair</TH>
              <TH>W/L</TH>
              <TH>W/L Spec.</TH>
              <TH>Buy/Sell</TH>
              <TH>Risk</TH>
              <TH>Net Result</TH>
              <TH>Result</TH>
              <TH>Commissions</TH>
              <TH>Swaps</TH>
              <TH>Net RR</TH>
              {/* Trade Specifics */}
              <TH>Entry TF</TH>
              <TH>Entry</TH>
              <TH>SL pips</TH>
              <TH>TP pips</TH>
              <TH>P. RR</TH>
              {/* Entry Specifics */}
              <TH>Entry</TH>
              <TH>Imb</TH>
              <TH>OB</TH>
              <TH>SZ</TH>
              <TH>OTE</TH>
              {/* Time Specifics */}
              <TH>Entry Time</TH>
              <TH>Zone</TH>
              <TH>Exit Time</TH>
              <TH>Duration</TH>
              {/* MAP/MFP */}
              <TH>MFP (pips)</TH>
              <TH>MFP (%)</TH>
              <TH>MAP (pips)</TH>
              <TH>MAP (%)</TH>
              {/* Exit Specifics */}
              <TH>P1</TH>
              <TH>AR StDev</TH>
              <TH>P2</TH>
              <TH>AR StDev</TH>
              <TH>Full Pos. Out</TH>
              <TH>Further Part.</TH>
              <TH>Notes</TH>
              {/* Market Sentiment */}
              <TH>Weekly TF</TH>
              <TH>Daily TF</TH>
              <TH>4H TF</TH>
              <TH>1H TF</TH>
              {/* Narrative */}
              <TH>Protraction</TH>
              <TH>LQ Sweep</TH>
              <TH>Market Shift</TH>
              <TH>Divergence</TH>
              <TH>Div (+/-)</TH>
              <TH>High/Low</TH>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={49} className="px-3 py-12 text-center text-text-secondary text-sm">
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
                    onClick={() => { if (!viewOnly) setEditing(t.id); }}
                    className={`border-t border-border transition-colors ${viewOnly ? '' : 'hover:bg-bg-tertiary/50 cursor-pointer'}`}
                  >
                    {/* General Information */}
                    <TD>{t.tradeNumber}</TD>
                    <TD>
                      <div className="flex flex-wrap gap-0.5">
                        {(t.labels || []).map(l => (
                          <span key={l} className="px-1 py-0.5 rounded bg-accent/15 text-accent-hover text-[9px]">{l}</span>
                        ))}
                      </div>
                    </TD>
                    <TD>{t.date}</TD>
                    <AutoTD>{getWeekday(t.date).slice(0, 3)}</AutoTD>
                    <TD className="font-medium">{t.pair}</TD>
                    <TD>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        t.winLoss === 'W' ? 'bg-green/20 text-green' :
                        t.winLoss === 'L' ? 'bg-red/20 text-red' :
                        t.winLoss === 'BE' ? 'bg-yellow/20 text-yellow' :
                        'text-text-secondary'
                      }`}>{t.winLoss || '--'}</span>
                    </TD>
                    <TD>{t.winLossSpecifics}</TD>
                    <TD>{t.buySell}</TD>
                    <TD className="font-mono">{t.risk ? `$${t.risk.toFixed(2)}` : ''}</TD>
                    <AutoTD className={`font-mono ${nr > 0 ? 'text-green' : nr < 0 ? 'text-red' : ''}`}>
                      {t.risk ? `$${nr.toFixed(2)}` : ''}
                    </AutoTD>
                    <TD className="font-mono">{t.result ? `$${t.result.toFixed(2)}` : ''}</TD>
                    <TD className="font-mono">{t.commissions ? `$${t.commissions.toFixed(2)}` : ''}</TD>
                    <TD className="font-mono">{t.swaps ? `$${t.swaps.toFixed(2)}` : ''}</TD>
                    <AutoTD className={`font-mono ${nrr > 0 ? 'text-green' : nrr < 0 ? 'text-red' : ''}`}>
                      {t.risk ? nrr.toFixed(2) : ''}
                    </AutoTD>
                    {/* Trade Specifics */}
                    <TD>{t.entryTF}</TD>
                    <TD className="font-mono">{t.entryPrice || ''}</TD>
                    <TD className="font-mono">{t.slPips || ''}</TD>
                    <TD className="font-mono">{t.tpPips || ''}</TD>
                    <AutoTD className="font-mono">{t.slPips ? getPlannedRR(t).toFixed(2) : ''}</AutoTD>
                    {/* Entry Specifics */}
                    <TD>{t.entryType}</TD>
                    <BoolTD value={t.imbalance} />
                    <BoolTD value={t.orderBlock} />
                    <BoolTD value={t.supplyZone} />
                    <BoolTD value={t.ote} />
                    {/* Time Specifics */}
                    <TD>{t.entryTime}</TD>
                    <AutoTD>{getSession(t.entryTime, settings.sessions)}</AutoTD>
                    <TD>{t.exitTime}</TD>
                    <AutoTD>{getDuration(t.entryTime, t.exitTime)}</AutoTD>
                    {/* MAP/MFP */}
                    <TD className="font-mono">{t.mfpPips || ''}</TD>
                    <AutoTD className="font-mono">{t.tpPips ? getMfpPercent(t).toFixed(1) + '%' : ''}</AutoTD>
                    <TD className="font-mono">{t.mapPips || ''}</TD>
                    <AutoTD className="font-mono">{t.slPips ? getMapPercent(t).toFixed(1) + '%' : ''}</AutoTD>
                    {/* Exit Specifics */}
                    <TD className="font-mono">{t.p1 || ''}</TD>
                    <TD>{t.arStdev1}</TD>
                    <TD className="font-mono">{t.p2 || ''}</TD>
                    <TD>{t.arStdev2}</TD>
                    <TD>{t.fullPosOut}</TD>
                    <TD>{t.furtherPartials}</TD>
                    <TD className="max-w-[120px] truncate">{t.exitNotes}</TD>
                    {/* Market Sentiment */}
                    <TD>{t.weeklyBias}</TD>
                    <TD>{t.dailyBias}</TD>
                    <TD>{t.h4Bias}</TD>
                    <TD>{t.h1Bias}</TD>
                    {/* Narrative */}
                    <TD>{t.protraction}</TD>
                    <TD>{t.lqSweep}</TD>
                    <TD>{t.marketShift}</TD>
                    <TD>{t.divergence}</TD>
                    <TD>{t.divergencePosNeg}</TD>
                    <TD>{t.highLow}</TD>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editingTrade && !viewOnly && updateTrade && (
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
