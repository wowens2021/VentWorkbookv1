import React, { useMemo } from 'react';
import { Play, ArrowRight, Trophy, BookOpen } from 'lucide-react';
import { MODULES } from '../modules';
import { listAllProgress, loadProgress } from '../persistence/progress';
import type { ModuleConfig, ProgressRecord } from '../shell/types';

interface Props {
  onBrowseModules: () => void;
  onOpenPlayground: () => void;
  onOpenModule: (mod: ModuleConfig) => void;
}

const Landing: React.FC<Props> = ({ onBrowseModules, onOpenPlayground, onOpenModule }) => {
  // Stats derived from localStorage progress
  const stats = useMemo(() => {
    const all = listAllProgress();
    const completed = all.filter(p => !!p.quiz_submitted_at).length;
    const objectivesMet = all.filter(p => !!p.objective_satisfied_at).length;
    return {
      totalModules: MODULES.length,
      objectivesMet,
      completed,
    };
  }, []);

  /**
   * Every module that has been started but not finished — sorted by recency
   * so the most active sits at the top. Modules that have never been opened
   * are intentionally excluded (the Simulations page is the place for those).
   */
  const inProgressModules = useMemo(() => {
    const all = listAllProgress();
    const items = all
      .filter(p => !p.quiz_submitted_at)
      .map(p => {
        const mod = MODULES.find(m => m.id === p.module_id);
        return mod ? { mod, progress: p } : null;
      })
      .filter((x): x is { mod: ModuleConfig; progress: ProgressRecord } => x !== null)
      .sort((a, b) => recencyMs(b.progress) - recencyMs(a.progress));
    return items;
  }, []);

  return (
    <div className="min-h-full bg-brand-cream">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-200 rounded-full text-[11px] font-bold uppercase tracking-widest text-brand-olive mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-olive" /> Welcome back, Dr.
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-stone-900 leading-[1.05] tracking-tight mb-5">
              Master mechanical<br />ventilation <span className="italic font-medium text-stone-700">— at your pace.</span>
            </h1>
            <p className="text-[17px] text-stone-700 leading-relaxed mb-7 max-w-xl">
              Evidence-based ICU simulations built from <em>The Ventilator Book</em>.
              Adjust settings, interpret live waveforms, manage scenarios — without risk to patients.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={onBrowseModules}
                className="flex items-center gap-2 px-6 py-3 bg-brand-olive hover:bg-brand-olive-hover text-white rounded-full text-[14px] font-bold transition shadow-sm"
              >
                Browse simulations <ArrowRight size={15} />
              </button>
              <button
                onClick={onOpenPlayground}
                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-full text-[14px] font-bold transition"
              >
                <Play size={13} fill="currentColor" /> Open Playground
              </button>
            </div>
          </div>

          {/* Right column: workbook overview */}
          <div className="lg:col-span-5 hidden lg:flex">
            <div className="w-full bg-white border border-stone-200 rounded-2xl p-7 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-brand-olive" />
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-olive">
                  Workbook overview
                </span>
              </div>
              <h2 className="font-display text-[26px] font-semibold text-stone-900 leading-tight mb-3">
                19 modules across six tracks
              </h2>
              <p className="text-[14px] text-stone-600 leading-relaxed mb-5">
                From the four indications for intubation through advanced ARDS management.
                Each module follows the same five-phase rhythm: primer → read → explore → try it → debrief.
              </p>
              <ul className="space-y-2 mb-5">
                {['Foundations & physiology', 'Modes (VC, PC, PRVC, PSV, SIMV)', 'PEEP, oxygenation, ARDS, obstruction', 'Weaning, extubation, troubleshooting'].map((t, i) => (
                  <li key={i} className="text-[13px] text-stone-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-olive" /> {t}
                  </li>
                ))}
              </ul>
              <button
                onClick={onBrowseModules}
                className="mt-auto self-start text-[13px] font-bold text-brand-olive hover:text-brand-olive-deep underline underline-offset-2"
              >
                See all modules →
              </button>
            </div>
          </div>
        </div>

        {/* Consolidated progress strip */}
        <ProgressStrip
          modulesCompleted={stats.completed}
          modulesTotal={stats.totalModules}
          objectivesMet={stats.objectivesMet}
        />

        {/* In-progress modules — every non-completed module that's been touched */}
        {inProgressModules.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-semibold text-stone-900">
                Continue where you left off
              </h2>
              <button
                onClick={onBrowseModules}
                className="text-[13px] font-bold text-brand-olive hover:text-brand-olive-deep"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2.5">
              {inProgressModules.map(({ mod, progress }) => (
                <ContinueRow
                  key={mod.id}
                  mod={mod}
                  percent={percentFromProgress(progress)}
                  onClick={() => onOpenModule(mod)}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

// ── Sub-components ──

/** Single horizontal strip combining "modules completed" + "objectives mastered". */
const ProgressStrip: React.FC<{ modulesCompleted: number; modulesTotal: number; objectivesMet: number }> = ({
  modulesCompleted, modulesTotal, objectivesMet,
}) => {
  const pct = modulesTotal === 0 ? 0 : Math.round((modulesCompleted / modulesTotal) * 100);
  return (
    <div className="bg-white border border-stone-200 rounded-2xl px-6 py-5 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-brand-cream-2 flex items-center justify-center">
          <Trophy size={18} className="text-brand-olive" />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-0.5">
            Your progress
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl font-semibold text-stone-900 leading-none">
              {modulesCompleted}<span className="text-stone-400">/{modulesTotal}</span>
            </span>
            <span className="text-[12px] text-stone-500">modules completed</span>
            <span className="text-stone-300">·</span>
            <span className="font-display text-2xl font-semibold text-stone-900 leading-none">
              {objectivesMet}
            </span>
            <span className="text-[12px] text-stone-500">objectives mastered</span>
          </div>
        </div>
      </div>
      <div className="md:ml-auto w-full md:w-72">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">
          <span>Overall</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-olive transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
};

const ContinueRow: React.FC<{ mod: ModuleConfig; percent: number; onClick: () => void }> = ({
  mod, percent, onClick,
}) => (
  <button
    onClick={onClick}
    className="w-full text-left bg-white border border-stone-200 hover:border-brand-olive rounded-xl px-5 py-3.5 shadow-sm hover:shadow transition flex items-center gap-4"
  >
    <div className="flex items-center gap-2 shrink-0 w-32">
      <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
        In progress
      </span>
    </div>
    <div className="shrink-0 text-[11px] font-mono text-stone-500 w-12">{mod.id}</div>
    <div className="flex-1 min-w-0">
      <h3 className="font-display text-base font-semibold text-stone-900 leading-tight truncate">
        {mod.title}
      </h3>
      <p className="text-[11.5px] text-stone-500 truncate">{mod.track}</p>
    </div>
    <div className="shrink-0 flex items-center gap-1.5 w-24">
      <div className="h-1.5 flex-1 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-500" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[11px] font-bold text-stone-700">{percent}%</span>
    </div>
    <ArrowRight size={16} className="text-stone-400 shrink-0" />
  </button>
);

function recencyMs(p: ProgressRecord): number {
  return new Date(
    p.task_started_at
      ?? p.exploration_started_at
      ?? p.reading_completed_at
      ?? p.primer_completed_at
      ?? p.started_at,
  ).getTime();
}

function percentFromProgress(p: ProgressRecord): number {
  if (p.quiz_submitted_at) return 100;
  if (p.objective_satisfied_at) return 80;
  if (p.task_started_at) return 60;
  if (p.exploration_started_at) return 40;
  if (p.reading_completed_at) return 30;
  if (p.primer_completed_at) return 20;
  return 5;
}

// Silence the unused-warning for loadProgress (kept for future per-card details).
void loadProgress;

export default Landing;
