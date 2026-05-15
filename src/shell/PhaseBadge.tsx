import React from 'react';
import { Check } from 'lucide-react';

export type Phase = 'primer' | 'read' | 'explore' | 'try-it' | 'debrief';

const PHASE_ORDER: Phase[] = ['primer', 'read', 'explore', 'try-it', 'debrief'];
const PHASE_LABEL: Record<Phase, string> = {
  'primer': 'Primer',
  'read': 'Read',
  'explore': 'Explore',
  'try-it': 'Try It',
  'debrief': 'Debrief',
};

interface Props {
  phase: Phase;
  /** Set of phases that have been completed at least once — clickable for back-nav. */
  completedPhases?: Set<Phase>;
  /** When provided, clicking a past/completed phase calls this. */
  onJumpToPhase?: (p: Phase) => void;
  /** G2: optional track tint applied to the current-phase dot + connector. */
  accentHex?: string;
}

/**
 * Sticky strip above both columns. Always visible so the learner always
 * knows where they are in the five-phase sequence (§1.2 / §1.4).
 * Completed phases are clickable (back-navigation).
 */
const PhaseBadge: React.FC<Props> = ({ phase, completedPhases, onJumpToPhase, accentHex }) => {
  const currentIdx = PHASE_ORDER.indexOf(phase);
  return (
    <div className="bg-gradient-to-r from-brand-olive/[0.06] via-white to-brand-olive/[0.06] border-b-2 border-brand-olive/20 px-4 py-2 flex items-center gap-1.5 shrink-0">
      <span className="text-[11px] font-black uppercase tracking-widest text-brand-olive mr-2">
        {currentIdx + 1} of {PHASE_ORDER.length} — {PHASE_LABEL[phase]}
      </span>
      <div className="flex items-center gap-1 ml-auto">
        {PHASE_ORDER.map((p, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isCompleted = completedPhases?.has(p) ?? isPast;
          const canJump = isCompleted && !isCurrent && !!onJumpToPhase;
          const dotState = isPast || isCompleted
            ? 'bg-emerald-500'
            : isCurrent
              ? '' // tint via inline style below
              : 'bg-zinc-200';
          const dotInlineStyle: React.CSSProperties | undefined =
            isCurrent && accentHex
              ? { backgroundColor: accentHex, boxShadow: `0 0 0 2px ${accentHex}33` }
              : isCurrent
                ? { backgroundColor: '#0ea5e9', boxShadow: '0 0 0 2px #bae6fd' }
                : undefined;

          const dot = (
            <div
              className={`h-2.5 w-2.5 rounded-full flex items-center justify-center transition ${dotState} ${
                canJump ? 'cursor-pointer hover:ring-2 hover:ring-emerald-300' : ''
              }`}
              style={dotInlineStyle}
              title={canJump ? `Return to ${PHASE_LABEL[p]}` : PHASE_LABEL[p]}
            >
              {(isPast || isCompleted) && !isCurrent && <Check size={8} className="text-white" strokeWidth={4} />}
            </div>
          );

          return (
            <div key={p} className="flex items-center gap-1">
              {canJump ? (
                <button
                  onClick={() => onJumpToPhase!(p)}
                  className="flex items-center gap-1 group"
                  aria-label={`Return to ${PHASE_LABEL[p]}`}
                >
                  {dot}
                  <span className="text-[10px] font-semibold text-emerald-700 hidden group-hover:inline">
                    {PHASE_LABEL[p]}
                  </span>
                </button>
              ) : (
                dot
              )}
              {i < PHASE_ORDER.length - 1 && (
                <div className={`h-px w-4 ${isPast || isCompleted ? 'bg-emerald-300' : 'bg-zinc-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhaseBadge;
