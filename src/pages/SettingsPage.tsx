import type { Settings, SessionTime } from '../types';
import { Trash2, Plus } from 'lucide-react';

interface Props {
  settings: Settings;
  setSettings?: (s: Settings) => void;
  viewOnly?: boolean;
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-secondary rounded-lg border border-border p-5 space-y-4">
      <h3 className="text-sm font-semibold text-accent">{title}</h3>
      {children}
    </div>
  );
}

export default function SettingsPage({ settings, setSettings, viewOnly }: Props) {
  const update = (partial: Partial<Settings>) => { if (setSettings) setSettings({ ...settings, ...partial }); };

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

  type ListKey = 'pairs' | 'entryTypes' | 'tfOptions' | 'htfBiasOptions' | 'h1BiasOptions' | 'divergenceOptions' | 'protractionOptions' | 'highLowOptions' | 'arStDevOptions' | 'fullPosOutOptions';

  const updateList = (key: ListKey, index: number, value: string) => {
    const list = [...settings[key]];
    list[index] = value;
    update({ [key]: list });
  };

  const addToList = (key: ListKey) => {
    update({ [key]: [...settings[key], ''] });
  };

  const removeFromList = (key: ListKey, index: number) => {
    update({ [key]: settings[key].filter((_: string, i: number) => i !== index) });
  };

  function ListEditor({ label, listKey }: { label: string; listKey: ListKey }) {
    return (
      <div>
        <label className="text-xs text-text-secondary font-medium block mb-2">{label}</label>
        <div className="flex flex-wrap gap-2">
          {settings[listKey].map((v: string, i: number) => (
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
    <div className={`p-6 space-y-6 max-w-3xl ${viewOnly ? 'pointer-events-none opacity-75' : ''}`}>
      <h2 className="text-xl font-bold">Settings (List Variables)
        {viewOnly && <span className="text-xs text-yellow font-normal ml-2">(View only)</span>}
      </h2>

      <SectionBlock title="Strategy Editables">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-text-secondary font-medium block mb-1">Name</label>
            <input value={settings.accountName} onChange={e => update({ accountName: e.target.value })} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium block mb-1">Dashboard Name</label>
            <input value={settings.dashboardName} onChange={e => update({ dashboardName: e.target.value })} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium block mb-1">Starting Balance ($)</label>
            <input type="number" value={settings.startingBalance || ''} onChange={e => update({ startingBalance: +e.target.value })} className="w-full" />
          </div>
        </div>
        <div className="space-y-4 mt-4">
          <ListEditor label="Entry Models" listKey="entryTypes" />
          <ListEditor label="Entry TF" listKey="tfOptions" />
          <ListEditor label="Pair" listKey="pairs" />
        </div>
      </SectionBlock>

      <SectionBlock title="Analyzing Editables">
        <div className="space-y-3">
          {settings.sessions.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={s.name} onChange={e => updateSession(i, 'name', e.target.value)} placeholder="Name" className="w-28" />
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
        <div className="space-y-4 mt-4 pt-4 border-t border-border">
          <ListEditor label="AR StDev" listKey="arStDevOptions" />
          <ListEditor label="W/D/4H Bias" listKey="htfBiasOptions" />
          <ListEditor label="1H Bias" listKey="h1BiasOptions" />
          <ListEditor label="Divergence" listKey="divergenceOptions" />
          <ListEditor label="Protraction" listKey="protractionOptions" />
          <ListEditor label="High/Low" listKey="highLowOptions" />
          <ListEditor label="Full Pos. Out" listKey="fullPosOutOptions" />
        </div>
      </SectionBlock>

      <SectionBlock title="Data Management">
        <div className="flex gap-3">
          <button
            onClick={() => {
              const data = JSON.stringify({ trades: JSON.parse(localStorage.getItem(`dtd-trades-${location.search}`) || '[]'), settings }, null, 2);
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
                    if (data.settings && setSettings) setSettings(data.settings);
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
      </SectionBlock>
    </div>
  );
}
