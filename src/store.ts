import { useState, useEffect, useCallback, useRef } from 'react';
import type { Trade, Settings } from './types';
import { DEFAULT_SETTINGS } from './types';

// --- Scheduled backup to GitHub (12:00 and 00:00) ---

function doBackup(instanceId: string) {
  try {
    const prefix = `dtd-${instanceId}-`;
    const profiles = JSON.parse(localStorage.getItem(`${prefix}profiles`) || '[]');
    const activeProfile = localStorage.getItem(`${prefix}active-profile`);
    const backup: Record<string, unknown> = { instanceId, profiles, activeProfile, backedUpAt: new Date().toISOString() };

    let totalTrades = 0;
    for (const p of profiles) {
      const trades = JSON.parse(localStorage.getItem(`${prefix}trades-${p.id}`) || '[]');
      totalTrades += trades.length;
      backup[`trades-${p.id}`] = trades;
      backup[`settings-${p.id}`] = JSON.parse(localStorage.getItem(`${prefix}settings-${p.id}`) || 'null');
    }

    if (totalTrades === 0) return;

    fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backup),
    }).catch(() => {});
  } catch {}
}

// Returns the most recent 12:00 or 00:00 slot as a timestamp string (YYYY-MM-DD-HH)
function getCurrentSlot(): string {
  const now = new Date();
  const h = now.getHours();
  const slot = h >= 12 ? 12 : 0;
  return `${now.toISOString().slice(0, 10)}-${slot}`;
}

let backupInterval: ReturnType<typeof setInterval> | null = null;

function startScheduledBackup(instanceId: string) {
  if (backupInterval) clearInterval(backupInterval);

  const checkAndBackup = () => {
    const slot = getCurrentSlot();
    const lastSlot = localStorage.getItem(`dtd-${instanceId}-last-backup-slot`);
    if (lastSlot === slot) return; // already backed up this slot

    doBackup(instanceId);
    localStorage.setItem(`dtd-${instanceId}-last-backup-slot`, slot);
  };

  // Check immediately (in case user opens app after a missed slot)
  setTimeout(checkAndBackup, 3000);
  // Then check every 5 minutes
  backupInterval = setInterval(checkAndBackup, 5 * 60 * 1000);
}

function stopScheduledBackup() {
  if (backupInterval) { clearInterval(backupInterval); backupInterval = null; }
}

// Also backup on first trade add (so new users get an immediate backup)
function triggerImmediateBackup(instanceId: string) {
  const lastSlot = localStorage.getItem(`dtd-${instanceId}-last-backup-slot`);
  if (!lastSlot) {
    // First ever backup for this instance — do it now
    setTimeout(() => doBackup(instanceId), 3000);
    localStorage.setItem(`dtd-${instanceId}-last-backup-slot`, getCurrentSlot());
  }
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

export function useProfiles(instanceId: string) {
  const prefix = `dtd-${instanceId}-`;

  const [profiles, setProfiles] = useState<Profile[]>(() =>
    loadJSON(`${prefix}profiles`, [DEFAULT_PROFILE])
  );
  const [activeId, setActiveId] = useState<string>(() =>
    loadJSON(`${prefix}active-profile`, 'default')
  );

  useEffect(() => { saveJSON(`${prefix}profiles`, profiles); }, [prefix, profiles]);
  useEffect(() => { saveJSON(`${prefix}active-profile`, activeId); }, [prefix, activeId]);
  useEffect(() => {
    setProfiles(loadJSON(`${prefix}profiles`, [DEFAULT_PROFILE]));
    setActiveId(loadJSON(`${prefix}active-profile`, 'default'));
  }, [prefix]);

  // Start/stop scheduled backup (12:00 and 00:00)
  useEffect(() => {
    if (instanceId) startScheduledBackup(instanceId);
    return () => stopScheduledBackup();
  }, [instanceId]);

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

// --- Trade migration ---

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
    id: '', tradeNumber: 0, labels: [], date: '', pair: '', winLoss: '', winLossSpecifics: '', buySell: '',
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

// --- Trades & Settings (scoped by instanceId + profileId) ---

function loadTrades(instanceId: string, profileId: string): Trade[] {
  const key = `dtd-${instanceId}-trades-${profileId}`;
  const stored = loadJSON<Partial<Trade>[]>(key, []);
  if (stored.length > 0) return stored.map(migrateTrade);
  return [];
}

export function useTrades(instanceId: string, profileId: string) {
  const key = `dtd-${instanceId}-trades-${profileId}`;
  const [trades, setTrades] = useState<Trade[]>(() => loadTrades(instanceId, profileId));

  useEffect(() => { setTrades(loadTrades(instanceId, profileId)); }, [instanceId, profileId]);

  const isFirst = useRef(true);
  useEffect(() => {
    saveJSON(key, trades);
    if (isFirst.current) { isFirst.current = false; return; }
    // Immediate backup on first trade add (so new users don't wait 12h)
    triggerImmediateBackup(instanceId);
  }, [key, trades, instanceId]);

  const archiveKey = `dtd-${instanceId}-deleted-${profileId}`;

  const addTrade = useCallback((trade: Trade) => { setTrades(prev => [...prev, trade]); }, []);
  const updateTrade = useCallback((id: string, updates: Partial<Trade>) => { setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)); }, []);
  const deleteTrade = useCallback((id: string) => {
    setTrades(prev => {
      const trade = prev.find(t => t.id === id);
      if (trade) {
        const archived = loadJSON<Trade[]>(archiveKey, []);
        archived.push(trade);
        saveJSON(archiveKey, archived.slice(-3));
      }
      return prev.filter(t => t.id !== id);
    });
  }, [archiveKey]);

  const getDeletedTrades = useCallback(() => loadJSON<Trade[]>(archiveKey, []), [archiveKey]);

  const restoreTrade = useCallback((id: string) => {
    const archived = loadJSON<Trade[]>(archiveKey, []);
    const trade = archived.find(t => t.id === id);
    if (trade) {
      saveJSON(archiveKey, archived.filter(t => t.id !== id));
      setTrades(prev => [...prev, trade]);
    }
  }, [archiveKey]);

  return { trades, setTrades, addTrade, updateTrade, deleteTrade, getDeletedTrades, restoreTrade };
}

function mergeSettings(stored: Partial<Settings> | null, defaults: Settings): Settings {
  if (!stored) return defaults;
  return { ...defaults, ...stored };
}

function loadSettings(instanceId: string, profileId: string): Settings {
  const key = `dtd-${instanceId}-settings-${profileId}`;
  const stored = loadJSON<Partial<Settings> | null>(key, null);
  if (stored) return mergeSettings(stored, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export function useSettings(instanceId: string, profileId: string) {
  const key = `dtd-${instanceId}-settings-${profileId}`;
  const [settings, setSettings] = useState<Settings>(() => loadSettings(instanceId, profileId));

  useEffect(() => { setSettings(loadSettings(instanceId, profileId)); }, [instanceId, profileId]);

  useEffect(() => {
    saveJSON(key, settings);
  }, [key, settings]);

  return { settings, setSettings };
}
