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
    <div className="bg-brand-olive px-4 py-2 flex items-center gap-1.5 shrink-0">
      <span className="text-[11px] font-black uppercase tracking-widest text-white mr-2">
        {currentIdx + 1} of {PHASE_ORDER.length} — {PHASE_LABEL[phase]}
      </span>
      <div className="flex items-center gap-1 ml-auto">
        {PHASE_ORDER.map((p, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isCompleted = completedPhases?.has(p) ?? isPast;
          const canJump = isCompleted && !isCurrent && !!onJumpToPhase;
          // Dot palette tuned to read clearly against the solid
          // brand-olive bar: completed = white check; current = white
          // dot with subtle ring; future = translucent-white pill.
          const dotState = isPast || isCompleted
            ? 'bg-white'
            : isCurrent
              ? '' // tint via inline style below
              : 'bg-white/25';
          const dotInlineStyle: React.CSSProperties | undefined =
            isCurrent && accentHex
              ? { backgroundColor: '#ffffff', boxShadow: '0 0 0 2px rgba(255,255,255,0.5)' }
              : isCurrent
                ? { backgroundColor: '#ffffff', boxShadow: '0 0 0 2px rgba(255,255,255,0.5)' }
                : undefined;

          const dot = (
            <div
              className={`h-2.5 w-2.5 rounded-full flex items-center justify-center transition ${dotState} ${
                canJump ? 'cursor-pointer hover:ring-2 hover:ring-white/50' : ''
              }`}
              style={dotInlineStyle}
              title={canJump ? `Return to ${PHASE_LABEL[p]}` : PHASE_LABEL[p]}
            >
              {(isPast || isCompleted) && !isCurrent && <Check size={8} className="text-brand-olive" strokeWidth={4} />}
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
                  <span className="text-[10px] font-semibold text-white hidden group-hover:inline">
                    {PHASE_LABEL[p]}
                  </span>
                </button>
              ) : (
                dot
              )}
              {i < PHASE_ORDER.length - 1 && (
                <div className={`h-px w-4 ${isPast || isCompleted ? 'bg-white/60' : 'bg-white/25'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhaseBadge;
