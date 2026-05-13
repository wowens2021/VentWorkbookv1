import React, { useEffect, useRef, useState } from 'react';
import { Target, Clock, ChevronRight } from 'lucide-react';
import ContentBlocks from './ContentBlocks';
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
}

/**
 * Read phase workbook column. Wraps `ContentBlocks` with:
 *   - a scroll-progress observer that surfaces a sticky bottom CTA once the
 *     learner is past ~70 % of the content (so long readers don't have to
 *     scroll all the way to find the advance button), and
 *   - the existing bottom-of-content CTA for fast scrollers, so both
 *     interaction styles are covered.
 */
const ReadPane: React.FC<Props> = ({ module, harness, ctaLabel, onAdvance, trackAccent }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledFar, setScrolledFar] = useState(false);

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

        <ContentBlocks blocks={module.content_blocks} harness={harness} />

        {/* Bottom-of-content CTA — full-prominence button for fast scrollers
            who reach the end. The sticky version (below) catches everyone else. */}
        <button
          onClick={onAdvance}
          className={`mt-6 w-full px-4 py-2.5 ${bgClass} ${bgHoverClass} text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm`}
        >
          {ctaLabel} <ChevronRight size={14} />
        </button>
        <div className="h-12" /> {/* tail spacer so sticky bar doesn't overlap the inline CTA */}
      </div>

      {/* Sticky CTA — fades in once the learner has scrolled past ~70 %. */}
      {scrolledFar && (
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-3 pt-2 bg-gradient-to-t from-white via-white/95 to-white/0 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={onAdvance}
            className={`pointer-events-auto w-full px-4 py-2.5 ${bgClass} ${bgHoverClass} text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-lg`}
          >
            {ctaLabel} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReadPane;
