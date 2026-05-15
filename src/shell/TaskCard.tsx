import React from 'react';
import { Target, RotateCcw, ChevronRight, Lightbulb, Check, Circle, Activity } from 'lucide-react';
import type { TaskFramingStyle } from './types';

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
      <div className="flex items-center gap-2 mb-2">
        <Target size={16} className="text-rose-600" />
        <h2 className="text-[11px] font-black uppercase tracking-widest text-rose-700">Your task</h2>
        {framingStyle && (
          <span className="ml-auto text-[10px] font-mono text-zinc-400">
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
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
            Success criteria
          </span>
          <ul className="space-y-1.5">
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
                  className={`text-[13px] leading-snug flex items-start gap-2 transition ${
                    isActive ? 'bg-sky-50 border border-sky-200 rounded-md px-2 py-1' : ''
                  }`}
                >
                  {hasProgress ? (
                    done ? (
                      <Check
                        size={14}
                        strokeWidth={3}
                        className="text-emerald-600 mt-0.5 shrink-0 transition-opacity"
                      />
                    ) : isActive ? (
                      <span className="mt-1 shrink-0 inline-block w-2 h-2 rounded-full bg-sky-500 ring-2 ring-sky-200" />
                    ) : (
                      <Circle size={13} className="text-zinc-300 mt-0.5 shrink-0" />
                    )
                  ) : (
                    <span className="text-emerald-600 mt-0.5">•</span>
                  )}
                  <span
                    className={
                      done
                        ? 'text-zinc-400 line-through'
                        : isActive
                          ? 'text-sky-900 font-semibold'
                          : 'text-zinc-500'
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

      {/* B2: live "you're getting warmer" chip. Shown only while progress > 0
          and not yet satisfied; gives the learner a visible signal that their
          adjustments are landing in range before the tracker fires. */}
      {outcomeProgress && outcomeProgress.target > 0 && (
        <div className="mb-4 -mt-1 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 border border-sky-200 rounded-lg">
            <Activity size={14} className="text-sky-600 shrink-0" />
            <span className="text-[12px] font-bold text-sky-900">
              Holding {outcomeProgress.current} of {outcomeProgress.target} {outcomeProgress.label ?? 'breaths'}…
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-sky-100 overflow-hidden ml-2">
              <div
                className="h-full bg-sky-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (outcomeProgress.current / outcomeProgress.target) * 100)}%` }}
              />
            </div>
          </div>
          {/* Novice-pass §15.2: per-readout pass/fail strip. Pairs the
              "Holding X of Y" chip with explicit "which criterion is
              breaking the streak" feedback so a learner doesn't spin. */}
          {outcomeProgress.byReadout && outcomeProgress.byReadout.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {outcomeProgress.byReadout.map(r => (
                <span
                  key={r.name}
                  className={`text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    r.passing
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {r.name} {typeof r.current === 'number' ? r.current.toFixed(0) : String(r.current)}
                  <span className="opacity-60">
                    {' '}
                    ({r.operator} {String(r.threshold)})
                  </span>
                  {r.passing ? ' ✓' : ' ✗'}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-4 border-t border-zinc-200">
        <button
          onClick={onShowHint}
          className="flex items-center gap-1.5 text-[12px] font-bold text-amber-700 hover:text-amber-800"
        >
          <Lightbulb size={13} /> Stuck? Show a hint
        </button>
        <button
          onClick={onReset}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-300 hover:bg-stone-50 rounded-lg text-[12px] font-bold text-zinc-700 transition"
        >
          <RotateCcw size={13} /> Reset to start
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
