import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Trades from './pages/Trades';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import SettingsPage from './pages/SettingsPage';
import Guide from './pages/Guide';
import { useTrades, useSettings, useProfiles } from './store';

function UsernamePrompt({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-xl border border-border p-8 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Welcome to DTD Journal</h2>
        <p className="text-sm text-text-secondary">Enter your name to get started. This is used to keep your data separate from other users.</p>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSubmit(name.trim()); }}
          placeholder="Your name..."
          className="w-full text-sm"
        />
        <button
          onClick={() => { if (name.trim()) onSubmit(name.trim()); }}
          disabled={!name.trim()}
          className="w-full px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('dtd-username'));

  const handleSetUsername = (name: string) => {
    localStorage.setItem('dtd-username', name);
    setUsername(name);
  };

  const { profiles, activeProfile, activeId, setActiveId, createProfile, deleteProfile, renameProfile } = useProfiles();
  const { trades, addTrade, updateTrade, deleteTrade } = useTrades(activeId);
  const { settings, setSettings } = useSettings(activeId);

  if (!username) {
    return <UsernamePrompt onSubmit={handleSetUsername} />;
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
            username={username}
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
