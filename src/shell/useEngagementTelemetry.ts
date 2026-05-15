/**
 * useEngagementTelemetry — extracted from ModuleShell per Fix 2.
 *
 * Owns: active-engagement-seconds accumulator, idle tracking for the
 * hint ladder, per-phase counters (explore/task control changes, reset
 * clicks), and the "changes since outcome progress" streak.
 *
 * Pure extraction — no behavior change vs the previous in-component
 * implementation. Side effects (intervals, beforeunload listeners,
 * progress persistence on unmount) fire on the same schedule.
 *
 * NOTE on signature: the hook does NOT take phase as a constructor
 * arg. The phase-dependent effects (the now-ticker, the change-streak
 * phase-exit reset) are exposed as `phaseAwareEffect` helpers the
 * consumer wires up via a single useEffect after the phase value is
 * known. This avoids the chicken-and-egg with usePhaseFlow (which owns
 * the phase state) and keeps the active-time interval / beforeunload
 * listener registered exactly once.
 */
import { useEffect, useRef, useState } from 'react';
import { persistProgress } from '../persistence/progress';

interface OutcomeProgress {
  current: number;
  target: number;
  label?: string;
  byReadout?: unknown;
}

export interface EngagementTelemetry {
  /** Milliseconds since the last user-driven interaction. */
  idleMs: number;
  /** Sliding counter of try-it control_changes since the last forward
   *  progress. */
  changesSinceProgress: number;
  setChangesSinceProgress: React.Dispatch<React.SetStateAction<number>>;
  /** Bump on every learner interaction. */
  markActive: () => void;
  exploreStartedAtRef: React.MutableRefObject<number | null>;
  exploreControlChangesRef: React.MutableRefObject<number>;
  taskStartedAtRef: React.MutableRefObject<number | null>;
  taskControlChangesRef: React.MutableRefObject<number>;
  resetClicksRef: React.MutableRefObject<number>;
  accumulatedSecRef: React.MutableRefObject<number>;
  flushActiveTime: () => void;
  lastInteractMs: number;
  setLastInteractMs: React.Dispatch<React.SetStateAction<number>>;
  /** Trigger the 1-Hz idle-counter increment. ModuleShell starts/stops
   *  this on phase = try-it && !objectiveSatisfied. */
  startIdleTicker: () => () => void;
  /** Reset the change-streak and its supporting refs. Called on
   *  try-it phase exit. */
  resetChangeStreak: () => void;
}

const IDLE_THRESHOLD_MS = 5 * 60 * 1000;

export function useEngagementTelemetry(
  moduleId: string,
  outcomeProgress: OutcomeProgress | null,
  childStates: boolean[],
  priorTimeActiveSec: number | undefined,
): EngagementTelemetry {
  // ── Active engagement timer ──
  const lastActiveMsRef = useRef(Date.now());
  const accumulatedSecRef = useRef(priorTimeActiveSec ?? 0);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      const sinceLast = Date.now() - lastActiveMsRef.current;
      if (sinceLast > IDLE_THRESHOLD_MS) return;
      accumulatedSecRef.current += 5;
    }, 5000);
    return () => clearInterval(id);
  }, [moduleId]);

  const flushActiveTime = () => {
    persistProgress({
      module_id: moduleId,
      time_active_sec: accumulatedSecRef.current,
      last_active_at: new Date().toISOString(),
    });
  };

  useEffect(() => {
    const beforeunload = () => flushActiveTime();
    window.addEventListener('beforeunload', beforeunload);
    return () => {
      flushActiveTime();
      window.removeEventListener('beforeunload', beforeunload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  const markActive = () => {
    lastActiveMsRef.current = Date.now();
  };

  // ── Hint-ladder idle tracking ──
  const [lastInteractMs, setLastInteractMs] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const idleMs = now - lastInteractMs;

  useEffect(() => {
    lastActiveMsRef.current = lastInteractMs;
  }, [lastInteractMs]);

  /** Start the 1-Hz `now`-ticker. Returns a cleanup. Caller fires this
   *  from an effect gated on phase === 'try-it' && !objectiveSatisfied. */
  const startIdleTicker = () => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  };

  // ── Per-phase counters ──
  const exploreStartedAtRef = useRef<number | null>(null);
  const exploreControlChangesRef = useRef(0);
  const taskStartedAtRef = useRef<number | null>(null);
  const taskControlChangesRef = useRef(0);
  const resetClicksRef = useRef(0);

  // ── Change-since-progress streak ──
  const [changesSinceProgress, setChangesSinceProgress] = useState(0);
  const lastOutcomeProgressRef = useRef(0);
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

  const resetChangeStreak = () => {
    setChangesSinceProgress(0);
    lastOutcomeProgressRef.current = 0;
    childStatesDoneCountRef.current = 0;
  };

  return {
    idleMs,
    changesSinceProgress,
    setChangesSinceProgress,
    markActive,
    exploreStartedAtRef,
    exploreControlChangesRef,
    taskStartedAtRef,
    taskControlChangesRef,
    resetClicksRef,
    accumulatedSecRef,
    flushActiveTime,
    lastInteractMs,
    setLastInteractMs,
    startIdleTicker,
    resetChangeStreak,
  };
}
