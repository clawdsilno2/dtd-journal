import type { Trade, Settings } from '../types';
import { getWeekday, getNetResult, getNetRR, getPlannedRR, getMfpPercent, getMapPercent, getDuration, getSession } from '../types';

interface Props {
  trade: Trade;
  settings: Settings;
  onChange: (id: string, updates: Partial<Trade>) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function Field({ label, children, computed }: { label: string; children?: React.ReactNode; computed?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-text-secondary font-medium">{label}</label>
      {computed !== undefined ? (
        <div className="px-2.5 py-1.5 bg-bg-primary rounded-md text-sm text-accent-hover font-mono">
          {computed}
        </div>
      ) : children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-accent border-b border-border pb-1">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  );
}

export default function TradeForm({ trade, settings, onChange, onClose, onDelete }: Props) {
  const t = trade;
  const set = (updates: Partial<Trade>) => onChange(t.id, updates);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-8 z-50 overflow-auto pb-8">
      <div className="bg-bg-secondary rounded-xl border border-border w-full max-w-4xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Trade #{t.tradeNumber}</h2>
          <div className="flex gap-2">
            <button onClick={() => onDelete(t.id)} className="px-3 py-1.5 text-xs bg-red/20 text-red rounded-lg hover:bg-red/30 transition-colors">Delete</button>
            <button onClick={onClose} className="px-3 py-1.5 text-xs bg-bg-tertiary text-text-secondary rounded-lg hover:text-text-primary transition-colors">Close</button>
          </div>
        </div>

        <Section title="General Info">
          <Field label="Date">
            <input type="date" value={t.date} onChange={e => set({ date: e.target.value })} />
          </Field>
          <Field label="Weekday" computed={getWeekday(t.date)} />
          <Field label="Pair">
            <select value={t.pair} onChange={e => set({ pair: e.target.value })}>
              <option value="">--</option>
              {settings.pairs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="W/L">
            <select value={t.winLoss} onChange={e => set({ winLoss: e.target.value as Trade['winLoss'] })}>
              <option value="">--</option>
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
              <option value="BE">BE</option>
            </select>
          </Field>
          <Field label="W/L Specifics">
            <select value={t.winLossSpecifics} onChange={e => set({ winLossSpecifics: e.target.value })}>
              <option value="">--</option>
              {settings.wlSpecifics.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Buy/Sell">
            <select value={t.buySell} onChange={e => set({ buySell: e.target.value as Trade['buySell'] })}>
              <option value="">--</option>
              <option value="Buy">Buy</option>
              <option value="Sell">Sell</option>
            </select>
          </Field>
          <Field label="Risk ($)">
            <input type="number" step="0.01" value={t.risk || ''} onChange={e => set({ risk: +e.target.value })} />
          </Field>
          <Field label="Result ($)">
            <input type="number" step="0.01" value={t.result || ''} onChange={e => set({ result: +e.target.value })} />
          </Field>
          <Field label="Commissions ($)">
            <input type="number" step="0.01" value={t.commissions || ''} onChange={e => set({ commissions: +e.target.value })} />
          </Field>
          <Field label="Swaps ($)">
            <input type="number" step="0.01" value={t.swaps || ''} onChange={e => set({ swaps: +e.target.value })} />
          </Field>
          <Field label="Net Result" computed={`$${getNetResult(t).toFixed(2)}`} />
          <Field label="Net RR" computed={getNetRR(t).toFixed(2) + 'R'} />
        </Section>

        <Section title="Trade Specifics">
          <Field label="Entry TF">
            <select value={t.entryTF} onChange={e => set({ entryTF: e.target.value })}>
              <option value="">--</option>
              {settings.tfOptions.map(tf => <option key={tf} value={tf}>{tf}</option>)}
            </select>
          </Field>
          <Field label="Entry Price">
            <input type="number" step="0.00001" value={t.entryPrice || ''} onChange={e => set({ entryPrice: +e.target.value })} />
          </Field>
          <Field label="SL Pips">
            <input type="number" step="0.1" value={t.slPips || ''} onChange={e => set({ slPips: +e.target.value })} />
          </Field>
          <Field label="TP Pips">
            <input type="number" step="0.1" value={t.tpPips || ''} onChange={e => set({ tpPips: +e.target.value })} />
          </Field>
          <Field label="Planned RR" computed={getPlannedRR(t).toFixed(2)} />
        </Section>

        <Section title="Entry Specifics">
          <Field label="Entry Type">
            <select value={t.entryType} onChange={e => set({ entryType: e.target.value })}>
              <option value="">--</option>
              {settings.entryTypes.map(et => <option key={et} value={et}>{et}</option>)}
            </select>
          </Field>
          <Field label="Confluence">
            <div className="flex flex-wrap gap-3 text-xs">
              {[
                ['imbalance', 'IMB'],
                ['orderBlock', 'OB'],
                ['supplyZone', 'SZ'],
                ['ote', 'OTE'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={t[key as keyof Trade] as boolean}
                    onChange={e => set({ [key]: e.target.checked })}
                    className="w-3.5 h-3.5"
                  />
                  {label}
                </label>
              ))}
            </div>
          </Field>
        </Section>

        <Section title="Time Specifics">
          <Field label="Entry Time">
            <input type="time" value={t.entryTime} onChange={e => set({ entryTime: e.target.value })} />
          </Field>
          <Field label="Exit Time">
            <input type="time" value={t.exitTime} onChange={e => set({ exitTime: e.target.value })} />
          </Field>
          <Field label="Session" computed={getSession(t.entryTime, settings.sessions)} />
          <Field label="Duration" computed={getDuration(t.entryTime, t.exitTime)} />
        </Section>

        <Section title="MAP / MFP">
          <Field label="MFP Pips">
            <input type="number" step="0.1" value={t.mfpPips || ''} onChange={e => set({ mfpPips: +e.target.value })} />
          </Field>
          <Field label="MFP %" computed={getMfpPercent(t).toFixed(1) + '%'} />
          <Field label="MAP Pips">
            <input type="number" step="0.1" value={t.mapPips || ''} onChange={e => set({ mapPips: +e.target.value })} />
          </Field>
          <Field label="MAP %" computed={getMapPercent(t).toFixed(1) + '%'} />
        </Section>

        <Section title="Exit Specifics">
          <Field label="P1">
            <input type="number" step="0.01" value={t.p1 || ''} onChange={e => set({ p1: +e.target.value })} />
          </Field>
          <Field label="AR StDev (P1)">
            <input type="number" step="0.01" value={t.arStdev1 || ''} onChange={e => set({ arStdev1: +e.target.value })} />
          </Field>
          <Field label="P2">
            <input type="number" step="0.01" value={t.p2 || ''} onChange={e => set({ p2: +e.target.value })} />
          </Field>
          <Field label="AR StDev (P2)">
            <input type="number" step="0.01" value={t.arStdev2 || ''} onChange={e => set({ arStdev2: +e.target.value })} />
          </Field>
          <Field label="Full Pos Out">
            <input value={t.fullPosOut} onChange={e => set({ fullPosOut: e.target.value })} />
          </Field>
          <Field label="Further Partials">
            <input value={t.furtherPartials} onChange={e => set({ furtherPartials: e.target.value })} />
          </Field>
        </Section>

        <Section title="Market Sentiment">
          {(['weeklyBias', 'dailyBias', 'h4Bias', 'h1Bias'] as const).map(key => {
            const labels: Record<string, string> = { weeklyBias: 'Weekly', dailyBias: 'Daily', h4Bias: '4H', h1Bias: '1H' };
            return (
              <Field key={key} label={labels[key]}>
                <select value={t[key]} onChange={e => set({ [key]: e.target.value })}>
                  <option value="">--</option>
                  {settings.biasOptions.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            );
          })}
        </Section>

        <Section title="Narrative">
          <Field label="Confluences">
            <div className="flex flex-wrap gap-3 text-xs">
              {[
                ['protraction', 'Protraction'],
                ['lqSweep', 'LQ Sweep'],
                ['marketShift', 'Market Shift'],
                ['divergence', 'Divergence'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={t[key as keyof Trade] as boolean}
                    onChange={e => set({ [key]: e.target.checked })}
                    className="w-3.5 h-3.5"
                  />
                  {label}
                </label>
              ))}
            </div>
          </Field>
          <Field label="High/Low">
            <select value={t.highLow} onChange={e => set({ highLow: e.target.value })}>
              <option value="">--</option>
              <option value="High">High</option>
              <option value="Low">Low</option>
            </select>
          </Field>
        </Section>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-accent border-b border-border pb-1">Notes & Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Emotions">
              <textarea rows={2} value={t.emotions} onChange={e => set({ emotions: e.target.value })} className="w-full resize-none" />
            </Field>
            <Field label="Key Notes">
              <textarea rows={2} value={t.keyNotes} onChange={e => set({ keyNotes: e.target.value })} className="w-full resize-none" />
            </Field>
            <Field label="Trade Link">
              <input value={t.tradeLink} onChange={e => set({ tradeLink: e.target.value })} className="w-full" />
            </Field>
            <Field label="DXY Link">
              <input value={t.dxyLink} onChange={e => set({ dxyLink: e.target.value })} className="w-full" />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
