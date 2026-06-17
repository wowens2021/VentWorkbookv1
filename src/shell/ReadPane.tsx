import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import ContentBlocks, { type PredictMcqStatus } from './ContentBlocks';
import type { ContentBlock, ModuleConfig } from './types';
import type { ScenarioHarness } from '../harness/ScenarioHarness';

interface Props {
  module: ModuleConfig;
  harness: ScenarioHarness;
  /** Label for the CTA — depends on whether the module has formative blocks. */
  ctaLabel: string;
  onAdvance: () => void;
  /** Brand-track tint colors so the CTA matches the rest of the in-module chrome. */
  trackAccent?: { bg: string; bgHover: string };
  /** Per v3.2 §0.4: per-block telemetry callback. */
  onPredictMcqStatusChange?: (s: PredictMcqStatus) => void;
  /**
   * Fires whenever the current page changes. Reports whether the active
   * page references the sim (any block with an `awaits_control`). The
   * parent uses this to collapse / expand the sim column so text-only
   * pages get the full width.
   */
  onSimNeededChange?: (needsSim: boolean) => void;
}

/**
 * Decide whether a content block needs the sim alongside it. A block
 * "needs the sim" when it explicitly references a sim control (the
 * predict_observe / predict_mcq `awaits_control` field). Plain prose,
 * callouts, figures, predict_prompts, reference tables, and the PBW
 * widget all stand on their own — no sim required.
 */
const blockNeedsSim = (b: ContentBlock): boolean => {
  if (b.kind === 'predict_observe') return !!b.awaits_control;
  if (b.kind === 'predict_mcq') return !!b.awaits_control;
  return false;
};

/**
 * Group a module's content blocks into pages. Formative blocks are
 * stripped out (they render on the standalone Check Yourself page).
 *
 * Default page size = 3 blocks. Modules can override with
 * `module.read_page_size` if a denser or sparser slide rhythm fits.
 */
const paginateBlocks = (blocks: ContentBlock[], pageSize: number): ContentBlock[][] => {
  const visible = blocks.filter(b => b.kind !== 'formative');
  if (visible.length === 0) return [[]];
  const pages: ContentBlock[][] = [];
  for (let i = 0; i < visible.length; i += pageSize) {
    pages.push(visible.slice(i, i + pageSize));
  }
  return pages;
};

/**
 * Read phase workbook column. Splits content into a sequence of 2–3
 * "slides" with Prev / Next navigation, so the learner reads in
 * digestible chunks instead of a 7-block scroll. The Objectives
 * header that used to live above the content is gone — those
 * objectives were already shown during the briefing.
 *
 * The pane also reports up to the parent whether the current page
 * references the sim, so ModuleShell can hide the sim column on
 * pure-prose pages and give the workbook the full body width.
 */
const ReadPane: React.FC<Props> = ({
  module,
  harness,
  ctaLabel,
  onAdvance,
  trackAccent,
  onPredictMcqStatusChange,
  onSimNeededChange,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build the page list once per module. Default page size = 3 blocks.
  const pageSize = (module as any).read_page_size ?? 3;
  const pages = useMemo(
    () => paginateBlocks(module.content_blocks, pageSize),
    [module.content_blocks, pageSize],
  );
  const [currentPage, setCurrentPage] = useState(0);
  // Reset to page 0 when the module identity changes (back-nav).
  useEffect(() => {
    setCurrentPage(0);
  }, [module.id]);

  // Whether the visible page references the sim. The parent uses this
  // to collapse the sim column on pure-prose slides.
  const currentPageNeedsSim = useMemo(
    () => (pages[currentPage] ?? []).some(blockNeedsSim),
    [pages, currentPage],
  );
  useEffect(() => {
    onSimNeededChange?.(currentPageNeedsSim);
    // Only run when the value changes — the parent compares and stores.
  }, [currentPageNeedsSim, onSimNeededChange]);

  // Per v3.2 §0.3: gate the bottom CTA on every predict_mcq block being
  // satisfied across the WHOLE module (any page), so the learner can't
  // skip predictions by paging forward without answering them.
  const expectedMcq = useMemo(
    () => module.content_blocks.filter(b => b.kind === 'predict_mcq').length,
    [module.content_blocks],
  );
  const [mcqStatus, setMcqStatus] = useState<Record<string, boolean>>({});
  const handleMcqStatus = (s: PredictMcqStatus) => {
    setMcqStatus(prev => {
      // Satisfaction is MONOTONIC — once a predict_mcq is answered
      // correctly, paginating away and back must not reset it. The
      // PredictMcq component's local `satisfied` state is lost on
      // unmount, so it reports `false` on remount until the learner
      // re-answers. Without this guard, opening a previous slide
      // re-locks the Continue CTA.
      if (prev[s.block_id] === true && !s.satisfied) return prev;
      if (prev[s.block_id] === s.satisfied) return prev;
      return { ...prev, [s.block_id]: s.satisfied };
    });
    onPredictMcqStatusChange?.(s);
  };
  const satisfiedMcq = Object.values(mcqStatus).filter(Boolean).length;
  const mcqsRemaining = Math.max(0, expectedMcq - satisfiedMcq);
  const ctaDisabled = mcqsRemaining > 0;

  // Scroll the page back to top whenever the slide changes — otherwise
  // the learner lands mid-content on the new slide.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [currentPage]);

  const bgClass = trackAccent?.bg ?? 'bg-brand-olive';
  const bgHoverClass = trackAccent?.bgHover ?? 'hover:bg-brand-olive-hover';

  const onLastPage = currentPage >= pages.length - 1;
  const onFirstPage = currentPage === 0;
  const visibleBlocks = pages[currentPage] ?? [];

  return (
    <div className="h-full flex flex-col relative">
      <div ref={scrollRef} className="flex-1 px-5 py-3 overflow-y-auto">
        {/* Header strip: track chip + module id + estimated time +
            title. Objectives moved out — they were redundant with the
            briefing screen. */}
        <div className="mb-3 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-olive bg-stone-50 px-2 py-0.5 rounded">
              {module.track}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">{module.id}</span>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Clock size={11} /> {module.estimated_minutes} min
            </span>
            {pages.length > 1 && (
              <span className="ml-auto text-[10px] font-bold text-zinc-500 bg-stone-100 px-2 py-0.5 rounded">
                Slide {currentPage + 1} of {pages.length}
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl font-semibold text-zinc-900 leading-tight tracking-tight">
            {module.title}
          </h1>
        </div>

        {/* Render only the current page's blocks. */}
        <ContentBlocks
          blocks={visibleBlocks}
          harness={harness}
          moduleId={module.id}
          onMcqStatusChange={handleMcqStatus}
        />

        {/* Tail spacer so the sticky footer doesn't overlap the last
            content block on this slide. */}
        <div className="h-24" />
      </div>

      {/* Sticky footer: Prev / Page indicator / Next or Continue. When
          there is only one slide, just the Continue CTA shows. */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-3 pt-2 bg-gradient-to-t from-white via-white/95 to-white/0">
        {ctaDisabled && onLastPage && (
          <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
            <Lock size={12} className="text-amber-700 shrink-0" />
            <span className="text-[12px] font-semibold text-amber-900 leading-snug">
              Answer {mcqsRemaining} more prediction{mcqsRemaining === 1 ? '' : 's'} above to continue.
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {pages.length > 1 && (
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={onFirstPage}
              className={`px-3 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-1 ${
                onFirstPage
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-white border border-zinc-300 hover:bg-stone-50 text-zinc-700 shadow-sm'
              }`}
            >
              <ChevronLeft size={14} /> Prev
            </button>
          )}
          {onLastPage ? (
            <button
              onClick={onAdvance}
              disabled={ctaDisabled}
              title={ctaDisabled ? 'Answer the predictions above to continue.' : undefined}
              className={`flex-1 px-4 py-2.5 ${
                ctaDisabled
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : `${bgClass} ${bgHoverClass} text-white shadow-lg`
              } text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5`}
            >
              {ctaLabel} <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
              className={`flex-1 px-4 py-2.5 ${bgClass} ${bgHoverClass} text-white shadow-lg text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5`}
            >
              Next slide <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadPane;
