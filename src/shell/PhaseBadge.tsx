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
}

/**
 * Sticky strip above both columns. Always visible so the learner always
 * knows where they are in the five-phase sequence (§1.2 / §1.4).
 */
const PhaseBadge: React.FC<Props> = ({ phase }) => {
  const currentIdx = PHASE_ORDER.indexOf(phase);
  return (
    <div className="bg-white border-b border-zinc-200 px-4 py-2 flex items-center gap-1.5 shrink-0">
      <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mr-2">
        {currentIdx + 1} of {PHASE_ORDER.length} — {PHASE_LABEL[phase]}
      </span>
      <div className="flex items-center gap-1 ml-auto">
        {PHASE_ORDER.map((p, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={p} className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full flex items-center justify-center transition ${
                  isPast
                    ? 'bg-emerald-500'
                    : isCurrent
                      ? 'bg-sky-500 ring-2 ring-sky-200'
                      : 'bg-zinc-200'
                }`}
                title={PHASE_LABEL[p]}
              >
                {isPast && <Check size={7} className="text-white" strokeWidth={4} />}
              </div>
              {i < PHASE_ORDER.length - 1 && (
                <div className={`h-px w-4 ${isPast ? 'bg-emerald-300' : 'bg-zinc-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhaseBadge;
