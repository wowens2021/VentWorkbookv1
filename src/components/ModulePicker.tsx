import React, { useMemo, useState } from 'react';
import { Play, RotateCcw, ArrowRight, ChevronDown, Layers } from 'lucide-react';
import { MODULES } from '../modules';
import { loadProgress, listAllProgress, clearProgress } from '../persistence/progress';
import type { ModuleConfig, Track, ProgressRecord } from '../shell/types';
import { trackTone } from '../shell/trackColors';
import { PASSING_THRESHOLD } from '../shell/scoring';

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
  'Advanced Topics': 'ADVANCED',
  'Clinical Skills': 'ADVANCED',
  'Patient-Ventilator Dyssynchrony': 'ADVANCED',
  'Ventilator Liberation': 'ADVANCED',
};

// Difficulty pills sit inside the green/cream library palette: olive for
// "beginner / safe to start," gold for "intermediate," and ink/red for
// "expert level." All three pair with the cover's racing green.
const difficultyClasses: Record<Difficulty, string> = {
  BEGINNER: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  INTERMEDIATE: 'bg-amber-50 text-amber-800 border-amber-200',
  ADVANCED: 'bg-red-50 text-red-900 border-red-200',
};

type Status = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_RETAKE';

/**
 * Status derivation, with passing-grade gating.
 *
 * A module that's been quiz-submitted but scored below the
 * PASSING_THRESHOLD (80%) is NOT counted as COMPLETED. It becomes
 * NEEDS_RETAKE — the learner must pass before mastery is credited.
 * This matches the in-module debrief, which already gates the
 * "Continue to next module →" CTA on the same threshold.
 */
function statusOf(p: ProgressRecord | null): Status {
  if (!p) return 'NOT_STARTED';
  if (p.quiz_submitted_at) {
    const score = p.total_score_percent ?? 0;
    return score >= PASSING_THRESHOLD ? 'COMPLETED' : 'NEEDS_RETAKE';
  }
  if (p.primer_completed_at || p.started_at) return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

/** True when the module counts toward the learner's mastery tally. */
function isMastered(p: ProgressRecord | null): boolean {
  return statusOf(p) === 'COMPLETED';
}

// Status pills: NOT_STARTED stays neutral stone; IN_PROGRESS adopts the
// brand olive (was amber); COMPLETED keeps emerald to match the brand
// green family. NEEDS_RETAKE adopts amber so a failing submission stands
// out without looking like a hard error.
const statusClasses: Record<Status, string> = {
  NOT_STARTED: 'bg-stone-100 text-stone-600 border-stone-200',
  IN_PROGRESS: 'bg-brand-olive/10 text-brand-olive border-brand-olive/30',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  NEEDS_RETAKE: 'bg-amber-100 text-amber-800 border-amber-300',
};

const statusLabel: Record<Status, string> = {
  NOT_STARTED: 'NOT STARTED',
  IN_PROGRESS: 'IN PROGRESS',
  COMPLETED: 'COMPLETED',
  NEEDS_RETAKE: 'NEEDS RETAKE',
};

/**
 * Per-module contribution to the "Overall %" aggregate.
 *
 * Phase markers map to a coarse 5–80% progress signal as before. Once
 * the quiz is submitted, the contribution becomes the actual graded
 * score percent — so a failing 60% no longer reads as 100% complete
 * in the aggregate, and a passing 92% contributes 92, not a misleading
 * 100. Pre-score legacy records fall back to 100 to avoid a regression.
 */
function percent(p: ProgressRecord | null): number {
  if (!p) return 0;
  if (p.quiz_submitted_at) return p.total_score_percent ?? 100;
  if (p.objective_satisfied_at) return 80;
  if (p.task_started_at) return 60;
  if (p.exploration_started_at) return 40;
  if (p.reading_completed_at) return 30;
  if (p.primer_completed_at) return 20;
  return 5;
}

// Curriculum order — left-to-right and top-to-bottom on the page.
const TRACK_ORDER: Track[] = ['Foundations', 'Physiology', 'Modes', 'Strategy', 'Advanced Topics', 'Weaning', 'Synthesis', 'Clinical Skills'];

const TRACK_BLURB: Record<Track, string> = {
  Foundations: 'Start here. The four reasons to intubate, the vent display vocabulary, the equation of motion.',
  Physiology: 'How the lungs actually behave on the vent. Gas exchange, mechanics, trapping.',
  Modes: 'Volume, pressure, dual-control, support. When to reach for each and what to watch.',
  Strategy: 'PEEP titration, oxygenation ladders, disease-specific lung-protective recipes.',
  Weaning: 'The daily judgments that decide whether the tube comes out today or tomorrow.',
  Synthesis: 'Putting it together at the bedside when a vented patient acutely deteriorates.',
  'Advanced Topics': 'PEEP and oxygenation strategies in their full clinical reasoning loop.',
  'Clinical Skills': 'Bedside troubleshooting at 2 AM — the right framework for each call.',
  'Patient-Ventilator Dyssynchrony': 'When the patient and the vent disagree. Waveform pattern recognition and the fix for each category.',
  'Ventilator Liberation': 'Getting the tube out — weaning readiness, SBT pass/fail, and what makes extubation succeed or fail.',
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

  // Bumped after a restart to force the inline `loadProgress` calls to
  // re-run so the row flips back to NOT_STARTED without a page reload.
  const [restartNonce, setRestartNonce] = useState(0);

  const handleRestart = (mod: ModuleConfig) => {
    const ok = typeof window !== 'undefined'
      ? window.confirm(
          `Restart M${mod.number} — ${mod.title}?\n\n` +
          'This wipes your saved progress, scores, and answers for this module so you can start from the beginning. You can\'t undo this.'
        )
      : true;
    if (!ok) return;
    clearProgress(mod.id);
    setRestartNonce(n => n + 1);
  };

  const overallStats = useMemo(() => {
    const all = listAllProgress();
    // "Modules completed" now requires a passing grade — a quiz-submitted
    // but failing module is NEEDS_RETAKE, not COMPLETED, and shouldn't
    // count toward the learner's mastery tally.
    const completed = all.filter(p => isMastered(p)).length;
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
    // Recompute on restart so the "modules completed" + "overall %" tiles
    // reflect the cleared record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartNonce]);

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
            // Only passing completions count toward the track's "complete"
            // count — a NEEDS_RETAKE module is not mastered yet.
            const complete = mods.filter(m => isMastered(loadProgress(m.id))).length;
            const needsRetake = mods.filter(m => statusOf(loadProgress(m.id)) === 'NEEDS_RETAKE').length;
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
                        {needsRetake > 0 && (
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            {needsRetake} needs retake
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
                          {/* Module number + minutes — quieter mono column,
                              modern. We show the sequential M{number} label,
                              NOT the raw string id. The ids drifted out of
                              sync after the curriculum reorder (some are
                              'compliance' / 'resistance' / 'M13_M14_merged'),
                              so rendering them verbatim looked broken. The
                              `number` field is dense and consistent (1..N). */}
                          <div className="shrink-0 w-[64px] hidden md:flex flex-col items-start gap-0.5">
                            <span className="text-[11px] font-mono font-semibold tracking-wider text-stone-700">
                              M{mod.number}
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

                          {/* Status badge column.
                              - IN_PROGRESS: phase-progress % + thin bar.
                              - COMPLETED / NEEDS_RETAKE: graded letter + %
                                score from the persisted record. Replaces
                                the prior "✓ 100%" affordance with the
                                actual mastery signal — emerald for a
                                passing grade, amber for sub-passing.
                              - NOT_STARTED: blank placeholder. */}
                          {status === 'IN_PROGRESS' && (
                            <div className="hidden md:flex flex-col items-end shrink-0 w-[80px]">
                              <span className="text-[15px] font-semibold text-brand-olive leading-none tabular-nums">
                                {pct}%
                              </span>
                              <div className="mt-1.5 h-1 w-16 bg-stone-100 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-olive transition-[width]" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )}
                          {(status === 'COMPLETED' || status === 'NEEDS_RETAKE') && (() => {
                            const score = prog?.total_score_percent;
                            const letter = prog?.total_score_letter;
                            const tone = status === 'COMPLETED'
                              ? { text: 'text-emerald-700', sub: 'text-emerald-600' }
                              : { text: 'text-amber-700', sub: 'text-amber-700' };
                            return (
                              <div className="hidden md:flex flex-col items-end shrink-0 w-[80px]">
                                <div className="flex items-baseline gap-1 leading-none">
                                  <span className={`font-display text-[22px] font-bold tabular-nums ${tone.text}`}>
                                    {letter ?? '—'}
                                  </span>
                                  <span className={`text-[11px] font-mono tabular-nums ${tone.sub}`}>
                                    {score !== undefined ? `${score}%` : ''}
                                  </span>
                                </div>
                                {status === 'NEEDS_RETAKE' && (
                                  <div className="text-[8.5px] font-bold uppercase tracking-widest text-amber-600 mt-1">
                                    Below {PASSING_THRESHOLD}%
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          {status === 'NOT_STARTED' && (
                            <div className="hidden md:block shrink-0 w-[80px]" />
                          )}

                          {/* Action cluster.
                              - NOT_STARTED   → Start button.
                              - IN_PROGRESS   → Resume button.
                              - COMPLETED     → Restart (icon) + Review.
                              - NEEDS_RETAKE  → Restart (icon) + Retake.
                                The Restart icon clears that module's saved
                                progress (full wipe, can't undo) so the
                                learner can redo it from scratch. The
                                primary "Retake" CTA opens the module — the
                                debrief surfaces the in-module "Retake" path
                                that preserves best-attempt score history. */}
                          {(status === 'COMPLETED' || status === 'NEEDS_RETAKE') ? (
                            <div className="shrink-0 flex items-center gap-1.5">
                              <button
                                onClick={() => handleRestart(mod)}
                                title={`Restart M${mod.number} from the beginning`}
                                aria-label={`Restart M${mod.number} from the beginning`}
                                className="shrink-0 w-9 h-9 rounded-full bg-white border border-stone-300 text-stone-500 hover:text-brand-olive hover:border-brand-olive flex items-center justify-center transition"
                              >
                                <RotateCcw size={13} />
                              </button>
                              <button
                                onClick={() => onPickModule(mod)}
                                className={`shrink-0 w-[110px] px-4 py-2 rounded-full text-[12px] font-bold flex items-center justify-center gap-1.5 transition ${
                                  status === 'COMPLETED'
                                    ? 'bg-white border border-brand-olive text-brand-olive hover:bg-brand-olive/5'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                                }`}
                              >
                                {status === 'COMPLETED' ? <ArrowRight size={12} /> : <RotateCcw size={12} />}
                                {status === 'COMPLETED' ? 'Review' : 'Retake'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onPickModule(mod)}
                              className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-bold flex items-center justify-center gap-1.5 transition w-[110px] ${
                                status === 'IN_PROGRESS'
                                  ? 'bg-brand-olive/10 text-brand-olive border border-brand-olive/40 hover:bg-brand-olive/20'
                                  : 'bg-brand-olive hover:bg-brand-olive-hover text-white shadow-sm'
                              }`}
                            >
                              {status === 'IN_PROGRESS' ? <RotateCcw size={12} /> : <Play size={11} fill="currentColor" />}
                              {status === 'IN_PROGRESS' ? 'Resume' : 'Start'}
                            </button>
                          )}
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
