import React, { useMemo } from 'react';
import { Play, RotateCcw, Check, ArrowRight } from 'lucide-react';
import { MODULES } from '../modules';
import { loadProgress, listAllProgress } from '../persistence/progress';
import type { ModuleConfig, Track, ProgressRecord } from '../shell/types';

interface Props {
  onPickModule: (mod: ModuleConfig) => void;
}

type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

const trackToDifficulty: Record<Track, Difficulty> = {
  Foundations: 'BEGINNER',
  Physiology: 'BEGINNER',
  Modes: 'INTERMEDIATE',
  Strategy: 'ADVANCED',
  Weaning: 'ADVANCED',
  Synthesis: 'ADVANCED',
};

const difficultyClasses: Record<Difficulty, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  INTERMEDIATE: 'bg-blue-100 text-blue-800 border-blue-200',
  ADVANCED: 'bg-rose-100 text-rose-800 border-rose-200',
};

type Status = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

function statusOf(p: ProgressRecord | null): Status {
  if (!p) return 'NOT_STARTED';
  if (p.quiz_submitted_at) return 'COMPLETED';
  if (p.primer_completed_at || p.started_at) return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

const statusClasses: Record<Status, string> = {
  NOT_STARTED: 'bg-stone-100 text-stone-600 border-stone-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const statusLabel: Record<Status, string> = {
  NOT_STARTED: 'NOT STARTED',
  IN_PROGRESS: 'IN PROGRESS',
  COMPLETED: 'COMPLETED',
};

function percent(p: ProgressRecord | null): number {
  if (!p) return 0;
  if (p.quiz_submitted_at) return 100;
  if (p.objective_satisfied_at) return 80;
  if (p.task_started_at) return 60;
  if (p.exploration_started_at) return 40;
  if (p.reading_completed_at) return 30;
  if (p.primer_completed_at) return 20;
  return 5;
}

const ModulePicker: React.FC<Props> = ({ onPickModule }) => {
  const overallStats = useMemo(() => {
    const all = listAllProgress();
    const completed = all.filter(p => !!p.quiz_submitted_at).length;
    const objectivesMet = all.filter(p => !!p.objective_satisfied_at).length;
    return {
      total: MODULES.length,
      completed,
      objectivesMet,
      avgPercent: MODULES.length === 0
        ? 0
        : Math.round(
            MODULES.reduce((s, m) => s + percent(loadProgress(m.id)), 0) / MODULES.length,
          ),
    };
  }, []);

  return (
    <div className="min-h-full bg-brand-cream">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-stone-900 mb-2">
            Clinical Simulations
          </h1>
          <p className="text-[15px] text-stone-600 max-w-2xl">
            Work through evidence-based ventilator simulations. Each module includes a primer,
            free exploration, a clinical task, and a knowledge check.
          </p>
        </div>

        {/* Compact summary strip */}
        <div className="bg-white border border-stone-200 rounded-xl px-5 py-3.5 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 shadow-sm">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-brand-olive leading-none">
              {overallStats.completed}/{overallStats.total}
            </span>
            <span className="text-[12px] text-stone-500">modules completed</span>
          </div>
          <div className="hidden md:block w-px h-7 bg-stone-200" />
          <div className="text-[12px] text-stone-700">
            {overallStats.objectivesMet} objective{overallStats.objectivesMet === 1 ? '' : 's'} mastered
          </div>
          <div className="md:ml-auto flex-1 md:flex-none md:w-[240px]">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">
              <span>Overall</span>
              <span>{overallStats.avgPercent}%</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-olive transition-all" style={{ width: `${overallStats.avgPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Horizontal row list */}
        <div className="space-y-2.5">
          {MODULES.map(mod => {
            const prog = loadProgress(mod.id);
            const status = statusOf(prog);
            const difficulty = trackToDifficulty[mod.track];
            const pct = percent(prog);
            return (
              <article
                key={mod.id}
                className={`bg-white border rounded-xl px-5 py-3.5 shadow-sm hover:shadow transition flex items-center gap-4 ${
                  status === 'IN_PROGRESS' ? 'border-amber-300' : 'border-stone-200 hover:border-brand-olive'
                }`}
              >
                {/* Pills column (fixed width) */}
                <div className="flex flex-col gap-1 shrink-0 w-[120px]">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border text-center ${statusClasses[status]}`}>
                    {statusLabel[status]}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border text-center ${difficultyClasses[difficulty]}`}>
                    {difficulty}
                  </span>
                </div>

                {/* Module id + track */}
                <div className="shrink-0 w-[120px] hidden md:block">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Module {mod.number}
                  </div>
                  <div className="text-[11px] text-stone-500">{mod.track}</div>
                </div>

                {/* Title + topics */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-semibold text-stone-900 leading-snug mb-0.5 truncate">
                    {mod.title}
                  </h3>
                  <p className="text-[12px] text-stone-600 leading-snug line-clamp-1">
                    {mod.visible_learning_objectives.join('; ')}.
                  </p>
                </div>

                {/* Progress (in-progress only) */}
                {status === 'IN_PROGRESS' && (
                  <div className="hidden md:flex flex-col items-end shrink-0 w-[80px]">
                    <span className="font-display text-base font-semibold text-amber-700 leading-none">{pct}%</span>
                    <div className="mt-1.5 h-1 w-16 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
                {status === 'COMPLETED' && (
                  <div className="hidden md:flex items-center gap-1 shrink-0 w-[80px] justify-end">
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-[11px] font-bold text-emerald-700">100%</span>
                  </div>
                )}
                {status === 'NOT_STARTED' && (
                  <div className="hidden md:block shrink-0 w-[80px]" />
                )}

                {/* CTA */}
                <button
                  onClick={() => onPickModule(mod)}
                  className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-bold flex items-center justify-center gap-1.5 transition w-[110px] ${
                    status === 'IN_PROGRESS'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                      : status === 'COMPLETED'
                        ? 'bg-white text-brand-olive border border-brand-olive hover:bg-stone-50'
                        : 'bg-brand-olive text-white hover:bg-brand-olive-hover'
                  }`}
                >
                  {status === 'IN_PROGRESS' ? <RotateCcw size={12} /> : status === 'COMPLETED' ? <ArrowRight size={12} /> : <Play size={11} fill="currentColor" />}
                  {status === 'IN_PROGRESS' ? 'Resume' : status === 'COMPLETED' ? 'Review' : 'Start'}
                </button>
              </article>
            );
          })}
        </div>

        <footer className="text-[11px] text-stone-400 mt-12 text-center">
          Progress is stored locally in your browser. Clear browser data to reset.
        </footer>
      </div>
    </div>
  );
};

export default ModulePicker;
