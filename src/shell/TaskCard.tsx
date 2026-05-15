import React from 'react';
import { Target, RotateCcw, ChevronRight, Lightbulb, Check, Circle, Activity, X } from 'lucide-react';
import type { TaskFramingStyle } from './types';

/**
 * Friendly display labels for readout keys, used in the TaskCard's
 * per-criterion live cards. Keep these short — they live inside small
 * cards. Falls back to the raw key for any unmapped readout.
 */
const READOUT_LABEL: Record<string, string> = {
  pip: 'PIP',
  plat: 'Pplat',
  drivingPressure: 'Driving P',
  mve: 'MVe',
  vte: 'Vte',
  totalPeep: 'Total PEEP',
  autoPeep: 'Auto-PEEP',
  actualRate: 'Rate',
  ieRatio: 'I:E',
  rsbi: 'RSBI',
  ph: 'pH',
  paco2: 'PaCO2',
  pao2: 'PaO2',
  spo2: 'SpO2',
  hco3: 'HCO3',
  fio2: 'FiO2',
  peep: 'PEEP',
  tidalVolumeSet: 'Set Vt',
  meanAirwayPressure: 'Mean Paw',
  sbp: 'SBP',
  etco2: 'ETCO2',
};

interface Props {
  userFacingTask: string;
  successCriteria: string[];
  framingStyle?: TaskFramingStyle;
  objectiveSatisfied: boolean;
  onReset: () => void;
  onContinueToDebrief: () => void;
  onShowHint: () => void;
  /**
   * F3: per-criterion progress for compound objectives. `progress[i] === true`
   * means the i-th child tracker has fired. Length matches `successCriteria`
   * when the shell can map 1:1; otherwise we still render checkmarks up to
   * min(length).
   */
  progress?: boolean[];
  /** F8: re-arm the tracker so the learner can redo the task. */
  onRedo?: () => void;
  /**
   * B2: live partial-completion progress from the active outcome tracker.
   * Rendered as a "Holding 3 of 5 breaths…" chip so the learner sees that
   * their adjustments ARE working, even before satisfaction fires.
   */
  outcomeProgress?: {
    current: number;
    target: number;
    label?: string;
    /** Novice-pass §15.2: per-criterion live status. Each entry says whether
     *  one specific readout is currently passing, so a novice holding 4 of 5
     *  knows which one is the bottleneck. */
    byReadout?: { name: string; current: number | boolean; threshold: number | boolean; operator: string; passing: boolean }[];
  } | null;
  /**
   * The currently-active recognition prompt question, surfaced as a
   * "Direction" line directly above the success criteria. Mirrors the
   * blue banner that appears over the sim so the learner sees the same
   * instruction in both places. Omitted when no prompt is active.
   */
  activeDirection?: string;
  /**
   * Novice-pass §2.3: when the learner has accumulated ≥ 3 wrong clicks
   * on the current click-target prompt, surface a "Show me the answer"
   * affordance alongside the Direction banner. Clicking it flashes the
   * correct on-sim target via the existing flashReadouts pipeline.
   */
  onShowMeAnswer?: () => void;
  /**
   * A6: when set, the TaskCard shows exactly ONE active step (rather
   * than the full criteria list), and once that step lands shows an
   * inline "observation" prose block with a "Next →" button that calls
   * `onAdvanceStep`. Used by modules with
   * `hidden_objective.present_one_at_a_time = true`.
   */
  sequential?: {
    /** Index of the currently-active step (0-based). */
    activeIndex: number;
    /** Total steps. */
    totalSteps: number;
    /** Observation prose for the just-completed step, if any. */
    observation: string | null;
    /** Called when the learner clicks "Next →" to advance past the
     *  current observation to the next step's direction. */
    onAdvanceStep: () => void;
  };
}

/**
 * Phase 4 — Task card.
 * Shows the user-facing clinical framing distinct from the backend tracker (§1.6).
 * Collapses to a ✓ summary once the objective fires `satisfied` (§1.4 Phase 4).
 */
const TaskCard: React.FC<Props> = ({
  userFacingTask,
  successCriteria,
  framingStyle,
  objectiveSatisfied,
  onReset,
  onContinueToDebrief,
  onShowHint,
  progress,
  onRedo,
  outcomeProgress,
  activeDirection,
  onShowMeAnswer,
  sequential,
}) => {
  if (objectiveSatisfied) {
    return (
      <div className="h-full flex flex-col px-5 py-4">
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <Check size={14} className="text-white" strokeWidth={3} />
          </div>
          <span className="text-[13px] font-bold text-emerald-800 leading-snug">
            Task complete — nice work.
          </span>
        </div>

        <div className="text-[12px] text-zinc-500 leading-relaxed mb-1">Your task was:</div>
        <p className="text-[13px] text-zinc-700 leading-relaxed mb-4 pb-3 border-b border-zinc-200">
          {userFacingTask}
        </p>

        <button
          onClick={onContinueToDebrief}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-olive hover:bg-brand-olive-hover text-white rounded-lg text-sm font-bold transition shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          Continue to debrief <ChevronRight size={14} />
        </button>

        {/* F8: redo-task link — re-arm the tracker without leaving the phase. */}
        {onRedo && (
          <button
            onClick={onRedo}
            className="mt-3 mx-auto flex items-center gap-1.5 text-[12px] font-bold text-zinc-500 hover:text-zinc-800 transition"
          >
            <RotateCcw size={12} /> Redo this task
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col px-5 py-4 overflow-y-auto">
      {/* Task header — slightly larger icon + cleaner kicker chip for the
          framing style. The framing-style chip used to be a tiny mono
          tag in the corner; now it's a small pill that reads naturally. */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-6 h-6 rounded-md bg-rose-100 flex items-center justify-center shrink-0">
          <Target size={14} className="text-rose-600" strokeWidth={2.5} />
        </div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-rose-700">Your task</h2>
        {framingStyle && (
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
            {framingStyle === 'A' ? 'direct' : framingStyle === 'B' ? 'clinical' : 'recognition'}
          </span>
        )}
      </div>

      <p className="text-[15px] text-zinc-900 leading-relaxed mb-4 font-medium">
        {userFacingTask}
      </p>

      {/* A6: sequential one-step-at-a-time mode. Shows the active step
          number, the current criterion text (active styling), then either
          an observation + "Next →" button (if the step just landed) or
          nothing (if the step is still in progress). */}
      {sequential && (
        <section className="mb-4 rounded-lg border border-brand-olive/30 bg-brand-olive/5 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-olive">
              Step {sequential.activeIndex + 1} of {sequential.totalSteps}
            </span>
          </div>
          <p className="text-[14px] font-semibold text-stone-900 leading-snug mb-2">
            {successCriteria[sequential.activeIndex] ?? ''}
          </p>
          {sequential.observation && (
            <>
              <div className="mt-3 rounded-md bg-white border border-stone-200 px-3 py-2.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-1">
                  What just happened
                </span>
                <p className="text-[13px] text-stone-700 leading-snug">
                  {sequential.observation}
                </p>
              </div>
              {/* Novice-pass §3.2 — dominant forward CTA. Full-width, large,
                  animated entry so a novice scanning the screen cannot miss it. */}
              <button
                onClick={sequential.onAdvanceStep}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-olive hover:bg-brand-olive-hover text-white rounded-lg text-[15px] font-black uppercase tracking-wide transition shadow-lg ring-2 ring-brand-olive/30 animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                {sequential.activeIndex + 1 < sequential.totalSteps ? 'Next step →' : 'Finish →'}
              </button>
            </>
          )}
        </section>
      )}

      {activeDirection && !sequential && (
        <section className="mb-4 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2.5">
          <span className="text-[11px] font-black uppercase tracking-widest text-sky-700 block mb-1">
            Direction
          </span>
          <p className="text-[14px] font-semibold text-sky-900 leading-snug">
            {activeDirection}
          </p>
          {onShowMeAnswer && (
            <button
              type="button"
              onClick={onShowMeAnswer}
              className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-sky-700 hover:text-sky-900 underline underline-offset-2 decoration-dotted"
            >
              Show me the answer →
            </button>
          )}
        </section>
      )}

      {successCriteria.length > 0 && !sequential && (
        <section className="mb-4">
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500 block mb-2">
            Success criteria
          </span>
          <ul className="space-y-2 bg-stone-50 border border-stone-200 rounded-lg p-3">
            {successCriteria.map((c, i) => {
              // F3: show a filled check for satisfied steps, hollow circle otherwise.
              // Only applied when the shell provided a progress array (compound trackers).
              const hasProgress = !!progress && progress.length > 0;
              const done = hasProgress && !!progress[i];
              // A4: the first un-satisfied step is "active." Bold it, give it
              // a sky-blue indicator + light wash so it's obvious which step
              // the learner is currently on. Past = strikethrough; future =
              // dim hollow circle.
              const firstUnsatisfied = hasProgress
                ? progress!.findIndex(p => !p)
                : -1;
              const isActive = hasProgress && !done && i === firstUnsatisfied;
              return (
                <li
                  key={i}
                  className={`text-[13px] leading-snug flex items-start gap-2.5 transition ${
                    isActive ? 'bg-sky-50 border border-sky-300 rounded-md px-2 py-1.5 -mx-1 shadow-sm' : ''
                  }`}
                >
                  {hasProgress ? (
                    done ? (
                      <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm transition">
                        <Check size={11} strokeWidth={3.5} className="text-white" />
                      </div>
                    ) : isActive ? (
                      <span className="mt-1 shrink-0 inline-block w-3 h-3 rounded-full bg-sky-500 ring-2 ring-sky-200 animate-pulse" />
                    ) : (
                      <Circle size={14} className="text-zinc-300 mt-0.5 shrink-0" strokeWidth={2} />
                    )
                  ) : (
                    <span className="text-emerald-600 mt-0.5 text-base leading-none">•</span>
                  )}
                  <span
                    className={
                      done
                        ? 'text-zinc-400 line-through'
                        : isActive
                          ? 'text-sky-900 font-bold'
                          : 'text-zinc-700 font-medium'
                    }
                  >
                    {c}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* B2 + appearance polish: live "you're getting warmer" panel.
          Larger, more prominent layout — bigger counter, full-width
          chunky progress bar, and per-criterion live cards with
          friendly labels, current values, and target thresholds. */}
      {outcomeProgress && outcomeProgress.target > 0 && (
        <div className="mb-4 -mt-1 animate-in fade-in duration-300">
          <div className="rounded-xl border-2 border-sky-300 bg-gradient-to-br from-sky-50 to-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
              <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center shrink-0 shadow-sm">
                <Activity size={15} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-sky-700 leading-none mb-0.5">
                  Holding breath streak
                </div>
                <div className="text-[14px] font-bold text-sky-900 leading-tight">
                  {outcomeProgress.label ?? 'breaths within target'}
                </div>
              </div>
              <div className="flex items-baseline gap-1 shrink-0 font-mono">
                <span className="text-3xl font-black text-sky-700 leading-none tabular-nums">
                  {outcomeProgress.current}
                </span>
                <span className="text-base font-bold text-sky-400 leading-none">/{outcomeProgress.target}</span>
              </div>
            </div>
            <div className="px-4 pb-3">
              <div className="h-2.5 rounded-full bg-sky-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full transition-all duration-500 shadow-inner"
                  style={{ width: `${Math.min(100, (outcomeProgress.current / outcomeProgress.target) * 100)}%` }}
                />
              </div>
            </div>
            {/* Per-criterion live cards. Each readout gets a small card
                showing its name, current value, threshold, and pass/fail
                color so the learner sees WHICH criterion is the bottleneck. */}
            {outcomeProgress.byReadout && outcomeProgress.byReadout.length > 0 && (
              <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                {outcomeProgress.byReadout.map(r => {
                  const label = READOUT_LABEL[r.name] ?? r.name;
                  const opSymbol = r.operator === '>=' ? '≥'
                    : r.operator === '<=' ? '≤'
                    : r.operator === '>' ? '>'
                    : r.operator === '<' ? '<'
                    : r.operator === '==' ? '='
                    : r.operator;
                  const currentDisplay = typeof r.current === 'number'
                    ? r.current.toFixed(0)
                    : String(r.current);
                  return (
                    <div
                      key={r.name}
                      className={`rounded-lg border-2 px-2.5 py-1.5 transition-colors ${
                        r.passing
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-rose-50 border-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                          r.passing ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {label}
                        </span>
                        {r.passing ? (
                          <Check size={13} strokeWidth={3} className="text-emerald-600 shrink-0" />
                        ) : (
                          <X size={13} strokeWidth={3} className="text-rose-600 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-lg font-mono font-black leading-none tabular-nums ${
                          r.passing ? 'text-emerald-900' : 'text-rose-900'
                        }`}>
                          {currentDisplay}
                        </span>
                        <span className={`text-[10px] font-bold ${
                          r.passing ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          target {opSymbol} {String(r.threshold)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-4 border-t border-zinc-200">
        <button
          onClick={onShowHint}
          className="flex items-center gap-1.5 text-[12.5px] font-bold text-amber-700 hover:text-amber-800 transition"
        >
          <Lightbulb size={14} strokeWidth={2.5} /> Stuck? Show a hint
        </button>
        <button
          onClick={onReset}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-300 hover:bg-stone-100 hover:border-zinc-400 rounded-lg text-[12.5px] font-bold text-zinc-700 transition shadow-sm"
        >
          <RotateCcw size={13} strokeWidth={2.5} /> Reset to start
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
