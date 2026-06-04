import { useState } from 'react';

const sections = [
  {
    id: 'data',
    title: 'Data (Trade Entry)',
    content: [
      {
        heading: 'Overview',
        body: 'The Data tab is where you log all your trade details. Auto-calculated fields (shown in purple) are computed for you — you only need to fill in the editable fields.',
      },
      {
        heading: 'General Information',
        body: 'Core trade details: Date (weekday auto-fills), Pair, Win/Loss/BE, Buy/Sell, Risk amount, Result, Commissions, and Swaps. Net Result and Net RR are calculated automatically.',
      },
      {
        heading: 'Trade Specifics',
        body: 'Entry timeframe, entry price, SL pips, and TP pips. Planned RR (TP pips / SL pips) is calculated automatically.',
      },
      {
        heading: 'Entry Specifics',
        body: 'Your entry model (E1, E2, Shift, Other) and confluence factors: Imbalance, Order Block (OB), Supply Zone (SZ), and OTE.',
      },
      {
        heading: 'Time Specifics',
        body: 'Entry and exit times. The session zone is auto-detected based on your configured session times, and duration is calculated from entry to exit. Use HH:MM format (24-hour clock).',
      },
    ],
  },
  {
    id: 'exit',
    title: 'Exit Specifics & MAP/MFP',
    content: [
      {
        heading: 'Partials (P1, P2)',
        body: 'Measure at which point you close part of your position. These are quantified using the Asia Range Standard Deviation tool (Exodus Vol 2). This way, partial points are relative to your Asia Range, allowing you to segment partial-taking data across different AR conditions.',
      },
      {
        heading: 'AR StDev',
        body: 'The Asia Range Standard Deviation value at the point where each partial was taken. Used to analyze partial optimization across different volatility conditions.',
      },
      {
        heading: 'Full Pos. Out & Further Partials',
        body: '"Full Pos. Out" records where you fully exited (TP, SL, BE, manual). "Further Partials" lets you note any additional partial points beyond P1 and P2.',
      },
      {
        heading: 'MFP (Most Favourable Price)',
        body: 'Measures how far price moved in your favor after entry before reversing and hitting your SL or BE. MFP% is calculated as MFP pips / TP pips. This helps analyze if you\'re being too greedy with partials or TP targets. Only fill in MFP when there is no full TP hit.',
      },
      {
        heading: 'MAP (Most Adverse Price)',
        body: 'Measures the maximum drawdown in pips before price moved in your favor. MAP% is calculated as MAP pips / SL pips. Helps you understand how close trades get to stopping out before working.',
      },
    ],
  },
  {
    id: 'sentiment',
    title: 'Market Sentiment',
    content: [
      {
        heading: 'Overview',
        body: 'Market sentiment tracks your higher timeframe analysis at the time of trade. This helps you understand your playing field and correlate results with HTF conditions.',
      },
      {
        heading: 'Weekly / Daily / 4H Bias',
        body: 'Options: PO3 (Power of 3 — clean delivery day with accumulation, manipulation, distribution), PB (Pullback — retracement within the ERR), or Neutral (price isn\'t clearly doing either).',
      },
      {
        heading: '1H Bias',
        body: 'Options: Expansion, Retracement, and Reversal (ERR). These follow the framework from Exodus Volume 1.',
      },
    ],
  },
  {
    id: 'narrative',
    title: 'Narrative',
    content: [
      {
        heading: 'Protraction',
        body: 'Measured by the standard deviations of your expiry range (Exodus Vol 2). Measures London session protraction against different Expiry Range conditions to optimize narrative building. Options: 0-SD, 1-SD, 2-SD.',
      },
      {
        heading: 'LQ Sweep',
        body: 'Before an E1 entry, price needs to make a liquidity sweep — inducing a high/low with a wick. Important: a body-close inducement and reaction is NOT considered an LQ sweep within Exodus. Only non-body-close inducements qualify.',
      },
      {
        heading: 'Market Shift',
        body: 'Occurs after a liquidity sweep, when price breaks the last significant low/high with intent. Theoretically, there can\'t be a market shift without a liquidity sweep. However, a body-close sweep can also indicate a market shift in practice.',
      },
      {
        heading: 'Divergence',
        body: 'Track whether price showed divergence at the point of entry — a key confirmation signal.',
      },
      {
        heading: 'High/Low',
        body: 'Whether you\'re trading at a significant high or low in the current context.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings (List Variables)',
    content: [
      {
        heading: 'Overview',
        body: 'Settings is your cockpit — the configuration that powers the Dashboard, Data entry dropdowns, and all auto-calculations.',
      },
      {
        heading: 'Account Details',
        body: 'Your account name, prop firm, and starting balance. The account name shows at the top of your Dashboard. Starting balance is used for CPG (Compound Periodic Growth) calculations.',
      },
      {
        heading: 'Entry Models',
        body: 'The different entry types you use. In Exodus, the most common are E1, E2, and Shift entries. Customize these to match your strategy.',
      },
      {
        heading: 'Trading Pairs',
        body: 'All the pairs you trade. Within Exodus this is typically EU and GU. The Dashboard breaks down stats per pair with Buy/Sell splits.',
      },
      {
        heading: 'Session Time Zones',
        body: 'Define your trading sessions with start/end times. When you fill in Entry Time and Exit Time on a trade, the session zone auto-fills and duration is calculated. These zones power the "Time of Trade" dashboard breakdown.',
      },
      {
        heading: 'Dropdown Options',
        body: 'Predefined filters used throughout the journal. Timeframes, W/L specifics, bias options — all configurable. These are based on concepts from Exodus Vol 1 and 2.',
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    content: [
      {
        heading: 'Account Details',
        body: 'Gain (R), average gain per trade, Daily/Weekly/Monthly CPG (Compound Periodic Growth), starting balance, total winnings, commissions/swaps, current balance, and highest/lowest trades.',
      },
      {
        heading: 'Trade Stats',
        body: 'Win/loss/BE counts, profitability percentage, loss rate, and consistency score. Consistency = 1 - (largest single win / total winnings). A higher consistency means your profits are evenly distributed, not reliant on one lucky trade.',
      },
      {
        heading: 'Hall of Fame',
        body: 'Your best trade and worst loss with full details: trade number, pair, date, dollar amount, R value, direction, and entry type.',
      },
      {
        heading: 'PnL Breakdowns',
        body: 'Yearly, Quarterly (Q1-Q4), and Monthly PnL. The monthly chart visualizes green/red bars for each month.',
      },
      {
        heading: 'Profitability by Day',
        body: 'Monday through Friday breakdown: trades, wins, BE, losses, total R, win %, average winning R, and average losing R.',
      },
      {
        heading: 'Time of Trade',
        body: 'Same breakdown by session zone (Asia, Pre London, LOKZ, London, NYKZ, New York, Dead Time). Helps identify which sessions you perform best in.',
      },
      {
        heading: 'Trade Pair',
        body: 'Per-pair stats with Buy/Sell splits. Total row at top, then each pair with its Buy and Sell sub-rows.',
      },
      {
        heading: 'Strategy (Entry Type)',
        body: 'Performance by entry model (E1, E2, Shift, Other). Identify which setups have the highest edge.',
      },
    ],
  },
];

export default function Guide() {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  return (
    <div className="p-6 flex gap-6 max-w-5xl">
      {/* Mini nav */}
      <div className="hidden md:block w-48 shrink-0">
        <h2 className="text-xl font-bold mb-4">Guide</h2>
        <nav className="space-y-1 sticky top-6">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(s.id);
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                activeSection === s.id
                  ? 'bg-accent/15 text-accent-hover font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              {s.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-8">
        <h2 className="text-xl font-bold md:hidden">Guide</h2>
        {sections.map(section => (
          <div
            key={section.id}
            id={section.id}
            className={`${activeSection === section.id ? '' : 'hidden md:block'}`}
          >
            <h3 className="text-lg font-bold mb-4 border-b border-border pb-2">{section.title}</h3>
            <div className="space-y-4">
              {section.content.map(item => (
                <div key={item.heading} className="bg-bg-secondary rounded-lg border border-border p-4">
                  <h4 className="text-sm font-semibold text-accent mb-2">{item.heading}</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
