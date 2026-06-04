import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Trades from './pages/Trades';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import SettingsPage from './pages/SettingsPage';
import Guide from './pages/Guide';
import { useTrades, useSettings, useProfiles } from './store';

function LoginPrompt({ onSubmit }: { onSubmit: (key: string) => void }) {
  const [pass, setPass] = useState('');
  return (
    <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-xl border border-border p-8 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold text-text-primary">DTD Journal</h2>
        <p className="text-sm text-text-secondary">Enter your passphrase to access your journal.</p>
        <input
          autoFocus
          type="password"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && pass.trim()) onSubmit(pass.trim()); }}
          placeholder="Passphrase..."
          className="w-full text-sm"
        />
        <button
          onClick={() => { if (pass.trim()) onSubmit(pass.trim()); }}
          disabled={!pass.trim()}
          className="w-full px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
        >
          Enter
        </button>
      </div>
    </div>
  );
}

// Simple hash to create a localStorage key from the passphrase
function hashKey(passphrase: string): string {
  let hash = 0;
  for (let i = 0; i < passphrase.length; i++) {
    const char = passphrase.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export default function App() {
  const [userKey, setUserKey] = useState<string | null>(() => localStorage.getItem('dtd-active-key'));

  const handleLogin = (passphrase: string) => {
    const key = hashKey(passphrase);
    localStorage.setItem('dtd-active-key', key);
    // Also store the passphrase label (not the raw pass) for backup filename
    const label = passphrase.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 50);
    localStorage.setItem('dtd-active-label', label);
    setUserKey(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('dtd-active-key');
    localStorage.removeItem('dtd-active-label');
    setUserKey(null);
  };

  const { profiles, activeProfile, activeId, setActiveId, createProfile, deleteProfile, renameProfile } = useProfiles(userKey || '');
  const { trades, addTrade, updateTrade, deleteTrade } = useTrades(userKey || '', activeId);
  const { settings, setSettings } = useSettings(userKey || '', activeId);

  if (!userKey) {
    return <LoginPrompt onSubmit={handleLogin} />;
  }

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
            onLogout={handleLogout}
          />
        }>
          <Route path="/" element={<Trades trades={trades} settings={settings} addTrade={addTrade} updateTrade={updateTrade} deleteTrade={deleteTrade} />} />
          <Route path="/dashboard" element={<Dashboard trades={trades} settings={settings} />} />
          <Route path="/calendar" element={<CalendarView trades={trades} />} />
          <Route path="/settings" element={<SettingsPage settings={settings} setSettings={setSettings} />} />
          <Route path="/guide" element={<Guide />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
