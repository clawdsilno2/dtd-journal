import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Trades from './pages/Trades';
import Dashboard from './pages/Dashboard';
import ReturnPage from './pages/ReturnPage';
import RiskPage from './pages/RiskPage';
import CalendarView from './pages/CalendarView';
import SettingsPage from './pages/SettingsPage';
import Guide from './pages/Guide';
import { useTrades, useSettings, useProfiles } from './store';
import { DEMO_TRADES } from './demoData';
import { DEFAULT_SETTINGS } from './types';
import { Plus, Play } from 'lucide-react';

interface InstanceInfo {
  id: string;
  name: string;
  createdAt: string;
}

// --- Landing: list all instances ---
function LandingPage({ onSelect, onCreate, onDemo }: { onSelect: (inst: InstanceInfo) => void; onCreate: () => void; onDemo: () => void }) {
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/instances')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setInstances(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">DTD Journal</h1>
          <p className="text-sm text-text-secondary mt-1">Select a journal or create a new one</p>
        </div>

        {loading ? (
          <p className="text-center text-text-secondary text-sm">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {instances.map(inst => (
              <button
                key={inst.id}
                onClick={() => onSelect(inst)}
                className="bg-bg-secondary border border-border rounded-xl p-5 text-left hover:border-accent/50 transition-colors"
              >
                <p className="text-sm font-semibold text-text-primary">{inst.name}</p>
                <p className="text-xs text-text-secondary mt-1">Created {new Date(inst.createdAt).toLocaleDateString()}</p>
              </button>
            ))}
            <button
              onClick={onCreate}
              className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-accent/50 transition-colors"
            >
              <Plus size={20} className="text-text-secondary" />
              <p className="text-sm text-text-secondary">New Journal</p>
            </button>
            <button
              onClick={onDemo}
              className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-accent/50 border-accent/30 transition-colors"
            >
              <Play size={20} className="text-accent" />
              <p className="text-sm text-accent">Demo Journal</p>
              <p className="text-[10px] text-text-secondary">20 sample trades</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Create instance ---
function CreatePage({ onCreated, onBack }: { onCreated: (id: string) => void; onBack: () => void }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !password.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', name: name.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (data.id) {
        onCreated(data.id);
      } else {
        setError(data.error || 'Failed to create');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="bg-bg-secondary rounded-xl border border-border p-8 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Create New Journal</h2>
        <div>
          <label className="text-xs text-text-secondary font-medium block mb-1">Journal Name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Sil's Journal"
            className="w-full text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary font-medium block mb-1">Editor Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="Password to edit this journal"
            className="w-full text-sm"
          />
        </div>
        {error && <p className="text-xs text-red">{error}</p>}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || !password.trim() || loading}
          className="w-full px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
        >
          {loading ? 'Creating...' : 'Create Journal'}
        </button>
        <button onClick={onBack} className="w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
          Back
        </button>
      </div>
    </div>
  );
}

// --- Access prompt: password or view-only ---
function AccessPrompt({ instance, onAccess, onBack }: {
  instance: InstanceInfo;
  onAccess: (mode: 'edit' | 'view') => void;
  onBack: () => void;
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', instanceId: instance.id, password: password.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        onAccess('edit');
      } else {
        setError('Wrong password');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="bg-bg-secondary rounded-xl border border-border p-8 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold text-text-primary">{instance.name}</h2>
        <p className="text-sm text-text-secondary">Enter the password for editor access</p>
        <input
          autoFocus
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleVerify(); }}
          placeholder="Editor password..."
          className="w-full text-sm"
        />
        {error && <p className="text-xs text-red">{error}</p>}
        <button
          onClick={handleVerify}
          disabled={!password.trim() || loading}
          className="w-full px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
        >
          {loading ? 'Verifying...' : 'Enter as Editor'}
        </button>
        <button
          onClick={() => onAccess('view')}
          className="w-full px-4 py-2 text-sm bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary transition-colors"
        >
          I just want to view it
        </button>
        <button onClick={onBack} className="w-full text-xs text-text-secondary hover:text-text-primary transition-colors pt-2">
          Back to all journals
        </button>
      </div>
    </div>
  );
}

// --- Sync from GitHub backup on load (merge by trade ID — always adds missing trades) ---
function useRestoreFromBackup(instanceId: string) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prefix = `dtd-${instanceId}-`;

    fetch(`/api/backup?id=${encodeURIComponent(instanceId)}`)
      .then(r => { if (r.ok) return r.json(); throw new Error('no backup'); })
      .then(data => {
        if (!data || typeof data !== 'object') return;

        // Merge profiles: union by ID
        const localProfiles: {id: string; name: string}[] = JSON.parse(localStorage.getItem(`${prefix}profiles`) || '[]');
        const remoteProfiles: {id: string; name: string}[] = data.profiles || [];
        const profileMap = new Map(localProfiles.map(p => [p.id, p]));
        for (const p of remoteProfiles) {
          if (!profileMap.has(p.id)) profileMap.set(p.id, p);
        }
        const mergedProfiles = [...profileMap.values()];
        localStorage.setItem(`${prefix}profiles`, JSON.stringify(mergedProfiles));

        // Merge trades per profile: union by trade ID, respecting tombstones
        for (const p of mergedProfiles) {
          const tradesKey = `${prefix}trades-${p.id}`;
          const tombstoneKey = `${prefix}tombstones-${p.id}`;
          const localTrades: {id: string}[] = JSON.parse(localStorage.getItem(tradesKey) || '[]');
          const remoteTrades: {id: string}[] = data[`trades-${p.id}`] || [];

          // Merge tombstones from both sides
          const localTombstones: string[] = JSON.parse(localStorage.getItem(tombstoneKey) || '[]');
          const remoteTombstones: string[] = data[`tombstones-${p.id}`] || [];
          const allTombstones = new Set([...localTombstones, ...remoteTombstones]);
          localStorage.setItem(tombstoneKey, JSON.stringify([...allTombstones]));

          // Union trades, skip anything in tombstones
          const localIds = new Set(localTrades.map(t => t.id));
          const merged = localTrades.filter(t => !allTombstones.has(t.id));
          for (const rt of remoteTrades) {
            if (!localIds.has(rt.id) && !allTombstones.has(rt.id)) merged.push(rt);
          }
          localStorage.setItem(tradesKey, JSON.stringify(merged));

          // Sync settings if local is empty
          const settingsKey = `${prefix}settings-${p.id}`;
          const remoteSettings = data[`settings-${p.id}`];
          if (remoteSettings && !localStorage.getItem(settingsKey)) {
            localStorage.setItem(settingsKey, JSON.stringify(remoteSettings));
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        window.dispatchEvent(new Event('dtd-synced'));
        setReady(true);
      });
  }, [instanceId]);

  return ready;
}

// --- Main journal app (with view/edit mode) ---
function JournalAppLoader({ instanceId, instanceName, mode, onExit }: {
  instanceId: string;
  instanceName: string;
  mode: 'edit' | 'view';
  onExit: () => void;
}) {
  const ready = useRestoreFromBackup(instanceId);

  if (!ready) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-secondary text-sm">Loading journal...</p>
      </div>
    );
  }

  // Key forces remount after restore so hooks read fresh localStorage
  return <JournalAppInner key={instanceId + '-ready'} instanceId={instanceId} instanceName={instanceName} mode={mode} onExit={onExit} />;
}

function JournalAppInner({ instanceId, instanceName, mode, onExit }: {
  instanceId: string;
  instanceName: string;
  mode: 'edit' | 'view';
  onExit: () => void;
}) {
  const { profiles, activeProfile, activeId, setActiveId, createProfile, deleteProfile, renameProfile } = useProfiles(instanceId);
  const { trades, addTrade, updateTrade, deleteTrade, getDeletedTrades, restoreTrade } = useTrades(instanceId, activeId);
  const { settings, setSettings } = useSettings(instanceId, activeId);

  const isView = mode === 'view';

  return (
    <BrowserRouter>
      <Routes>
        <Route element={
          <Layout
            profiles={profiles}
            activeProfile={activeProfile}
            onSwitchProfile={setActiveId}
            onCreateProfile={createProfile}
            onDeleteProfile={deleteProfile}
            onRenameProfile={renameProfile}
            onExit={onExit}
            instanceName={instanceName}
            viewOnly={isView}
          />
        }>
          <Route path="/" element={<Dashboard trades={trades} settings={settings} />} />
          <Route path="/return" element={<ReturnPage trades={trades} settings={settings} />} />
          <Route path="/risk" element={<RiskPage trades={trades} settings={settings} />} />
          <Route path="/trades" element={
            <Trades
              trades={trades}
              settings={settings}
              addTrade={isView ? undefined : addTrade}
              updateTrade={isView ? undefined : updateTrade}
              deleteTrade={isView ? undefined : deleteTrade}
              getDeletedTrades={isView ? undefined : getDeletedTrades}
              restoreTrade={isView ? undefined : restoreTrade}
              viewOnly={isView}
            />
          } />
          <Route path="/calendar" element={<CalendarView trades={trades} />} />
          <Route path="/settings" element={<SettingsPage settings={settings} setSettings={isView ? undefined : setSettings} viewOnly={isView} />} />
          <Route path="/guide" element={<Guide />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// --- Root app: state machine ---
type Screen =
  | { page: 'landing' }
  | { page: 'create' }
  | { page: 'access'; instance: InstanceInfo }
  | { page: 'journal'; instanceId: string; instanceName: string; mode: 'edit' | 'view' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ page: 'landing' });

  const handleLoadDemo = () => {
    const demoId = 'demo-' + Date.now().toString(36);
    const prefix = `dtd-${demoId}-`;
    // Seed localStorage with demo data
    localStorage.setItem(`${prefix}profiles`, JSON.stringify([{ id: 'default', name: 'Demo' }]));
    localStorage.setItem(`${prefix}active-profile`, JSON.stringify('default'));
    localStorage.setItem(`${prefix}trades-default`, JSON.stringify(DEMO_TRADES));
    localStorage.setItem(`${prefix}settings-default`, JSON.stringify({
      ...DEFAULT_SETTINGS,
      accountName: 'Demo Trader',
      dashboardName: 'Demo Journal',
      startingBalance: 100000,
    }));
    setScreen({ page: 'journal', instanceId: demoId, instanceName: 'Demo Journal', mode: 'edit' });
  };

  if (screen.page === 'landing') {
    return (
      <LandingPage
        onSelect={inst => setScreen({ page: 'access', instance: inst })}
        onCreate={() => setScreen({ page: 'create' })}
        onDemo={handleLoadDemo}
      />
    );
  }

  if (screen.page === 'create') {
    return (
      <CreatePage
        onCreated={id => setScreen({ page: 'journal', instanceId: id, instanceName: 'New Journal', mode: 'edit' })}
        onBack={() => setScreen({ page: 'landing' })}
      />
    );
  }

  if (screen.page === 'access') {
    return (
      <AccessPrompt
        instance={screen.instance}
        onAccess={mode => setScreen({ page: 'journal', instanceId: screen.instance.id, instanceName: screen.instance.name, mode })}
        onBack={() => setScreen({ page: 'landing' })}
      />
    );
  }

  return (
    <JournalAppLoader
      instanceId={screen.instanceId}
      instanceName={screen.instanceName}
      mode={screen.mode}
      onExit={() => setScreen({ page: 'landing' })}
    />
  );
}
