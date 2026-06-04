import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Table, Settings as SettingsIcon, Calendar, BookOpen, LogOut, ChevronDown, Plus, Trash2, Check, X, Eye, TrendingUp, ShieldAlert } from 'lucide-react';
import type { Profile } from '../store';

interface Props {
  profiles: Profile[];
  activeProfile: Profile;
  onSwitchProfile: (id: string) => void;
  onCreateProfile: (name: string) => void;
  onDeleteProfile: (id: string) => void;
  onRenameProfile: (id: string, name: string) => void;
  onExit: () => void;
  instanceName: string;
  viewOnly: boolean;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/return', icon: TrendingUp, label: 'Return' },
  { to: '/risk', icon: ShieldAlert, label: 'Risk' },
  { to: '/trades', icon: Table, label: 'Trades' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  { to: '/guide', icon: BookOpen, label: 'Guide' },
];

export default function Layout({ profiles, activeProfile, onSwitchProfile, onCreateProfile, onDeleteProfile, onRenameProfile, onExit, instanceName, viewOnly }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreateProfile(name);
    setNewName('');
    setCreating(false);
    setDropdownOpen(false);
  };

  const handleRename = (id: string) => {
    const name = editName.trim();
    if (!name) return;
    onRenameProfile(id, name);
    setEditingId(null);
  };

  return (
    <div className="flex h-screen">
      <nav className="w-56 bg-bg-secondary border-r border-border flex flex-col shrink-0">
        {/* Instance name + view badge */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-text-primary truncate">{instanceName}</h1>
            {viewOnly && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-yellow/15 text-yellow rounded font-medium shrink-0">
                <Eye size={10} /> View
              </span>
            )}
          </div>
        </div>

        {/* Profile Selector */}
        <div className="px-4 pb-3 border-b border-border relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-bg-tertiary rounded-lg hover:border-accent/50 border border-border transition-colors"
          >
            <p className="text-xs text-text-primary truncate">{activeProfile.name}</p>
            <ChevronDown size={12} className={`text-text-secondary shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-bg-tertiary border border-border rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {profiles.map(p => (
                  <div key={p.id} className="group flex items-center">
                    {editingId === p.id ? (
                      <div className="flex items-center gap-1 flex-1 px-3 py-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleRename(p.id); if (e.key === 'Escape') setEditingId(null); }}
                          className="flex-1 text-sm !py-1 !px-2"
                        />
                        <button onClick={() => handleRename(p.id)} className="p-1 text-green hover:text-green"><Check size={12} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-text-secondary hover:text-text-primary"><X size={12} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { onSwitchProfile(p.id); setDropdownOpen(false); }}
                        className={`flex-1 text-left px-3 py-2 text-sm transition-colors ${
                          p.id === activeProfile.id ? 'text-accent-hover bg-accent/10' : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                        }`}
                      >
                        {p.name}
                      </button>
                    )}
                    {!viewOnly && editingId !== p.id && (
                      <div className="hidden group-hover:flex items-center pr-2 gap-0.5">
                        <button
                          onClick={e => { e.stopPropagation(); setEditingId(p.id); setEditName(p.name); }}
                          className="p-1 text-text-secondary hover:text-text-primary text-[10px]"
                        >
                          ab
                        </button>
                        {profiles.length > 1 && (
                          <button
                            onClick={e => { e.stopPropagation(); onDeleteProfile(p.id); }}
                            className="p-1 text-text-secondary hover:text-red"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {!viewOnly && (
                <div className="border-t border-border">
                  {creating ? (
                    <div className="flex items-center gap-1 p-2">
                      <input
                        autoFocus
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
                        placeholder="Profile name..."
                        className="flex-1 text-sm !py-1 !px-2"
                      />
                      <button onClick={handleCreate} className="p-1 text-green"><Check size={14} /></button>
                      <button onClick={() => setCreating(false)} className="p-1 text-text-secondary"><X size={14} /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreating(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent hover:bg-bg-secondary transition-colors"
                    >
                      <Plus size={14} /> New Profile
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-accent/15 text-accent-hover font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="p-3 border-t border-border">
          <button
            onClick={onExit}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <LogOut size={14} /> All Journals
          </button>
        </div>
      </nav>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
