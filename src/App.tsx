import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Trades from './pages/Trades';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import SettingsPage from './pages/SettingsPage';
import Guide from './pages/Guide';
import { useTrades, useSettings, useProfiles } from './store';

export default function App() {
  const { profiles, activeProfile, activeId, setActiveId, createProfile, deleteProfile, renameProfile } = useProfiles();
  const { trades, addTrade, updateTrade, deleteTrade } = useTrades(activeId);
  const { settings, setSettings } = useSettings(activeId);

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
