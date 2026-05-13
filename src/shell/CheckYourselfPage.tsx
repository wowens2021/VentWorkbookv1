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
    <div className="h-full flex flex-col px-6 py-5 overflow-y-auto">
      <div className="mb-4 pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle size={16} className="text-brand-olive" />
          <h2 className="text-[11px] font-black uppercase tracking-widest text-brand-olive">
            Check yourself
          </h2>
        </div>
        <p className="text-[14px] text-zinc-600 leading-snug">
          Quick gut-check before you touch the ventilator. Don't worry about getting it perfect —
          the explanation is right there either way.
        </p>
      </div>

      <div className="space-y-5 flex-1">
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

      <button
        onClick={onContinue}
        className="mt-6 w-full px-4 py-3 bg-brand-olive hover:bg-brand-olive-hover text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
      >
        {continueCTA(moduleId ?? 'check')} <ChevronRight size={14} />
      </button>
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
    <section className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold text-zinc-400">
          Q{index}{total > 1 ? ` of ${total}` : ''}
        </span>
      </div>
      <p className="text-[15px] text-zinc-900 leading-relaxed font-medium mb-3">
        {block.question}
      </p>

      {hasOptions ? (
        <div className="space-y-2 mb-3">
          {block.options!.map((opt, i) => {
            const isSelected = selected === i;
            const isThisCorrect = i === correctIdx;
            // Styling cascade: pre-submit → neutral hover; post-submit → correct=green, wrong-selected=rose, correct-revealed=green outline.
            let cls = 'w-full text-left px-3 py-2.5 rounded-lg border text-[14px] font-medium transition flex items-center gap-2.5';
            if (!submitted) {
              cls += ' bg-stone-50 border-stone-200 hover:bg-stone-100 hover:border-stone-300 text-zinc-800 cursor-pointer';
            } else if (isThisCorrect) {
              cls += ' bg-emerald-50 border-emerald-300 text-emerald-900';
            } else if (isSelected && !isThisCorrect) {
              cls += ' bg-rose-50 border-rose-300 text-rose-900';
            } else {
              cls += ' bg-stone-50 border-stone-200 text-zinc-500';
            }
            return (
              <button
                key={i}
                disabled={submitted}
                onClick={() => handlePick(i)}
                className={cls}
              >
                <span className="font-mono text-[11px] font-bold text-zinc-500 shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt.label}</span>
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
          className={`mt-2 border rounded-lg p-3 text-[13.5px] leading-relaxed ${
            isCorrect
              ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
              : 'border-zinc-200 bg-stone-50 text-zinc-800'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">
            {isCorrect
              ? `${successPhrase(questionId).replace(/[.!]$/, '')} — here's the why`
              : `${wrongPhrase(questionId).replace(/[.!]$/, '')} — here's the why`}
          </div>
          {block.answer}
        </div>
      )}
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
