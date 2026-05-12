import React, { useMemo } from 'react';
import { Play, RotateCcw, Check } from 'lucide-react';
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
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-stone-900 mb-2">
            Clinical Simulations
          </h1>
          <p className="text-[15px] text-stone-600 max-w-2xl">
            Work through evidence-based ventilator simulations. Each module includes a primer,
            free exploration, a clinical task, and a knowledge check.
          </p>
        </div>

        {/* Summary card */}
        <div className="bg-white border border-stone-200 rounded-2xl px-6 py-5 mb-8 flex flex-col md:flex-row items-start md:items-center gap-4 shadow-sm">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-semibold text-brand-olive leading-none">
              {overallStats.completed}/{overallStats.total}
            </span>
            <span className="text-[13px] text-stone-500">Modules completed</span>
          </div>
          <div className="hidden md:block w-px h-10 bg-stone-200 mx-3" />
          <div className="text-[13px] text-stone-700">
            {overallStats.objectivesMet} objective{overallStats.objectivesMet === 1 ? '' : 's'} mastered
          </div>
          <div className="md:ml-auto flex-1 md:flex-none md:w-[280px]">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
              <span>Overall progress</span>
              <span>{overallStats.avgPercent}%</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-olive transition-all"
                style={{ width: `${overallStats.avgPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map(mod => {
            const prog = loadProgress(mod.id);
            const status = statusOf(prog);
            const difficulty = trackToDifficulty[mod.track];
            const pct = percent(prog);
            return (
              <article
                key={mod.id}
                className={`bg-white border rounded-2xl p-5 flex flex-col shadow-sm hover:shadow transition relative ${
                  status === 'IN_PROGRESS' ? 'border-amber-300' : 'border-stone-200 hover:border-brand-olive'
                }`}
              >
                {/* Yellow ribbon for in-progress */}
                {status === 'IN_PROGRESS' && (
                  <div className="absolute top-0 left-5 right-5 h-1 bg-amber-400 rounded-b" />
                )}

                {/* Status + difficulty pills */}
                <div className="flex items-center gap-1.5 mb-3 pr-14">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${statusClasses[status]}`}>
                    {statusLabel[status]}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${difficultyClasses[difficulty]}`}>
                    {difficulty}
                  </span>
                </div>

                {/* Module label + title */}
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">
                  Module {mod.number} · {mod.track}
                </div>
                <h3 className="font-display text-xl font-semibold text-stone-900 leading-snug mb-3 pr-14">
                  {mod.title}
                </h3>

                {/* Topics covered */}
                <p className="text-[13px] text-stone-600 leading-relaxed mb-3">
                  <span className="font-bold text-stone-800">Topics covered: </span>
                  {mod.visible_learning_objectives.join('; ')}.
                </p>

                {/* Objective bullets */}
                <ul className="space-y-1 mb-4 text-[12px] text-stone-700">
                  {mod.visible_learning_objectives.slice(0, 3).map((o, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className={`mt-0.5 w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center ${status === 'COMPLETED' ? 'bg-emerald-500' : 'border border-stone-300 bg-white'}`}>
                        {status === 'COMPLETED' && <Check size={9} className="text-white" strokeWidth={3.5} />}
                      </span>
                      <span className="leading-snug">{o}</span>
                    </li>
                  ))}
                  {mod.visible_learning_objectives.length > 3 && (
                    <li className="text-stone-400 text-[11.5px] pl-5">
                      +{mod.visible_learning_objectives.length - 3} more
                    </li>
                  )}
                </ul>

                {/* Progress ring (in-progress only) */}
                {status === 'IN_PROGRESS' && (
                  <div className="absolute top-4 right-4">
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="20" stroke="#e7e5e4" strokeWidth="3" fill="none" />
                        <circle
                          cx="24" cy="24" r="20"
                          stroke="#d97706" strokeWidth="3" fill="none"
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-stone-800">
                        {pct}%
                      </span>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={() => onPickModule(mod)}
                  className={`mt-auto w-full px-4 py-2.5 rounded-full text-[13px] font-bold flex items-center justify-center gap-1.5 transition ${
                    status === 'IN_PROGRESS'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                      : status === 'COMPLETED'
                        ? 'bg-white text-brand-olive border border-brand-olive hover:bg-stone-50'
                        : 'bg-brand-olive text-white hover:bg-brand-olive-hover'
                  }`}
                >
                  {status === 'IN_PROGRESS' ? <RotateCcw size={13} /> : <Play size={12} fill="currentColor" />}
                  {status === 'IN_PROGRESS' ? 'Resume' : status === 'COMPLETED' ? 'Review' : 'Start case'}
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
