import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { InlinePromptConfig } from './types';

interface Props {
  prompt: InlinePromptConfig;
  onResponse: (selectedLabel: string, isCorrect: boolean) => void;
  onDismiss?: () => void;
}

/** Inline multiple-choice card displayed over/inside the sim panel. */
const RecognitionPrompt: React.FC<Props> = ({ prompt, onResponse, onDismiss }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = prompt.max_attempts ?? 2;
  const revealed = attempts >= maxAttempts;

  const submit = () => {
    if (selected === null) return;
    const opt = prompt.options[selected];
    setSubmitted(true);
    onResponse(opt.label, opt.is_correct);
    if (!opt.is_correct) {
      const next = attempts + 1;
      setAttempts(next);
      if (next < maxAttempts) {
        // allow retry after a brief delay
        setTimeout(() => { setSubmitted(false); setSelected(null); }, 1100);
      }
    }
  };

  return (
    <div className="bg-white border border-sky-300 rounded-xl shadow-2xl p-4 max-w-md w-full">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle size={14} className="text-sky-600" />
        <span className="text-[10px] font-black uppercase tracking-widest text-sky-700">Quick check</span>
      </div>
      <p className="text-sm font-bold text-zinc-900 mb-3 leading-snug">{prompt.question}</p>
      <div className="space-y-1.5">
        {prompt.options.map((opt, i) => {
          const isSel = selected === i;
          const show = submitted;
          const cls = !show
            ? isSel
              ? 'bg-sky-100 border-sky-500 text-sky-800'
              : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'
            : opt.is_correct
              ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
              : isSel
                ? 'bg-rose-50 border-rose-600 text-rose-700'
                : 'bg-zinc-50 border-zinc-200 text-zinc-500';
          return (
            <button
              key={i}
              disabled={submitted}
              onClick={() => setSelected(i)}
              className={`w-full text-left px-3 py-1.5 rounded border text-[12px] flex items-start gap-2 transition ${cls}`}
            >
              <span className="font-black text-[10px] pt-0.5">{String.fromCharCode(65 + i)}.</span>
              <span className="flex-1">{opt.label}</span>
              {show && opt.is_correct && <CheckCircle2 size={12} className="text-emerald-600 mt-0.5" />}
              {show && !opt.is_correct && isSel && <XCircle size={12} className="text-rose-600 mt-0.5" />}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-3">
        {attempts > 0 && !revealed && (
          <span className="text-[10px] text-amber-600">Try again ({maxAttempts - attempts} left)</span>
        )}
        {revealed && <span className="text-[10px] text-zinc-500">Correct answer revealed.</span>}
        <div className="ml-auto flex gap-2">
          {onDismiss && submitted && (
            <button onClick={onDismiss} className="text-[11px] text-zinc-500 hover:text-zinc-900">Close</button>
          )}
          {!submitted && (
            <button
              onClick={submit}
              disabled={selected === null}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-100 disabled:text-zinc-400 text-white text-[11px] font-bold rounded transition"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecognitionPrompt;
