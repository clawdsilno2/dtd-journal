import { useState, useEffect, useCallback, useRef } from 'react';
import type { Trade, Settings } from './types';
import { DEFAULT_SETTINGS } from './types';

// --- Auto-backup to GitHub ---

let backupTimer: ReturnType<typeof setTimeout> | null = null;

function triggerBackup(userKey: string) {
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    try {
      const prefix = `dtd-${userKey}-`;
      const profiles = JSON.parse(localStorage.getItem(`${prefix}profiles`) || '[]');
      const activeProfile = localStorage.getItem(`${prefix}active-profile`);
      const label = localStorage.getItem('dtd-active-label') || userKey;
      const backup: Record<string, unknown> = { userKey, username: label, profiles, activeProfile, backedUpAt: new Date().toISOString() };
      for (const p of profiles) {
        backup[`trades-${p.id}`] = JSON.parse(localStorage.getItem(`${prefix}trades-${p.id}`) || '[]');
        backup[`settings-${p.id}`] = JSON.parse(localStorage.getItem(`${prefix}settings-${p.id}`) || 'null');
      }

      fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup),
      }).catch(() => { /* silent fail */ });
    } catch { /* silent fail */ }
  }, 5000);
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

// --- Profiles (namespaced by userKey) ---

export interface Profile {
  id: string;
  name: string;
}

const DEFAULT_PROFILE: Profile = { id: 'default', name: 'My Journal' };

export function useProfiles(userKey: string) {
  const prefix = `dtd-${userKey}-`;

  const [profiles, setProfiles] = useState<Profile[]>(() =>
    loadJSON(`${prefix}profiles`, [DEFAULT_PROFILE])
  );
  const [activeId, setActiveId] = useState<string>(() =>
    loadJSON(`${prefix}active-profile`, 'default')
  );

  useEffect(() => { saveJSON(`${prefix}profiles`, profiles); }, [prefix, profiles]);
  useEffect(() => { saveJSON(`${prefix}active-profile`, activeId); }, [prefix, activeId]);

  // Reload when userKey changes
  useEffect(() => {
    setProfiles(loadJSON(`${prefix}profiles`, [DEFAULT_PROFILE]));
    setActiveId(loadJSON(`${prefix}active-profile`, 'default'));
  }, [prefix]);

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
    localStorage.removeItem(`${prefix}trades-${id}`);
    localStorage.removeItem(`${prefix}settings-${id}`);
    setActiveId(prev => prev === id ? 'default' : prev);
  }, [prefix]);

  const renameProfile = useCallback((id: string, name: string) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  }, []);

  return { profiles, activeProfile, activeId, setActiveId, createProfile, deleteProfile, renameProfile };
}

// --- Trade migration (handles old data formats) ---

function migrateTrade(raw: Partial<Trade>): Trade {
  const legacy = raw as Record<string, unknown>;
  const migrateStr = (v: unknown): string => {
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'number') return v ? String(v) : '';
    return (v as string) || '';
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

// --- Profile-scoped trades & settings (namespaced by userKey) ---

function loadTrades(userKey: string, profileId: string): Trade[] {
  const key = `dtd-${userKey}-trades-${profileId}`;
  const stored = loadJSON<Partial<Trade>[]>(key, []);
  if (stored.length > 0) return stored.map(migrateTrade);
  return [];
}

export function useTrades(userKey: string, profileId: string) {
  const key = `dtd-${userKey}-trades-${profileId}`;
  const [trades, setTrades] = useState<Trade[]>(() => loadTrades(userKey, profileId));

  useEffect(() => { setTrades(loadTrades(userKey, profileId)); }, [userKey, profileId]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    saveJSON(key, trades);
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    triggerBackup(userKey);
  }, [key, trades, userKey]);

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

function mergeSettings(stored: Partial<Settings> | null, defaults: Settings): Settings {
  if (!stored) return defaults;
  return { ...defaults, ...stored };
}

function loadSettings(userKey: string, profileId: string): Settings {
  const key = `dtd-${userKey}-settings-${profileId}`;
  const stored = loadJSON<Partial<Settings> | null>(key, null);
  if (stored?.accountName) return mergeSettings(stored, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export function useSettings(userKey: string, profileId: string) {
  const key = `dtd-${userKey}-settings-${profileId}`;
  const [settings, setSettings] = useState<Settings>(() => loadSettings(userKey, profileId));

  useEffect(() => { setSettings(loadSettings(userKey, profileId)); }, [userKey, profileId]);

  const isFirstSettingsRender = useRef(true);
  useEffect(() => {
    saveJSON(key, settings);
    if (isFirstSettingsRender.current) { isFirstSettingsRender.current = false; return; }
    triggerBackup(userKey);
  }, [key, settings, userKey]);

  return { settings, setSettings };
}
