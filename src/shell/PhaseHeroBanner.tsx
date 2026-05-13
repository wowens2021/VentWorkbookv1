import React from 'react';
import type { Phase } from './PhaseBadge';

const PHASE_LABELS: Record<Phase, { number: number; name: string }> = {
  primer:   { number: 1, name: 'Primer' },
  read:     { number: 2, name: 'Read' },
  explore:  { number: 3, name: 'Explore' },
  'try-it': { number: 4, name: 'Try it' },
  debrief:  { number: 5, name: 'Debrief' },
};

/**
 * A short-lived centered overlay that announces the new phase name on
 * transition. Fades in, holds, fades out — gives the learner a sense of
 * forward momentum instead of a hard swap.
 *
 * Lifecycle is owned by the parent: render this component only while the
 * banner should be visible. Use `setTimeout(() => setHeroPhase(null), 1500)`
 * after setting it on a phase change.
 */
const PhaseHeroBanner: React.FC<{ phase: Phase }> = ({ phase }) => {
  const meta = PHASE_LABELS[phase];
  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div className="bg-white/85 backdrop-blur-md border border-stone-200 rounded-2xl px-8 py-5 shadow-xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-olive mb-1">
          Phase {meta.number} of 5
        </div>
        <div className="font-display text-4xl font-semibold text-zinc-900 tracking-tight">
          {meta.name}
        </div>
      </div>
    </div>
  );
};

export default PhaseHeroBanner;
