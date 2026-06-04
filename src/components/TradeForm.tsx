import { useState } from 'react';
import type { Trade, Settings } from '../types';
import { getWeekday, getNetResult, getNetRR, getPlannedRR, getMfpPercent, getMapPercent, getDuration, getSession } from '../types';

interface Props {
  trade: Trade;
  settings: Settings;
  onChange: (id: string, updates: Partial<Trade>) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function InfoButton({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(!open); }}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-bg-tertiary text-[9px] text-text-secondary hover:text-accent hover:bg-accent/15 transition-colors leading-none"
      >
        i
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 bottom-full mb-1 z-50 w-56 p-2.5 rounded-lg bg-bg-tertiary border border-border shadow-xl text-xs text-text-secondary leading-relaxed">
            {text}
          </div>
        </>
      )}
    </span>
  );
}

function Field({ label, children, computed, info }: { label: string; children?: React.ReactNode; computed?: string; info?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-text-secondary font-medium">
        {label}
        {info && <InfoButton text={info} />}
      </label>
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

        <Section title="General Information">
          <Field label="Date" info="Date of entering the trade.">
            <input type="date" value={t.date} onChange={e => set({ date: e.target.value })} />
          </Field>
          <Field label="Weekday" computed={getWeekday(t.date)} info="Auto-calculated from the date." />
          <Field label="Pair">
            <select value={t.pair} onChange={e => set({ pair: e.target.value })}>
              <option value="">--</option>
              {settings.pairs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="W/L" info="W = Win, L = Loss, BE = Breakeven. Also log missed trades for analysis.">
            <select value={t.winLoss} onChange={e => set({ winLoss: e.target.value as Trade['winLoss'] })}>
              <option value="">--</option>
              <option value="W">W</option>
              <option value="L">L</option>
              <option value="BE">BE</option>
            </select>
          </Field>
          <Field label="W/L Specifics" info="More detail on the outcome. P = Partial (e.g. Partial Win, Partial Loss).">
            <input value={t.winLossSpecifics} onChange={e => set({ winLossSpecifics: e.target.value })} />
          </Field>
          <Field label="Buy/Sell">
            <select value={t.buySell} onChange={e => set({ buySell: e.target.value as Trade['buySell'] })}>
              <option value="">--</option>
              <option value="Buy">Buy</option>
              <option value="Sell">Sell</option>
            </select>
          </Field>
          <Field label="Risk ($)" info="Fill in the risk amount in dollars, not percentage.">
            <input type="number" step="0.01" value={t.risk || ''} onChange={e => set({ risk: +e.target.value })} />
          </Field>
          <Field label="Net Result" computed={`$${getNetResult(t).toFixed(2)}`} info="Auto-calculated: Result + Commissions + Swaps." />
          <Field label="Result ($)" info="The trade result excluding commissions and swap costs.">
            <input type="number" step="0.01" value={t.result || ''} onChange={e => set({ result: +e.target.value })} />
          </Field>
          <Field label="Commissions ($)">
            <input type="number" step="0.01" value={t.commissions || ''} onChange={e => set({ commissions: +e.target.value })} />
          </Field>
          <Field label="Swaps ($)">
            <input type="number" step="0.01" value={t.swaps || ''} onChange={e => set({ swaps: +e.target.value })} />
          </Field>
          <Field label="Net RR" computed={getNetRR(t).toFixed(2) + 'R'} info="Auto-calculated: Net Result / Risk. Your actual risk-reward ratio." />
        </Section>

        <Section title="Trade Specifics">
          <Field label="Entry TF" info="The timeframe you used to enter the trade.">
            <select value={t.entryTF} onChange={e => set({ entryTF: e.target.value })}>
              <option value="">--</option>
              {settings.tfOptions.map(tf => <option key={tf} value={tf}>{tf}</option>)}
            </select>
          </Field>
          <Field label="Entry Price" info="The exact price at which you entered the trade.">
            <input type="number" step="0.00001" value={t.entryPrice || ''} onChange={e => set({ entryPrice: +e.target.value })} />
          </Field>
          <Field label="SL Pips" info="Stop loss distance in pips from your entry.">
            <input type="number" step="0.1" value={t.slPips || ''} onChange={e => set({ slPips: +e.target.value })} />
          </Field>
          <Field label="TP Pips" info="Take profit distance in pips from your entry.">
            <input type="number" step="0.1" value={t.tpPips || ''} onChange={e => set({ tpPips: +e.target.value })} />
          </Field>
          <Field label="Planned RR" computed={getPlannedRR(t).toFixed(2)} info="Auto-calculated: TP pips / SL pips. Your planned risk-reward before entering." />
        </Section>

        <Section title="Entry Specifics">
          <Field label="Entry Type" info="Your entry model. E1, E2, Shift, etc. These are defined in Settings.">
            <select value={t.entryType} onChange={e => set({ entryType: e.target.value })}>
              <option value="">--</option>
              {settings.entryTypes.map(et => <option key={et} value={et}>{et}</option>)}
            </select>
          </Field>
          <Field label="Imbalance" info="Was there a Fair Value Gap (imbalance) at the point of entry?">
            <select value={t.imbalance ? 'Yes' : 'No'} onChange={e => set({ imbalance: e.target.value === 'Yes' })}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </Field>
          <Field label="OB" info="Order Block — did price react from an order block at entry?">
            <select value={t.orderBlock ? 'Yes' : 'No'} onChange={e => set({ orderBlock: e.target.value === 'Yes' })}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </Field>
          <Field label="SZ" info="Supply/Demand Zone — did price enter a supply or demand zone?">
            <select value={t.supplyZone ? 'Yes' : 'No'} onChange={e => set({ supplyZone: e.target.value === 'Yes' })}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </Field>
          <Field label="OTE" info="Optimal Trade Entry — was your entry within the OTE zone (62-79% Fibonacci retracement)?">
            <select value={t.ote ? 'Yes' : 'No'} onChange={e => set({ ote: e.target.value === 'Yes' })}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </Field>
        </Section>

        <Section title="Time Specifics (UTC -4)">
          <Field label="Entry Time" info="Exact time you entered. Format: HH:MM in UTC-4.">
            <input type="time" value={t.entryTime} onChange={e => set({ entryTime: e.target.value })} />
          </Field>
          <Field label="Zone" computed={getSession(t.entryTime, settings.sessions)} info="Auto-detected session based on your entry time and session settings." />
          <Field label="Exit Time" info="Exact time you exited. Format: HH:MM in UTC-4.">
            <input type="time" value={t.exitTime} onChange={e => set({ exitTime: e.target.value })} />
          </Field>
          <Field label="Duration" computed={getDuration(t.entryTime, t.exitTime)} info="Auto-calculated: time between entry and exit." />
        </Section>

        <Section title="MAP / MFP">
          <Field label="MFP (pips)" info="Most Favourable Price — how far price moved in your favor (in pips) before reversing. Only fill in when there is no full TP hit.">
            <input type="number" step="0.1" value={t.mfpPips || ''} onChange={e => set({ mfpPips: +e.target.value })} />
          </Field>
          <Field label="MFP (%)" computed={getMfpPercent(t).toFixed(1) + '%'} info="Auto-calculated: MFP pips / TP pips. Shows how close you got to TP. Helps analyze if your TP is too greedy." />
          <Field label="MAP (pips)" info="Most Adverse Price — the maximum drawdown in pips before price moved in your favor. How close did it get to stopping you out?">
            <input type="number" step="0.1" value={t.mapPips || ''} onChange={e => set({ mapPips: +e.target.value })} />
          </Field>
          <Field label="MAP (%)" computed={getMapPercent(t).toFixed(1) + '%'} info="Auto-calculated: MAP pips / SL pips. 100% means price hit your SL exactly." />
        </Section>

        <Section title="Exit Specifics">
          <Field label="P1" info="First partial — the price level or pip amount where you took your first partial profit.">
            <input type="number" step="0.01" value={t.p1 || ''} onChange={e => set({ p1: +e.target.value })} />
          </Field>
          <Field label="AR StDev" info="Asia Range Standard Deviation at P1. Measures partial points relative to the Asia Range for different volatility conditions.">
            <select value={t.arStdev1} onChange={e => set({ arStdev1: e.target.value })}>
              <option value="">--</option>
              {settings.arStDevOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="P2" info="Second partial — the price level or pip amount where you took your second partial.">
            <input type="number" step="0.01" value={t.p2 || ''} onChange={e => set({ p2: +e.target.value })} />
          </Field>
          <Field label="AR StDev" info="Asia Range Standard Deviation at P2.">
            <select value={t.arStdev2} onChange={e => set({ arStdev2: e.target.value })}>
              <option value="">--</option>
              {settings.arStDevOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Full Pos. Out" info="How you fully exited the position. Full TP, BE (breakeven), Full SL, P + BE (partial then breakeven), Manual Exit, etc.">
            <select value={t.fullPosOut} onChange={e => set({ fullPosOut: e.target.value })}>
              <option value="">--</option>
              {settings.fullPosOutOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Further Partials" info="Additional partial points beyond P1 and P2, if any.">
            <input value={t.furtherPartials} onChange={e => set({ furtherPartials: e.target.value })} />
          </Field>
          <Field label="Notes">
            <textarea rows={2} value={t.exitNotes} onChange={e => set({ exitNotes: e.target.value })} className="w-full resize-none" />
          </Field>
        </Section>

        <Section title="Market Sentiment">
          <Field label="Weekly TF" info="Higher timeframe bias on the Weekly. Options: Bullish, Bearish, Neutral. Helps understand the HTF playing field.">
            <select value={t.weeklyBias} onChange={e => set({ weeklyBias: e.target.value })}>
              <option value="">--</option>
              {settings.htfBiasOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Daily TF" info="HTF bias on the Daily chart.">
            <select value={t.dailyBias} onChange={e => set({ dailyBias: e.target.value })}>
              <option value="">--</option>
              {settings.htfBiasOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="4H TF" info="HTF bias on the 4-hour chart.">
            <select value={t.h4Bias} onChange={e => set({ h4Bias: e.target.value })}>
              <option value="">--</option>
              {settings.htfBiasOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="1H TF" info="1-hour bias. ProTrend = trading with the trend, CounterTrend = against, Neutral = no clear direction.">
            <select value={t.h1Bias} onChange={e => set({ h1Bias: e.target.value })}>
              <option value="">--</option>
              {settings.h1BiasOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Narrative">
          <Field label="Protraction" info="Measured by the standard deviations of the Expiry Range. 0-SD, 1-SD, or 2-SD. Measures London session protraction to optimize narrative building.">
            <select value={t.protraction} onChange={e => set({ protraction: e.target.value })}>
              <option value="">--</option>
              {settings.protractionOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="LQ Sweep" info="Liquidity Sweep — price induces a high/low with a wick before entry. Body-close inducements do NOT count as LQ sweeps.">
            <select value={t.lqSweep} onChange={e => set({ lqSweep: e.target.value })}>
              <option value="">--</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </Field>
          <Field label="Market Shift" info="After a liquidity sweep, price breaks the last significant low/high with intent. Indicates a shift in market direction.">
            <select value={t.marketShift} onChange={e => set({ marketShift: e.target.value })}>
              <option value="">--</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </Field>
          <Field label="Divergence" info="Was there divergence at the point of entry? Yes/No for presence, Positive/Negative for the type.">
            <select value={t.divergence} onChange={e => set({ divergence: e.target.value })}>
              <option value="">--</option>
              {settings.divergenceOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Divergence (+/-)" info="Additional detail on the divergence direction.">
            <input value={t.divergencePosNeg} onChange={e => set({ divergencePosNeg: e.target.value })} />
          </Field>
          <Field label="High/Low" info="Protected = liquidity level had been defended. Unprotected = liquidity was exposed and vulnerable to a sweep.">
            <select value={t.highLow} onChange={e => set({ highLow: e.target.value })}>
              <option value="">--</option>
              {settings.highLowOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
        </Section>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-accent border-b border-border pb-1">Trade Notes / Emotions / Key Notes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Trade Notes">
              <textarea rows={2} value={t.tradeNotes} onChange={e => set({ tradeNotes: e.target.value })} className="w-full resize-none" />
            </Field>
            <Field label="Emotions">
              <textarea rows={2} value={t.emotions} onChange={e => set({ emotions: e.target.value })} className="w-full resize-none" />
            </Field>
            <Field label="Key Notes">
              <textarea rows={2} value={t.keyNotes} onChange={e => set({ keyNotes: e.target.value })} className="w-full resize-none" />
            </Field>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-accent border-b border-border pb-1">Trade Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Flow">
              <input value={t.tradeLinkFlow} onChange={e => set({ tradeLinkFlow: e.target.value })} className="w-full" />
            </Field>
            <Field label="Flux">
              <input value={t.tradeLinkFlux} onChange={e => set({ tradeLinkFlux: e.target.value })} className="w-full" />
            </Field>
            <Field label="ETF">
              <input value={t.tradeLinkETF} onChange={e => set({ tradeLinkETF: e.target.value })} className="w-full" />
            </Field>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-accent border-b border-border pb-1">DXY Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Flow">
              <input value={t.dxyLinkFlow} onChange={e => set({ dxyLinkFlow: e.target.value })} className="w-full" />
            </Field>
            <Field label="Flux">
              <input value={t.dxyLinkFlux} onChange={e => set({ dxyLinkFlux: e.target.value })} className="w-full" />
            </Field>
            <Field label="ETF">
              <input value={t.dxyLinkETF} onChange={e => set({ dxyLinkETF: e.target.value })} className="w-full" />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
