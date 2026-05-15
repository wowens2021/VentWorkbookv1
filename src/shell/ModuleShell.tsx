import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Clock, ChevronRight, Trophy, Home, RotateCcw, Check, X } from 'lucide-react';
import type { ModuleConfig, InlinePromptConfig, ExploreCardConfig, PerturbationSpec } from './types';
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
import { persistProgress, loadProgress } from '../persistence/progress';
import { useEngagementTelemetry } from './useEngagementTelemetry';
import { usePhaseFlow } from './usePhaseFlow';

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

// Score math moved to ./scoring.ts per MASTER_SHELL_v3 §9 — a pure module
// is testable and prevents anti-pattern A10 (drift between debrief renders).
import { computeTotalScore, isPassing, PASSING_THRESHOLD } from './scoring';
import { READOUT_DESC, CONTROL_DESC } from './glossary';

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

// computeTotalScore now lives in ./scoring.ts (see import above). The
// formula and weights are documented there. Do not re-inline this function.

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
  // Novice-pass §7.3 + §16.3 — flash plat/drivingPressure on INSP HOLD,
  // and autoPEEP on EXP HOLD, so the learner SEES which readout the
  // pause maneuver reveals.
  inspiratory_pause: ['plat', 'drivingPressure'],
  expiratory_pause: ['autoPeep', 'totalPeep'],
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
/**
 * Derive the try-it success-criteria checklist directly from the tracker
 * configuration when every objective is a recognition prompt. This keeps the
 * blue question banner above the sim and the criteria list on the TaskCard
 * in sync without a second authoring step that can drift. For mixed trackers
 * (manipulation + outcome + recognition) we fall back to the module's
 * explicit `success_criteria_display`.
 */
function deriveSuccessCriteria(module: ModuleConfig): string[] {
  const obj = module.hidden_objective;
  if (obj?.kind === 'recognition' && obj.prompt?.question) {
    return [obj.prompt.question];
  }
  if (obj?.kind === 'compound') {
    const allRecognition = obj.children.every((c: any) => c?.kind === 'recognition' && c?.prompt?.question);
    if (allRecognition) {
      return obj.children.map((c: any) => c.prompt.question as string);
    }
  }
  return module.success_criteria_display ?? ['Continue exploring until the objective is met.'];
}

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

  // ── Harness ──
  const harnessRef = useRef<ScenarioHarness | null>(null);
  if (!harnessRef.current) harnessRef.current = new ScenarioHarness(module.scenario);
  const harness = harnessRef.current;

  // ── Inline recognition prompts ──
  const [activePrompt, setActivePrompt] = useState<InlinePromptConfig | null>(null);
  const [clickFeedback, setClickFeedback] = useState<{
    label: string; isCorrect: boolean; explanation?: string;
  } | null>(null);

  // ── Hint tier counter (read by HintLadder; written by onTierTriggered) ──
  const [hintTiersTriggered, setHintTiersTriggered] = useState(prior?.hint_tiers_triggered ?? 0);

  // ── B2: outcome progress chip (declared early so the engagement hook can
  // depend on it; reset wiring lives in the tracker's onOutcomeProgress) ──
  const [outcomeProgress, setOutcomeProgress] = useState<
    { current: number; target: number; label?: string; byReadout?: any } | null
  >(null);

  // ── Compound-tracker progress (F3) ──
  const [childStates, setChildStates] = useState<boolean[]>(() => {
    if (module.hidden_objective?.kind === 'compound') {
      return module.hidden_objective.children.map(() => false);
    }
    return [];
  });

  // ── Fix 2: extracted hooks ──
  // useEngagementTelemetry owns the active-time accumulator, idle
  // tracking, per-phase counters, and the change-since-progress streak.
  // usePhaseFlow owns the 5-phase state machine + all advanceFrom* /
  // handleRetake / handleRestart actions.
  //
  // useEngagementTelemetry does NOT take phase as input — the
  // phase-dependent effects (now-ticker, phase-exit reset) are wired in
  // explicit useEffects below so engagement can be constructed BEFORE
  // usePhaseFlow without a chicken-and-egg.
  const engagement = useEngagementTelemetry(
    module.id,
    outcomeProgress,
    childStates,
    prior?.time_active_sec,
  );
  const flow = usePhaseFlow({
    module,
    prior,
    engagement,
    resetSimToPreset: () => harness.resetToPreset(),
    externalCleanup: {
      setActivePrompt: () => setActivePrompt(null),
      setStepToast: () => setStepToast(null),
      setHintTiersTriggered: (v: number) => setHintTiersTriggered(v),
      setClickFeedback: () => setClickFeedback(null),
    },
  });
  const {
    phase,
    setPhase,
    readSubPhase,
    setReadSubPhase,
    briefingDone,
    acknowledgeBriefing,
    objectiveSatisfied,
    setObjectiveSatisfied,
    quizSubmitted,
    setQuizSubmitted,
    completedPhases,
    jumpToPhase,
    advanceFromPrimer,
    advanceFromRead,
    advanceFromReadOrCheck,
    advanceFromExplore,
    advanceFromTryIt,
    advanceFromDebrief,
    handleRetake,
    handleRestart,
    onRedoTask,
    checkYourselfAnswersRef,
    handleCheckYourselfAnswer,
    formativeBlocks,
  } = flow;
  // Convenience locals re-exposing engagement-hook outputs that the rest
  // of the component reads. Pure aliases — no behavior change.
  const idleMs = engagement.idleMs;
  const changesSinceProgress = engagement.changesSinceProgress;
  const lastInteractMs = engagement.lastInteractMs;
  const setLastInteractMs = engagement.setLastInteractMs;
  const exploreStartedAtRef = engagement.exploreStartedAtRef;
  const exploreControlChangesRef = engagement.exploreControlChangesRef;
  const taskStartedAtRef = engagement.taskStartedAtRef;
  const taskControlChangesRef = engagement.taskControlChangesRef;
  const resetClicksRef = engagement.resetClicksRef;
  const setChangesSinceProgress = engagement.setChangesSinceProgress;
  const markActive = engagement.markActive;

  // Phase-dependent engagement effects (formerly inline in the hook).
  // 1) 1-Hz now-ticker runs only while in try-it and not satisfied — drives
  //    the HintLadder's idle-based tier triggers.
  useEffect(() => {
    if (phase !== 'try-it' || objectiveSatisfied) return;
    return engagement.startIdleTicker();
  }, [phase, objectiveSatisfied, engagement]);
  // 2) Phase-exit cleanup for the change-streak (reset on leaving try-it).
  useEffect(() => {
    if (phase !== 'try-it') engagement.resetChangeStreak();
  }, [phase, engagement]);

  // (childStates declared above in the hook-binding block — used by both
  // the engagement hook (for change-streak reset) and the TaskCard.)
  // ── Step-complete toast (F4) ──
  const [stepToast, setStepToast] = useState<{ idx: number; total: number } | null>(null);
  // Auto-dismiss the toast after 3 s so it doesn't linger.
  useEffect(() => {
    if (!stepToast) return;
    const id = setTimeout(() => setStepToast(null), 3000);
    return () => clearTimeout(id);
  }, [stepToast]);

  /**
   * A6: sequential-mode state. When a module's hidden_objective has
   * `present_one_at_a_time` set, the TaskCard shows ONE step at a time
   * with an observation block + "Next →" between steps. The tracker
   * is held at the just-completed step until the learner advances.
   *
   * `seqAdvancedThrough` is the highest step index the learner has
   * clicked "Next" past (-1 before any advance). The currently
   * highlighted step is `seqAdvancedThrough + 1`.
   *
   * When the FINAL step fires, the compound's onSatisfied would
   * normally fire setObjectiveSatisfied(true) immediately, jumping the
   * learner straight to the "Task complete" screen without seeing the
   * final observation. We defer that via `seqPendingFinish` and let
   * the final "Finish →" click do the transition.
   */
  const sequentialMode =
    module.hidden_objective?.kind === 'compound' &&
    (module.hidden_objective as any).present_one_at_a_time === true;
  const sequentialObservations: string[] =
    sequentialMode
      ? ((module.hidden_objective as any).observations as string[] | undefined) ?? []
      : [];
  const sequentialTotal =
    sequentialMode && module.hidden_objective?.kind === 'compound'
      ? module.hidden_objective.children.length
      : 0;
  const [seqAdvancedThrough, setSeqAdvancedThrough] = useState(-1);
  const seqPendingFinishRef = useRef(false);
  // Reset the cursor when the phase re-enters try-it.
  useEffect(() => {
    if (phase === 'try-it' && sequentialMode) {
      setSeqAdvancedThrough(-1);
      seqPendingFinishRef.current = false;
    }
  }, [phase, sequentialMode]);

  // (Phase hero banner removed — was too intrusive. The slide-in
  // animation on workbookContent already conveys motion. The
  // PhaseBadge in the top strip still tracks position in the
  // 5-phase sequence.)
  const flashHero = (_target: Phase) => { /* no-op, kept so call sites compile */ };

  // (Engagement counter refs moved to useEngagementTelemetry — see
  // engagement.exploreStartedAtRef / taskStartedAtRef / etc above.)

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

  // (outcomeProgress, childStates, changesSinceProgress, and the
  // change-streak reset wiring all live above — outcomeProgress +
  // childStates are state declared near the hook block; the streak
  // and its phase-exit reset live inside useEngagementTelemetry.)

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
  // Fix 1 — companion flash for control boxes when the "Show me the
  // answer" affordance reveals a control as the correct click-target.
  const [flashControls, setFlashControls] = useState<string[]>([]);
  useEffect(() => {
    if (flashControls.length === 0) return;
    const id = setTimeout(() => setFlashControls([]), 1100);
    return () => clearTimeout(id);
  }, [flashControls]);

  // Novice-pass §2.3: per-prompt wrong-click count. After 3 wrong clicks on
  // a single recognition prompt, a persistent "Show me the answer" link
  // appears in the Direction banner that flashes the correct target.
  const [wrongClicksByPrompt, setWrongClicksByPrompt] = useState<Record<string, number>>({});

  // Novice-pass §16.3 — auto-PEEP delta watcher. Flashes the autoPEEP tile
  // whenever the value moves by ≥ 1 cmH2O between ticks. Draws the novice's
  // eye to the criterion M16 actually grades on.
  const lastAutoPeepRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== 'try-it') return;
    const off = harness.subscribe(ev => {
      if (ev.type !== 'sim_tick') return;
      const ap = ev.computed_readouts.autoPeep;
      if (typeof ap !== 'number') return;
      const last = lastAutoPeepRef.current;
      lastAutoPeepRef.current = ap;
      if (last !== null && Math.abs(ap - last) >= 1) {
        setFlashReadouts(prev => Array.from(new Set([...prev, 'autoPeep'])));
      }
    });
    return off;
  }, [harness, phase]);

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
      // v3.2 §9 — route scripted perturbations through the harness so
      // PlaygroundSim (which subscribes via onPerturbation) re-merges its
      // settings/patient state. M19 uses this to script DOPES decompensations.
      applyPerturbation: (p: PerturbationSpec) => harness.applyPerturbation(p),
      clearPerturbations: () => harness.clearPerturbations(),
    };

    tracker.start(ctx, () => {
      // A6: in sequential mode, hold off the objectiveSatisfied transition
      // until the learner clicks the final "Finish →" — otherwise they'd
      // skip the observation prose for the last step.
      if (sequentialMode) {
        seqPendingFinishRef.current = true;
      } else {
        setObjectiveSatisfied(true);
      }
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

  // (advanceFromPrimer/Read/ReadOrCheck/Explore/TryIt/Debrief,
  // handleRetake, handleRestart, onRedoTask, checkYourselfAnswersRef,
  // handleCheckYourselfAnswer — all moved to usePhaseFlow per Fix 2.
  // Destructured above from `flow`. No behavior change.)

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
          onPredictMcqStatusChange={(s) => {
            // v3.2 §0.4: persist per-block attempts for dashboard telemetry.
            // Best-effort merge — only write to localStorage on completion to
            // avoid hammering writes on every option click.
            if (!s.satisfied) return;
            const latest = loadProgress(module.id);
            const prev = (latest?.predict_mcq_attempts ?? []).filter(
              p => p.block_id !== s.block_id,
            );
            persistProgress({
              module_id: module.id,
              predict_mcq_attempts: [
                ...prev,
                {
                  block_id: s.block_id,
                  attempts: s.attempts,
                  selected_labels: s.selected_labels,
                },
              ],
            });
          }}
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
              successCriteria={deriveSuccessCriteria(module)}
              framingStyle={module.task_framing_style}
              objectiveSatisfied={objectiveSatisfied}
              onReset={onResetToStart}
              onContinueToDebrief={advanceFromTryIt}
              onShowHint={() => setLastInteractMs(Date.now() - 46_000)}  // Fix 7: tier 1 now fires at 45 s of idle, so subtract 46_000 ms to push the ladder one tick past it.
              progress={childStates.length > 0 ? childStates : undefined}
              onRedo={onRedoTask}
              outcomeProgress={outcomeProgress}
              activeDirection={activePrompt?.question}
              // Novice-pass §2.3: after 3 wrong clicks on this prompt,
              // surface a "Show me the answer" link that flashes the
              // correct on-sim target via the existing flash pipeline.
              onShowMeAnswer={
                activePrompt &&
                isClickTargetMode &&
                (wrongClicksByPrompt[activePrompt.prompt_id] ?? 0) >= 3
                  ? () => {
                      const correct = activePrompt.click_targets?.find(t => t.is_correct);
                      // Fix 1 — route to the appropriate flash channel so
                      // control targets actually halo on screen (the prior
                      // implementation called setFlashReadouts for both,
                      // which silently failed on control elements).
                      if (correct?.element.kind === 'readout') {
                        setFlashReadouts([correct.element.name]);
                      } else if (correct?.element.kind === 'control') {
                        setFlashControls([correct.element.name]);
                      }
                    }
                  : undefined
              }
              sequential={
                sequentialMode
                  ? {
                      activeIndex: Math.min(seqAdvancedThrough + 1, sequentialTotal - 1),
                      totalSteps: sequentialTotal,
                      observation:
                        childStates[seqAdvancedThrough + 1]
                          ? sequentialObservations[seqAdvancedThrough + 1] ?? null
                          : null,
                      onAdvanceStep: () => {
                        const justFinished = seqAdvancedThrough + 1;
                        // Bump cursor.
                        setSeqAdvancedThrough(justFinished);
                        // If that was the final step, fire the completion now.
                        if (justFinished >= sequentialTotal - 1 && seqPendingFinishRef.current) {
                          seqPendingFinishRef.current = false;
                          setObjectiveSatisfied(true);
                          persistProgress({
                            module_id: module.id,
                            objective_satisfied_at: new Date().toISOString(),
                          });
                        }
                      },
                    }
                  : undefined
              }
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
                // A1: total module time is now ACTIVE engagement seconds —
                // accumulated only while the tab is visible and the learner
                // is not idle. Replaces the prior wall-clock between started_at
                // and quiz_submitted_at, which could span days across sessions
                // (the "1506 min" bug).
                const totalSec = rec?.time_active_sec ?? accumulatedSecRef.current;
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
                        points earned, the max points, and a progress bar.
                        (?) tooltips explain the bonus categories that
                        previously read as opaque ("Reset Usage Bonus"). */}
                    <div className="space-y-3">
                      <BreakdownRow
                        label="Primer"
                        detail={`${primerScore} of ${primerTotal} correct`}
                        points={bd.primerPts}
                        max={30}
                        help="Three multiple-choice questions before the read phase. Each is worth 10 points."
                      />
                      <BreakdownRow
                        label="Knowledge check"
                        detail={`${quizScore} of ${quizTotal} correct`}
                        points={bd.quizPts}
                        max={50}
                        help="The summative quiz at the end of the module. Each question is worth 10 points."
                      />
                      <BreakdownRow
                        label="Stayed independent"
                        detail={
                          hintTiers === 0 ? 'No hints engaged — full bonus'
                          : hintTiers === 1 ? 'One tier of hints engaged — partial bonus'
                          : `${hintTiers} hint tiers engaged — no bonus`
                        }
                        points={bd.hintBonus}
                        max={10}
                        help="Bonus for completing the task without opening the hint ladder. Full 10 points for zero hints, partial for one tier, none beyond that."
                      />
                      <BreakdownRow
                        label="Stayed on task"
                        detail={
                          resets === 0 ? 'No resets — full bonus'
                          : resets === 1 ? 'One reset — partial bonus'
                          : `${resets} resets — no bonus`
                        }
                        points={bd.resetBonus}
                        max={10}
                        help='Bonus for completing the task without clicking "Reset to start." Full 10 points for zero resets, partial for one, none beyond that.'
                      />
                      {cyTotal > 0 && (
                        <BreakdownRow
                          label="Self-check questions"
                          detail={`${cyCorrect} of ${cyTotal} correct between the read and the sim`}
                          points={bd.checkYourselfBonus}
                          max={5}
                          help="Inline formative questions that appear in the middle of the read phase. Up to 5 bonus points (1 per correct answer, scaled)."
                        />
                      )}
                    </div>

                    {/* Timing footer */}
                    <div className="mt-5 pt-4 border-t border-stone-100 grid grid-cols-2 gap-3">
                      <TimingCard
                        label="Task completion"
                        value={fmtSec(taskSec)}
                        help="Wall-clock seconds from when you started Phase 4 until the objective was satisfied."
                      />
                      <TimingCard
                        label="Active engagement time"
                        value={fmtSec(totalSec)}
                        help="Counted only while this tab is visible and you're actively interacting. Idle time and background tabs don't count."
                      />
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

              {/* A2: pass / retake gate at 80%. Below threshold the
                  primary action becomes "Retake the module" and the
                  forward path demotes to a text link — no hard lockout. */}
              <div className="mt-5">
                {/* Pass-state banner */}
                {!isPassing(total.percent) && (
                  <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                    <div className="text-[11px] font-black uppercase tracking-widest text-amber-700 mb-1">
                      Below passing
                    </div>
                    <p className="text-[13px] text-amber-900 leading-snug">
                      A score of {PASSING_THRESHOLD}% is the bar for this module. You scored {total.percent}%. Retake to lock in a better score — best attempt wins. You can move on without retaking, but the next module is easier with this one solid.
                    </p>
                  </div>
                )}

                {/* "Up next" micro-line — only when passing AND there's a next */}
                {isPassing(total.percent) && onNext && nextModule && (
                  <div className="mb-2 text-[12px] text-zinc-600">
                    <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] mr-1.5">Up next ·</span>
                    <span className="font-bold text-zinc-800">{nextModule.id} — {nextModule.title}</span>
                    <span className="text-zinc-400"> · {nextModule.estimated_minutes} min</span>
                  </div>
                )}
                {isPassing(total.percent) && !onNext && (
                  <div className="mb-2 text-[12px] text-zinc-600 italic">
                    You've reached the end of the track. Pick another module from the home page.
                  </div>
                )}

                {/* Primary CTA — Retake (below threshold) or Continue (passing). */}
                {!isPassing(total.percent) ? (
                  <button
                    onClick={handleRetake}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-brand-olive hover:bg-brand-olive-hover text-white rounded-lg text-[14px] font-bold transition shadow-sm"
                  >
                    <RotateCcw size={14} /> Retake the module
                  </button>
                ) : onNext ? (
                  <button
                    onClick={onNext}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-brand-olive hover:bg-brand-olive-hover text-white rounded-lg text-[14px] font-bold transition shadow-sm"
                  >
                    Continue to {nextModule?.id ?? 'the next module'} <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => (onHome ?? onBack)()}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-brand-olive hover:bg-brand-olive-hover text-white rounded-lg text-[14px] font-bold transition shadow-sm"
                  >
                    <Home size={14} /> Return home
                  </button>
                )}

                {/* Tertiary row. Below-threshold: a secondary "Move on anyway"
                    link plus the Restart link; passing: Return home + Restart. */}
                <div className="mt-3 flex items-center justify-between text-[12px]">
                  {!isPassing(total.percent) && onNext ? (
                    <button
                      onClick={onNext}
                      className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 font-bold transition"
                    >
                      Move on anyway → {nextModule?.id}
                    </button>
                  ) : (
                    onNext && (
                      <button
                        onClick={() => (onHome ?? onBack)()}
                        className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 font-bold transition"
                      >
                        <Home size={12} /> Return home
                      </button>
                    )
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
  // A5: lookups extracted to ./glossary so the sim's hover tooltips and
  // the wrong-click feedback path share a single source.

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
      // Novice-pass §2.3: bump the per-prompt wrong-click counter so the
      // "Show me the answer" affordance can surface after 3 wrong clicks
      // even if the learner never went idle.
      setWrongClicksByPrompt(prev => ({
        ...prev,
        [activePrompt.prompt_id]: (prev[activePrompt.prompt_id] ?? 0) + 1,
      }));
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

  // The sim-side "CLICK THE READING / CONTROL" banner used to live above the
  // Measured Values strip. It was duplicated by the workbook-side "DIRECTION"
  // panel on the TaskCard, so we keep only the workbook one.
  const recognitionBanner = null;

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
          onContinue={() => {
            // Force-advance: emit a recognition_response with is_correct=true
            // using the prompt's correct option label, so a wrong-answer
            // attempt no longer blocks the tracker. The original wrong
            // response has already been emitted by `onResponse` above for
            // telemetry, so attempts_per_recognition still reflects reality.
            if (!activePrompt) return;
            const correctOpt = activePrompt.options.find(o => o.is_correct);
            if (correctOpt) {
              respondToPrompt(correctOpt.label, true);
            } else {
              // Defensive fallback: just close the prompt.
              setActivePrompt(null);
            }
          }}
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
    <div className="flex flex-col h-screen bg-brand-olive text-zinc-900 font-sans overflow-hidden select-none">
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
          flashControls={flashControls}
          onPrvcAdjust={() => {
            // Per MASTER_SHELL_v3 §6 M9 tighten: when the PRVC adaptive
            // algorithm ticks its inspiratory-pressure target, flash the
            // PIP readout so the learner sees the algorithm working. Only
            // arm this during the try-it phase to avoid spurious halos
            // in Read / Explore where the algorithm is also live.
            if (phase === 'try-it') setFlashReadouts(['pip']);
          }}
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
  /** A3: optional plain-English explanation of what this row rewards. Shown
   *  in the browser-native tooltip on the (?) icon so the learner can see
   *  *why* points exist for it (e.g. "stayed on task without resetting"). */
  help?: string;
}> = ({ label, detail, points, max, help }) => {
  const pct = max > 0 ? Math.max(0, Math.min(100, (points / max) * 100)) : 0;
  const barColor =
    pct >= 90 ? 'bg-emerald-500' :
    pct >= 70 ? 'bg-emerald-400' :
    pct >= 50 ? 'bg-amber-400' :
    pct > 0 ? 'bg-amber-500' : 'bg-zinc-300';
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[12.5px] font-bold text-zinc-800 flex items-center gap-1.5">
          {label}
          {help && (
            <span
              className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-stone-200 text-stone-600 text-[9px] font-bold cursor-help"
              title={help}
            >
              ?
            </span>
          )}
        </span>
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

/**
 * Two-up timing summary cell. Optional `help` text renders a (?) tooltip
 * next to the label so the learner can see what the number actually means.
 * Fix 2: "Total module time" → "Active engagement time" with help text
 * that calls out the active-tab + non-idle gating, since the value isn't
 * wall-clock.
 */
const TimingCard: React.FC<{ label: string; value: string; help?: string }> = ({ label, value, help }) => (
  <div className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5 flex items-center gap-1.5">
      <span>{label}</span>
      {help && (
        <span
          className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-stone-200 text-stone-600 text-[8px] font-bold cursor-help"
          title={help}
        >
          ?
        </span>
      )}
    </div>
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
