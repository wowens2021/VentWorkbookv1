import React, { useState } from 'react';
import { CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import type { QuizQuestion } from './types';

interface Props {
  questions: QuizQuestion[];
  /**
   * Receives the score AND the per-question answer log so the debrief can
   * render a real breakdown (which questions the learner got right or wrong,
   * and what they picked).
   */
  onSubmit: (
    score: number,
    answers: { question_id: string; selected_label: string; is_correct: boolean }[],
  ) => void;
}

const SummativeQuiz: React.FC<Props> = ({ questions, onSubmit }) => {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers.every(a => a !== null);
  const score = answers.reduce((s, a, i) => {
    if (a === null) return s;
    return s + (questions[i].options[a].is_correct ? 1 : 0);
  }, 0);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gradient-to-br from-brand-olive/[0.04] via-stone-50 to-brand-olive/[0.06]">
      {/* Olive-trimmed header bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b-2 border-brand-olive/30 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-olive flex items-center justify-center shrink-0 shadow-sm">
            <BookOpen size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-brand-olive leading-none mb-0.5">
              Knowledge check
            </div>
            <div className="text-[13px] font-bold text-stone-800 leading-tight">
              {questions.length} questions · grades your understanding
            </div>
          </div>
          {submitted && (
            <div className="flex items-baseline gap-1 shrink-0 font-mono">
              <span className="text-2xl font-black text-brand-olive tabular-nums leading-none">
                {score}
              </span>
              <span className="text-base font-bold text-brand-olive/50 leading-none">/{questions.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">
        {questions.map((q, qi) => {
          const sel = answers[qi];
          const showResult = submitted;
          return (
            <div
              key={q.id}
              className="rounded-xl border-2 border-brand-olive/20 bg-white shadow-sm hover:border-brand-olive/30 transition-colors overflow-hidden"
            >
              {/* Question header band */}
              <div className="flex items-start gap-3 px-4 pt-4 pb-3 bg-gradient-to-r from-brand-olive/[0.08] to-transparent border-b border-brand-olive/15">
                <div className="w-7 h-7 rounded-full bg-brand-olive flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-white font-mono font-black text-[12px] leading-none">
                    {qi + 1}
                  </span>
                </div>
                <h3 className="text-[14px] font-bold text-stone-900 leading-snug pt-0.5">
                  {q.prompt}
                </h3>
              </div>

              {/* Answer choices */}
              <div className="px-4 py-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const isSel = sel === oi;
                  const isCorrect = opt.is_correct;
                  // Default (not submitted)
                  let cls = 'bg-white border-stone-200 text-stone-700 hover:border-brand-olive/40 hover:bg-brand-olive/[0.04]';
                  let letterCls = 'bg-stone-100 text-stone-500 border-stone-200';
                  if (!showResult && isSel) {
                    cls = 'bg-brand-olive/10 border-brand-olive text-stone-900 ring-2 ring-brand-olive/30';
                    letterCls = 'bg-brand-olive text-white border-brand-olive';
                  }
                  if (showResult) {
                    if (isCorrect) {
                      cls = 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-300';
                      letterCls = 'bg-emerald-500 text-white border-emerald-500';
                    } else if (isSel) {
                      cls = 'bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-300';
                      letterCls = 'bg-rose-500 text-white border-rose-500';
                    } else {
                      cls = 'bg-stone-50 border-stone-200 text-stone-500';
                      letterCls = 'bg-stone-100 text-stone-400 border-stone-200';
                    }
                  }
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => {
                        setAnswers(a => {
                          const next = [...a];
                          next[qi] = oi;
                          return next;
                        });
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border-2 text-[13.5px] flex items-center gap-3 transition-all ${cls} ${
                        submitted ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md border-2 font-black text-[11px] flex items-center justify-center shrink-0 transition-all ${letterCls}`}
                      >
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1 font-medium leading-snug">{opt.label}</span>
                      {showResult && isCorrect && (
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" strokeWidth={2.5} />
                      )}
                      {showResult && !isCorrect && isSel && (
                        <XCircle size={18} className="text-rose-600 shrink-0" strokeWidth={2.5} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Per-question explanation */}
              {submitted && sel !== null && (() => {
                const selectedOpt = q.options[sel as number];
                const isCorrect = selectedOpt.is_correct;
                const text = selectedOpt.explanation ?? q.explanation;
                if (!text) return null;
                return (
                  <div
                    className={`mx-4 mb-4 px-3.5 py-2.5 border-l-4 rounded-r-lg text-[13px] leading-relaxed ${
                      isCorrect
                        ? 'bg-emerald-50/70 border-emerald-500 text-emerald-900'
                        : 'bg-rose-50/70 border-rose-500 text-rose-900'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest mr-1.5 ${
                        isCorrect ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isCorrect ? 'Why this is right:' : 'Why this is not it:'}
                    </span>
                    {text}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Sticky submit footer */}
      <div className="sticky bottom-0 mt-auto bg-white/95 backdrop-blur-sm border-t-2 border-brand-olive/30 px-6 py-4 shadow-[0_-4px_12px_rgba(71,113,62,0.08)]">
        {!submitted ? (
          <button
            disabled={!allAnswered}
            onClick={() => {
              setSubmitted(true);
              const log = questions.map((q, i) => {
                const idx = answers[i];
                const opt = idx !== null ? q.options[idx] : null;
                return {
                  question_id: q.id,
                  selected_label: opt?.label ?? '',
                  is_correct: !!opt?.is_correct,
                };
              });
              onSubmit(score, log);
            }}
            className="w-full px-5 py-3 bg-brand-olive hover:bg-brand-olive-hover disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed text-white text-[14px] font-black uppercase tracking-wider rounded-lg transition shadow-md disabled:shadow-none ring-2 ring-brand-olive/30 disabled:ring-0"
          >
            {allAnswered ? 'Submit answers' : `Answer ${answers.filter(a => a === null).length} more to submit`}
          </button>
        ) : (
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 via-emerald-50 to-brand-olive/10 border-2 border-emerald-300 rounded-lg text-emerald-800 text-[13.5px] font-semibold flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 size={14} className="text-white" strokeWidth={2.5} />
            </div>
            Submitted — review the answers above, then check the key points below.
          </div>
        )}
      </div>
    </div>
  );
};

export default SummativeQuiz;
