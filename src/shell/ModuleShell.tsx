import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Target, Clock, ChevronRight, Trophy, Home, RotateCcw, Check, X } from 'lucide-react';
import type { ModuleConfig, InlinePromptConfig, ExploreCardConfig } from './types';
import PrimerQuiz from './PrimerQuiz';
import CheckYourselfPage from './CheckYourselfPage';
import IntroBriefing from './IntroBriefing';
import ReadPane from './ReadPane';
import TrackProgressStrip from './TrackProgressStrip';
import { trackTone } from './trackColors';
import { successPhrase, wrongPhrase, continueCTA } from './microcopy';
import SummativeQuiz from './SummativeQuiz';
import ReviewCard from './ReviewCard';
import HintLadder from './HintLadder';
import RecognitionPrompt from './RecognitionPrompt';
import PhaseBadge, { type Phase } from './PhaseBadge';
import ExploreCard from './ExploreCard';
import TaskCard from './TaskCard';
import PlaygroundSim, { type SimInteractivity } from '../components/PlaygroundSim';
import { ScenarioHarness } from '../harness/ScenarioHarness';
import { buildTracker, type Tracker } from '../trackers';
import { persistProgress, loadProgress, clearProgress } from '../persistence/progress';

interface Props {
  module: ModuleConfig;
  onBack: () => void;
  onNext?: () => void;
  /** Optional explicit "go home" handler. Falls back to onBack if absent. */
  onHome?: () => void;
  /** Metadata for the next module in sequence — powers the "Up next" line
   *  on the debrief so the learner sees what they're about to start. */
  nextModule?: ModuleConfig;
}

/**
 * C1: small RAF-driven count-up hook so the debrief score animates from 0
 * to its final value over `duration` ms. No external dependency. Returns
 * the latest tweened integer; rerenders the parent on each frame.
 */
function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    setValue(0);
    let start: number | null = null;
    let frame: number;
    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

/**
 * Composite performance score, capped at 100. Component weights:
 *   - Primer first-attempt:   30 pts (primer_score / 3 × 30)
 *   - Summative quiz:         50 pts (quiz_score / 5 × 50)
 *   - Hint-usage bonus:       up to 10 pts (no hints) / 5 (tier 1 only) / 0
 *   - Reset-usage bonus:      up to 10 pts (zero resets) / 5 (one) / 0
 *   - Check-yourself bonus:   up to 5 pts (E3) — proportional to correct ratio
 *
 * Raw total can reach 105; the displayed percent is capped at 100. The +5
 * cushion lets a strong learner absorb a small hint/reset penalty without
 * losing their A grade.
 */
function computeTotalScore(rec: {
  primer_score?: number;
  primer_total?: number;
  quiz_score?: number;
  quiz_total?: number;
  hint_tiers_triggered?: number;
  reset_to_start_clicks?: number;
  check_yourself_correct?: number;
  check_yourself_total?: number;
}): { percent: number; letter: 'A' | 'B' | 'C' | 'D' | 'F'; breakdown: Record<string, number> } {
  const primerPts = rec.primer_total && rec.primer_score !== undefined
    ? Math.round((rec.primer_score / rec.primer_total) * 30)
    : 0;
  const quizPts = rec.quiz_total && rec.quiz_score !== undefined
    ? Math.round((rec.quiz_score / rec.quiz_total) * 50)
    : 0;
  const hintBonus = (rec.hint_tiers_triggered ?? 0) === 0 ? 10
    : (rec.hint_tiers_triggered ?? 0) === 1 ? 5
    : 0;
  const resetBonus = (rec.reset_to_start_clicks ?? 0) === 0 ? 10
    : (rec.reset_to_start_clicks ?? 0) === 1 ? 5
    : 0;
  const checkYourselfBonus = rec.check_yourself_total && rec.check_yourself_total > 0
    ? Math.floor((rec.check_yourself_correct ?? 0) / rec.check_yourself_total * 5)
    : 0;
  const raw = primerPts + quizPts + hintBonus + resetBonus + checkYourselfBonus;
  const percent = Math.max(0, Math.min(100, raw));
  const letter: 'A' | 'B' | 'C' | 'D' | 'F' =
    percent >= 90 ? 'A' :
    percent >= 80 ? 'B' :
    percent >= 70 ? 'C' :
    percent >= 60 ? 'D' : 'F';
  return {
    percent,
    letter,
    breakdown: { primerPts, quizPts, hintBonus, resetBonus, checkYourselfBonus },
  };
}

/**
 * B1 helper: which readouts should briefly halo when the learner moves a
 * given control? Outcome trackers name their readouts explicitly — we pull
 * those out first so the flash points the learner at the thing the tracker
 * is actually watching. For manipulation / recognition tasks (no outcome
 * dict), fall back to a hand-tuned affinity table mapping each control to
 * the readouts physiologically downstream of it.
 */
function collectOutcomeReadouts(cfg: any): string[] {
  if (!cfg) return [];
  if (cfg.kind === 'outcome' && cfg.readouts) return Object.keys(cfg.readouts);
  if (cfg.kind === 'compound' && Array.isArray(cfg.children)) {
    return cfg.children.flatMap(collectOutcomeReadouts);
  }
  return [];
}
const CONTROL_AFFINITY: Record<string, string[]> = {
  compliance: ['pip', 'plat', 'drivingPressure'],
  resistance: ['pip', 'drivingPressure'],
  peep: ['pip', 'plat', 'totalPeep'],
  respiratoryRate: ['mve', 'autoPeep', 'actualRate'],
  tidalVolume: ['vte', 'mve', 'pip', 'plat'],
  fiO2: ['fio2'],
  iTime: ['ieRatio'],
  pInsp: ['pip', 'vte'],
  psLevel: ['vte', 'mve'],
  spontaneousRate: ['actualRate', 'mve', 'rsbi'],
  endInspiratoryPercent: ['vte', 'ieRatio'],
};
function readoutsRelatedToControl(controlName: string, trackerCfg: any): string[] {
  const fromOutcome = collectOutcomeReadouts(trackerCfg);
  if (fromOutcome.length > 0) return fromOutcome;
  return CONTROL_AFFINITY[controlName] ?? [];
}

/**
 * Derive an explore card from the scenario if the module didn't author one.
 * Generic fallback — keeps the shell working through transitional builds.
 */
function deriveExploreCard(module: ModuleConfig): ExploreCardConfig {
  const unlocked = module.scenario.unlocked_controls.map(c => ({
    name: c,
    description: 'Adjust this control to see the effect on the waveforms and readouts.',
  }));
  const readouts = (module.scenario.visible_readouts ?? []).map(r => ({
    name: r,
    description: 'Watch this readout as you change controls.',
  }));
  return {
    patient_context: undefined,
    unlocked_controls_description: unlocked,
    readouts_description: readouts,
    suggestions: [
      'Try changing each unlocked control by a small amount, then a large amount.',
      'Watch which readouts respond and which don’t.',
      'Use the Reset button if you want to start over before the task begins.',
    ],
  };
}

const ModuleShell: React.FC<Props> = ({ module, onBack, onNext, onHome, nextModule }) => {
  // ── Resume from prior progress ──
  const prior = useMemo(() => loadProgress(module.id), [module.id]);

  // Persist start on first mount
  useEffect(() => {
    persistProgress({ module_id: module.id, started_at: prior?.started_at ?? new Date().toISOString() });
  }, [module.id]);

  // ── One-time intro briefing splash ──
  // Shown when the learner first enters the module, before any phase starts.
  // Acknowledgment is persisted so resuming or navigating back doesn't show
  // it again. A Restart clears the ack alongside the rest of the progress.
  const [briefingDone, setBriefingDone] = useState(!!prior?.briefing_acknowledged_at);
  const acknowledgeBriefing = () => {
    persistProgress({
      module_id: module.id,
      briefing_acknowledged_at: new Date().toISOString(),
    });
    setBriefingDone(true);
  };

  // ── Phase state machine (§1.4 — 5-phase model) ──
  const initialPhase: Phase = prior?.quiz_submitted_at
    ? 'debrief'
    : prior?.objective_satisfied_at
      ? 'debrief'
      : prior?.task_started_at
        ? 'try-it'
        : prior?.exploration_started_at
          ? 'explore'
          : prior?.primer_completed_at
            ? 'read'
            : 'primer';
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [objectiveSatisfied, setObjectiveSatisfied] = useState(!!prior?.objective_satisfied_at);
  const [quizSubmitted, setQuizSubmitted] = useState(!!prior?.quiz_submitted_at);

  // Sub-phase within Read: 'prose' (the readable content) → 'check' (standalone
  // MCQ "Check yourself" page) → advance to Explore. The check sub-phase is
  // only entered if the module actually has formative content blocks; otherwise
  // Read → Explore directly.
  const formativeBlocks = useMemo(
    () => module.content_blocks.filter((b): b is Extract<typeof b, { kind: 'formative' }> => b.kind === 'formative'),
    [module]
  );
  const [readSubPhase, setReadSubPhase] = useState<'prose' | 'check'>('prose');

  // ── Completed-phase tracking (for back-navigation) ──
  // A phase is "completed" once the learner has advanced past it OR satisfied
  // its terminal condition. Computed from the persisted record so resume works.
  const completedPhases = useMemo(() => {
    const set = new Set<Phase>();
    if (prior?.primer_completed_at) set.add('primer');
    if (prior?.reading_completed_at) set.add('read');
    if (prior?.task_started_at) set.add('explore'); // started Phase 4 ⇒ Phase 3 was completed
    if (prior?.objective_satisfied_at) set.add('try-it');
    if (prior?.quiz_submitted_at) set.add('debrief');
    // Plus anything the in-session phase has already passed.
    const passed: Phase[] = ['primer', 'read', 'explore', 'try-it', 'debrief'];
    const idx = passed.indexOf(phase);
    for (let i = 0; i < idx; i++) set.add(passed[i]);
    if (objectiveSatisfied) set.add('try-it');
    if (quizSubmitted) set.add('debrief');
    return set;
  }, [prior, phase, objectiveSatisfied, quizSubmitted]);

  /**
   * Jump back to a previously completed phase. The objective state for try-it
   * is preserved (objectiveSatisfied stays true on return), so going back to
   * "read" and forward again doesn't require redoing the task.
   */
  const jumpToPhase = (target: Phase) => {
    if (!completedPhases.has(target) || target === phase) return;
    setPhase(target);
    setLastInteractMs(Date.now());
  };

  // ── Harness + tracker ──
  const harnessRef = useRef<ScenarioHarness | null>(null);
  if (!harnessRef.current) harnessRef.current = new ScenarioHarness(module.scenario);
  const harness = harnessRef.current;

  // ── Inline recognition prompts ──
  const [activePrompt, setActivePrompt] = useState<InlinePromptConfig | null>(null);
  // Click-target feedback state — populated when a learner clicks a tile on
  // the sim in click-target recognition mode, OR when the "Show me" hint
  // auto-answers a recognition prompt. Declared here so `onShowMe` and
  // `respondToPrompt` (below) can both write into it.
  const [clickFeedback, setClickFeedback] = useState<{
    label: string; isCorrect: boolean; explanation?: string;
  } | null>(null);

  // ── Hint ladder idle tracking (Phase 4 only) ──
  const [lastInteractMs, setLastInteractMs] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const idleMs = now - lastInteractMs;

  useEffect(() => {
    if (phase !== 'try-it' || objectiveSatisfied) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase, objectiveSatisfied]);

  const [hintTiersTriggered, setHintTiersTriggered] = useState(prior?.hint_tiers_triggered ?? 0);

  // ── Compound-tracker progress (F3) + step-complete toast (F4) ──
  const [childStates, setChildStates] = useState<boolean[]>(() => {
    if (module.hidden_objective?.kind === 'compound') {
      return module.hidden_objective.children.map(() => false);
    }
    return [];
  });
  const [stepToast, setStepToast] = useState<{ idx: number; total: number } | null>(null);
  // Auto-dismiss the toast after 3 s so it doesn't linger.
  useEffect(() => {
    if (!stepToast) return;
    const id = setTimeout(() => setStepToast(null), 3000);
    return () => clearTimeout(id);
  }, [stepToast]);

  // (Phase hero banner removed — was too intrusive. The slide-in
  // animation on workbookContent already conveys motion. The
  // PhaseBadge in the top strip still tracks position in the
  // 5-phase sequence.)
  const flashHero = (_target: Phase) => { /* no-op, kept so call sites compile */ };

  // ── Engagement counters (per §1.9) ──
  const exploreStartedAtRef = useRef<number | null>(null);
  const exploreControlChangesRef = useRef(0);
  const taskStartedAtRef = useRef<number | null>(null);
  const taskControlChangesRef = useRef(0);
  const resetClicksRef = useRef(0);

  // Belt-and-suspenders cleanup: if the phase changes away from try-it
  // (debrief, back-nav to read, etc.), wipe any lingering recognition
  // prompt + click-feedback popup so they don't bleed into other phases.
  useEffect(() => {
    if (phase !== 'try-it') {
      setActivePrompt(null);
      setClickFeedback(null);
    }
  }, [phase]);

  // ── Debrief sub-view (summary ↔ detailed evaluations) ──
  // The debrief opens on the score summary. The three per-question answer
  // reviews (primer / check-yourself / knowledge check) used to render
  // inline as three collapsed "lines" stacked under the score — that
  // crowded the focus. They now live on a dedicated `evaluations` sub-page,
  // reached from a single "Review your answers →" link on the summary.
  const [debriefSubView, setDebriefSubView] = useState<'summary' | 'evaluations'>('summary');
  // Reset back to summary whenever we re-enter debrief from elsewhere.
  useEffect(() => {
    if (phase !== 'debrief') setDebriefSubView('summary');
  }, [phase]);

  // ── B2: outcome progress chip ──
  const [outcomeProgress, setOutcomeProgress] = useState<
    { current: number; target: number; label?: string } | null
  >(null);
  // ── B3: hint trigger on N control changes without progress ──
  // Incremented on every try-it control_changed. Reset to 0 whenever the
  // tracker reports forward progress (outcome counter goes up OR a compound
  // child fires). Surfaces tier 1 around 5 changes, tier 2 at 10, tier 3 at 15.
  const [changesSinceProgress, setChangesSinceProgress] = useState(0);
  const lastOutcomeProgressRef = useRef(0);

  // ── B1: readout flash on control change ──
  // When the learner changes a control in the try-it phase, briefly outline
  // the related readouts in sky-blue so they SEE which numbers their knob
  // talks to. Auto-cleared after 1.1 s.
  const [flashReadouts, setFlashReadouts] = useState<string[]>([]);
  useEffect(() => {
    if (flashReadouts.length === 0) return;
    const id = setTimeout(() => setFlashReadouts([]), 1100);
    return () => clearTimeout(id);
  }, [flashReadouts]);

  // B3: reset the no-progress streak whenever the tracker advances —
  // either an outcome counter ticked up, or a compound child fired.
  useEffect(() => {
    const cur = outcomeProgress?.current ?? 0;
    if (cur > lastOutcomeProgressRef.current) {
      lastOutcomeProgressRef.current = cur;
      setChangesSinceProgress(0);
    }
    if (!outcomeProgress) lastOutcomeProgressRef.current = 0;
  }, [outcomeProgress]);
  const childStatesDoneCountRef = useRef(0);
  useEffect(() => {
    const done = childStates.filter(Boolean).length;
    if (done > childStatesDoneCountRef.current) {
      childStatesDoneCountRef.current = done;
      setChangesSinceProgress(0);
    }
    if (done === 0) childStatesDoneCountRef.current = 0;
  }, [childStates]);
  // Phase-exit: reset the streak so re-entering try-it starts clean.
  useEffect(() => {
    if (phase !== 'try-it') {
      setChangesSinceProgress(0);
      lastOutcomeProgressRef.current = 0;
      childStatesDoneCountRef.current = 0;
    }
  }, [phase]);

  // ── Global harness subscriber for engagement counting + B1 flash ──
  // Always subscribed; only the tracker is conditionally subscribed in Phase 4.
  useEffect(() => {
    const off = harness.subscribe(ev => {
      if (ev.type === 'control_changed') {
        if (phase === 'explore') exploreControlChangesRef.current += 1;
        if (phase === 'try-it') {
          taskControlChangesRef.current += 1;
          const readouts = readoutsRelatedToControl(ev.control, module.hidden_objective);
          if (readouts.length > 0) setFlashReadouts(readouts);
          // B3: every try-it change starts a new "no-progress streak" tick.
          // The streak is cleared elsewhere when outcomeProgress / childStates
          // increment.
          setChangesSinceProgress(n => n + 1);
        }
        setLastInteractMs(Date.now());
      }
      if (ev.type === 'recognition_response') {
        setLastInteractMs(Date.now());
      }
    });
    return off;
  }, [harness, phase, module.hidden_objective]);

  // ── Wire harness to objective tracker — ONLY in Phase 4 ──
  useEffect(() => {
    if (phase !== 'try-it' || objectiveSatisfied) return;

    // §1.4 Phase 4: reset sim to preset on phase entry so prior exploration
    // doesn't accidentally satisfy the tracker.
    harness.resetToPreset();
    taskStartedAtRef.current = Date.now();
    taskControlChangesRef.current = 0;
    resetClicksRef.current = 0;
    persistProgress({
      module_id: module.id,
      task_started_at: new Date().toISOString(),
    });

    const tracker = buildTracker(module.hidden_objective);

    // Re-seed compound child progress on each phase entry / redo.
    if (module.hidden_objective.kind === 'compound') {
      setChildStates(module.hidden_objective.children.map(() => false));
    } else {
      setChildStates([]);
    }
    setStepToast(null);

    const ctx = {
      baseline_controls: harness.baseline_controls,
      presentPrompt: (p: InlinePromptConfig) => setActivePrompt(p),
      resetToPreset: () => harness.resetToPreset(),
      // F4: announce which compound step just landed (1-based for display).
      notifyStepComplete: (idx: number, total: number) =>
        setStepToast({ idx, total }),
      // F5: clear any inline prompt that was still waiting for an answer.
      clearActivePrompt: () => setActivePrompt(null),
      // F3: surface per-child progress so TaskCard can show checkmarks.
      onProgress: (states: boolean[]) => setChildStates(states),
      // B2: wire outcome-tracker progress so TaskCard can show a live chip.
      onOutcomeProgress: (
        p: { current: number; target: number; label?: string } | null,
      ) => setOutcomeProgress(p),
    };

    tracker.start(ctx, () => {
      setObjectiveSatisfied(true);
      // The whole compound is done — clear both the recognition question
      // banner (driven by activePrompt) and any in-flight click-feedback
      // popup so neither lingers into the debrief phase.
      setActivePrompt(null);
      setClickFeedback(null);
      // Capture replay snapshot
      const snap = harness.snapshot();
      const ref = `snap_${module.id}_${Date.now()}`;
      try { localStorage.setItem(`vp:snap:${ref}`, JSON.stringify(snap)); } catch {}
      const elapsedSec = taskStartedAtRef.current
        ? Math.round((Date.now() - taskStartedAtRef.current) / 1000)
        : undefined;
      persistProgress({
        module_id: module.id,
        objective_satisfied_at: new Date().toISOString(),
        time_to_objective_sec: elapsedSec,
        task_control_changes: taskControlChangesRef.current,
        reset_to_start_clicks: resetClicksRef.current,
        hint_tiers_triggered: hintTiersTriggered,
        replay_snapshot_ref: ref,
      });
    });

    const off = harness.subscribe(ev => tracker.handle(ev));

    // Inline prompts configured on the scenario itself
    module.scenario.inline_prompts?.forEach(prompt => {
      if (prompt.trigger.kind === 'on_load') setActivePrompt(prompt);
    });

    return () => {
      off();
      tracker.stop();
      setOutcomeProgress(null);
    };
  }, [phase, objectiveSatisfied, module.id]);

  // ── Recognition response → harness ──
  const respondToPrompt = (selectedLabel: string, isCorrect: boolean) => {
    if (!activePrompt) return;
    const promptIdAtClick = activePrompt.prompt_id;
    harness.emit({
      type: 'recognition_response',
      prompt_id: activePrompt.prompt_id,
      selected_label: selectedLabel,
      is_correct: isCorrect,
      timestamp: Date.now(),
    });
    if (isCorrect) {
      // Only clear `activePrompt` 800 ms later if it's still the one we
      // just answered. The compound tracker may have synchronously loaded
      // the NEXT prompt during the emit chain — wiping the active prompt
      // in that case would erase the new question.
      setTimeout(() => {
        setActivePrompt(p => p?.prompt_id === promptIdAtClick ? null : p);
      }, 800);
    }
  };

  // ── Hint tier ──
  const onTierTriggered = (tier: 1 | 2 | 3) => {
    setHintTiersTriggered(t => {
      const next = Math.max(t, tier);
      persistProgress({ module_id: module.id, hint_tiers_triggered: next });
      return next;
    });
  };

  const onShowMe = () => {
    // 1) Manipulation-tier demo (a specific control flick + reset).
    const demo = module.hint_ladder.tier3?.demonstration;
    if (demo) {
      harness.emit({ type: 'demonstration_played', control: demo.control, timestamp: Date.now() });
      harness.emit({
        type: 'control_changed',
        control: demo.control,
        old_value: harness.baseline_controls[demo.control],
        new_value: demo.target_value,
        timestamp: Date.now(),
      });
      // Reset immediately — no timer-based delay. The learner sees the
      // demonstrated value land and the sim return to baseline in one beat.
      harness.resetToPreset();
      return;
    }

    // 2) Recognition prompt currently active. For click-target prompts, show
    //    the explanation popup pre-populated with the correct answer — the
    //    learner clicks "Continue →" to actually advance, matching the normal
    //    click flow. For pure MCQ prompts (no click_targets), advance via
    //    respondToPrompt directly.
    if (activePrompt) {
      const correctClick = activePrompt.click_targets?.find(t => t.is_correct);
      if (correctClick) {
        setClickFeedback({
          label: correctClick.label,
          isCorrect: true,
          explanation: correctClick.explanation,
        });
        return;
      }
      const correctOpt = activePrompt.options.find(o => o.is_correct);
      if (correctOpt) {
        respondToPrompt(correctOpt.label, true);
        return;
      }
    }

    // 3) Fallback: just emit a demonstration on the first unlocked control.
    const target = module.scenario.unlocked_controls[0];
    if (target) harness.emit({ type: 'demonstration_played', control: target, timestamp: Date.now() });
  };

  // ── Reset button (used in Phase 3 + Phase 4 cards) ──
  const onResetToStart = () => {
    if (phase === 'try-it') resetClicksRef.current += 1;
    harness.resetToPreset();
  };

  /**
   * F8: re-arm the try-it phase so the learner can redo the task.
   * Clears the satisfaction flag; the wiring useEffect re-runs, rebuilds the
   * tracker, resets the sim, and re-subscribes.
   */
  const onRedoTask = () => {
    setObjectiveSatisfied(false);
    setActivePrompt(null);
    setStepToast(null);
    // Don't wipe persisted achievement — the learner already completed it once.
    // Just open the tracker again.
  };

  // ── Phase transitions ──
  const advanceFromPrimer = (score: number, answers: any[]) => {
    persistProgress({
      module_id: module.id,
      primer_completed_at: new Date().toISOString(),
      primer_score: score,
      primer_answers: answers,
    });
    setPhase('read');
    flashHero('read');
    setLastInteractMs(Date.now());
  };

  /** Move from Read's prose sub-view → either the check-yourself MCQ page
   *  (if the module has formative blocks) or directly to Explore. */
  const advanceFromRead = () => {
    if (formativeBlocks.length > 0 && readSubPhase === 'prose') {
      setReadSubPhase('check');
      return;
    }
    advanceFromReadOrCheck();
  };

  /**
   * E1: capture each check-yourself answer as the learner makes it, so the
   * debrief can review them and the score can include a small bonus.
   * Stable IDs (`{moduleId}-CY{n}`) are derived from the position of the
   * formative block in the module's content_blocks list.
   */
  const checkYourselfAnswersRef = useRef<
    Map<string, { question_id: string; selected_label: string; is_correct: boolean }>
  >(new Map());
  const handleCheckYourselfAnswer = (answer: {
    question_id: string;
    selected_label: string;
    is_correct: boolean;
  }) => {
    checkYourselfAnswersRef.current.set(answer.question_id, answer);
  };

  /** Move from Read (either sub-phase) → Explore. Persists timestamps and
   *  initializes the exploration counters. */
  const advanceFromReadOrCheck = () => {
    persistProgress({
      module_id: module.id,
      reading_completed_at: new Date().toISOString(),
    });
    // Persist any captured check-yourself answers before leaving the sub-phase.
    if (checkYourselfAnswersRef.current.size > 0) {
      persistProgress({
        module_id: module.id,
        check_yourself_answers: Array.from(checkYourselfAnswersRef.current.values()),
      });
    }
    exploreStartedAtRef.current = Date.now();
    exploreControlChangesRef.current = 0;
    persistProgress({
      module_id: module.id,
      exploration_started_at: new Date().toISOString(),
    });
    setReadSubPhase('prose'); // reset for back-nav
    setPhase('explore');
    flashHero('explore');
  };

  const advanceFromExplore = () => {
    const dur = exploreStartedAtRef.current
      ? Math.round((Date.now() - exploreStartedAtRef.current) / 1000)
      : undefined;
    persistProgress({
      module_id: module.id,
      exploration_duration_sec: dur,
      exploration_control_changes: exploreControlChangesRef.current,
    });
    setPhase('try-it');
    flashHero('try-it');
    setLastInteractMs(Date.now());
  };

  const advanceFromTryIt = () => {
    setPhase('debrief');
    flashHero('debrief');
  };

  const advanceFromDebrief = (score: number, answers: any[]) => {
    // Compute the composite total score and persist alongside the quiz result.
    const cyAnswers =
      Array.from(checkYourselfAnswersRef.current.values()).length > 0
        ? Array.from(checkYourselfAnswersRef.current.values())
        : prior?.check_yourself_answers ?? [];
    const merged = {
      primer_score: prior?.primer_score,
      primer_total: module.primer_questions.length,
      quiz_score: score,
      quiz_total: module.summative_quiz.length,
      hint_tiers_triggered: prior?.hint_tiers_triggered ?? 0,
      reset_to_start_clicks: prior?.reset_to_start_clicks ?? resetClicksRef.current,
      check_yourself_correct: cyAnswers.filter(a => a.is_correct).length,
      check_yourself_total: formativeBlocks.length,
    };
    const total = computeTotalScore(merged);
    persistProgress({
      module_id: module.id,
      quiz_submitted_at: new Date().toISOString(),
      quiz_score: score,
      quiz_answers: answers,
      total_score_percent: total.percent,
      total_score_letter: total.letter,
    });
    setQuizSubmitted(true);
  };

  /**
   * Wipe this module's progress and reset all in-session state so the learner
   * starts from Phase 1 again. Used by the "Restart module" debrief button.
   */
  const handleRestart = () => {
    clearProgress(module.id);
    // Reset in-session state
    setObjectiveSatisfied(false);
    setQuizSubmitted(false);
    setActivePrompt(null);
    setHintTiersTriggered(0);
    exploreControlChangesRef.current = 0;
    taskControlChangesRef.current = 0;
    resetClicksRef.current = 0;
    exploreStartedAtRef.current = null;
    taskStartedAtRef.current = null;
    harness.resetToPreset();
    setPhase('primer');
    // Show the intro briefing splash again on restart so the learner gets
    // re-oriented before re-attempting the module.
    setBriefingDone(false);
    // Re-seed started_at so the dashboard sees a fresh attempt
    persistProgress({ module_id: module.id, started_at: new Date().toISOString() });
  };

  // ── Per-phase sim interactivity ──
  // When revisiting an already-completed phase via back-nav, the sim opens up
  // (no need to re-lock controls) — the learner is in review mode.
  const isReviewing = completedPhases.has(phase) && phase !== 'debrief' && quizSubmitted;
  const simInteractivity: SimInteractivity =
    phase === 'primer' ? 'locked'
    // Read phase is now fully live so the learner can poke the sim while
    // reading — the `predict_observe` blocks auto-reveal when the targeted
    // control changes. Mode-row locking still respects the module's scenario.
    : phase === 'read' ? 'live'
    : phase === 'try-it' ? 'live'
    : phase === 'debrief' ? 'live-frozen'
    : 'live'; // explore

  // ── Workbook content by phase ──
  const workbookContent = useMemo(() => {
    if (phase === 'primer') {
      return <PrimerQuiz questions={module.primer_questions} onComplete={advanceFromPrimer} />;
    }

    if (phase === 'read') {
      // Sub-phase 'check' — standalone MCQ page between prose and explore.
      if (readSubPhase === 'check' && formativeBlocks.length > 0) {
        return (
          <CheckYourselfPage
            blocks={formativeBlocks}
            moduleId={module.id}
            onContinue={advanceFromReadOrCheck}
            onAnswered={handleCheckYourselfAnswer}
          />
        );
      }
      // Sub-phase 'prose' — uncluttered reading view; formative blocks are
      // stripped out by ContentBlocks and rendered on the next sub-page.
      const ctaLabel = formativeBlocks.length > 0
        ? 'Continue — quick check yourself'
        : "I'm ready — let me try it";
      return (
        <ReadPane
          module={module}
          harness={harness}
          ctaLabel={ctaLabel}
          onAdvance={advanceFromRead}
        />
      );
    }

    if (phase === 'explore') {
      return (
        <ExploreCard
          config={module.explore_card ?? deriveExploreCard(module)}
          onReset={onResetToStart}
          onStartTask={advanceFromExplore}
        />
      );
    }

    if (phase === 'try-it') {
      return (
        <div className="h-full flex flex-col overflow-hidden">
          {/* F4: 3-second step-complete banner. Above HintLadder so a satisfied
              step is clearly the headline, not the hint. */}
          {stepToast && (
            <div className="mx-5 mt-3 shrink-0 bg-emerald-50 border border-emerald-300 rounded-lg px-3 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <ChevronRight size={12} className="text-white" />
              </div>
              <span className="text-[12px] font-bold text-emerald-900 leading-snug">
                Step {stepToast.idx + 1} of {stepToast.total} complete — sim reset for the next step.
              </span>
            </div>
          )}
          <div className="px-5 pt-3 shrink-0">
            <HintLadder
              hint={module.hint_ladder}
              idleMs={idleMs}
              changesSinceProgress={changesSinceProgress}
              onShowMe={onShowMe}
              onTierTriggered={onTierTriggered}
              suppressed={objectiveSatisfied}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <TaskCard
              userFacingTask={module.user_facing_task ?? 'Continue using the simulator to complete this module.'}
              successCriteria={module.success_criteria_display ?? ['Continue exploring until the objective is met.']}
              framingStyle={module.task_framing_style}
              objectiveSatisfied={objectiveSatisfied}
              onReset={onResetToStart}
              onContinueToDebrief={advanceFromTryIt}
              onShowHint={() => setLastInteractMs(Date.now() - 26_000)}  // F7: tier 1 fires at 25 s
              progress={childStates.length > 0 ? childStates : undefined}
              onRedo={onRedoTask}
              outcomeProgress={outcomeProgress}
            />
          </div>
        </div>
      );
    }

    // debrief
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {!quizSubmitted ? (
          <SummativeQuiz
            questions={module.summative_quiz}
            onSubmit={(score, answers) => advanceFromDebrief(score, answers)}
          />
        ) : (() => {
          // Pull the latest persisted record so the score is consistent with
          // what's stored (rather than relying on stale closures).
          const rec = loadProgress(module.id);
          const cyAnswers = rec?.check_yourself_answers ?? [];
          const cyCorrect = cyAnswers.filter(a => a.is_correct).length;
          const cyTotal = formativeBlocks.length;
          const total = rec?.total_score_percent !== undefined
            ? { percent: rec.total_score_percent, letter: rec.total_score_letter ?? 'F' }
            : computeTotalScore({
                primer_score: rec?.primer_score,
                primer_total: module.primer_questions.length,
                quiz_score: rec?.quiz_score,
                quiz_total: module.summative_quiz.length,
                hint_tiers_triggered: rec?.hint_tiers_triggered,
                reset_to_start_clicks: rec?.reset_to_start_clicks,
                check_yourself_correct: cyCorrect,
                check_yourself_total: cyTotal,
              });
          const letterColor =
            total.letter === 'A' ? 'text-emerald-600' :
            total.letter === 'B' ? 'text-emerald-500' :
            total.letter === 'C' ? 'text-amber-600' :
            total.letter === 'D' ? 'text-amber-700' : 'text-rose-600';

          // ─── Sub-view: detailed evaluations page ────────────────────
          // Reached from the "Review your answers" link on the summary.
          if (debriefSubView === 'evaluations') {
            return (
              <div className="h-full flex flex-col px-5 py-5 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                  onClick={() => setDebriefSubView('summary')}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-500 hover:text-zinc-900 transition mb-3 self-start"
                >
                  <ArrowLeft size={14} /> Back to summary
                </button>
                <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Detailed evaluation
                </div>
                <h1 className="font-display text-2xl font-semibold text-zinc-900 leading-tight tracking-tight mb-1">
                  {module.title}
                </h1>
                <p className="text-[13px] text-zinc-600 mb-5">
                  Every question you saw in this module — what you picked, whether it was right, and the correct answer when it wasn't.
                </p>
                <AnswerReview
                  title="Primer (before the module)"
                  questions={module.primer_questions}
                  answers={rec?.primer_answers ?? []}
                />
                {cyTotal > 0 && (
                  <AnswerReview
                    title="Check yourself (between read and sim)"
                    questions={formativeBlocks.map((b, i) => ({
                      id: `${module.id}-CY${i + 1}`,
                      prompt: b.question,
                      options: b.options ?? [],
                      explanation: b.answer,
                    }))}
                    answers={cyAnswers}
                  />
                )}
                <AnswerReview
                  title="Knowledge check (after the module)"
                  questions={module.summative_quiz}
                  answers={rec?.quiz_answers ?? []}
                />
                <div className="mt-4">
                  <button
                    onClick={() => setDebriefSubView('summary')}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg text-[13px] font-bold text-stone-700 transition"
                  >
                    <ArrowLeft size={13} /> Back to summary
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="h-full flex flex-col px-5 py-5 overflow-y-auto">
              {/* C2: track-level progress strip — shows the larger arc so the
                  learner sees how far they've come and what's next. */}
              <TrackProgressStrip track={module.track} highlightCompleteId={module.id} />

              {/* Banner */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 mb-5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-1 duration-500">
                <Trophy size={20} className="text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[14px] font-bold text-emerald-900 leading-tight">Module complete</div>
                  <div className="text-[12px] text-emerald-700">{module.title}</div>
                </div>
              </div>

              {/* ─── Full score breakdown ───────────────────────────────── */}
              {(() => {
                const primerScore = rec?.primer_score ?? 0;
                const primerTotal = module.primer_questions.length;
                const quizScore = rec?.quiz_score ?? 0;
                const quizTotal = module.summative_quiz.length;
                const hintTiers = rec?.hint_tiers_triggered ?? 0;
                const resets = rec?.reset_to_start_clicks ?? 0;
                const bd = computeTotalScore({
                  primer_score: primerScore,
                  primer_total: primerTotal,
                  quiz_score: quizScore,
                  quiz_total: quizTotal,
                  hint_tiers_triggered: hintTiers,
                  reset_to_start_clicks: resets,
                  check_yourself_correct: cyCorrect,
                  check_yourself_total: cyTotal,
                }).breakdown;
                const taskSec = rec?.time_to_objective_sec;
                const fmtSec = (s?: number) =>
                  s === undefined ? '—' : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
                // Total session time from started_at → quiz_submitted_at if both present.
                const totalSec = rec?.started_at && rec?.quiz_submitted_at
                  ? Math.max(0, Math.round(
                      (new Date(rec.quiz_submitted_at).getTime() - new Date(rec.started_at).getTime()) / 1000
                    ))
                  : undefined;
                return (
                  <div className="bg-white border border-stone-200 rounded-xl p-5 mb-5">
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Your total score</div>
                      <div className="text-[10px] font-mono text-zinc-400">out of 100</div>
                    </div>
                    <div className="flex items-baseline gap-3 mb-5">
                      {/* C1: letter pops in with a tiny bounce. */}
                      <span
                        className={`font-display text-5xl font-semibold ${letterColor} leading-none animate-in zoom-in-50 fade-in duration-700`}
                      >
                        {total.letter}
                      </span>
                      {/* C1: percent counts up from 0 over ~1.2 s. */}
                      <CountedPercent
                        target={total.percent}
                        className="font-display text-3xl font-semibold text-stone-900 leading-none"
                      />
                    </div>

                    {/* Component breakdown — each row shows the detail, the
                        points earned, the max points, and a progress bar. */}
                    <div className="space-y-3">
                      <BreakdownRow
                        label="Primer questions"
                        detail={`${primerScore} of ${primerTotal} correct`}
                        points={bd.primerPts}
                        max={30}
                      />
                      <BreakdownRow
                        label="Knowledge check"
                        detail={`${quizScore} of ${quizTotal} correct`}
                        points={bd.quizPts}
                        max={50}
                      />
                      <BreakdownRow
                        label="Hint usage bonus"
                        detail={
                          hintTiers === 0 ? 'No hints engaged — full bonus'
                          : hintTiers === 1 ? 'One tier of hints engaged — partial bonus'
                          : `${hintTiers} hint tiers engaged — no bonus`
                        }
                        points={bd.hintBonus}
                        max={10}
                      />
                      <BreakdownRow
                        label="Reset usage bonus"
                        detail={
                          resets === 0 ? 'No resets — full bonus'
                          : resets === 1 ? 'One reset — partial bonus'
                          : `${resets} resets — no bonus`
                        }
                        points={bd.resetBonus}
                        max={10}
                      />
                      {cyTotal > 0 && (
                        <BreakdownRow
                          label="Check yourself bonus"
                          detail={`${cyCorrect} of ${cyTotal} correct between the read and the sim`}
                          points={bd.checkYourselfBonus}
                          max={5}
                        />
                      )}
                    </div>

                    {/* Timing footer */}
                    <div className="mt-5 pt-4 border-t border-stone-100 grid grid-cols-2 gap-3">
                      <TimingCard label="Task completion" value={fmtSec(taskSec)} />
                      <TimingCard label="Total module time" value={fmtSec(totalSec)} />
                    </div>
                  </div>
                );
              })()}

              {/* Single "Review your answers →" link replaces the three
                  inline AnswerReview cards. The detailed per-question
                  breakdown lives on the standalone evaluations sub-page. */}
              <button
                onClick={() => setDebriefSubView('evaluations')}
                className="w-full bg-white border border-stone-200 rounded-xl px-5 py-3 mb-5 flex items-center justify-between hover:bg-stone-50 transition group"
              >
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">
                    Detailed evaluation
                  </div>
                  <div className="text-[13px] font-bold text-zinc-800">
                    Review your answers question by question
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-400 group-hover:text-zinc-700 transition" />
              </button>

              <ReviewCard keyPoints={module.key_points} />

              {/* C3 + C4: reordered actions — Next module is the primary
                  forward path, "Up next" microcopy below sets expectations,
                  Return home is a tertiary text link, Restart is buried in a
                  small secondary affordance below. */}
              <div className="mt-5">
                {/* C4: "Up next" one-liner above the primary button. */}
                {onNext && nextModule && (
                  <div className="mb-2 text-[12px] text-zinc-600">
                    <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] mr-1.5">Up next ·</span>
                    <span className="font-bold text-zinc-800">{nextModule.id} — {nextModule.title}</span>
                    <span className="text-zinc-400"> · {nextModule.estimated_minutes} min</span>
                  </div>
                )}
                {!onNext && (
                  <div className="mb-2 text-[12px] text-zinc-600 italic">
                    You've reached the end of the track. Pick another module from the home page.
                  </div>
                )}

                {/* C3: primary Next-module CTA in track color. */}
                {onNext ? (
                  <button
                    onClick={onNext}
                    className={`w-full flex items-center justify-center gap-1.5 px-4 py-3 ${trackTone(module.track).bg} ${trackTone(module.track).bgHover} ${trackTone(module.track).fgOnSolid} rounded-lg text-[14px] font-bold transition shadow-sm`}
                  >
                    Continue to {nextModule?.id ?? 'the next module'} <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => (onHome ?? onBack)()}
                    className={`w-full flex items-center justify-center gap-1.5 px-4 py-3 ${trackTone(module.track).bg} ${trackTone(module.track).bgHover} ${trackTone(module.track).fgOnSolid} rounded-lg text-[14px] font-bold transition shadow-sm`}
                  >
                    <Home size={14} /> Return home
                  </button>
                )}

                {/* Tertiary row: Return home (text link) + buried Restart. */}
                <div className="mt-3 flex items-center justify-between text-[12px]">
                  {onNext && (
                    <button
                      onClick={() => (onHome ?? onBack)()}
                      className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 font-bold transition"
                    >
                      <Home size={12} /> Return home
                    </button>
                  )}
                  <button
                    onClick={handleRestart}
                    className="ml-auto flex items-center gap-1 text-zinc-400 hover:text-zinc-700 font-bold transition"
                  >
                    <RotateCcw size={12} /> Restart this module
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }, [phase, module, objectiveSatisfied, quizSubmitted, idleMs, childStates, stepToast, readSubPhase, formativeBlocks, outcomeProgress, changesSinceProgress, nextModule, debriefSubView]);

  // ── Click-target mode (recognition by clicking a reading/control) ──
  const isClickTargetMode = !!activePrompt?.click_targets && activePrompt.click_targets.length > 0;

  /**
   * Short human descriptions for every readout / control so an unmapped tile
   * click still yields a useful "[Tile] shows X, not what we're looking for"
   * popup. Keeps the schema lean — module configs only need to spell out
   * targets they want a *specific* explanation for.
   */
  const READOUT_DESC: Record<string, string> = {
    pip: 'peak inspiratory pressure (cmH2O)',
    plat: 'plateau pressure (cmH2O)',
    drivingPressure: 'driving pressure (cmH2O)',
    mve: 'minute ventilation (L/min)',
    vte: 'expired tidal volume per breath (mL)',
    totalPeep: 'total PEEP (cmH2O)',
    autoPeep: 'auto-PEEP / air trapping (cmH2O)',
    actualRate: 'the measured respiratory rate (bpm)',
    ieRatio: 'the inspiration : expiration ratio',
    rsbi: 'rapid shallow breathing index',
  };
  const CONTROL_DESC: Record<string, string> = {
    respiratoryRate: 'the set respiratory rate (bpm)',
    tidalVolume: 'the set tidal volume (mL)',
    pInsp: 'the set inspiratory pressure (cmH2O)',
    psLevel: 'the pressure-support level (cmH2O)',
    iTime: 'the set inspiratory time (sec)',
    peep: 'the set PEEP (cmH2O)',
    fiO2: 'the set FiO2 (%)',
    endInspiratoryPercent: 'the expiratory-trigger threshold (%)',
  };

  /**
   * Click handler for recognition click-target mode.
   *
   * Behavior contract (per UX directive):
   *   - WRONG click → show popup with explanation. The recognition_response
   *     is emitted with `is_correct: false` for telemetry; the tracker does
   *     NOT advance. The "Try again" button on the popup just dismisses;
   *     the question banner above the readings stays the same so the learner
   *     can pick another tile.
   *   - CORRECT click → show popup with explanation. The recognition_response
   *     is NOT emitted yet — emit happens on "Continue →" so the next
   *     prompt's banner doesn't appear behind the open popup.
   */
  const handleRecognitionElementClick = (
    label: string,
    isCorrect: boolean,
    element: { kind: 'readout' | 'control'; name: string },
  ) => {
    if (!activePrompt) return;
    // Ignore further clicks while the feedback popup is open — the learner
    // must dismiss it before answering again.
    if (clickFeedback) return;
    const configured = activePrompt.click_targets?.find(
      t => t.element.kind === element.kind && t.element.name === element.name,
    );
    let explanation = configured?.explanation;
    if (!explanation) {
      const desc = (element.kind === 'readout' ? READOUT_DESC : CONTROL_DESC)[element.name];
      const askingFor = activePrompt.click_targets?.find(t => t.is_correct)?.label;
      if (desc && askingFor) {
        explanation = `${label} shows ${desc} — not ${askingFor.toLowerCase()}. Try another reading.`;
      } else if (desc) {
        explanation = `${label} shows ${desc}. That's not what we're looking for — try another.`;
      } else {
        explanation = 'That isn\'t the right one. Try another reading.';
      }
    }
    setClickFeedback({ label, isCorrect, explanation });
    if (!isCorrect) {
      // Emit immediately so wrong attempts are recorded; tracker stays put.
      harness.emit({
        type: 'recognition_response',
        prompt_id: activePrompt.prompt_id,
        selected_label: label,
        is_correct: false,
        timestamp: Date.now(),
      });
    }
    // For correct clicks, the emit is deferred until the learner clicks
    // "Continue →" in the popup.
  };

  /**
   * Popup dismissal. For CORRECT clicks, this is also where we finally fire
   * the recognition_response that advances the compound tracker to the next
   * step. For WRONG clicks, this just closes the popup so the learner can
   * try again on the same question.
   */
  const dismissClickFeedback = () => {
    if (!clickFeedback) return;
    if (clickFeedback.isCorrect && activePrompt) {
      harness.emit({
        type: 'recognition_response',
        prompt_id: activePrompt.prompt_id,
        selected_label: clickFeedback.label,
        is_correct: true,
        timestamp: Date.now(),
      });
    }
    setClickFeedback(null);
  };

  const recognitionTargets = isClickTargetMode
    ? activePrompt!.click_targets!.map(t => ({
        element: t.element,
        label: t.label,
        is_correct: t.is_correct,
      }))
    : undefined;

  // Compact question banner above the Measured Values strip — never blocks
  // the readings themselves. The banner header adapts to whether the correct
  // answer is a measured-value reading or a settable control so the wording
  // matches what the learner is being asked to click.
  const correctTargetKind = activePrompt?.click_targets?.find(t => t.is_correct)?.element.kind;
  const bannerLabel = correctTargetKind === 'control' ? 'Click the control' : 'Click the reading';
  const recognitionBanner = isClickTargetMode ? (
    <div className="bg-sky-50 border border-sky-300 rounded-xl px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Target size={14} className="text-sky-600" />
        <span className="text-[10px] font-black uppercase tracking-widest text-sky-700">
          {bannerLabel}
        </span>
      </div>
      <p className="text-[14px] font-semibold text-zinc-900 leading-snug">
        {activePrompt!.question}
      </p>
    </div>
  ) : null;

  // Click-feedback modal — sits ABOVE the waveform area only (the readings
  // and the workbook stay visible underneath / above). Shows whatever the
  // learner clicked, with explanation. Wrong clicks have a "Try again"
  // button that just dismisses; correct clicks have "Continue →" which
  // closes — the compound tracker has already advanced via respondToPrompt.
  const clickFeedbackModal = clickFeedback ? (
    <div className="bg-white border-2 rounded-2xl shadow-2xl p-5 max-w-md w-full"
      style={{ borderColor: clickFeedback.isCorrect ? '#10b981' : '#e11d48' }}
    >
      <div className="flex items-center gap-2 mb-2">
        {clickFeedback.isCorrect ? (
          <>
            <Check size={18} className="text-emerald-600" strokeWidth={3} />
            <span className="text-[14px] font-black uppercase tracking-wide text-emerald-700">
              {successPhrase(activePrompt?.prompt_id + '|' + clickFeedback.label)}
            </span>
          </>
        ) : (
          <>
            <X size={18} className="text-rose-600" strokeWidth={3} />
            <span className="text-[14px] font-black uppercase tracking-wide text-rose-700">
              {wrongPhrase(activePrompt?.prompt_id + '|' + clickFeedback.label)}
            </span>
          </>
        )}
        <span className="ml-auto text-[11px] font-mono text-zinc-400">
          You clicked: <span className="font-bold text-zinc-700">{clickFeedback.label}</span>
        </span>
      </div>
      {clickFeedback.explanation && (
        <p className="text-[14px] text-zinc-800 leading-relaxed mb-4">
          {clickFeedback.explanation}
        </p>
      )}
      <div className="flex justify-end">
        <button
          onClick={dismissClickFeedback}
          className={`px-4 py-2 rounded-lg text-[13px] font-bold transition shadow-sm ${
            clickFeedback.isCorrect
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300'
          }`}
        >
          {clickFeedback.isCorrect
            ? continueCTA(activePrompt?.prompt_id ?? 'cy')
            : 'Try again'}
        </button>
      </div>
    </div>
  ) : null;

  // ── Inline recognition prompt overlay (over sim) ──
  // MCQ prompts render the legacy floating modal. Click-target prompts use
  // the modal above (clickFeedbackModal) for feedback only — the question
  // itself is the banner above the Measured Values strip.
  const inlinePromptOverlay = clickFeedbackModal
    ? clickFeedbackModal
    : activePrompt && !isClickTargetMode ? (
        <RecognitionPrompt
          prompt={activePrompt}
          onResponse={(label, isCorrect) => respondToPrompt(label, isCorrect)}
          onDismiss={() => setActivePrompt(null)}
        />
      ) : null;

  // ── One-time briefing splash short-circuits everything else ──
  // Shown until the learner clicks "Begin module →". This intentionally
  // bypasses the harness/sim altogether so the orientation feels separate
  // from the working sim view.
  if (!briefingDone) {
    return (
      <IntroBriefing
        module={module}
        onBegin={acknowledgeBriefing}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-brand-cream text-zinc-900 font-sans overflow-hidden select-none">
      {/* Top nav — track-colored brand strip with a sticky learn-tagline. */}
      {(() => {
        const tone = trackTone(module.track);
        const tagline =
          module.briefing?.tagline ?? module.visible_learning_objectives?.[0] ?? '';
        return (
          <div className={`flex items-center justify-between ${tone.bg} ${tone.fgOnSolid} px-5 py-2.5 shrink-0`}>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-white/80 hover:text-white transition shrink-0"
            >
              <ArrowLeft size={14} /> Back to simulations
            </button>
            <div className="flex items-center gap-2 text-[12px] min-w-0">
              <BookOpen size={13} className="text-white/70 shrink-0" />
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-white/15 text-white/95"
              >
                {module.track}
              </span>
              <span className="font-bold text-white shrink-0">{module.id}</span>
              <span className="text-white/40 shrink-0">·</span>
              <span className="text-[14px] font-semibold text-white/95 truncate">{module.title}</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-[11px] italic text-white/80 min-w-0 max-w-[280px]">
              <span className="font-bold uppercase tracking-widest text-[9px] not-italic text-white/60 shrink-0">Goal</span>
              <span className="truncate">{tagline}</span>
            </div>
          </div>
        );
      })()}

      {/* Phase badge — clickable for completed phases (back-nav). Current
          dot is tinted with the track color so the in-module identity
          stays consistent. */}
      <PhaseBadge
        phase={phase}
        completedPhases={completedPhases}
        onJumpToPhase={jumpToPhase}
        accentHex={trackTone(module.track).hex}
      />

      {/* Two-column body */}
      <div className="flex-1 p-2 overflow-hidden min-h-0 relative">
        <PlaygroundSim
          harness={harness}
          initialPreset={module.scenario.preset}
          unlockedControls={module.scenario.unlocked_controls}
          workbookContent={
            // D1: keyed wrapper so the workbook column re-mounts and replays
            // the slide-in animation on every phase change.
            <div
              key={`${phase}-${readSubPhase}`}
              className="h-full animate-in slide-in-from-right-4 fade-in duration-300"
            >
              {workbookContent}
            </div>
          }
          inlinePromptOverlay={inlinePromptOverlay}
          simInteractivity={simInteractivity}
          flashReadouts={flashReadouts}
          recognitionTargets={recognitionTargets}
          recognitionBanner={recognitionBanner}
          onRecognitionElementClick={handleRecognitionElementClick}
          hideHeader
        />
      </div>
    </div>
  );
};

/** C1: number that tweens from 0 → target using the useCountUp hook. */
const CountedPercent: React.FC<{ target: number; className?: string }> = ({ target, className }) => {
  const value = useCountUp(target);
  return <span className={className}>{value}%</span>;
};

const ScoreRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between px-2.5 py-1.5 bg-stone-50 border border-stone-100 rounded">
    <span className="text-zinc-500">{label}</span>
    <span className="font-mono font-bold text-zinc-900">{value}</span>
  </div>
);

/**
 * One line in the score-breakdown card. Shows label + small detail string +
 * a points/max readout and a thin progress bar so the relative contribution
 * is visible at a glance.
 */
const BreakdownRow: React.FC<{
  label: string;
  detail: string;
  points: number;
  max: number;
}> = ({ label, detail, points, max }) => {
  const pct = max > 0 ? Math.max(0, Math.min(100, (points / max) * 100)) : 0;
  const barColor =
    pct >= 90 ? 'bg-emerald-500' :
    pct >= 70 ? 'bg-emerald-400' :
    pct >= 50 ? 'bg-amber-400' :
    pct > 0 ? 'bg-amber-500' : 'bg-zinc-300';
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[12.5px] font-bold text-zinc-800">{label}</span>
        <span className="text-[12px] font-mono">
          <span className="text-zinc-900 font-bold">{points}</span>
          <span className="text-zinc-400"> / {max} pts</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[11px] text-zinc-500 mt-1">{detail}</div>
    </div>
  );
};

/** Two-up timing summary cell. */
const TimingCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">{label}</div>
    <div className="text-[15px] font-mono font-bold text-zinc-900">{value}</div>
  </div>
);

/**
 * Per-question answer review card. Renders each question with a check or X,
 * the option the learner picked, and (when not chosen) the correct option.
 * Collapsed by default so the debrief stays scannable.
 */
const AnswerReview: React.FC<{
  title: string;
  questions: import('./types').QuizQuestion[];
  answers: { question_id: string; selected_label: string; is_correct: boolean }[];
}> = ({ title, questions, answers }) => {
  const [open, setOpen] = React.useState(false);
  if (questions.length === 0) return null;
  const score = answers.filter(a => a.is_correct).length;
  const total = questions.length;
  return (
    <div className="bg-white border border-stone-200 rounded-xl mb-5 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-stone-50 transition"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{title}</span>
          <span className="text-[11px] font-mono">
            <span className={score === total ? 'text-emerald-600 font-bold' : 'text-zinc-700 font-bold'}>{score}</span>
            <span className="text-zinc-400"> / {total} correct</span>
          </span>
        </div>
        <span className="text-[11px] font-bold text-zinc-500">
          {open ? 'Hide answers ▴' : 'Show answers ▾'}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-3 border-t border-stone-100 pt-3">
          {questions.map((q, i) => {
            const ans = answers.find(a => a.question_id === q.id);
            const isCorrect = ans?.is_correct ?? false;
            const correctOpt = q.options.find(o => o.is_correct);
            return (
              <div key={q.id} className="border border-stone-200 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-1.5">
                  {isCorrect ? (
                    <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" strokeWidth={3} />
                  ) : (
                    <X size={14} className="text-rose-600 mt-0.5 shrink-0" strokeWidth={3} />
                  )}
                  <div className="flex-1 text-[12.5px] font-semibold text-zinc-800 leading-snug">
                    {i + 1}. {q.prompt}
                  </div>
                </div>
                {ans && (
                  <div className="ml-5 text-[11.5px] text-zinc-600 leading-relaxed">
                    <span className="font-bold">{isCorrect ? 'You picked:' : 'You picked:'}</span>{' '}
                    <span className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                      {ans.selected_label || '(no answer)'}
                    </span>
                    {!isCorrect && correctOpt && (
                      <div>
                        <span className="font-bold">Correct answer:</span>{' '}
                        <span className="text-emerald-700">{correctOpt.label}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModuleShell;
