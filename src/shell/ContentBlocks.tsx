import React, { useState } from 'react';
import { Info, AlertTriangle, Lightbulb } from 'lucide-react';
import type { ContentBlock } from './types';

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
      if (tok.startsWith('**')) parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
      else parts.push(<code key={key++} className="bg-zinc-800 px-1 py-0.5 rounded text-[12px] font-mono">{tok.slice(1, -1)}</code>);
      last = m.index + tok.length;
    }
    if (last < buf.length) parts.push(buf.slice(last));
    return <p key={pi} className="mb-3 last:mb-0 leading-relaxed text-zinc-300 text-[13px]">{parts}</p>;
  });
};

const Block: React.FC<{ block: ContentBlock }> = ({ block }) => {
  if (block.kind === 'prose') return <div>{renderInline(block.markdown)}</div>;

  if (block.kind === 'figure') {
    return (
      <figure className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 my-3">
        {block.ascii && <pre className="text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre">{block.ascii}</pre>}
        {block.src && <img src={block.src} alt={block.caption ?? ''} className="w-full rounded" />}
        {block.caption && <figcaption className="text-[10px] text-zinc-500 mt-2 italic">{block.caption}</figcaption>}
      </figure>
    );
  }

  if (block.kind === 'callout') {
    const Icon = block.tone === 'warn' ? AlertTriangle : block.tone === 'tip' ? Lightbulb : Info;
    const tone =
      block.tone === 'warn'
        ? 'border-amber-700 bg-amber-900/20 text-amber-100'
        : block.tone === 'tip'
          ? 'border-sky-700 bg-sky-900/20 text-sky-100'
          : 'border-zinc-700 bg-zinc-900 text-zinc-300';
    return (
      <div className={`border rounded-lg p-3 my-3 flex gap-2.5 ${tone}`}>
        <Icon size={16} className="shrink-0 mt-0.5" />
        <div className="text-[12px] leading-relaxed">{renderInline(block.markdown)}</div>
      </div>
    );
  }

  if (block.kind === 'formative') return <Formative block={block} />;
  if (block.kind === 'predict_observe') return <PredictObserve block={block} />;
  return null;
};

const Formative: React.FC<{ block: Extract<ContentBlock, { kind: 'formative' }> }> = ({ block }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-zinc-800 rounded-lg p-3 my-3 bg-zinc-950">
      <div className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1">Check yourself</div>
      <p className="text-[13px] text-zinc-200 leading-relaxed">{block.question}</p>
      {!open ? (
        <button onClick={() => setOpen(true)} className="mt-2 text-[11px] font-bold text-sky-400 hover:text-sky-300">Show answer →</button>
      ) : (
        <div className="mt-2 pt-2 border-t border-zinc-800 text-[12px] text-emerald-300 leading-relaxed">{block.answer}</div>
      )}
    </div>
  );
};

const PredictObserve: React.FC<{ block: Extract<ContentBlock, { kind: 'predict_observe' }> }> = ({ block }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="border-l-2 border-violet-700 bg-violet-900/10 rounded-r-lg p-3 my-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1">Predict</div>
      <p className="text-[12px] text-zinc-200 leading-relaxed mb-2">{block.predict}</p>
      {!revealed ? (
        <button onClick={() => setRevealed(true)} className="text-[11px] font-bold text-violet-400 hover:text-violet-300">
          Then observe in the sim →
        </button>
      ) : (
        <div className="mt-2 pt-2 border-t border-violet-800">
          <div className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1">Observe</div>
          <p className="text-[12px] text-zinc-200 leading-relaxed">{block.observe}</p>
        </div>
      )}
    </div>
  );
};

interface Props { blocks: ContentBlock[]; }
const ContentBlocks: React.FC<Props> = ({ blocks }) => (
  <div className="space-y-1">{blocks.map((b, i) => <Block key={i} block={b} />)}</div>
);

export default ContentBlocks;
