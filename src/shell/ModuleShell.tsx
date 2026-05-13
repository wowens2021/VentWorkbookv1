import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Target, Clock, ChevronRight, Trophy, Home, RotateCcw } from 'lucide-react';
import type { ModuleConfig, InlinePromptConfig, ExploreCardConfig } from './types';
import PrimerQuiz from './PrimerQuiz';
import ContentBlocks from './ContentBlocks';
import CheckYourselfPage from './CheckYourselfPage';
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
}

/**
 * Composite performance score (0–100). Weighting:
 *   - Primer first-attempt:   30% (primer_score / 3 × 30)
 *   - Summative quiz:         50% (quiz_score / 5 × 50)
 *   - Hint-usage bonus:       up to +10 (no hints) / +5 (tier 1 only) / 0 otherwise
 *   - Reset-usage bonus:      up to +10 (zero resets) / +5 (one) / 0 otherwise
 */
function computeTotalScore(rec: {
  primer_score?: number;
  primer_total?: number;
  quiz_score?: number;
  quiz_total?: number;
  hint_tiers_triggered?: number;
  reset_to_start_clicks?: number;
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
  const percent = Math.max(0, Math.min(100, primerPts + quizPts + hintBonus + resetBonus));
  const letter: 'A' | 'B' | 'C' | 'D' | 'F' =
    percent >= 90 ? 'A' :
    percent >= 80 ? 'B' :
    percent >= 70 ? 'C' :
    percent >= 60 ? 'D' : 'F';
  return {
    percent,
    letter,
    breakdown: { primerPts, quizPts, hintBonus, resetBonus },
  };
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

const ModuleShell: React.FC<Props> = ({ module, onBack, onNext, onHome }) => {
  // ── Resume from prior progress ──
  const prior = useMemo(() => loadProgress(module.id), [module.id]);

  // Persist start on first mount
  useEffect(() => {
    persistProgress({ module_id: module.id, started_at: prior?.started_at ?? new Date().toISOString() });
  }, [module.id]);

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

  // ── Engagement counters (per §1.9) ──
  const exploreStartedAtRef = useRef<number | null>(null);
  const exploreControlChangesRef = useRef(0);
  const taskStartedAtRef = useRef<number | null>(null);
  const taskControlChangesRef = useRef(0);
  const resetClicksRef = useRef(0);

  // ── Global harness subscriber for engagement counting ──
  // Always subscribed; only the tracker is conditionally subscribed in Phase 4.
  useEffect(() => {
    const off = harness.subscribe(ev => {
      if (ev.type === 'control_changed') {
        if (phase === 'explore') exploreControlChangesRef.current += 1;
        if (phase === 'try-it') taskControlChangesRef.current += 1;
        setLastInteractMs(Date.now());
      }
      if (ev.type === 'recognition_response') {
        setLastInteractMs(Date.now());
      }
    });
    return off;
  }, [harness, phase]);

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
    };

    tracker.start(ctx, () => {
      setObjectiveSatisfied(true);
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

    return () => { off(); tracker.stop(); };
  }, [phase, objectiveSatisfied, module.id]);

  // ── Recognition response → harness ──
  const respondToPrompt = (selectedLabel: string, isCorrect: boolean) => {
    if (!activePrompt) return;
    harness.emit({
      type: 'recognition_response',
      prompt_id: activePrompt.prompt_id,
      selected_label: selectedLabel,
      is_correct: isCorrect,
      timestamp: Date.now(),
    });
    if (isCorrect) setTimeout(() => setActivePrompt(null), 800);
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

    // 2) Recognition prompt currently active — auto-answer with the correct
    //    label so the learner who is stuck can still advance. For click-target
    //    prompts (e.g. M1), the green flash lands on the correct tile too.
    if (activePrompt) {
      const correctClick = activePrompt.click_targets?.find(t => t.is_correct);
      if (correctClick) {
        setClickFeedback({
          label: correctClick.label,
          isCorrect: true,
          explanation: correctClick.explanation,
        });
        harness.emit({
          type: 'recognition_response',
          prompt_id: activePrompt.prompt_id,
          selected_label: correctClick.label,
          is_correct: true,
          timestamp: Date.now(),
        });
        // Mirror respondToPrompt's auto-clear so the next prompt loads
        // cleanly when the compound tracker advances.
        setTimeout(() => setActivePrompt(null), 800);
        return;
      }
      const correctOpt = activePrompt.options.find(o => o.is_correct);
      if (correctOpt) {
        harness.emit({
          type: 'recognition_response',
          prompt_id: activePrompt.prompt_id,
          selected_label: correctOpt.label,
          is_correct: true,
          timestamp: Date.now(),
        });
        setTimeout(() => setActivePrompt(null), 800);
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

  /** Move from Read (either sub-phase) → Explore. Persists timestamps and
   *  initializes the exploration counters. */
  const advanceFromReadOrCheck = () => {
    persistProgress({
      module_id: module.id,
      reading_completed_at: new Date().toISOString(),
    });
    exploreStartedAtRef.current = Date.now();
    exploreControlChangesRef.current = 0;
    persistProgress({
      module_id: module.id,
      exploration_started_at: new Date().toISOString(),
    });
    setReadSubPhase('prose'); // reset for back-nav
    setPhase('explore');
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
    setLastInteractMs(Date.now());
  };

  const advanceFromTryIt = () => {
    setPhase('debrief');
  };

  const advanceFromDebrief = (score: number, answers: any[]) => {
    // Compute the composite total score and persist alongside the quiz result.
    const merged = {
      primer_score: prior?.primer_score,
      primer_total: module.primer_questions.length,
      quiz_score: score,
      quiz_total: module.summative_quiz.length,
      hint_tiers_triggered: prior?.hint_tiers_triggered ?? 0,
      reset_to_start_clicks: prior?.reset_to_start_clicks ?? resetClicksRef.current,
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
    // Re-seed started_at so the dashboard sees a fresh attempt
    persistProgress({ module_id: module.id, started_at: new Date().toISOString() });
  };

  // ── Per-phase sim interactivity ──
  // When revisiting an already-completed phase via back-nav, the sim opens up
  // (no need to re-lock controls) — the learner is in review mode.
  const isReviewing = completedPhases.has(phase) && phase !== 'debrief' && quizSubmitted;
  const simInteractivity: SimInteractivity =
    phase === 'primer' ? 'locked'
    : phase === 'read' ? (isReviewing ? 'live' : 'live-disabled')
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
            onContinue={advanceFromReadOrCheck}
          />
        );
      }
      // Sub-phase 'prose' — uncluttered reading view; formative blocks are
      // stripped out by ContentBlocks and rendered on the next sub-page.
      const ctaLabel = formativeBlocks.length > 0
        ? 'Continue — quick check yourself'
        : "I'm ready — let me try it";
      return (
        <div className="h-full flex flex-col px-5 py-3 overflow-y-auto">
          <div className="mb-3 pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-olive bg-stone-50 px-2 py-0.5 rounded">{module.track}</span>
              <span className="text-[10px] font-mono text-zinc-500">{module.id}</span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Clock size={11} /> {module.estimated_minutes} min
              </span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-zinc-900 leading-tight tracking-tight">{module.title}</h1>
            <div className="mt-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1">
                <Target size={11} /> Objectives
              </div>
              <ul className="space-y-0.5">
                {module.visible_learning_objectives.map((o, i) => (
                  <li key={i} className="text-[13px] text-zinc-700 leading-snug">• {o}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex-1">
            <ContentBlocks blocks={module.content_blocks} />
          </div>
          <button
            onClick={advanceFromRead}
            className="mt-4 w-full px-4 py-2.5 bg-brand-olive hover:bg-brand-olive-hover text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            {ctaLabel} <ChevronRight size={14} />
          </button>
        </div>
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
            onSubmit={(score) => {
              const answers = module.summative_quiz.map(q => ({
                question_id: q.id,
                selected_label: '', // not yet exposed
                is_correct: false,
              }));
              advanceFromDebrief(score, answers);
            }}
          />
        ) : (() => {
          // Pull the latest persisted record so the score is consistent with
          // what's stored (rather than relying on stale closures).
          const rec = loadProgress(module.id);
          const total = rec?.total_score_percent !== undefined
            ? { percent: rec.total_score_percent, letter: rec.total_score_letter ?? 'F' }
            : computeTotalScore({
                primer_score: rec?.primer_score,
                primer_total: module.primer_questions.length,
                quiz_score: rec?.quiz_score,
                quiz_total: module.summative_quiz.length,
                hint_tiers_triggered: rec?.hint_tiers_triggered,
                reset_to_start_clicks: rec?.reset_to_start_clicks,
              });
          const letterColor =
            total.letter === 'A' ? 'text-emerald-600' :
            total.letter === 'B' ? 'text-emerald-500' :
            total.letter === 'C' ? 'text-amber-600' :
            total.letter === 'D' ? 'text-amber-700' : 'text-rose-600';
          return (
            <div className="h-full flex flex-col px-5 py-5 overflow-y-auto">
              {/* Banner */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 mb-5 flex items-center gap-3">
                <Trophy size={20} className="text-emerald-700 shrink-0" />
                <div>
                  <div className="text-[14px] font-bold text-emerald-900 leading-tight">Module complete</div>
                  <div className="text-[12px] text-emerald-700">{module.title}</div>
                </div>
              </div>

              {/* Total score card */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 mb-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Your total score</div>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className={`font-display text-5xl font-semibold ${letterColor} leading-none`}>{total.letter}</span>
                  <span className="font-display text-3xl font-semibold text-stone-900 leading-none">{total.percent}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                  <ScoreRow label="Primer" value={`${rec?.primer_score ?? 0} / ${module.primer_questions.length}`} />
                  <ScoreRow label="Knowledge check" value={`${rec?.quiz_score ?? 0} / ${module.summative_quiz.length}`} />
                  <ScoreRow label="Hint tiers used" value={String(rec?.hint_tiers_triggered ?? 0)} />
                  <ScoreRow label="Resets" value={String(rec?.reset_to_start_clicks ?? 0)} />
                </div>
                {rec?.time_to_objective_sec !== undefined && (
                  <div className="mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
                    Task completed in {rec.time_to_objective_sec}s
                  </div>
                )}
              </div>

              <ReviewCard keyPoints={module.key_points} />

              {/* Three actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-5">
                <button
                  onClick={handleRestart}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg text-[13px] font-bold text-stone-700 transition"
                >
                  <RotateCcw size={14} /> Restart module
                </button>
                <button
                  onClick={() => (onHome ?? onBack)()}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg text-[13px] font-bold text-stone-700 transition"
                >
                  <Home size={14} /> Return home
                </button>
                <button
                  onClick={onNext}
                  disabled={!onNext}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-olive hover:bg-brand-olive-hover disabled:bg-stone-200 disabled:text-stone-400 text-white rounded-lg text-[13px] font-bold transition"
                >
                  Next module <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }, [phase, module, objectiveSatisfied, quizSubmitted, idleMs, childStates, stepToast, readSubPhase, formativeBlocks]);

  // ── Click-target mode (recognition by clicking a reading/control) ──
  const isClickTargetMode = !!activePrompt?.click_targets && activePrompt.click_targets.length > 0;
  // Reset feedback whenever a new prompt loads.
  useEffect(() => {
    setClickFeedback(null);
  }, [activePrompt?.prompt_id]);
  // Auto-clear wrong-answer feedback after 2.5 s so the learner can retry.
  useEffect(() => {
    if (!clickFeedback || clickFeedback.isCorrect) return;
    const id = setTimeout(() => setClickFeedback(null), 2500);
    return () => clearTimeout(id);
  }, [clickFeedback]);

  const handleRecognitionElementClick = (label: string, isCorrect: boolean) => {
    if (!activePrompt) return;
    const target = activePrompt.click_targets?.find(t => t.label === label);
    setClickFeedback({ label, isCorrect, explanation: target?.explanation });
    respondToPrompt(label, isCorrect);
  };

  const recognitionTargets = isClickTargetMode
    ? activePrompt!.click_targets!.map(t => ({
        element: t.element,
        label: t.label,
        is_correct: t.is_correct,
      }))
    : undefined;

  const recognitionBanner = isClickTargetMode ? (
    <div className="bg-sky-50 border border-sky-300 rounded-xl px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Target size={14} className="text-sky-600" />
        <span className="text-[10px] font-black uppercase tracking-widest text-sky-700">
          Click the reading
        </span>
      </div>
      <p className="text-[14px] font-semibold text-zinc-900 leading-snug">
        {activePrompt!.question}
      </p>
      {clickFeedback && (
        <div
          className={`mt-2 border rounded-md px-3 py-2 text-[12.5px] leading-snug ${
            clickFeedback.isCorrect
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-rose-300 bg-rose-50 text-rose-900'
          }`}
        >
          <span className="font-bold">
            {clickFeedback.isCorrect ? 'Correct.' : 'Not quite — try another.'}
          </span>
          {clickFeedback.explanation && (
            <span className="ml-1.5 text-zinc-700">{clickFeedback.explanation}</span>
          )}
        </div>
      )}
    </div>
  ) : null;

  // ── Inline recognition prompt overlay (over sim) — MCQ modal only ──
  // Suppressed in click-target mode so the modal doesn't block the readings.
  const inlinePromptOverlay = activePrompt && !isClickTargetMode ? (
    <RecognitionPrompt
      prompt={activePrompt}
      onResponse={(label, isCorrect) => respondToPrompt(label, isCorrect)}
      onDismiss={() => setActivePrompt(null)}
    />
  ) : null;

  return (
    <div className="flex flex-col h-screen bg-brand-cream text-zinc-900 font-sans overflow-hidden select-none">
      {/* Top nav — olive brand strip */}
      <div className="flex items-center justify-between bg-brand-olive text-white px-5 py-2.5 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-white/80 hover:text-white transition"
        >
          <ArrowLeft size={14} /> Back to simulations
        </button>
        <div className="flex items-center gap-2 text-[12px]">
          <BookOpen size={13} className="text-white/70" />
          <span className="font-bold text-white">{module.id}</span>
          <span className="text-white/40">·</span>
          <span className="text-[14px] font-semibold text-white/95">{module.title}</span>
        </div>
        <div className="w-[160px]" /> {/* spacer for symmetry */}
      </div>

      {/* Phase badge — clickable for completed phases (back-nav) */}
      <PhaseBadge phase={phase} completedPhases={completedPhases} onJumpToPhase={jumpToPhase} />

      {/* Two-column body */}
      <div className="flex-1 p-2 overflow-hidden min-h-0">
        <PlaygroundSim
          harness={harness}
          initialPreset={module.scenario.preset}
          unlockedControls={module.scenario.unlocked_controls}
          workbookContent={workbookContent}
          inlinePromptOverlay={inlinePromptOverlay}
          simInteractivity={simInteractivity}
          recognitionTargets={recognitionTargets}
          recognitionBanner={recognitionBanner}
          onRecognitionElementClick={handleRecognitionElementClick}
          hideHeader
        />
      </div>
    </div>
  );
};

const ScoreRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between px-2.5 py-1.5 bg-stone-50 border border-stone-100 rounded">
    <span className="text-zinc-500">{label}</span>
    <span className="font-mono font-bold text-zinc-900">{value}</span>
  </div>
);

export default ModuleShell;
