import React, { useState } from 'react';
import { Activity, Home, BookOpen, Brain, Play, X, LogOut, Users } from 'lucide-react';

export type NavTarget = 'home' | 'modules' | 'knowledge-check' | 'playground' | 'admin';

interface Props {
  current: NavTarget;
  onNavigate: (target: NavTarget) => void;
  /** Signed-in learner's display name/email, and a sign-out action. Both
   *  optional so TopNav still renders sensibly if App ever mounts it
   *  outside the auth gate. */
  userLabel?: string;
  onSignOut?: () => void;
  /** Show the program-admin tab (only for administrators of a program). */
  showAdmin?: boolean;
}

/** First-letter-of-each-word initials, capped at 2 characters, for the
 *  avatar chip — e.g. "Jane Smith" -> "JS", "jane@x.com" -> "J". */
const initialsFrom = (label: string): string => {
  const parts = label.split(/[\s@.]+/).filter(Boolean);
  const chars = parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '');
  return chars.join('') || '?';
};

interface TabDef {
  id: NavTarget;
  label: string;
  icon: React.ComponentType<any>;
  isAccent?: boolean;
}

const BASE_TABS: TabDef[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'modules', label: 'Modules', icon: BookOpen },
  { id: 'playground', label: 'Ventilator Playground', icon: Play },
  { id: 'knowledge-check', label: 'Knowledge Check', icon: Brain },
];

const TopNav: React.FC<Props> = ({ current, onNavigate, userLabel, onSignOut, showAdmin }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const TABS: TabDef[] = showAdmin
    ? [...BASE_TABS, { id: 'admin', label: 'Program', icon: Users }]
    : BASE_TABS;
  return (
    <header className="bg-brand-olive text-white shrink-0">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 mr-2 hover:opacity-90 transition"
        >
          <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
            <Activity size={15} className="text-white" />
          </div>
          <span className="font-display text-[17px] font-semibold tracking-wide text-white">
            The Ventilator Workbook
          </span>
        </button>

        {/* Center tabs */}
        <nav className="flex items-center gap-1 ml-4">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = current === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onNavigate(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold rounded-full transition ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/8'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Right side: signed-in learner + sign out */}
        <div className="ml-auto flex items-center gap-3 relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-9 h-9 rounded-full bg-white/15 text-white text-[11px] font-bold flex items-center justify-center border border-white/20 hover:bg-white/25 transition"
            title={userLabel}
          >
            {initialsFrom(userLabel ?? '?')}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-zinc-300 rounded-xl shadow-2xl z-50 p-3 text-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Signed in</span>
                <button onClick={() => setMenuOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                  <X size={14} />
                </button>
              </div>
              <p className="text-[13px] font-semibold text-zinc-900 truncate mb-3">{userLabel}</p>
              <button
                onClick={() => { setMenuOpen(false); onSignOut?.(); }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[13px] font-bold rounded-lg transition"
              >
                <LogOut size={13} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
