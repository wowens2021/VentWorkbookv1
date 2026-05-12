import React from 'react';
import { Target, RotateCcw, ChevronRight, Lightbulb, Check } from 'lucide-react';
import type { TaskFramingStyle } from './types';

interface Props {
  userFacingTask: string;
  successCriteria: string[];
  framingStyle?: TaskFramingStyle;
  objectiveSatisfied: boolean;
  onReset: () => void;
  onContinueToDebrief: () => void;
  onShowHint: () => void;
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
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-bold transition shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          Continue to debrief <ChevronRight size={14} />
        </button>
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

      {successCriteria.length > 0 && (
        <section className="mb-4">
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
            Success criteria
          </span>
          <ul className="space-y-1.5">
            {successCriteria.map((c, i) => (
              <li key={i} className="text-[13px] text-zinc-700 leading-snug flex items-start gap-1.5">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
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
          className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg text-[12px] font-bold text-zinc-700 transition"
        >
          <RotateCcw size={13} /> Reset to start
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
