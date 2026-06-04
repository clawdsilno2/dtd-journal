import { useState, useEffect, useCallback } from 'react';
import type { Trade, Settings } from './types';
import { DEFAULT_SETTINGS } from './types';

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
    id: 'sample-1', tradeNumber: 1, date: '2026-06-02', pair: 'XAUUSD', winLoss: 'Win', winLossSpecifics: 'Full Win', buySell: 'Buy',
    risk: 100, result: 210, commissions: -3.20, swaps: -0.80, entryTF: '5M', entryPrice: 2348.50, slPips: 50, tpPips: 100,
    entryType: 'E1', imbalance: true, orderBlock: true, supplyZone: false, ote: true,
    entryTime: '10:15', exitTime: '11:42', mfpPips: 105, mapPips: 18,
    p1: 50, arStdev1: 1.2, p2: 50, arStdev2: 0, fullPosOut: 'TP', furtherPartials: '',
    weeklyBias: 'Bullish', dailyBias: 'Bullish', h4Bias: 'Bullish', h1Bias: 'Bullish',
    protraction: false, lqSweep: true, marketShift: true, divergence: false, highLow: 'Low',
    emotions: 'Confident, followed the plan', keyNotes: 'Clean LOKZ sweep into OB, textbook E1', tradeLink: '', dxyLink: '',
  },
  {
    id: 'sample-2', tradeNumber: 2, date: '2026-06-02', pair: 'XAUUSD', winLoss: 'Loss', winLossSpecifics: 'Full Loss', buySell: 'Sell',
    risk: 100, result: -100, commissions: -3.10, swaps: 0, entryTF: '5M', entryPrice: 2355.20, slPips: 40, tpPips: 80,
    entryType: 'Shift', imbalance: true, orderBlock: false, supplyZone: true, ote: false,
    entryTime: '14:30', exitTime: '15:05', mfpPips: 30, mapPips: 42,
    p1: 0, arStdev1: 0, p2: 0, arStdev2: 0, fullPosOut: 'SL', furtherPartials: '',
    weeklyBias: 'Bullish', dailyBias: 'Bullish', h4Bias: 'Bearish', h1Bias: 'Bearish',
    protraction: true, lqSweep: false, marketShift: false, divergence: false, highLow: 'High',
    emotions: 'FOMO after missing the move', keyNotes: 'Counter-trend, no HTF confluence', tradeLink: '', dxyLink: '',
  },
  {
    id: 'sample-3', tradeNumber: 3, date: '2026-06-03', pair: 'EURUSD', winLoss: 'Win', winLossSpecifics: 'Partial Win', buySell: 'Buy',
    risk: 75, result: 112, commissions: -2.50, swaps: -0.40, entryTF: '15M', entryPrice: 1.08450, slPips: 15, tpPips: 30,
    entryType: 'E2', imbalance: false, orderBlock: true, supplyZone: false, ote: true,
    entryTime: '06:20', exitTime: '08:10', mfpPips: 28, mapPips: 5,
    p1: 15, arStdev1: 0.8, p2: 10, arStdev2: 1.5, fullPosOut: '', furtherPartials: 'Trailed stop',
    weeklyBias: 'Bearish', dailyBias: 'Neutral', h4Bias: 'Bullish', h1Bias: 'Bullish',
    protraction: false, lqSweep: true, marketShift: true, divergence: true, highLow: 'Low',
    emotions: 'Calm, patient entry', keyNotes: 'London open sweep with divergence confirmation', tradeLink: '', dxyLink: '',
  },
  {
    id: 'sample-4', tradeNumber: 4, date: '2026-06-03', pair: 'GBPUSD', winLoss: 'BE', winLossSpecifics: 'Breakeven', buySell: 'Sell',
    risk: 100, result: 2, commissions: -3.00, swaps: -0.50, entryTF: '5M', entryPrice: 1.27850, slPips: 20, tpPips: 40,
    entryType: 'E1', imbalance: true, orderBlock: true, supplyZone: false, ote: false,
    entryTime: '10:45', exitTime: '12:30', mfpPips: 22, mapPips: 19,
    p1: 20, arStdev1: 1.0, p2: 0, arStdev2: 0, fullPosOut: 'BE', furtherPartials: '',
    weeklyBias: 'Bearish', dailyBias: 'Bearish', h4Bias: 'Bearish', h1Bias: 'Neutral',
    protraction: true, lqSweep: true, marketShift: false, divergence: false, highLow: 'High',
    emotions: 'Hesitant, moved SL to BE early', keyNotes: 'Good setup but poor trade management', tradeLink: '', dxyLink: '',
  },
  {
    id: 'sample-5', tradeNumber: 5, date: '2026-06-04', pair: 'XAUUSD', winLoss: 'Win', winLossSpecifics: 'Full Win', buySell: 'Buy',
    risk: 150, result: 450, commissions: -4.80, swaps: -1.20, entryTF: '5M', entryPrice: 2362.00, slPips: 50, tpPips: 150,
    entryType: 'E1', imbalance: true, orderBlock: true, supplyZone: false, ote: true,
    entryTime: '10:05', exitTime: '13:20', mfpPips: 155, mapPips: 12,
    p1: 50, arStdev1: 1.0, p2: 50, arStdev2: 1.5, fullPosOut: 'TP', furtherPartials: 'Runner hit 3R',
    weeklyBias: 'Bullish', dailyBias: 'Bullish', h4Bias: 'Bullish', h1Bias: 'Bullish',
    protraction: false, lqSweep: true, marketShift: true, divergence: false, highLow: 'Low',
    emotions: 'Focused, best trade this week', keyNotes: 'NYKZ sweep, all TFs aligned, held full runner to 3R', tradeLink: '', dxyLink: '',
  },
];

const SAMPLE_SETTINGS: Settings = {
  ...DEFAULT_SETTINGS,
  accountName: 'DTD Challenge',
  propFirm: 'FTMO',
  startingBalance: 100000,
};

// --- Profile-scoped trades & settings ---

export function useTrades(profileId: string) {
  const key = `dtd-trades-${profileId}`;
  // Migrate old non-prefixed data into default profile
  const [trades, setTrades] = useState<Trade[]>(() => {
    const stored = loadJSON<Trade[]>(key, []);
    if (stored.length > 0) return stored;
    if (profileId === 'default') {
      const legacy = loadJSON<Trade[]>('dtd-trades', []);
      if (legacy.length > 0) return legacy;
      return SAMPLE_TRADES;
    }
    return [];
  });

  useEffect(() => { saveJSON(key, trades); }, [key, trades]);

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

export function useSettings(profileId: string) {
  const key = `dtd-settings-${profileId}`;
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = loadJSON<Settings | null>(key, null);
    if (stored?.accountName) return stored;
    if (profileId === 'default') {
      const legacy = loadJSON<Settings | null>('dtd-settings', null);
      if (legacy?.accountName) return legacy;
      return SAMPLE_SETTINGS;
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => { saveJSON(key, settings); }, [key, settings]);

  return { settings, setSettings };
}
