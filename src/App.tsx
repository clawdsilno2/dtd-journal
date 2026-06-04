import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Trades from './pages/Trades';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import SettingsPage from './pages/SettingsPage';
import Guide from './pages/Guide';
import { useTrades, useSettings, useProfiles } from './store';
import { Plus } from 'lucide-react';

interface InstanceInfo {
  id: string;
  name: string;
  createdAt: string;
}

// --- Landing: list all instances ---
function LandingPage({ onSelect, onCreate }: { onSelect: (inst: InstanceInfo) => void; onCreate: () => void }) {
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

// --- Main journal app (with view/edit mode) ---
function JournalApp({ instanceId, instanceName, mode, onExit }: {
  instanceId: string;
  instanceName: string;
  mode: 'edit' | 'view';
  onExit: () => void;
}) {
  const { profiles, activeProfile, activeId, setActiveId, createProfile, deleteProfile, renameProfile } = useProfiles(instanceId);
  const { trades, addTrade, updateTrade, deleteTrade } = useTrades(instanceId, activeId);
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
          <Route path="/" element={
            <Trades
              trades={trades}
              settings={settings}
              addTrade={isView ? undefined : addTrade}
              updateTrade={isView ? undefined : updateTrade}
              deleteTrade={isView ? undefined : deleteTrade}
              viewOnly={isView}
            />
          } />
          <Route path="/dashboard" element={<Dashboard trades={trades} settings={settings} />} />
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

  if (screen.page === 'landing') {
    return (
      <LandingPage
        onSelect={inst => setScreen({ page: 'access', instance: inst })}
        onCreate={() => setScreen({ page: 'create' })}
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
    <JournalApp
      instanceId={screen.instanceId}
      instanceName={screen.instanceName}
      mode={screen.mode}
      onExit={() => setScreen({ page: 'landing' })}
    />
  );
}
