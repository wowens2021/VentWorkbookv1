/**
 * usePhaseFlow — extracted from ModuleShell per Fix 2.
 *
 * Owns: the 5-phase state machine (briefing → primer → read → explore →
 * try-it → debrief), the readSubPhase substate, the briefing
 * acknowledgment, objectiveSatisfied / quizSubmitted flags,
 * completedPhases tracking, jumpToPhase navigation, and all the
 * `advanceFrom*` actions plus handleRetake / handleRestart.
 *
 * Pure extraction — no behavior change vs the previous in-component
 * implementation. The hook calls persistProgress / loadProgress /
 * clearProgress directly; the parent supplies a resetSimToPreset
 * callback for handleRestart and a small bundle of "external cleanup"
 * setters (recognition prompt, step toast, hint-tier counter) that
 * handleRestart and onRedoTask invoke.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  persistProgress,
  loadProgress,
  clearProgress,
} from '../persistence/progress';
import { computeTotalScore } from './scoring';
import type { ModuleConfig, ProgressRecord, ContentBlock } from './types';
import type { Phase } from './PhaseBadge';
import type { EngagementTelemetry } from './useEngagementTelemetry';

interface Args {
  module: ModuleConfig;
  prior: ProgressRecord | null;
  engagement: EngagementTelemetry;
  /** Called by handleRestart to reset the sim. */
  resetSimToPreset: () => void;
  /** Called by handleRestart / onRedoTask to clear UI state that lives
   *  outside this hook (recognition prompts, step toast, hint tiers,
   *  click feedback popups). All optional — pass only the ones you need
   *  to wipe. */
  externalCleanup?: {
    setActivePrompt?: (v: null) => void;
    setStepToast?: (v: null) => void;
    setHintTiersTriggered?: (v: number) => void;
    setClickFeedback?: (v: null) => void;
  };
}

export interface PhaseFlow {
  phase: Phase;
  setPhase: React.Dispatch<React.SetStateAction<Phase>>;
  readSubPhase: 'prose' | 'check';
  setReadSubPhase: React.Dispatch<React.SetStateAction<'prose' | 'check'>>;
  briefingDone: boolean;
  acknowledgeBriefing: () => void;
  objectiveSatisfied: boolean;
  setObjectiveSatisfied: React.Dispatch<React.SetStateAction<boolean>>;
  quizSubmitted: boolean;
  setQuizSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
  completedPhases: Set<Phase>;
  jumpToPhase: (target: Phase) => void;
  advanceFromPrimer: (score: number, answers: any[]) => void;
  advanceFromRead: () => void;
  advanceFromReadOrCheck: () => void;
  advanceFromExplore: () => void;
  advanceFromTryIt: () => void;
  advanceFromDebrief: (score: number, answers: any[]) => void;
  handleRetake: () => void;
  handleRestart: () => void;
  onRedoTask: () => void;
  /** Check-yourself answers captured during the Read.check sub-phase.
   *  Returned so the debrief render can iterate over them. */
  checkYourselfAnswersRef: React.MutableRefObject<
    Map<string, { question_id: string; selected_label: string; is_correct: boolean }>
  >;
  handleCheckYourselfAnswer: (a: {
    question_id: string;
    selected_label: string;
    is_correct: boolean;
  }) => void;
  /** Formative blocks pulled out of the module config — used by the
   *  read-phase routing + scoring. */
  formativeBlocks: Extract<ContentBlock, { kind: 'formative' }>[];
}

export function usePhaseFlow({
  module,
  prior,
  engagement,
  resetSimToPreset,
  externalCleanup,
}: Args): PhaseFlow {
  // ── One-time intro briefing splash ──
  const [briefingDone, setBriefingDone] = useState(
    !!prior?.briefing_acknowledged_at,
  );
  const acknowledgeBriefing = () => {
    persistProgress({
      module_id: module.id,
      briefing_acknowledged_at: new Date().toISOString(),
    });
    setBriefingDone(true);
  };

  // ── Initial phase derivation ──
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
  const [objectiveSatisfied, setObjectiveSatisfied] = useState(
    !!prior?.objective_satisfied_at,
  );
  const [quizSubmitted, setQuizSubmitted] = useState(!!prior?.quiz_submitted_at);

  // ── Read sub-phase ──
  const formativeBlocks = useMemo(
    () =>
      module.content_blocks.filter(
        (b): b is Extract<ContentBlock, { kind: 'formative' }> =>
          b.kind === 'formative',
      ),
    [module],
  );
  const [readSubPhase, setReadSubPhase] = useState<'prose' | 'check'>('prose');

  // ── Completed-phase tracking ──
  const completedPhases = useMemo(() => {
    const set = new Set<Phase>();
    if (prior?.primer_completed_at) set.add('primer');
    if (prior?.reading_completed_at) set.add('read');
    if (prior?.task_started_at) set.add('explore');
    if (prior?.objective_satisfied_at) set.add('try-it');
    if (prior?.quiz_submitted_at) set.add('debrief');
    const passed: Phase[] = ['primer', 'read', 'explore', 'try-it', 'debrief'];
    const idx = passed.indexOf(phase);
    for (let i = 0; i < idx; i++) set.add(passed[i]);
    if (objectiveSatisfied) set.add('try-it');
    if (quizSubmitted) set.add('debrief');
    return set;
  }, [prior, phase, objectiveSatisfied, quizSubmitted]);

  const jumpToPhase = (target: Phase) => {
    if (!completedPhases.has(target) || target === phase) return;
    setPhase(target);
    engagement.setLastInteractMs(Date.now());
  };

  // ── Check-yourself answer capture ──
  const checkYourselfAnswersRef = useRef<
    Map<string, { question_id: string; selected_label: string; is_correct: boolean }>
  >(new Map());
  const handleCheckYourselfAnswer = (a: {
    question_id: string;
    selected_label: string;
    is_correct: boolean;
  }) => {
    checkYourselfAnswersRef.current.set(a.question_id, a);
  };

  // ── Persist start on first mount ──
  useEffect(() => {
    persistProgress({
      module_id: module.id,
      started_at: prior?.started_at ?? new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module.id]);

  // ── Fix 4 — phase_entries counter ──
  // Increments each time the learner enters a phase, including via
  // back-navigation. The briefing splash counts as an entry the first
  // time it's shown; check-yourself sub-phase counts as a distinct
  // entry from the read prose.
  useEffect(() => {
    const key: keyof NonNullable<typeof prior>['phase_entries'] extends never
      ? string
      : string =
      phase === 'read' && readSubPhase === 'check' ? 'check_yourself'
      : phase === 'try-it' ? 'try_it'
      : phase;
    const latest = loadProgress(module.id);
    const existing = latest?.phase_entries?.[key as keyof NonNullable<typeof latest>['phase_entries']] ?? 0;
    persistProgress({
      module_id: module.id,
      phase_entries: { [key]: existing + 1 } as any,
    });
  }, [phase, readSubPhase, module.id]);

  // Briefing splash counts as a distinct entry — fires on first mount
  // and on every restart (which sets briefingDone back to false).
  useEffect(() => {
    if (briefingDone) return;
    const latest = loadProgress(module.id);
    const existing = latest?.phase_entries?.briefing ?? 0;
    persistProgress({
      module_id: module.id,
      phase_entries: { briefing: existing + 1 },
    });
  }, [briefingDone, module.id]);

  // ── Fix 4 — abandon tracking ──
  // If the learner closes the tab mid-module (quiz not yet submitted),
  // stamp the abandon point. Cleared implicitly when the next debrief
  // submission overwrites last_abandon_at via a future write — we don't
  // need to explicitly clear here.
  useEffect(() => {
    const phaseKey =
      phase === 'read' && readSubPhase === 'check' ? 'check_yourself' : phase;
    const onBeforeUnload = () => {
      const latest = loadProgress(module.id);
      if (latest?.quiz_submitted_at) return;
      persistProgress({
        module_id: module.id,
        last_abandon_at: new Date().toISOString(),
        last_abandon_phase: phaseKey,
      });
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [module.id, phase, readSubPhase]);

  // ── Phase transitions ──
  const advanceFromPrimer = (score: number, answers: any[]) => {
    persistProgress({
      module_id: module.id,
      primer_completed_at: new Date().toISOString(),
      primer_score: score,
      primer_answers: answers,
    });
    setPhase('read');
    engagement.setLastInteractMs(Date.now());
  };

  const advanceFromRead = () => {
    if (formativeBlocks.length > 0 && readSubPhase === 'prose') {
      setReadSubPhase('check');
      return;
    }
    advanceFromReadOrCheck();
  };

  const advanceFromReadOrCheck = () => {
    persistProgress({
      module_id: module.id,
      reading_completed_at: new Date().toISOString(),
    });
    if (checkYourselfAnswersRef.current.size > 0) {
      persistProgress({
        module_id: module.id,
        check_yourself_answers: Array.from(
          checkYourselfAnswersRef.current.values(),
        ),
      });
    }
    engagement.exploreStartedAtRef.current = Date.now();
    engagement.exploreControlChangesRef.current = 0;
    persistProgress({
      module_id: module.id,
      exploration_started_at: new Date().toISOString(),
    });
    setReadSubPhase('prose');
    setPhase('explore');
  };

  const advanceFromExplore = () => {
    const dur = engagement.exploreStartedAtRef.current
      ? Math.round(
          (Date.now() - engagement.exploreStartedAtRef.current) / 1000,
        )
      : undefined;
    persistProgress({
      module_id: module.id,
      exploration_duration_sec: dur,
      exploration_control_changes: engagement.exploreControlChangesRef.current,
    });
    setPhase('try-it');
    engagement.setLastInteractMs(Date.now());
  };

  const advanceFromTryIt = () => {
    setPhase('debrief');
  };

  const advanceFromDebrief = (score: number, answers: any[]) => {
    const latest = loadProgress(module.id);
    const priorBest = latest?.quiz_best_score ?? latest?.quiz_score;
    const isImprovement = priorBest === undefined || score > priorBest;
    const bestScore = isImprovement ? score : priorBest!;
    const bestAnswers = isImprovement
      ? answers
      : latest?.quiz_answers ?? answers;

    const cyAnswers: {
      question_id: string;
      selected_label: string;
      is_correct: boolean;
    }[] =
      Array.from(checkYourselfAnswersRef.current.values()).length > 0
        ? Array.from(checkYourselfAnswersRef.current.values())
        : latest?.check_yourself_answers ?? [];
    const merged = {
      primer_score: latest?.primer_score,
      primer_total: module.primer_questions.length,
      quiz_score: bestScore,
      quiz_total: module.summative_quiz.length,
      hint_tiers_triggered: latest?.hint_tiers_triggered ?? 0,
      reset_to_start_clicks:
        latest?.reset_to_start_clicks ?? engagement.resetClicksRef.current,
      check_yourself_correct: cyAnswers.filter(a => a.is_correct).length,
      check_yourself_total: formativeBlocks.length,
    };
    const total = computeTotalScore(merged);
    persistProgress({
      module_id: module.id,
      quiz_submitted_at: new Date().toISOString(),
      quiz_score: bestScore,
      quiz_best_score: bestScore,
      quiz_attempts: (latest?.quiz_attempts ?? 0) + 1,
      quiz_answers: bestAnswers,
      total_score_percent: total.percent,
      total_score_letter: total.letter,
    });
    setQuizSubmitted(true);
  };

  const handleRetake = () => {
    const latest = loadProgress(module.id);
    persistProgress({
      module_id: module.id,
      primer_completed_at: undefined as any,
      primer_score: undefined as any,
      primer_answers: undefined as any,
      quiz_submitted_at: undefined as any,
      total_score_percent: undefined as any,
      total_score_letter: undefined as any,
    });
    setQuizSubmitted(false);
    setPhase('primer');
    void latest;
  };

  const handleRestart = () => {
    clearProgress(module.id);
    setObjectiveSatisfied(false);
    setQuizSubmitted(false);
    externalCleanup?.setActivePrompt?.(null);
    externalCleanup?.setClickFeedback?.(null);
    externalCleanup?.setStepToast?.(null);
    externalCleanup?.setHintTiersTriggered?.(0);
    engagement.exploreControlChangesRef.current = 0;
    engagement.taskControlChangesRef.current = 0;
    engagement.resetClicksRef.current = 0;
    engagement.exploreStartedAtRef.current = null;
    engagement.taskStartedAtRef.current = null;
    resetSimToPreset();
    setPhase('primer');
    setBriefingDone(false);
    persistProgress({
      module_id: module.id,
      started_at: new Date().toISOString(),
    });
  };

  const onRedoTask = () => {
    setObjectiveSatisfied(false);
    externalCleanup?.setActivePrompt?.(null);
    externalCleanup?.setStepToast?.(null);
  };

  return {
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
  };
}
