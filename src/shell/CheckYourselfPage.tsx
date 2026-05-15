import React, { useState } from 'react';
import { Check, X, ChevronRight, HelpCircle } from 'lucide-react';
import type { ContentBlock } from './types';
import { successPhrase, wrongPhrase, continueCTA } from './microcopy';

type FormativeBlock = Extract<ContentBlock, { kind: 'formative' }>;

/** Stable check-yourself question id derived from its position in the
 *  formative-blocks list and the module id. */
export const checkYourselfQuestionId = (moduleId: string, blockIndex: number): string =>
  `${moduleId}-CY${blockIndex + 1}`;

interface Props {
  blocks: FormativeBlock[];
  onContinue: () => void;
  /** Optional module id so emitted answers carry stable per-module question ids. */
  moduleId?: string;
  /** Fires the first time the learner clicks an option in each question. */
  onAnswered?: (answer: { question_id: string; selected_label: string; is_correct: boolean }) => void;
}

/**
 * Between Read and Explore. Shows every `formative` content block as a
 * standalone MCQ on its own page so the prose page stays uncluttered.
 *
 * Engagement rules (per UX directive):
 *   - Multiple-choice with immediate feedback on click.
 *   - Wrong answers do NOT block forward progress; the explanation is shown
 *     either way and the learner can always continue.
 *   - Each question is independent — answering one doesn't lock the others.
 */
const CheckYourselfPage: React.FC<Props> = ({ blocks, onContinue, moduleId, onAnswered }) => {
  return (
    <div className="h-full flex flex-col overflow-y-auto bg-gradient-to-br from-brand-olive/[0.04] via-stone-50 to-brand-olive/[0.06]">
      {/* Olive header bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b-2 border-brand-olive/30 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-olive flex items-center justify-center shrink-0 shadow-sm">
            <HelpCircle size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-brand-olive leading-none mb-0.5">
              Check yourself
            </div>
            <div className="text-[13px] font-bold text-stone-800 leading-tight">
              Quick gut-check before the sim — the explanation is right there either way.
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5 flex-1">
        {blocks.map((b, idx) => (
          <CheckYourselfQuestion
            key={idx}
            block={b}
            index={idx + 1}
            total={blocks.length}
            questionId={moduleId ? checkYourselfQuestionId(moduleId, idx) : `CY${idx + 1}`}
            onAnswered={onAnswered}
          />
        ))}
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t-2 border-brand-olive/30 px-6 py-4 shadow-[0_-4px_12px_rgba(71,113,62,0.08)]">
        <button
          onClick={onContinue}
          className="w-full px-4 py-3 bg-brand-olive hover:bg-brand-olive-hover text-white text-[14px] font-black uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1.5 shadow-md ring-2 ring-brand-olive/30"
        >
          {continueCTA(moduleId ?? 'check')} <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

const CheckYourselfQuestion: React.FC<{
  block: FormativeBlock;
  index: number;
  total: number;
  questionId: string;
  onAnswered?: (answer: { question_id: string; selected_label: string; is_correct: boolean }) => void;
}> = ({ block, index, total, questionId, onAnswered }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const hasOptions = !!block.options && block.options.length > 0;
  const correctIdx = hasOptions ? block.options!.findIndex(o => o.is_correct) : -1;
  const submitted = selected !== null;
  const isCorrect = submitted && hasOptions && selected === correctIdx;

  const handlePick = (i: number) => {
    if (submitted) return;
    setSelected(i);
    if (hasOptions && onAnswered) {
      const opt = block.options![i];
      onAnswered({
        question_id: questionId,
        selected_label: opt.label,
        is_correct: opt.is_correct,
      });
    }
  };

  return (
    <section className="rounded-xl border-2 border-brand-olive/20 bg-white shadow-sm hover:border-brand-olive/30 transition-colors overflow-hidden">
      {/* Question header band */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3 bg-gradient-to-r from-brand-olive/[0.08] to-transparent border-b border-brand-olive/15">
        <div className="w-7 h-7 rounded-full bg-brand-olive flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white font-mono font-black text-[12px] leading-none">
            {index}
          </span>
        </div>
        <p className="text-[14px] font-bold text-stone-900 leading-snug pt-0.5">
          {block.question}
        </p>
        {total > 1 && (
          <span className="ml-auto text-[10px] font-mono font-bold text-brand-olive/60 shrink-0 self-center">
            of {total}
          </span>
        )}
      </div>

      <div className="px-4 py-3">
        {hasOptions ? (
          <div className="space-y-2">
            {block.options!.map((opt, i) => {
              const isSelected = selected === i;
              const isThisCorrect = i === correctIdx;
              let cls = 'bg-white border-stone-200 text-stone-700 hover:border-brand-olive/40 hover:bg-brand-olive/[0.04]';
              let letterCls = 'bg-stone-100 text-stone-500 border-stone-200';
              if (!submitted) {
                // unchanged
              } else if (isThisCorrect) {
                cls = 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-300';
                letterCls = 'bg-emerald-500 text-white border-emerald-500';
              } else if (isSelected) {
                cls = 'bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-300';
                letterCls = 'bg-rose-500 text-white border-rose-500';
              } else {
                cls = 'bg-stone-50 border-stone-200 text-stone-500';
                letterCls = 'bg-stone-100 text-stone-400 border-stone-200';
              }
              return (
                <button
                  key={i}
                  disabled={submitted}
                  onClick={() => handlePick(i)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border-2 text-[13.5px] font-medium transition-all flex items-center gap-3 ${cls} ${
                    submitted ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-md border-2 font-black text-[11px] flex items-center justify-center shrink-0 transition-all ${letterCls}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 leading-snug">{opt.label}</span>
                  {submitted && isThisCorrect && (
                    <Check size={16} className="text-emerald-600 shrink-0" strokeWidth={3} />
                  )}
                  {submitted && isSelected && !isThisCorrect && (
                    <X size={16} className="text-rose-600 shrink-0" strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          // Legacy formative blocks without options: reveal-style.
          <FormativeLegacy block={block} />
        )}

        {hasOptions && submitted && (
          <div
            className={`mt-3 border-l-4 rounded-r-lg p-3 text-[13.5px] leading-relaxed ${
              isCorrect
                ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900'
                : 'border-rose-500 bg-rose-50/70 text-rose-900'
            }`}
          >
            <div
              className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                isCorrect ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {isCorrect
                ? `${successPhrase(questionId).replace(/[.!]$/, '')} — here's the why`
                : `${wrongPhrase(questionId).replace(/[.!]$/, '')} — here's the why`}
            </div>
            {block.answer}
          </div>
        )}
      </div>
    </section>
  );
};

const FormativeLegacy: React.FC<{ block: FormativeBlock }> = ({ block }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-[13px] font-bold text-sky-600 hover:text-sky-700"
        >
          Show answer →
        </button>
      ) : (
        <div className="mt-2 pt-2 border-t border-zinc-200 text-[14px] text-emerald-700 leading-relaxed">
          {block.answer}
        </div>
      )}
    </div>
  );
};

export default CheckYourselfPage;
