import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Target, Clock, ChevronRight, Lock } from 'lucide-react';
import ContentBlocks, { type PredictMcqStatus } from './ContentBlocks';
import type { ModuleConfig } from './types';
import type { ScenarioHarness } from '../harness/ScenarioHarness';

interface Props {
  module: ModuleConfig;
  harness: ScenarioHarness;
  /** Label for the CTA — depends on whether the module has formative blocks. */
  ctaLabel: string;
  onAdvance: () => void;
  /** Brand-track tint colors so the CTA matches the rest of the in-module chrome. */
  trackAccent?: { bg: string; bgHover: string };
  /** Per v3.2 §0.4: per-block telemetry callback. ReadPane forwards every
   *  predict_mcq status change up to ModuleShell so attempts can be
   *  persisted. */
  onPredictMcqStatusChange?: (s: PredictMcqStatus) => void;
}

/**
 * Read phase workbook column. Wraps `ContentBlocks` with:
 *   - a scroll-progress observer that surfaces a sticky bottom CTA once the
 *     learner is past ~70 % of the content (so long readers don't have to
 *     scroll all the way to find the advance button), and
 *   - the existing bottom-of-content CTA for fast scrollers, so both
 *     interaction styles are covered.
 */
const ReadPane: React.FC<Props> = ({
  module,
  harness,
  ctaLabel,
  onAdvance,
  trackAccent,
  onPredictMcqStatusChange,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledFar, setScrolledFar] = useState(false);

  // Per v3.2 §0.3: gate the bottom CTA on every predict_mcq block being
  // satisfied. We count expected MCQs from the module config and track
  // satisfaction by block_id reported up from ContentBlocks.
  const expectedMcq = useMemo(
    () => module.content_blocks.filter(b => b.kind === 'predict_mcq').length,
    [module.content_blocks],
  );
  const [mcqStatus, setMcqStatus] = useState<Record<string, boolean>>({});
  const handleMcqStatus = (s: PredictMcqStatus) => {
    setMcqStatus(prev => (prev[s.block_id] === s.satisfied ? prev : { ...prev, [s.block_id]: s.satisfied }));
    onPredictMcqStatusChange?.(s);
  };
  const satisfiedMcq = Object.values(mcqStatus).filter(Boolean).length;
  const mcqsRemaining = Math.max(0, expectedMcq - satisfiedMcq);
  const ctaDisabled = mcqsRemaining > 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const pct = el.scrollHeight > 0 ? (el.scrollTop + el.clientHeight) / el.scrollHeight : 0;
      setScrolledFar(pct >= 0.7);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  const bgClass = trackAccent?.bg ?? 'bg-brand-olive';
  const bgHoverClass = trackAccent?.bgHover ?? 'hover:bg-brand-olive-hover';

  return (
    <div className="h-full flex flex-col relative">
      <div ref={scrollRef} className="flex-1 px-5 py-3 overflow-y-auto">
        <div className="mb-3 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-olive bg-stone-50 px-2 py-0.5 rounded">
              {module.track}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">{module.id}</span>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Clock size={11} /> {module.estimated_minutes} min
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-zinc-900 leading-tight tracking-tight">
            {module.title}
          </h1>
          <div className="mt-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1">
              <Target size={11} /> Objectives
            </div>
            <ul className="space-y-0.5">
              {module.visible_learning_objectives.map((o, i) => (
                <li key={i} className="text-[13px] text-zinc-700 leading-snug">• {o}</li>
              ))}
            </ul>
          </div>
        </div>

        <ContentBlocks
          blocks={module.content_blocks}
          harness={harness}
          moduleId={module.id}
          onMcqStatusChange={handleMcqStatus}
        />

        {/* Tail spacer so the sticky CTA (below) doesn't overlap the last
            content block. There used to be a second inline CTA here too;
            it caused a duplicate button to appear once the learner scrolled
            past 70 %. The sticky one below is now the single source of truth. */}
        <div className="h-20" />
      </div>

      {/* Single sticky CTA — fades in once the learner has scrolled past ~70 %.
          One button only, no duplicate at the end of content.
          v3.2 §0.3: when predict_mcq blocks are unanswered, the CTA is
          disabled with a count of remaining predictions; no time/score
          penalty, unlimited attempts. */}
      {scrolledFar && (
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-3 pt-2 bg-gradient-to-t from-white via-white/95 to-white/0 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
          {ctaDisabled && (
            <div className="pointer-events-auto mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <Lock size={12} className="text-amber-700 shrink-0" />
              <span className="text-[12px] font-semibold text-amber-900 leading-snug">
                Answer {mcqsRemaining} more prediction{mcqsRemaining === 1 ? '' : 's'} above to continue.
              </span>
            </div>
          )}
          <button
            onClick={onAdvance}
            disabled={ctaDisabled}
            title={ctaDisabled ? 'Answer the predictions above to continue.' : undefined}
            className={`pointer-events-auto w-full px-4 py-2.5 ${
              ctaDisabled
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                : `${bgClass} ${bgHoverClass} text-white shadow-lg`
            } text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5`}
          >
            {ctaLabel} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReadPane;
