import React from 'react';
import { Activity, Home, BookOpen, Brain, Play } from 'lucide-react';

export type NavTarget = 'home' | 'modules' | 'knowledge-check' | 'playground';

interface Props {
  current: NavTarget;
  onNavigate: (target: NavTarget) => void;
}

interface TabDef {
  id: NavTarget;
  label: string;
  icon: React.ComponentType<any>;
  isAccent?: boolean;
}

const TABS: TabDef[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'modules', label: 'Modules', icon: BookOpen },
  { id: 'playground', label: 'Ventilator Playground', icon: Play },
  { id: 'knowledge-check', label: 'Knowledge Check', icon: Brain },
];

const TopNav: React.FC<Props> = ({ current, onNavigate }) => {
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

        {/* Right side: avatar placeholder */}
        <div className="ml-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/15 text-white text-[11px] font-bold flex items-center justify-center border border-white/20">
            DD
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
