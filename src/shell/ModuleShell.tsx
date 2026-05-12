import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Target, Clock } from 'lucide-react';
import type { ModuleConfig, InlinePromptConfig } from './types';
import PrimerQuiz from './PrimerQuiz';
import ContentBlocks from './ContentBlocks';
import GateButton from './GateButton';
import SummativeQuiz from './SummativeQuiz';
import ReviewCard from './ReviewCard';
import HintLadder from './HintLadder';
import RecognitionPrompt from './RecognitionPrompt';
import PlaygroundSim from '../components/PlaygroundSim';
import { ScenarioHarness } from '../harness/ScenarioHarness';
import { buildTracker, type Tracker } from '../trackers';
import { persistProgress, loadProgress } from '../persistence/progress';

interface Props {
  module: ModuleConfig;
  onBack: () => void;
  onNext?: () => void;
}

type Phase = 'primer' | 'content' | 'quiz' | 'review';

const ModuleShell: React.FC<Props> = ({ module, onBack, onNext }) => {
  // ── Resume from prior progress ──
  const prior = useMemo(() => loadProgress(module.id), [module.id]);

  // Persist start
  useEffect(() => {
    persistProgress({ module_id: module.id, started_at: prior?.started_at ?? new Date().toISOString() });
  }, [module.id]);

  // ── Phase ──
  const [phase, setPhase] = useState<Phase>(prior?.primer_completed_at ? 'content' : 'primer');
  const [objectiveSatisfied, setObjectiveSatisfied] = useState(!!prior?.objective_satisfied_at);
  const [quizSubmitted, setQuizSubmitted] = useState(!!prior?.quiz_submitted_at);
  const [gatePulse, setGatePulse] = useState(false);

  // ── Harness + tracker (only after primer) ──
  const harnessRef = useRef<ScenarioHarness | null>(null);
  const trackerRef = useRef<Tracker | null>(null);
  if (!harnessRef.current) harnessRef.current = new ScenarioHarness(module.scenario);
  const harness = harnessRef.current;

  // ── Inline recognition prompts ──
  const [activePrompt, setActivePrompt] = useState<InlinePromptConfig | null>(null);

  // ── Hint ladder idle tracking ──
  const [lastInteractMs, setLastInteractMs] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const idleMs = now - lastInteractMs;

  useEffect(() => {
    if (phase !== 'content' || objectiveSatisfied) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase, objectiveSatisfied]);

  // Track hint tier escalations
  const [hintTiersTriggered, setHintTiersTriggered] = useState(prior?.hint_tiers_triggered ?? 0);

  // ── Wire harness to tracker ──
  useEffect(() => {
    if (phase !== 'content' || objectiveSatisfied) return;
    const tracker = buildTracker(module.hidden_objective);
    trackerRef.current = tracker;

    const ctx = {
      baseline_controls: harness.baseline_controls,
      presentPrompt: (p: InlinePromptConfig) => setActivePrompt(p),
      resetToPreset: () => harness.resetToPreset(),
    };

    tracker.start(ctx, () => {
      setObjectiveSatisfied(true);
      setGatePulse(true);
      // capture replay snapshot
      const snap = harness.snapshot();
      const ref = `snap_${module.id}_${Date.now()}`;
      try { localStorage.setItem(`vp:snap:${ref}`, JSON.stringify(snap)); } catch {}
      persistProgress({
        module_id: module.id,
        objective_satisfied_at: new Date().toISOString(),
        replay_snapshot_ref: ref,
      });
      setTimeout(() => setGatePulse(false), 3500);
    });

    const off = harness.subscribe(ev => {
      // any relevant interaction resets idle timer
      if (ev.type === 'control_changed' || ev.type === 'recognition_response') {
        setLastInteractMs(Date.now());
      }
      tracker.handle(ev);
    });

    // Inline prompts from the scenario itself (configured triggers)
    module.scenario.inline_prompts?.forEach(prompt => {
      if (prompt.trigger.kind === 'on_load') setActivePrompt(prompt);
    });

    return () => { off(); tracker.stop(); trackerRef.current = null; };
  }, [phase, objectiveSatisfied, module.id]);

  // ── Handle recognition response ──
  const respondToPrompt = (selectedLabel: string, isCorrect: boolean) => {
    if (!activePrompt) return;
    harness.emit({
      type: 'recognition_response',
      prompt_id: activePrompt.prompt_id,
      selected_label: selectedLabel,
      is_correct: isCorrect,
      timestamp: Date.now(),
    });
    if (isCorrect) {
      setTimeout(() => setActivePrompt(null), 800);
    }
  };

  // ── Hint tier callback ──
  const onTierTriggered = (tier: 1 | 2 | 3) => {
    setHintTiersTriggered(t => {
      const next = Math.max(t, tier);
      persistProgress({ module_id: module.id, hint_tiers_triggered: next });
      return next;
    });
  };

  const onShowMe = () => {
    const demo = module.hint_ladder.tier3?.demonstration;
    if (!demo) return;
    harness.emit({ type: 'demonstration_played', control: demo.control, timestamp: Date.now() });
    // brief value pulse then reset
    harness.emit({ type: 'control_changed', control: demo.control, old_value: harness.baseline_controls[demo.control], new_value: demo.target_value, timestamp: Date.now() });
    setTimeout(() => harness.resetToPreset(), 2000);
  };

  // ── Workbook content based on phase ──
  const workbookContent = useMemo(() => {
    if (phase === 'primer') {
      return (
        <PrimerQuiz
          questions={module.primer_questions}
          onComplete={(score, answers) => {
            persistProgress({
              module_id: module.id,
              primer_completed_at: new Date().toISOString(),
              primer_score: score,
              primer_answers: answers,
            });
            setPhase('content');
            setLastInteractMs(Date.now());
          }}
        />
      );
    }

    if (phase === 'quiz') {
      return (
        <SummativeQuiz
          questions={module.summative_quiz}
          onSubmit={score => {
            persistProgress({
              module_id: module.id,
              quiz_submitted_at: new Date().toISOString(),
              quiz_score: score,
            });
            setQuizSubmitted(true);
            setPhase('review');
          }}
        />
      );
    }

    // 'content' or 'review' phase
    return (
      <div className="h-full flex flex-col px-5 py-4 overflow-y-auto">
        {/* Module header */}
        <div className="mb-4 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 bg-sky-900/30 px-1.5 py-0.5 rounded">{module.track}</span>
            <span className="text-[10px] font-mono text-zinc-500">{module.id}</span>
            <span className="text-[10px] text-zinc-600 flex items-center gap-1">
              <Clock size={10} /> {module.estimated_minutes} min
            </span>
          </div>
          <h1 className="text-lg font-black text-zinc-100 leading-tight">{module.title}</h1>
          <div className="mt-2">
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1">
              <Target size={10} /> Objectives
            </div>
            <ul className="space-y-0.5">
              {module.visible_learning_objectives.map((o, i) => (
                <li key={i} className="text-[11.5px] text-zinc-300 leading-snug">• {o}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Hint ladder (above content) */}
        <HintLadder
          hint={module.hint_ladder}
          idleMs={idleMs}
          onShowMe={onShowMe}
          onTierTriggered={onTierTriggered}
          suppressed={objectiveSatisfied || phase !== 'content'}
        />

        {/* Content */}
        <div className="flex-1">
          <ContentBlocks blocks={module.content_blocks} />
        </div>

        {/* Gate */}
        {phase === 'content' && (
          <GateButton
            enabled={objectiveSatisfied}
            pulse={gatePulse}
            onClick={() => setPhase('quiz')}
          />
        )}

        {/* Review card after quiz submission */}
        {quizSubmitted && (
          <>
            <ReviewCard keyPoints={module.key_points} />
            {onNext && (
              <button
                onClick={onNext}
                className="mt-3 w-full px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-lg transition"
              >
                Next module →
              </button>
            )}
          </>
        )}
      </div>
    );
  }, [phase, module, objectiveSatisfied, gatePulse, quizSubmitted, idleMs]);

  // ── Inline prompt overlay (rendered over waveforms) ──
  const inlinePromptOverlay = activePrompt ? (
    <RecognitionPrompt
      prompt={activePrompt}
      onResponse={(label, isCorrect) => respondToPrompt(label, isCorrect)}
      onDismiss={() => setActivePrompt(null)}
    />
  ) : null;

  // ── Top bar (replaces the sim's own header) ──
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden select-none">
      <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 border-b border-zinc-800">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-white">
          <ArrowLeft size={14} /> Back to modules
        </button>
        <div className="flex items-center gap-2 text-[11px]">
          <BookOpen size={13} className="text-sky-400" />
          <span className="font-bold text-zinc-200">{module.id}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">{module.title}</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          {phase === 'primer' && 'Primer'}
          {phase === 'content' && (objectiveSatisfied ? 'Objective met' : 'Exploring')}
          {phase === 'quiz' && 'Knowledge check'}
          {phase === 'review' && 'Review'}
        </div>
      </div>
      <div className="flex-1 p-3 overflow-hidden">
        <PlaygroundSim
          harness={harness}
          initialPreset={module.scenario.preset}
          unlockedControls={module.scenario.unlocked_controls}
          workbookContent={workbookContent}
          inlinePromptOverlay={inlinePromptOverlay}
          hideHeader
        />
      </div>
    </div>
  );
};

export default ModuleShell;
