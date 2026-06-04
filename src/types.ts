export interface Trade {
  id: string;
  tradeNumber: number;
  date: string; // YYYY-MM-DD
  pair: string;
  winLoss: '' | 'Win' | 'Loss' | 'BE';
  winLossSpecifics: string;
  buySell: '' | 'Buy' | 'Sell';
  risk: number;
  result: number;
  commissions: number;
  swaps: number;
  // Trade Specifics
  entryTF: string;
  entryPrice: number;
  slPips: number;
  tpPips: number;
  // Entry Specifics
  entryType: string;
  imbalance: boolean;
  orderBlock: boolean;
  supplyZone: boolean;
  ote: boolean;
  // Time Specifics
  entryTime: string; // HH:MM
  exitTime: string; // HH:MM
  // MAP/MFP
  mfpPips: number;
  mapPips: number;
  // Exit Specifics
  p1: number;
  arStdev1: number;
  p2: number;
  arStdev2: number;
  fullPosOut: string;
  furtherPartials: string;
  // Market Sentiment
  weeklyBias: string;
  dailyBias: string;
  h4Bias: string;
  h1Bias: string;
  // Narrative
  protraction: boolean;
  lqSweep: boolean;
  marketShift: boolean;
  divergence: boolean;
  highLow: string;
  // Other
  emotions: string;
  keyNotes: string;
  tradeLink: string;
  dxyLink: string;
}

export interface SessionTime {
  name: string;
  startTime: string;
  endTime: string;
}

export interface Settings {
  accountName: string;
  propFirm: string;
  startingBalance: number;
  pairs: string[];
  sessions: SessionTime[];
  entryTypes: string[];
  wlSpecifics: string[];
  tfOptions: string[];
  biasOptions: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  accountName: '',
  propFirm: '',
  startingBalance: 0,
  pairs: ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY'],
  sessions: [
    { name: 'Asia', startTime: '00:00', endTime: '03:00' },
    { name: 'Pre London', startTime: '03:00', endTime: '05:00' },
    { name: 'LOKZ', startTime: '05:00', endTime: '07:00' },
    { name: 'London', startTime: '07:00', endTime: '10:00' },
    { name: 'NYKZ', startTime: '10:00', endTime: '12:00' },
    { name: 'New York', startTime: '12:00', endTime: '17:00' },
    { name: 'Dead Time', startTime: '17:00', endTime: '00:00' },
  ],
  entryTypes: ['E1', 'E2', 'Shift', 'Other'],
  wlSpecifics: ['Full Win', 'Partial Win', 'Full Loss', 'Partial Loss', 'Breakeven'],
  tfOptions: ['2M', '3M', '5M', '15M', '1H', '4H'],
  biasOptions: ['Bullish', 'Bearish', 'Neutral', 'No Bias'],
};

export function createEmptyTrade(tradeNumber: number): Trade {
  return {
    id: crypto.randomUUID(),
    tradeNumber,
    date: new Date().toISOString().slice(0, 10),
    pair: '',
    winLoss: '',
    winLossSpecifics: '',
    buySell: '',
    risk: 0,
    result: 0,
    commissions: 0,
    swaps: 0,
    entryTF: '',
    entryPrice: 0,
    slPips: 0,
    tpPips: 0,
    entryType: '',
    imbalance: false,
    orderBlock: false,
    supplyZone: false,
    ote: false,
    entryTime: '',
    exitTime: '',
    mfpPips: 0,
    mapPips: 0,
    p1: 0,
    arStdev1: 0,
    p2: 0,
    arStdev2: 0,
    fullPosOut: '',
    furtherPartials: '',
    weeklyBias: '',
    dailyBias: '',
    h4Bias: '',
    h1Bias: '',
    protraction: false,
    lqSweep: false,
    marketShift: false,
    divergence: false,
    highLow: '',
    emotions: '',
    keyNotes: '',
    tradeLink: '',
    dxyLink: '',
  };
}

// Auto-calculated fields
export function getWeekday(date: string): string {
  if (!date) return '';
  const d = new Date(date + 'T12:00:00');
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
}

export function getNetResult(t: Trade): number {
  return t.result + t.commissions + t.swaps;
}

export function getNetRR(t: Trade): number {
  if (!t.risk || t.risk === 0) return 0;
  return getNetResult(t) / t.risk;
}

export function getPlannedRR(t: Trade): number {
  if (!t.slPips || t.slPips === 0) return 0;
  return t.tpPips / t.slPips;
}

export function getMfpPercent(t: Trade): number {
  if (!t.tpPips || t.tpPips === 0) return 0;
  return (t.mfpPips / t.tpPips) * 100;
}

export function getMapPercent(t: Trade): number {
  if (!t.slPips || t.slPips === 0) return 0;
  return (t.mapPips / t.slPips) * 100;
}

export function getDuration(entryTime: string, exitTime: string): string {
  if (!entryTime || !exitTime) return '';
  const [eh, em] = entryTime.split(':').map(Number);
  const [xh, xm] = exitTime.split(':').map(Number);
  let diff = (xh * 60 + xm) - (eh * 60 + em);
  if (diff < 0) diff += 24 * 60;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}h ${mins}m`;
}

export function getSession(entryTime: string, sessions: SessionTime[]): string {
  if (!entryTime) return '';
  const [h, m] = entryTime.split(':').map(Number);
  const mins = h * 60 + m;
  for (const s of sessions) {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (end > start) {
      if (mins >= start && mins < end) return s.name;
    } else {
      // wraps midnight
      if (mins >= start || mins < end) return s.name;
    }
  }
  return '';
}
