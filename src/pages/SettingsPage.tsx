import type { Settings, SessionTime } from '../types';
import { Trash2, Plus } from 'lucide-react';

interface Props {
  settings: Settings;
  setSettings: (s: Settings) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-secondary rounded-lg border border-border p-5 space-y-4">
      <h3 className="text-sm font-semibold text-accent">{title}</h3>
      {children}
    </div>
  );
}

export default function SettingsPage({ settings, setSettings }: Props) {
  const update = (partial: Partial<Settings>) => setSettings({ ...settings, ...partial });

  const updateSession = (index: number, field: keyof SessionTime, value: string) => {
    const sessions = [...settings.sessions];
    sessions[index] = { ...sessions[index], [field]: value };
    update({ sessions });
  };

  const addSession = () => {
    update({ sessions: [...settings.sessions, { name: '', startTime: '00:00', endTime: '00:00' }] });
  };

  const removeSession = (index: number) => {
    update({ sessions: settings.sessions.filter((_, i) => i !== index) });
  };

  const updateList = (key: 'pairs' | 'entryTypes' | 'wlSpecifics' | 'tfOptions' | 'biasOptions', index: number, value: string) => {
    const list = [...settings[key]];
    list[index] = value;
    update({ [key]: list });
  };

  const addToList = (key: 'pairs' | 'entryTypes' | 'wlSpecifics' | 'tfOptions' | 'biasOptions') => {
    update({ [key]: [...settings[key], ''] });
  };

  const removeFromList = (key: 'pairs' | 'entryTypes' | 'wlSpecifics' | 'tfOptions' | 'biasOptions', index: number) => {
    update({ [key]: settings[key].filter((_, i) => i !== index) });
  };

  function ListEditor({ label, listKey }: { label: string; listKey: 'pairs' | 'entryTypes' | 'wlSpecifics' | 'tfOptions' | 'biasOptions' }) {
    return (
      <div>
        <label className="text-xs text-text-secondary font-medium block mb-2">{label}</label>
        <div className="flex flex-wrap gap-2">
          {settings[listKey].map((v, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                value={v}
                onChange={e => updateList(listKey, i, e.target.value)}
                className="w-28"
              />
              <button onClick={() => removeFromList(listKey, i)} className="p-1 text-text-secondary hover:text-red transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => addToList(listKey)} className="px-2 py-1 text-xs bg-bg-tertiary rounded-md hover:text-accent transition-colors">
            <Plus size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold">Settings</h2>

      <Section title="Account Details">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-text-secondary font-medium block mb-1">Account Name</label>
            <input value={settings.accountName} onChange={e => update({ accountName: e.target.value })} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium block mb-1">Prop Firm</label>
            <input value={settings.propFirm} onChange={e => update({ propFirm: e.target.value })} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium block mb-1">Starting Balance ($)</label>
            <input type="number" value={settings.startingBalance || ''} onChange={e => update({ startingBalance: +e.target.value })} className="w-full" />
          </div>
        </div>
      </Section>

      <Section title="Trading Pairs">
        <ListEditor label="Pairs" listKey="pairs" />
      </Section>

      <Section title="Session Times">
        <div className="space-y-2">
          {settings.sessions.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={s.name} onChange={e => updateSession(i, 'name', e.target.value)} placeholder="Name" className="w-32" />
              <input type="time" value={s.startTime} onChange={e => updateSession(i, 'startTime', e.target.value)} />
              <span className="text-text-secondary text-xs">to</span>
              <input type="time" value={s.endTime} onChange={e => updateSession(i, 'endTime', e.target.value)} />
              <button onClick={() => removeSession(i)} className="p-1 text-text-secondary hover:text-red transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button onClick={addSession} className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors mt-2">
            <Plus size={14} /> Add Session
          </button>
        </div>
      </Section>

      <Section title="Dropdown Options">
        <div className="space-y-4">
          <ListEditor label="Entry Types" listKey="entryTypes" />
          <ListEditor label="W/L Specifics" listKey="wlSpecifics" />
          <ListEditor label="Timeframes" listKey="tfOptions" />
          <ListEditor label="Bias Options" listKey="biasOptions" />
        </div>
      </Section>

      <Section title="Data Management">
        <div className="flex gap-3">
          <button
            onClick={() => {
              const data = JSON.stringify({ trades: JSON.parse(localStorage.getItem('dtd-trades') || '[]'), settings }, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `dtd-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            Export Backup
          </button>
          <label className="px-4 py-2 text-sm bg-bg-tertiary rounded-lg hover:text-accent transition-colors cursor-pointer">
            Import Backup
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const data = JSON.parse(reader.result as string);
                    if (data.trades) localStorage.setItem('dtd-trades', JSON.stringify(data.trades));
                    if (data.settings) setSettings(data.settings);
                    window.location.reload();
                  } catch {
                    alert('Invalid backup file');
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
      </Section>
    </div>
  );
}
