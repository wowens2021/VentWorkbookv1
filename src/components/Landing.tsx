import React, { useMemo } from 'react';
import { Star, Users, ShieldCheck, Play, ArrowRight, Target, Trophy, Clock, BookOpen } from 'lucide-react';
import { MODULES } from '../modules';
import { listAllProgress, loadProgress } from '../persistence/progress';
import type { ModuleConfig } from '../shell/types';

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

  // Continue-where-left-off: most recently touched, not yet quiz-submitted
  const continueModule = useMemo(() => {
    const all = listAllProgress();
    const inProgress = all
      .filter(p => !p.quiz_submitted_at)
      .filter(p => !!p.primer_completed_at)
      .sort((a, b) => {
        const ta = new Date(a.task_started_at ?? a.exploration_started_at ?? a.reading_completed_at ?? a.primer_completed_at ?? a.started_at).getTime();
        const tb = new Date(b.task_started_at ?? b.exploration_started_at ?? b.reading_completed_at ?? b.primer_completed_at ?? b.started_at).getTime();
        return tb - ta;
      });
    if (inProgress.length === 0) return null;
    const mod = MODULES.find(m => m.id === inProgress[0].module_id);
    return mod ? { mod, progress: inProgress[0] } : null;
  }, []);

  return (
    <div className="min-h-full bg-brand-cream">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-200 rounded-full text-[11px] font-bold uppercase tracking-widest text-brand-olive mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-olive" /> Welcome back, Dr.
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-stone-900 leading-[1.05] tracking-tight mb-5">
              Master mechanical<br />ventilation <span className="italic font-medium text-stone-700">— at your pace.</span>
            </h1>
            <p className="text-[17px] text-stone-700 leading-relaxed mb-6 max-w-xl">
              Evidence-based ICU simulations built from <em>The Ventilator Book</em>.
              Adjust settings, interpret live waveforms, manage scenarios — without risk to patients.
            </p>

            <div className="flex items-center gap-5 mb-7 text-[13px] text-stone-600">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} className="text-brand-gold" fill="currentColor" />
                  ))}
                </div>
                <span className="font-bold text-stone-800">4.9</span>
                <span className="text-stone-500">(823 reviews)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-stone-500" />
                <span>12,400+ learners</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-stone-500" />
                <span>Built by ICU physicians</span>
              </div>
            </div>

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

          {/* Right column: a quiet illustration block (skipping featured card per scope answer) */}
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

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <StatCard icon={Target} value={String(stats.totalModules)} label="Clinical modules" />
          <StatCard icon={Trophy} value={`${stats.objectivesMet}/${stats.totalModules}`} label="Objectives mastered" />
          <StatCard icon={Clock} value={String(stats.completed)} label="Modules completed" />
        </div>

        {/* Continue where you left off */}
        {continueModule && (
          <section className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-semibold text-stone-900">Continue where you left off</h2>
              <button onClick={onBrowseModules} className="text-[13px] font-bold text-brand-olive hover:text-brand-olive-deep">
                View all →
              </button>
            </div>
            <ContinueCard
              mod={continueModule.mod}
              percent={percentFromProgress(continueModule.progress)}
              onClick={() => onOpenModule(continueModule.mod)}
            />
          </section>
        )}

      </div>
    </div>
  );
};

// ── Sub-components ──

const StatCard: React.FC<{ icon: any; value: string; label: string }> = ({ icon: Icon, value, label }) => (
  <div className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
    <div className="w-11 h-11 rounded-xl bg-brand-cream-2 flex items-center justify-center">
      <Icon size={18} className="text-brand-olive" />
    </div>
    <div>
      <div className="font-display text-3xl font-semibold text-stone-900 leading-none">{value}</div>
      <div className="text-[12px] text-stone-500 mt-1">{label}</div>
    </div>
  </div>
);

const ContinueCard: React.FC<{ mod: ModuleConfig; percent: number; onClick: () => void }> = ({ mod, percent, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left bg-white border border-stone-200 hover:border-brand-olive rounded-2xl p-6 shadow-sm hover:shadow transition flex items-center gap-5"
  >
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-0.5 rounded">In progress</span>
        <span className="text-[11px] text-stone-500 font-mono">{mod.id}</span>
        <span className="text-[11px] text-stone-400">·</span>
        <span className="text-[11px] text-stone-500">{mod.track}</span>
      </div>
      <h3 className="font-display text-2xl font-semibold text-stone-900 leading-tight mb-1">{mod.title}</h3>
      <p className="text-[13px] text-stone-600">{mod.visible_learning_objectives[0]}</p>
    </div>
    <div className="flex flex-col items-end">
      <div className="font-display text-2xl font-semibold text-brand-olive">{percent}%</div>
      <div className="text-[10px] text-stone-500 uppercase tracking-widest">progress</div>
    </div>
    <ArrowRight size={20} className="text-stone-400" />
  </button>
);

function percentFromProgress(p: any): number {
  if (p.quiz_submitted_at) return 100;
  if (p.objective_satisfied_at) return 80;
  if (p.task_started_at) return 60;
  if (p.exploration_started_at) return 40;
  if (p.reading_completed_at) return 30;
  if (p.primer_completed_at) return 20;
  return 5;
}

export default Landing;
