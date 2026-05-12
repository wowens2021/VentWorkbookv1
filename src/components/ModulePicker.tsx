import React, { useMemo } from 'react';
import { BookOpen, Check, Lock, Activity, ChevronRight } from 'lucide-react';
import { MODULES } from '../modules';
import { loadProgress } from '../persistence/progress';
import type { ModuleConfig, Track } from '../shell/types';

interface Props {
  onPickModule: (mod: ModuleConfig) => void;
  onOpenPlayground: () => void;
}

const trackOrder: Track[] = ['Foundations', 'Physiology', 'Modes', 'Strategy', 'Weaning', 'Synthesis'];

const trackColor: Record<Track, string> = {
  Foundations: 'sky',
  Physiology: 'emerald',
  Modes: 'violet',
  Strategy: 'amber',
  Weaning: 'rose',
  Synthesis: 'indigo',
};

const ModuleCard: React.FC<{ mod: ModuleConfig; onClick: () => void }> = ({ mod, onClick }) => {
  const progress = loadProgress(mod.id);
  const status =
    progress?.quiz_submitted_at ? 'complete' :
    progress?.objective_satisfied_at ? 'objective-met' :
    progress?.primer_completed_at ? 'in-progress' :
    progress?.started_at ? 'started' : 'new';
  const color = trackColor[mod.track];

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 p-4 bg-white border border-zinc-200 hover:border-${color}-400 hover:bg-zinc-100 rounded-xl text-left transition w-full`}
    >
      <div className={`w-10 h-10 shrink-0 rounded-lg bg-${color}-100 border border-${color}-300 flex items-center justify-center font-black text-${color}-700 text-sm`}>
        {mod.id}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-bold text-zinc-900 text-sm leading-tight">{mod.title}</h3>
          {status === 'complete' && <Check size={13} className="text-emerald-600 shrink-0" />}
        </div>
        <p className="text-[11px] text-zinc-500 truncate">{mod.visible_learning_objectives[0]}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-400">
          <span>{mod.estimated_minutes} min</span>
          {progress?.quiz_score !== undefined && <span className="text-emerald-600">Quiz: {progress.quiz_score}/{mod.summative_quiz.length}</span>}
          {progress?.primer_score !== undefined && status !== 'complete' && <span className="text-sky-600">Primer: {progress.primer_score}/3</span>}
        </div>
      </div>
      <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-700 shrink-0" />
    </button>
  );
};

const ModulePicker: React.FC<Props> = ({ onPickModule, onOpenPlayground }) => {
  const byTrack = useMemo(() => {
    const m = new Map<Track, ModuleConfig[]>();
    MODULES.forEach(mod => {
      if (!m.has(mod.track)) m.set(mod.track, []);
      m.get(mod.track)!.push(mod);
    });
    return m;
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 text-zinc-900 font-sans p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 mb-1">
              The Ventilator Workbook
            </h1>
            <p className="text-sm text-zinc-500">
              19 modules · TVB companion · self-paced
            </p>
          </div>
          <button
            onClick={onOpenPlayground}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 hover:border-sky-500 hover:bg-zinc-100 rounded-lg text-sm font-bold text-zinc-700 hover:text-white transition"
          >
            <Activity size={14} /> Open free-play sim
          </button>
        </header>

        {/* Track sections */}
        {trackOrder.map(track => {
          const mods = byTrack.get(track) ?? [];
          if (mods.length === 0) return null;
          const color = trackColor[track];
          return (
            <section key={track} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className={`text-${color}-400`} />
                <h2 className={`text-[11px] font-black uppercase tracking-widest text-${color}-700`}>{track}</h2>
                <div className={`flex-1 border-t border-${color}-900/40`} />
                <span className="text-[10px] text-zinc-400">{mods.length} module{mods.length === 1 ? '' : 's'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mods.map(mod => (
                  <ModuleCard key={mod.id} mod={mod} onClick={() => onPickModule(mod)} />
                ))}
              </div>
            </section>
          );
        })}

        <footer className="text-[10px] text-zinc-700 mt-12 text-center">
          Progress is stored locally in your browser. Clear browser data to reset.
        </footer>
      </div>
    </div>
  );
};

export default ModulePicker;
