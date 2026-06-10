export const ACCOUNT_LABELS = ['Live Account', 'Prop Phase 1', 'Prop Phase 2', 'Prop Live', 'AO Account', 'Backtest'] as const;
export type AccountLabel = typeof ACCOUNT_LABELS[number];

export interface Trade {
  id: string;
  tradeNumber: number;
  labels: AccountLabel[];
  date: string; // YYYY-MM-DD
  pair: string;
  winLoss: '' | 'W' | 'L' | 'BE';
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
  // SL Specifics
  slPda: string;
  slPdaX: string;
  slPdaSpecifics: string;
  // Expiry Range
  totalCbdr: number;
  totalAr: number;
  totalExpiryR: number;
  // Exit Specifics
  p1: string;
  arStdev1: string;
  p2: string;
  arStdev2: string;
  fullPosOut: string;
  furtherPartials: string;
  exitNotes: string;
  // Market Sentiment
  weeklyBias: string;
  dailyBias: string;
  h4Bias: string;
  h1Bias: string;
  // Narrative
  protraction: string;
  lqSweep: string;
  marketShift: string;
  divergence: string;
  divergencePosNeg: string;
  highLow: string;
  // Other
  tradeNotes: string;
  emotions: string;
  keyNotes: string;
  tradeLinkFlow: string;
  tradeLinkFlux: string;
  tradeLinkETF: string;
  dxyLinkFlow: string;
  dxyLinkFlux: string;
  dxyLinkETF: string;
}

export interface SessionTime {
  name: string;
  startTime: string;
  endTime: string;
}

export interface Settings {
  accountName: string;
  dashboardName: string;
  startingBalance: number;
  pairs: string[];
  sessions: SessionTime[];
  entryTypes: string[];
  tfOptions: string[];
  htfBiasOptions: string[];
  h1BiasOptions: string[];
  divergenceOptions: string[];
  protractionOptions: string[];
  highLowOptions: string[];
  arStDevOptions: string[];
  partialOptions: string[];
  fullPosOutOptions: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  accountName: 'AO Trader',
  dashboardName: 'Data Collection Sheet',
  startingBalance: 100000,
  pairs: ['EURUSD', 'GBPUSD'],
  sessions: [
    { name: 'Asia', startTime: '19:00', endTime: '00:00' },
    { name: 'Pre London', startTime: '00:00', endTime: '02:00' },
    { name: 'LOKZ', startTime: '02:00', endTime: '05:00' },
    { name: 'London', startTime: '05:00', endTime: '08:00' },
    { name: 'NYKZ', startTime: '08:00', endTime: '11:00' },
    { name: 'New York', startTime: '11:00', endTime: '15:00' },
    { name: 'Dead Time', startTime: '15:00', endTime: '19:00' },
  ],
  entryTypes: ['E1', 'E2', 'Shift', 'Other'],
  tfOptions: ['2m', '3m', '5m', '15m', '1h', '4h', 'D', 'W'],
  htfBiasOptions: ['Bullish', 'Bearish', 'Neutral'],
  h1BiasOptions: ['ProTrend', 'CounterTrend', 'Neutral'],
  divergenceOptions: ['Yes', 'No', 'Positive', 'Negative'],
  protractionOptions: ['0-SD', '1-SD', '2-SD'],
  highLowOptions: ['Protected', 'Unprotected'],
  arStDevOptions: ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5'],
  partialOptions: ['Imbalance', 'PWL/PWH', 'PDL/PDH', 'BSL/SSL', 'External+', 'BPR', 'OB', 'HL', 'AS H/L', 'LG', 'NY H/L'],
  fullPosOutOptions: ['Full TP', 'P + Full TP', 'P + BE', 'P + Trailed SL', 'BE', 'Full SL', 'P + SL', 'Manual Exit'],
};

export function createEmptyTrade(tradeNumber: number): Trade {
  return {
    id: crypto.randomUUID(),
    tradeNumber,
    labels: [],
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
    slPda: '',
    slPdaX: '',
    slPdaSpecifics: '',
    totalCbdr: 0,
    totalAr: 0,
    totalExpiryR: 0,
    p1: '',
    arStdev1: '',
    p2: '',
    arStdev2: '',
    fullPosOut: '',
    furtherPartials: '',
    exitNotes: '',
    weeklyBias: '',
    dailyBias: '',
    h4Bias: '',
    h1Bias: '',
    protraction: '',
    lqSweep: '',
    marketShift: '',
    divergence: '',
    divergencePosNeg: '',
    highLow: '',
    tradeNotes: '',
    emotions: '',
    keyNotes: '',
    tradeLinkFlow: '',
    tradeLinkFlux: '',
    tradeLinkETF: '',
    dxyLinkFlow: '',
    dxyLinkFlux: '',
    dxyLinkETF: '',
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
