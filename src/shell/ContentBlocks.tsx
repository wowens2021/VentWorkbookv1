import React, { useEffect, useMemo, useState } from 'react';
import { Info, AlertTriangle, Lightbulb, Sparkles, Check } from 'lucide-react';
import type { ContentBlock, ControlName } from './types';
import type { ScenarioHarness } from '../harness/ScenarioHarness';
import PBWWidget from './PBWWidget';
import DyssynchronyWaveform from '../components/DyssynchronyWaveform';
import { formatClinicalText } from './formatClinicalText';

/**
 * Registry of live React components that can be embedded inline via the
 * `live_component` ContentBlock kind. Keys are the `component` field on
 * the block; values are React components that accept the block's `props`.
 */
const LIVE_COMPONENTS: Record<string, React.FC<any>> = {
  DyssynchronyWaveform,
};

// Render the inline tokens (**bold**, `code`) of a single text run.
// Factored out so both <p> and <li> content can reuse it.
const renderTokens = (text: string, keyBase: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let m: RegExpExecArray | null;
  let last = 0;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(...formatClinicalText(text.slice(last, m.index), `${keyBase}-t${key++}`));
    const tok = m[0];
    if (tok.startsWith('**')) {
      // Bold prose still gets unit/operator typography; code stays verbatim.
      parts.push(<strong key={`${keyBase}-${key++}`} className="text-zinc-900">{formatClinicalText(tok.slice(2, -2), `${keyBase}-b${key}`)}</strong>);
    } else {
      parts.push(<code key={`${keyBase}-${key++}`} className="bg-zinc-100 px-1.5 py-0.5 rounded text-[14px] font-mono text-zinc-800">{tok.slice(1, -1)}</code>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(...formatClinicalText(text.slice(last), `${keyBase}-t${key++}`));
  return parts;
};

const renderInline = (md: string): React.ReactNode => {
  // Minimal markdown: **bold**, `code`, blank-line paragraphs, and
  // `- ` unordered lists. A blank-line-delimited block that contains
  // any `- ` lines is split into <li> items (wrapped in a <ul>);
  // non-list lines in the same block render as their own <p>. Blocks
  // with no list lines render as a single <p>, identical to before.
  const paragraphs = md.split(/\n\n+/);
  return paragraphs.map((para, pi) => {
    const lines = para.split('\n');
    const hasList = lines.some(l => /^\s*-\s+/.test(l));
    if (!hasList) {
      return (
        <p key={pi} className="mb-4 last:mb-0 leading-[1.75] text-zinc-700 text-[16px]">
          {renderTokens(para, `p${pi}`)}
        </p>
      );
    }
    const out: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    const flushList = (k: string) => {
      if (listItems.length > 0) {
        out.push(
          <ul key={k} className="list-disc pl-5 mb-4 space-y-2 leading-[1.75] text-zinc-700 text-[16px] marker:text-zinc-400">
            {listItems}
          </ul>,
        );
        listItems = [];
      }
    };
    lines.forEach((line, li) => {
      const item = line.match(/^\s*-\s+(.*)$/);
      if (item) {
        listItems.push(
          <li key={`li-${pi}-${li}`}>{renderTokens(item[1], `li${pi}-${li}`)}</li>,
        );
      } else if (line.trim() !== '') {
        flushList(`ul-${pi}-${li}`);
        out.push(
          <p key={`pl-${pi}-${li}`} className="mb-4 leading-[1.75] text-zinc-700 text-[16px]">
            {renderTokens(line, `pl${pi}-${li}`)}
          </p>,
        );
      }
    });
    flushList(`ul-${pi}-end`);
    return <React.Fragment key={pi}>{out}</React.Fragment>;
  });
};

/**
 * Per-block status surfaced to the parent ReadPane so it can gate the
 * "Continue" CTA on every predict_mcq being answered (v3.2 §0.3).
 */
export interface PredictMcqStatus {
  /** Stable id per block — `{moduleId}-PM{n}`, 1-indexed by occurrence. */
  block_id: string;
  satisfied: boolean;
  attempts: number;
  selected_labels: string[];
}

const Block: React.FC<{
  block: ContentBlock;
  harness?: ScenarioHarness;
  blockIdForMcq?: string;
  onMcqStatusChange?: (s: PredictMcqStatus) => void;
}> = ({ block, harness, blockIdForMcq, onMcqStatusChange }) => {
  if (block.kind === 'prose') return <div className="font-serif text-[16px] leading-relaxed text-zinc-800">{renderInline(block.markdown)}</div>;

  if (block.kind === 'figure') {
    return (
      <figure className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 my-3">
        {block.ascii && <pre className="text-[12px] font-mono text-zinc-600 overflow-x-auto whitespace-pre">{block.ascii}</pre>}
        {block.src && <img src={block.src} alt={block.caption ?? ''} className="w-full rounded" />}
        {block.caption && <figcaption className="text-[12.5px] text-zinc-500 mt-2 italic">{formatClinicalText(block.caption, 'figcap')}</figcaption>}
      </figure>
    );
  }

  // v3 Troubleshooting spec [UX-7]. Blue-italic block with a left
  // border accent. Not graded, not tracked — a cognitive priming nudge.
  if (block.kind === 'predict_prompt') {
    return (
      <div className="my-4 border-l-4 border-sky-400 bg-sky-50/60 pl-4 pr-3 py-2.5">
        <div className="text-[10px] font-black uppercase tracking-widest text-sky-700 mb-1">Predict before you explore</div>
        <div className="text-[14px] italic text-sky-900 leading-relaxed">{renderInline(block.markdown)}</div>
      </div>
    );
  }

  // v3 Troubleshooting spec [UX-11]. Real HTML table for the
  // ABG-driven adjustments quick reference. Bulleted prose was a wall
  // of text; the table makes the mode × direction lookup readable.
  if (block.kind === 'reference_table') {
    return (
      <div className="my-4">
        <div className="overflow-x-auto rounded-lg border border-zinc-300 bg-white shadow-sm">
          <table className="w-full text-[14px] tabular-nums">
            <thead className="bg-zinc-100 border-b border-zinc-300">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left font-bold text-zinc-800 whitespace-nowrap">{formatClinicalText(h, `th${i}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 1 ? 'bg-zinc-50' : ''}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2.5 align-top text-zinc-700 border-t border-zinc-200 leading-relaxed">{formatClinicalText(cell, `td${ri}-${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {block.caption && <div className="text-[12px] text-zinc-500 mt-1.5 italic">{block.caption}</div>}
      </div>
    );
  }

  if (block.kind === 'callout') {
    const Icon = block.tone === 'warn' ? AlertTriangle : block.tone === 'tip' ? Lightbulb : Info;
    const tone =
      block.tone === 'warn'
        ? 'border-amber-300 bg-amber-50 text-amber-800'
        : block.tone === 'tip'
          ? 'border-sky-300 bg-sky-50 text-sky-800'
          : 'border-zinc-300 bg-white text-zinc-700';
    return (
      <div className={`border rounded-lg p-4 my-4 flex gap-2.5 ${tone}`}>
        <Icon size={18} className="shrink-0 mt-0.5" />
        <div className="text-[15px] leading-[1.7]">{renderInline(block.markdown)}</div>
      </div>
    );
  }

  // Formative blocks render on the standalone "Check yourself" page between
  // Read and Explore — NOT inline. This keeps the read page focused on prose
  // and gives the quiz its own dedicated, engagement-optimized view.
  if (block.kind === 'formative') return null;
  if (block.kind === 'predict_observe') return <PredictObserve block={block} harness={harness} />;
  if (block.kind === 'predict_mcq') {
    return (
      <PredictMcq
        block={block}
        harness={harness}
        blockId={blockIdForMcq ?? 'PM'}
        onStatusChange={onMcqStatusChange}
      />
    );
  }
  // v3.3 M11 — embed a registered React component inline.
  if (block.kind === 'live_component') {
    const Comp = LIVE_COMPONENTS[block.component];
    if (!Comp) {
      return (
        <div className="my-3 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-[12px] text-rose-800">
          Unknown live component: <code>{block.component}</code>
        </div>
      );
    }
    return (
      <div className="my-4">
        <Comp {...(block.props ?? {})} />
        {block.caption && (
          <div className="text-[12.5px] text-zinc-500 mt-2 italic">{formatClinicalText(block.caption, 'lccap')}</div>
        )}
      </div>
    );
  }
  if (block.kind === 'pbw_widget') {
    return (
      <PBWWidget
        defaultHeightInches={block.default_height_inches}
        defaultSex={block.default_sex}
        label={block.label}
      />
    );
  }
  return null;
};

// Formative ("Check yourself") rendering moved to CheckYourselfPage between
// Read and Explore. Kept the type intact so existing module configs compile.

const PredictObserve: React.FC<{
  block: Extract<ContentBlock, { kind: 'predict_observe' }>;
  harness?: ScenarioHarness;
}> = ({ block, harness }) => {
  const [revealed, setRevealed] = useState(false);

  // Auto-reveal: when the block declares `awaits_control` and the learner
  // changes that control on the live sim during the read phase, flip to the
  // "Observe" half so the prediction is immediately validated.
  useEffect(() => {
    if (revealed || !harness || !block.awaits_control) return;
    const wanted: ControlName = block.awaits_control;
    const off = harness.subscribe(ev => {
      if (ev.type === 'control_changed' && ev.control === wanted) {
        setRevealed(true);
      }
    });
    return off;
  }, [revealed, harness, block.awaits_control]);

  const ctaLabel = block.awaits_control
    ? 'Try it in the sim · or reveal →'
    : 'Then observe in the sim →';

  return (
    <div className="border-l-2 border-violet-400 bg-violet-50 rounded-r-lg p-3.5 my-3">
      <div className="flex items-center gap-1.5 mb-1">
        <div className="text-[11px] font-black uppercase tracking-widest text-violet-700">Predict</div>
        {block.awaits_control && !revealed && (
          <span className="text-[10px] font-mono text-violet-500 inline-flex items-center gap-0.5">
            <Sparkles size={10} /> interactive
          </span>
        )}
      </div>
      <p className="text-[15px] text-zinc-900 leading-[1.7] mb-2">{formatClinicalText(block.predict, 'po-p')}</p>
      {!revealed ? (
        <button onClick={() => setRevealed(true)} className="text-[13px] font-bold text-violet-600 hover:text-violet-700">
          {ctaLabel}
        </button>
      ) : (
        <div className="mt-2 pt-2 border-t border-violet-200 animate-in fade-in slide-in-from-bottom-1 duration-500">
          <div className="text-[11px] font-black uppercase tracking-widest text-violet-700 mb-1">Observe</div>
          <p className="text-[15px] text-zinc-900 leading-[1.7]">{formatClinicalText(block.observe, 'po-o')}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Per v3.2 §0.2 — gated multiple-choice predict block. The learner has to
 * commit to an option; the "observe" half only reveals after a correct
 * pick. Wrong options surface the option's explanation and leave the
 * others enabled. Optional `awaits_control` provides an alternative
 * unlock path (changing the named control on the live sim also satisfies
 * the block) for cases where the manipulation IS the prediction.
 */
const PredictMcq: React.FC<{
  block: Extract<ContentBlock, { kind: 'predict_mcq' }>;
  harness?: ScenarioHarness;
  blockId: string;
  onStatusChange?: (s: PredictMcqStatus) => void;
}> = ({ block, harness, blockId, onStatusChange }) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [satisfied, setSatisfied] = useState(false);

  // Sim-side alternative unlock: changing the named control marks the
  // block satisfied (per spec §0.2 — use sparingly).
  useEffect(() => {
    if (satisfied || !harness || !block.awaits_control) return;
    const wanted: ControlName = block.awaits_control;
    const off = harness.subscribe(ev => {
      if (ev.type === 'control_changed' && ev.control === wanted) setSatisfied(true);
    });
    return off;
  }, [satisfied, harness, block.awaits_control]);

  // Surface status to ReadPane on every state change.
  useEffect(() => {
    onStatusChange?.({
      block_id: blockId,
      satisfied,
      attempts: selected.length,
      selected_labels: selected.map(i => block.options[i]?.label ?? ''),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satisfied, selected, blockId]);

  const correctIdx = useMemo(() => block.options.findIndex(o => o.is_correct), [block.options]);
  const pick = (i: number) => {
    if (satisfied) return;
    setSelected(prev => prev.includes(i) ? prev : [...prev, i]);
    if (i === correctIdx) setSatisfied(true);
  };

  return (
    <div className="border-l-2 border-violet-400 bg-violet-50 rounded-r-lg p-3.5 my-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="text-[11px] font-black uppercase tracking-widest text-violet-700">Predict</div>
        <span className="text-[10px] font-mono text-violet-500 inline-flex items-center gap-0.5">
          <Sparkles size={10} /> pick to continue
        </span>
        {satisfied && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
            <Check size={11} strokeWidth={3} /> Answered
          </span>
        )}
      </div>
      <p className="text-[15px] text-zinc-900 leading-[1.7] mb-3">{formatClinicalText(block.predict, 'pm-p')}</p>
      <div className="space-y-1.5">
        {block.options.map((opt, i) => {
          const picked = selected.includes(i);
          const isCorrect = i === correctIdx;
          // Visual: green for correct (after pick), rose for wrong-picked, neutral otherwise.
          let cls = 'border-zinc-200 bg-white hover:border-zinc-300';
          if (satisfied && isCorrect) cls = 'border-emerald-400 bg-emerald-50';
          else if (picked && !isCorrect) cls = 'border-rose-400 bg-rose-50';
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => pick(i)}
                disabled={satisfied}
                className={`w-full text-left text-[14px] leading-snug px-3 py-2 rounded-md border transition ${cls} ${
                  satisfied ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <span className="font-semibold text-zinc-500 mr-1.5">{String.fromCharCode(65 + i)}.</span>
                <span className="text-zinc-800">{formatClinicalText(opt.label, `pm-opt${i}`)}</span>
              </button>
              {picked && !isCorrect && opt.explanation && (
                <p className="text-[13px] text-rose-800 mt-1 ml-2.5 leading-snug">
                  {formatClinicalText(opt.explanation, `pm-exp${i}`)}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {satisfied && (
        <div className="mt-3 pt-3 border-t border-violet-200 animate-in fade-in slide-in-from-bottom-1 duration-500">
          <div className="text-[11px] font-black uppercase tracking-widest text-violet-700 mb-1">Observe</div>
          <p className="text-[15px] text-zinc-900 leading-[1.7]">{formatClinicalText(block.observe, 'pm-obs')}</p>
        </div>
      )}
    </div>
  );
};

interface Props {
  blocks: ContentBlock[];
  /** Optional live harness so `predict_observe` / `predict_mcq` blocks can
   *  auto-reveal when the learner changes the targeted control on the sim. */
  harness?: ScenarioHarness;
  /** Module id prefix so PM block ids are globally meaningful in telemetry. */
  moduleId?: string;
  /** Called on every predict_mcq state change so the ReadPane can gate
   *  its bottom CTA on all-mcqs-satisfied. */
  onMcqStatusChange?: (s: PredictMcqStatus) => void;
  /**
   * Number of predict_mcq blocks that appeared on EARLIER pages. The
   * ReadPane renders one page of blocks at a time, so without an offset
   * the PM counter would restart at 1 on every page and two MCQs on
   * different pages would collide on the same `{moduleId}-PM1` id. The
   * offset keeps the ids globally unique across the module.
   */
  mcqIdOffset?: number;
}
const ContentBlocks: React.FC<Props> = ({ blocks, harness, moduleId, onMcqStatusChange, mcqIdOffset = 0 }) => {
  // Stable ids for predict_mcq blocks: 1-indexed by GLOBAL occurrence
  // across the module (offset by the blocks shown on earlier pages).
  let mcqCounter = mcqIdOffset;
  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        const mcqId =
          b.kind === 'predict_mcq'
            ? `${moduleId ?? 'M?'}-PM${++mcqCounter}`
            : undefined;
        return (
          <Block
            key={i}
            block={b}
            harness={harness}
            blockIdForMcq={mcqId}
            onMcqStatusChange={onMcqStatusChange}
          />
        );
      })}
    </div>
  );
};

export default ContentBlocks;
