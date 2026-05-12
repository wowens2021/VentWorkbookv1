import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Target, Clock, ChevronRight } from 'lucide-react';
import type { ModuleConfig, InlinePromptConfig, ExploreCardConfig } from './types';
import PrimerQuiz from './PrimerQuiz';
import ContentBlocks from './ContentBlocks';
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

interface Props {
  module: ModuleConfig;
  onBack: () => void;
  onNext?: () => void;
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

const ModuleShell: React.FC<Props> = ({ module, onBack, onNext }) => {
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

  // ── Harness + tracker ──
  const harnessRef = useRef<ScenarioHarness | null>(null);
  if (!harnessRef.current) harnessRef.current = new ScenarioHarness(module.scenario);
  const harness = harnessRef.current;

  // ── Inline recognition prompts ──
  const [activePrompt, setActivePrompt] = useState<InlinePromptConfig | null>(null);

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

    const ctx = {
      baseline_controls: harness.baseline_controls,
      presentPrompt: (p: InlinePromptConfig) => setActivePrompt(p),
      resetToPreset: () => harness.resetToPreset(),
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
      setTimeout(() => harness.resetToPreset(), 2000);
      return;
    }
    const target = module.scenario.unlocked_controls[0];
    if (target) harness.emit({ type: 'demonstration_played', control: target, timestamp: Date.now() });
  };

  // ── Reset button (used in Phase 3 + Phase 4 cards) ──
  const onResetToStart = () => {
    if (phase === 'try-it') resetClicksRef.current += 1;
    harness.resetToPreset();
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

  const advanceFromRead = () => {
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
    persistProgress({
      module_id: module.id,
      quiz_submitted_at: new Date().toISOString(),
      quiz_score: score,
      quiz_answers: answers,
    });
    setQuizSubmitted(true);
  };

  // ── Per-phase sim interactivity ──
  const simInteractivity: SimInteractivity =
    phase === 'primer' ? 'locked'
    : phase === 'read' ? 'live-disabled'
    : phase === 'try-it' ? 'live'
    : phase === 'debrief' ? 'live-frozen'
    : 'live'; // explore

  // ── Workbook content by phase ──
  const workbookContent = useMemo(() => {
    if (phase === 'primer') {
      return <PrimerQuiz questions={module.primer_questions} onComplete={advanceFromPrimer} />;
    }

    if (phase === 'read') {
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
            I'm ready — let me try it <ChevronRight size={14} />
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
              onShowHint={() => setLastInteractMs(Date.now() - 60_000)}  // force tier 1
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
                selected_label: '', // SummativeQuiz doesn't yet expose answers; placeholder
                is_correct: false,
              }));
              advanceFromDebrief(score, answers);
            }}
          />
        ) : (
          <div className="h-full flex flex-col px-5 py-4 overflow-y-auto">
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 mb-4">
              <span className="text-[13px] font-bold text-emerald-800">Module complete.</span>
            </div>
            <ReviewCard keyPoints={module.key_points} />
            {onNext && (
              <button
                onClick={onNext}
                className="mt-3 w-full px-4 py-2 bg-brand-olive hover:bg-brand-olive-hover text-white text-sm font-bold rounded-lg transition"
              >
                Next module →
              </button>
            )}
          </div>
        )}
      </div>
    );
  }, [phase, module, objectiveSatisfied, quizSubmitted, idleMs]);

  // ── Inline recognition prompt overlay (over sim) ──
  const inlinePromptOverlay = activePrompt ? (
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
          <span className="font-display text-[15px] italic text-white/95">{module.title}</span>
        </div>
        <div className="w-[160px]" /> {/* spacer for symmetry */}
      </div>

      {/* Phase badge — always visible (§1.2) */}
      <PhaseBadge phase={phase} />

      {/* Two-column body */}
      <div className="flex-1 p-2 overflow-hidden min-h-0">
        <PlaygroundSim
          harness={harness}
          initialPreset={module.scenario.preset}
          unlockedControls={module.scenario.unlocked_controls}
          workbookContent={workbookContent}
          inlinePromptOverlay={inlinePromptOverlay}
          simInteractivity={simInteractivity}
          hideHeader
        />
      </div>
    </div>
  );
};

export default ModuleShell;
