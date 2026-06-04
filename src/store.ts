import { useState, useEffect, useCallback, useRef } from 'react';
import type { Trade, Settings } from './types';
import { DEFAULT_SETTINGS } from './types';

// --- Auto-backup to GitHub ---

let backupTimer: ReturnType<typeof setTimeout> | null = null;

function triggerBackup() {
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    try {
      // Collect all profile data from localStorage
      const profiles = JSON.parse(localStorage.getItem('dtd-profiles') || '[]');
      const activeProfile = localStorage.getItem('dtd-active-profile');
      const backup: Record<string, unknown> = { profiles, activeProfile, backedUpAt: new Date().toISOString() };
      for (const p of profiles) {
        backup[`trades-${p.id}`] = JSON.parse(localStorage.getItem(`dtd-trades-${p.id}`) || '[]');
        backup[`settings-${p.id}`] = JSON.parse(localStorage.getItem(`dtd-settings-${p.id}`) || 'null');
      }
      // Also grab legacy keys
      const legacyTrades = localStorage.getItem('dtd-trades');
      const legacySettings = localStorage.getItem('dtd-settings');
      if (legacyTrades) backup['trades-legacy'] = JSON.parse(legacyTrades);
      if (legacySettings) backup['settings-legacy'] = JSON.parse(legacySettings);

      fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup),
      }).catch(() => { /* silent fail */ });
    } catch { /* silent fail */ }
  }, 5000); // 5s debounce
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Profiles ---

export interface Profile {
  id: string;
  name: string;
}

const DEFAULT_PROFILE: Profile = { id: 'default', name: 'My Journal' };

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>(() =>
    loadJSON('dtd-profiles', [DEFAULT_PROFILE])
  );
  const [activeId, setActiveId] = useState<string>(() =>
    loadJSON('dtd-active-profile', 'default')
  );

  useEffect(() => { saveJSON('dtd-profiles', profiles); }, [profiles]);
  useEffect(() => { saveJSON('dtd-active-profile', activeId); }, [activeId]);

  const activeProfile = profiles.find(p => p.id === activeId) || profiles[0];

  const createProfile = useCallback((name: string) => {
    const id = crypto.randomUUID();
    setProfiles(prev => [...prev, { id, name }]);
    setActiveId(id);
    return id;
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => {
      const next = prev.filter(p => p.id !== id);
      if (next.length === 0) next.push(DEFAULT_PROFILE);
      return next;
    });
    localStorage.removeItem(`dtd-trades-${id}`);
    localStorage.removeItem(`dtd-settings-${id}`);
    setActiveId(prev => prev === id ? 'default' : prev);
  }, []);

  const renameProfile = useCallback((id: string, name: string) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  }, []);

  return { profiles, activeProfile, activeId, setActiveId, createProfile, deleteProfile, renameProfile };
}

// --- Sample data (only for default profile on first load) ---

const SAMPLE_TRADES: Trade[] = [
  {
    id: 'sample-1', tradeNumber: 1, date: '2026-06-02', pair: 'EURUSD', winLoss: 'W', winLossSpecifics: '', buySell: 'Buy',
    risk: 100, result: 210, commissions: -3.20, swaps: -0.80, entryTF: '5m', entryPrice: 1.08450, slPips: 15, tpPips: 30,
    entryType: 'E1', imbalance: true, orderBlock: true, supplyZone: false, ote: true,
    entryTime: '10:15', exitTime: '11:42', mfpPips: 32, mapPips: 5,
    p1: 15, arStdev1: '1.5', p2: 15, arStdev2: '2', fullPosOut: 'Full TP', furtherPartials: '', exitNotes: '',
    weeklyBias: 'Bullish', dailyBias: 'Bullish', h4Bias: 'Bullish', h1Bias: 'ProTrend',
    protraction: '0-SD', lqSweep: 'Yes', marketShift: 'Yes', divergence: 'No', divergencePosNeg: '', highLow: 'Protected',
    tradeNotes: 'Clean LOKZ sweep into OB, textbook E1', emotions: 'Confident, followed the plan', keyNotes: '',
    tradeLinkFlow: '', tradeLinkFlux: '', tradeLinkETF: '', dxyLinkFlow: '', dxyLinkFlux: '', dxyLinkETF: '',
  },
  {
    id: 'sample-2', tradeNumber: 2, date: '2026-06-02', pair: 'GBPUSD', winLoss: 'L', winLossSpecifics: '', buySell: 'Sell',
    risk: 100, result: -100, commissions: -3.10, swaps: 0, entryTF: '5m', entryPrice: 1.27850, slPips: 20, tpPips: 40,
    entryType: 'Shift', imbalance: true, orderBlock: false, supplyZone: true, ote: false,
    entryTime: '14:30', exitTime: '15:05', mfpPips: 15, mapPips: 22,
    p1: 0, arStdev1: '', p2: 0, arStdev2: '', fullPosOut: 'Full SL', furtherPartials: '', exitNotes: '',
    weeklyBias: 'Bullish', dailyBias: 'Bullish', h4Bias: 'Bearish', h1Bias: 'CounterTrend',
    protraction: '1-SD', lqSweep: 'No', marketShift: 'No', divergence: 'No', divergencePosNeg: '', highLow: 'Unprotected',
    tradeNotes: 'Counter-trend, no HTF confluence', emotions: 'FOMO after missing the move', keyNotes: '',
    tradeLinkFlow: '', tradeLinkFlux: '', tradeLinkETF: '', dxyLinkFlow: '', dxyLinkFlux: '', dxyLinkETF: '',
  },
  {
    id: 'sample-3', tradeNumber: 3, date: '2026-06-03', pair: 'EURUSD', winLoss: 'W', winLossSpecifics: '', buySell: 'Buy',
    risk: 75, result: 112, commissions: -2.50, swaps: -0.40, entryTF: '15m', entryPrice: 1.08450, slPips: 15, tpPips: 30,
    entryType: 'E2', imbalance: false, orderBlock: true, supplyZone: false, ote: true,
    entryTime: '03:20', exitTime: '05:10', mfpPips: 28, mapPips: 5,
    p1: 15, arStdev1: '1', p2: 10, arStdev2: '2', fullPosOut: 'P + Trailed SL', furtherPartials: '', exitNotes: '',
    weeklyBias: 'Bearish', dailyBias: 'Neutral', h4Bias: 'Bullish', h1Bias: 'ProTrend',
    protraction: '0-SD', lqSweep: 'Yes', marketShift: 'Yes', divergence: 'Positive', divergencePosNeg: '+', highLow: 'Protected',
    tradeNotes: 'London open sweep with divergence confirmation', emotions: 'Calm, patient entry', keyNotes: '',
    tradeLinkFlow: '', tradeLinkFlux: '', tradeLinkETF: '', dxyLinkFlow: '', dxyLinkFlux: '', dxyLinkETF: '',
  },
  {
    id: 'sample-4', tradeNumber: 4, date: '2026-06-03', pair: 'GBPUSD', winLoss: 'BE', winLossSpecifics: '', buySell: 'Sell',
    risk: 100, result: 2, commissions: -3.00, swaps: -0.50, entryTF: '5m', entryPrice: 1.27850, slPips: 20, tpPips: 40,
    entryType: 'E1', imbalance: true, orderBlock: true, supplyZone: false, ote: false,
    entryTime: '08:45', exitTime: '10:30', mfpPips: 22, mapPips: 19,
    p1: 20, arStdev1: '1.5', p2: 0, arStdev2: '', fullPosOut: 'P + BE', furtherPartials: '', exitNotes: '',
    weeklyBias: 'Bearish', dailyBias: 'Bearish', h4Bias: 'Bearish', h1Bias: 'CounterTrend',
    protraction: '2-SD', lqSweep: 'Yes', marketShift: 'No', divergence: 'No', divergencePosNeg: '', highLow: 'Unprotected',
    tradeNotes: 'Good setup but poor trade management', emotions: 'Hesitant, moved SL to BE early', keyNotes: '',
    tradeLinkFlow: '', tradeLinkFlux: '', tradeLinkETF: '', dxyLinkFlow: '', dxyLinkFlux: '', dxyLinkETF: '',
  },
  {
    id: 'sample-5', tradeNumber: 5, date: '2026-06-04', pair: 'EURUSD', winLoss: 'W', winLossSpecifics: '', buySell: 'Buy',
    risk: 150, result: 450, commissions: -4.80, swaps: -1.20, entryTF: '5m', entryPrice: 1.09200, slPips: 15, tpPips: 45,
    entryType: 'E1', imbalance: true, orderBlock: true, supplyZone: false, ote: true,
    entryTime: '09:05', exitTime: '12:20', mfpPips: 47, mapPips: 3,
    p1: 15, arStdev1: '1', p2: 15, arStdev2: '2', fullPosOut: 'Full TP', furtherPartials: 'Runner hit 3R', exitNotes: '',
    weeklyBias: 'Bullish', dailyBias: 'Bullish', h4Bias: 'Bullish', h1Bias: 'ProTrend',
    protraction: '0-SD', lqSweep: 'Yes', marketShift: 'Yes', divergence: 'No', divergencePosNeg: '', highLow: 'Protected',
    tradeNotes: 'NYKZ sweep, all TFs aligned, held full runner to 3R', emotions: 'Focused, best trade this week', keyNotes: '',
    tradeLinkFlow: '', tradeLinkFlux: '', tradeLinkETF: '', dxyLinkFlow: '', dxyLinkFlux: '', dxyLinkETF: '',
  },
];

const SAMPLE_SETTINGS: Settings = {
  ...DEFAULT_SETTINGS,
  accountName: 'AO Trader',
  dashboardName: 'Data Collection Sheet',
  startingBalance: 100000,
};

// --- Profile-scoped trades & settings ---

// Backfill missing fields on old trades so nothing crashes
function migrateTrade(raw: Partial<Trade>): Trade {
  // Cast to any to read legacy fields that no longer exist on the type
  const legacy = raw as Record<string, unknown>;

  // Migrate fields that changed type (boolean→string, number→string, renamed)
  const migrateStr = (v: unknown, fallback = ''): string => {
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'number') return v ? String(v) : '';
    return (v as string) || fallback;
  };
  const wl = legacy.winLoss as string || '';
  const winLoss = (wl === 'Win' ? 'W' : wl === 'Loss' ? 'L' : wl) as Trade['winLoss'];

  const base: Trade = {
    id: '', tradeNumber: 0, date: '', pair: '', winLoss: '', winLossSpecifics: '', buySell: '',
    risk: 0, result: 0, commissions: 0, swaps: 0,
    entryTF: '', entryPrice: 0, slPips: 0, tpPips: 0,
    entryType: '', imbalance: false, orderBlock: false, supplyZone: false, ote: false,
    entryTime: '', exitTime: '', mfpPips: 0, mapPips: 0,
    p1: 0, arStdev1: '', p2: 0, arStdev2: '', fullPosOut: '', furtherPartials: '', exitNotes: '',
    weeklyBias: '', dailyBias: '', h4Bias: '', h1Bias: '',
    protraction: '', lqSweep: '', marketShift: '', divergence: '', divergencePosNeg: '', highLow: '',
    tradeNotes: '', emotions: '', keyNotes: '',
    tradeLinkFlow: '', tradeLinkFlux: '', tradeLinkETF: '',
    dxyLinkFlow: '', dxyLinkFlux: '', dxyLinkETF: '',
  };

  return {
    ...base,
    ...raw,
    winLoss,
    protraction: typeof legacy.protraction === 'boolean' ? '' : migrateStr(legacy.protraction),
    lqSweep: migrateStr(legacy.lqSweep),
    marketShift: migrateStr(legacy.marketShift),
    divergence: migrateStr(legacy.divergence),
    divergencePosNeg: (raw.divergencePosNeg as string) || '',
    arStdev1: migrateStr(legacy.arStdev1),
    arStdev2: migrateStr(legacy.arStdev2),
    exitNotes: (raw.exitNotes as string) || '',
    tradeNotes: (raw.tradeNotes as string) || '',
    tradeLinkFlow: (raw.tradeLinkFlow as string) || (legacy.tradeLink as string) || '',
    tradeLinkFlux: (raw.tradeLinkFlux as string) || '',
    tradeLinkETF: (raw.tradeLinkETF as string) || '',
    dxyLinkFlow: (raw.dxyLinkFlow as string) || (legacy.dxyLink as string) || '',
    dxyLinkFlux: (raw.dxyLinkFlux as string) || '',
    dxyLinkETF: (raw.dxyLinkETF as string) || '',
  };
}

function loadTrades(profileId: string): Trade[] {
  const key = `dtd-trades-${profileId}`;
  const stored = loadJSON<Partial<Trade>[]>(key, []);
  if (stored.length > 0) return stored.map(migrateTrade);
  if (profileId === 'default') {
    const legacy = loadJSON<Partial<Trade>[]>('dtd-trades', []);
    if (legacy.length > 0) return legacy.map(migrateTrade);
    return SAMPLE_TRADES;
  }
  return [];
}

export function useTrades(profileId: string) {
  const key = `dtd-trades-${profileId}`;
  const [trades, setTrades] = useState<Trade[]>(() => loadTrades(profileId));

  // Reload when profile changes
  useEffect(() => { setTrades(loadTrades(profileId)); }, [profileId]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    saveJSON(key, trades);
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    triggerBackup();
  }, [key, trades]);

  const addTrade = useCallback((trade: Trade) => {
    setTrades(prev => [...prev, trade]);
  }, []);

  const updateTrade = useCallback((id: string, updates: Partial<Trade>) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  }, []);

  return { trades, setTrades, addTrade, updateTrade, deleteTrade };
}

// Merge stored settings with defaults so new fields always exist
function mergeSettings(stored: Partial<Settings> | null, defaults: Settings): Settings {
  if (!stored) return defaults;
  return { ...defaults, ...stored };
}

function loadSettings(profileId: string): Settings {
  const key = `dtd-settings-${profileId}`;
  const stored = loadJSON<Partial<Settings> | null>(key, null);
  if (stored?.accountName) return mergeSettings(stored, DEFAULT_SETTINGS);
  if (profileId === 'default') {
    const legacy = loadJSON<Partial<Settings> | null>('dtd-settings', null);
    if (legacy?.accountName) return mergeSettings(legacy, SAMPLE_SETTINGS);
    return SAMPLE_SETTINGS;
  }
  return DEFAULT_SETTINGS;
}

export function useSettings(profileId: string) {
  const key = `dtd-settings-${profileId}`;
  const [settings, setSettings] = useState<Settings>(() => loadSettings(profileId));

  // Reload when profile changes
  useEffect(() => { setSettings(loadSettings(profileId)); }, [profileId]);

  const isFirstSettingsRender = useRef(true);
  useEffect(() => {
    saveJSON(key, settings);
    if (isFirstSettingsRender.current) { isFirstSettingsRender.current = false; return; }
    triggerBackup();
  }, [key, settings]);

  return { settings, setSettings };
}
