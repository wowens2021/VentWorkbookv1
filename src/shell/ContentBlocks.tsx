import React, { useEffect, useState } from 'react';
import { Info, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';
import type { ContentBlock, ControlName } from './types';
import type { ScenarioHarness } from '../harness/ScenarioHarness';

const renderInline = (md: string): React.ReactNode => {
  // Minimal markdown: **bold**, `code`, and newlines → <p>
  const paragraphs = md.split(/\n\n+/);
  return paragraphs.map((para, pi) => {
    const parts: React.ReactNode[] = [];
    let buf = para;
    let key = 0;
    const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let m: RegExpExecArray | null;
    let last = 0;
    while ((m = re.exec(buf)) !== null) {
      if (m.index > last) parts.push(buf.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith('**')) parts.push(<strong key={key++} className="text-zinc-900">{tok.slice(2, -2)}</strong>);
      else parts.push(<code key={key++} className="bg-zinc-100 px-1.5 py-0.5 rounded text-[14px] font-mono text-zinc-800">{tok.slice(1, -1)}</code>);
      last = m.index + tok.length;
    }
    if (last < buf.length) parts.push(buf.slice(last));
    return <p key={pi} className="mb-3 last:mb-0 leading-relaxed text-zinc-700 text-[15px]">{parts}</p>;
  });
};

const Block: React.FC<{ block: ContentBlock; harness?: ScenarioHarness }> = ({ block, harness }) => {
  if (block.kind === 'prose') return <div className="font-serif text-[16px] leading-relaxed text-zinc-800">{renderInline(block.markdown)}</div>;

  if (block.kind === 'figure') {
    return (
      <figure className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 my-3">
        {block.ascii && <pre className="text-[12px] font-mono text-zinc-600 overflow-x-auto whitespace-pre">{block.ascii}</pre>}
        {block.src && <img src={block.src} alt={block.caption ?? ''} className="w-full rounded" />}
        {block.caption && <figcaption className="text-[12px] text-zinc-500 mt-2 italic">{block.caption}</figcaption>}
      </figure>
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
      <div className={`border rounded-lg p-3.5 my-3 flex gap-2.5 ${tone}`}>
        <Icon size={18} className="shrink-0 mt-0.5" />
        <div className="text-[14px] leading-relaxed">{renderInline(block.markdown)}</div>
      </div>
    );
  }

  // Formative blocks render on the standalone "Check yourself" page between
  // Read and Explore — NOT inline. This keeps the read page focused on prose
  // and gives the quiz its own dedicated, engagement-optimized view.
  if (block.kind === 'formative') return null;
  if (block.kind === 'predict_observe') return <PredictObserve block={block} harness={harness} />;
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
      <p className="text-[14px] text-zinc-900 leading-relaxed mb-2">{block.predict}</p>
      {!revealed ? (
        <button onClick={() => setRevealed(true)} className="text-[13px] font-bold text-violet-600 hover:text-violet-700">
          {ctaLabel}
        </button>
      ) : (
        <div className="mt-2 pt-2 border-t border-violet-200 animate-in fade-in slide-in-from-bottom-1 duration-500">
          <div className="text-[11px] font-black uppercase tracking-widest text-violet-700 mb-1">Observe</div>
          <p className="text-[14px] text-zinc-900 leading-relaxed">{block.observe}</p>
        </div>
      )}
    </div>
  );
};

interface Props {
  blocks: ContentBlock[];
  /** Optional live harness so `predict_observe` blocks can auto-reveal when
   *  the learner changes the targeted control on the sim. */
  harness?: ScenarioHarness;
}
const ContentBlocks: React.FC<Props> = ({ blocks, harness }) => (
  <div className="space-y-1">{blocks.map((b, i) => <Block key={i} block={b} harness={harness} />)}</div>
);

export default ContentBlocks;
