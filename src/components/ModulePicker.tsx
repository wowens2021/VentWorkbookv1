import React, { useMemo, useState } from 'react';
import { Play, RotateCcw, Check, ArrowRight, ChevronDown, Layers } from 'lucide-react';
import { MODULES } from '../modules';
import { loadProgress, listAllProgress } from '../persistence/progress';
import type { ModuleConfig, Track, ProgressRecord } from '../shell/types';
import { trackTone } from '../shell/trackColors';

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

// Difficulty pills sit inside the green/cream library palette: olive for
// "beginner / safe to start," gold for "intermediate," and ink/red for
// "expert level." All three pair with the cover's racing green.
const difficultyClasses: Record<Difficulty, string> = {
  BEGINNER: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  INTERMEDIATE: 'bg-amber-50 text-amber-800 border-amber-200',
  ADVANCED: 'bg-red-50 text-red-900 border-red-200',
};

type Status = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

function statusOf(p: ProgressRecord | null): Status {
  if (!p) return 'NOT_STARTED';
  if (p.quiz_submitted_at) return 'COMPLETED';
  if (p.primer_completed_at || p.started_at) return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

// Status pills: NOT_STARTED stays neutral stone; IN_PROGRESS adopts the
// brand olive (was amber); COMPLETED keeps emerald to match the brand
// green family.
const statusClasses: Record<Status, string> = {
  NOT_STARTED: 'bg-stone-100 text-stone-600 border-stone-200',
  IN_PROGRESS: 'bg-brand-olive/10 text-brand-olive border-brand-olive/30',
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

// Curriculum order — left-to-right and top-to-bottom on the page.
const TRACK_ORDER: Track[] = ['Foundations', 'Physiology', 'Modes', 'Strategy', 'Weaning', 'Synthesis'];

const TRACK_BLURB: Record<Track, string> = {
  Foundations: 'Start here. The four reasons to intubate, the vent display vocabulary, the equation of motion.',
  Physiology: 'How the lungs actually behave on the vent. Gas exchange, mechanics, trapping.',
  Modes: 'Volume, pressure, dual-control, support. When to reach for each and what to watch.',
  Strategy: 'PEEP titration, oxygenation ladders, disease-specific lung-protective recipes.',
  Weaning: 'The daily judgments that decide whether the tube comes out today or tomorrow.',
  Synthesis: 'Putting it together at the bedside when a vented patient acutely deteriorates.',
};

const ModulePicker: React.FC<Props> = ({ onPickModule }) => {
  // Group modules by track, preserving curriculum order within each.
  const byTrack = useMemo(() => {
    const map = new Map<Track, ModuleConfig[]>();
    TRACK_ORDER.forEach(t => map.set(t, []));
    MODULES.forEach(m => map.get(m.track)?.push(m));
    return map;
  }, []);

  // Decide which track to auto-expand on mount: the first track that has
  // at least one in-progress module, else the first incomplete track,
  // else Foundations.
  const initiallyOpen = useMemo<Track>(() => {
    for (const t of TRACK_ORDER) {
      const mods = byTrack.get(t) ?? [];
      if (mods.some(m => statusOf(loadProgress(m.id)) === 'IN_PROGRESS')) return t;
    }
    for (const t of TRACK_ORDER) {
      const mods = byTrack.get(t) ?? [];
      if (mods.some(m => statusOf(loadProgress(m.id)) !== 'COMPLETED')) return t;
    }
    return 'Foundations';
  }, [byTrack]);

  const [openTracks, setOpenTracks] = useState<Set<Track>>(new Set([initiallyOpen]));
  const toggleTrack = (t: Track) => {
    setOpenTracks(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

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
            Learning Modules
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

        {/* Expand-all / Collapse-all */}
        <div className="flex items-center justify-end gap-3 mb-3 text-[11px] font-bold">
          <button
            onClick={() => setOpenTracks(new Set(TRACK_ORDER))}
            className="text-stone-500 hover:text-stone-900 transition"
          >
            Expand all
          </button>
          <span className="text-stone-300">·</span>
          <button
            onClick={() => setOpenTracks(new Set())}
            className="text-stone-500 hover:text-stone-900 transition"
          >
            Collapse all
          </button>
        </div>

        {/* Track sections */}
        <div className="space-y-3">
          {TRACK_ORDER.map(track => {
            const mods = byTrack.get(track) ?? [];
            if (mods.length === 0) return null;
            const isOpen = openTracks.has(track);
            const tone = trackTone(track);
            const complete = mods.filter(m => statusOf(loadProgress(m.id)) === 'COMPLETED').length;
            const inProgress = mods.filter(m => statusOf(loadProgress(m.id)) === 'IN_PROGRESS').length;
            const trackPct = mods.length === 0
              ? 0
              : Math.round(mods.reduce((s, m) => s + percent(loadProgress(m.id)), 0) / mods.length);
            return (
              <section
                key={track}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm transition"
              >
                {/* Banner header — dropdown trigger */}
                <button
                  onClick={() => toggleTrack(track)}
                  className="w-full flex items-stretch text-left group"
                >
                  {/* Color rail */}
                  <div
                    className="w-1.5 shrink-0 transition-all"
                    style={{ backgroundColor: tone.hex }}
                  />
                  <div className="flex-1 flex items-center gap-4 px-5 py-4 hover:bg-stone-50/70 transition">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${tone.hex}1a`, color: tone.hex }}
                    >
                      <Layers size={18} strokeWidth={2.25} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <h2
                          className="text-[17px] font-semibold text-stone-900 leading-none tracking-tight"
                        >
                          {track}
                        </h2>
                        <span
                          className="text-[10px] font-semibold uppercase tracking-[0.14em] tabular-nums px-2 py-0.5 rounded"
                          style={{ backgroundColor: `${tone.hex}14`, color: tone.hex }}
                        >
                          {complete}/{mods.length}
                        </span>
                        {inProgress > 0 && (
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5 rounded bg-brand-olive/10 text-brand-olive border border-brand-olive/25">
                            {inProgress} in progress
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] text-stone-500 leading-snug truncate">
                        {TRACK_BLURB[track]}
                      </p>
                    </div>
                    {/* Track-level progress bar */}
                    <div className="hidden md:flex flex-col items-end shrink-0 w-[140px]">
                      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 mb-1.5 w-full tabular-nums">
                        <span>Progress</span>
                        <span>{trackPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{ width: `${trackPct}%`, backgroundColor: tone.hex }}
                        />
                      </div>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-stone-400 group-hover:text-stone-700 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* Module rows — collapsible */}
                {isOpen && (
                  <div className="border-t border-stone-100 bg-stone-50/40 px-3 py-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {mods.map(mod => {
                      const prog = loadProgress(mod.id);
                      const status = statusOf(prog);
                      const difficulty = trackToDifficulty[mod.track];
                      const pct = percent(prog);
                      return (
                        <article
                          key={mod.id}
                          className={`bg-white border rounded-xl px-4 py-3.5 shadow-sm hover:shadow-md transition flex items-center gap-4 ${
                            status === 'IN_PROGRESS' ? 'border-brand-olive/40' : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {/* Module id + minutes — quieter mono column, modern. */}
                          <div className="shrink-0 w-[64px] hidden md:flex flex-col items-start gap-0.5">
                            <span className="text-[11px] font-mono font-semibold tracking-wider text-stone-700">
                              {mod.id}
                            </span>
                            <span className="text-[10px] text-stone-400 tabular-nums">
                              {mod.estimated_minutes} min
                            </span>
                          </div>

                          {/* Status + difficulty pills */}
                          <div className="flex flex-col gap-1 shrink-0 w-[112px]">
                            <span className={`text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded border text-center ${statusClasses[status]}`}>
                              {statusLabel[status]}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded border text-center ${difficultyClasses[difficulty]}`}>
                              {difficulty}
                            </span>
                          </div>

                          {/* Title + tagline — modern, no italics; tagline reads
                              as supporting copy in a quieter stone tone. */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[15px] font-semibold text-stone-900 leading-tight mb-1 truncate tracking-tight">
                              {mod.title}
                            </h3>
                            <p className="text-[13px] text-stone-500 leading-snug line-clamp-1">
                              {mod.briefing?.tagline ?? mod.visible_learning_objectives[0]}
                            </p>
                          </div>

                          {/* Progress (in-progress only) */}
                          {status === 'IN_PROGRESS' && (
                            <div className="hidden md:flex flex-col items-end shrink-0 w-[72px]">
                              <span className="text-[15px] font-semibold text-brand-olive leading-none tabular-nums">
                                {pct}%
                              </span>
                              <div className="mt-1.5 h-1 w-16 bg-stone-100 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-olive transition-[width]" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )}
                          {status === 'COMPLETED' && (
                            <div className="hidden md:flex items-center gap-1.5 shrink-0 w-[72px] justify-end">
                              <Check size={14} className="text-brand-olive" strokeWidth={3} />
                              <span className="text-[12px] font-semibold text-brand-olive tabular-nums">100%</span>
                            </div>
                          )}
                          {status === 'NOT_STARTED' && (
                            <div className="hidden md:block shrink-0 w-[70px]" />
                          )}

                          {/* CTA — primary action is ALWAYS the brand racing
                              green, regardless of track. Track identity
                              shows through icon + accent text up top; the
                              "Start" button is the single product green so
                              the dashboard reads as one product. */}
                          <button
                            onClick={() => onPickModule(mod)}
                            className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-bold flex items-center justify-center gap-1.5 transition w-[110px] ${
                              status === 'IN_PROGRESS'
                                ? 'bg-brand-olive/10 text-brand-olive border border-brand-olive/40 hover:bg-brand-olive/20'
                                : status === 'COMPLETED'
                                  ? 'bg-white border border-brand-olive text-brand-olive hover:bg-brand-olive/5'
                                  : 'bg-brand-olive hover:bg-brand-olive-hover text-white shadow-sm'
                            }`}
                          >
                            {status === 'IN_PROGRESS' ? <RotateCcw size={12} /> : status === 'COMPLETED' ? <ArrowRight size={12} /> : <Play size={11} fill="currentColor" />}
                            {status === 'IN_PROGRESS' ? 'Resume' : status === 'COMPLETED' ? 'Review' : 'Start'}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
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
