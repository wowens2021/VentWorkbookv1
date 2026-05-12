import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface Props {
  keyPoints: string[];
  onReopenReplay?: () => void;
}

const ReviewCard: React.FC<Props> = ({ keyPoints, onReopenReplay }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 border border-zinc-800 rounded-lg bg-zinc-950">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900 transition"
      >
        <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Key points</span>
        {open ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <ul className="space-y-2">
            {keyPoints.map((pt, i) => (
              <li key={i} className="text-[12px] text-zinc-300 leading-relaxed flex items-start gap-2">
                <span className="text-emerald-400 font-black">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
          {onReopenReplay && (
            <button
              onClick={onReopenReplay}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-[11px] font-bold text-zinc-300 transition"
            >
              <RotateCcw size={12} /> Reopen sim in replay state
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
