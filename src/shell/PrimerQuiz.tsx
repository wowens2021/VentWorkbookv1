import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import type { QuizQuestion } from './types';

interface Props {
  questions: QuizQuestion[];
  /** Called when the learner answers all questions correctly. `score` is
   *  derived from first-attempt correctness so the program-director dashboard
   *  retains baseline signal even though advancement now requires retries. */
  onComplete: (score: number, answers: { question_id: string; selected_label: string; is_correct: boolean }[]) => void;
}

const PrimerQuiz: React.FC<Props> = ({ questions, onComplete }) => {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  /** First-attempt-correct record per question (for dashboard score). */
  const [firstAttempts, setFirstAttempts] = useState<Record<string, boolean>>({});
  /** Per-question attempt count for the current pass. */
  const [attemptsByQ, setAttemptsByQ] = useState<Record<string, number>>({});
  const [answerLog, setAnswerLog] = useState<{ question_id: string; selected_label: string; is_correct: boolean }[]>([]);
  const [finalCard, setFinalCard] = useState(false);

  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const lastWasCorrect = submitted && selected !== null && q.options[selected].is_correct;

  if (finalCard) {
    const score = questions.reduce((s, qq) => s + (firstAttempts[qq.id] ? 1 : 0), 0);
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12 animate-in fade-in duration-500">
        <div className="text-emerald-600 text-5xl font-black mb-3">✓</div>
        <h2 className="text-2xl font-black text-zinc-900 mb-2 tracking-tight">Primer complete</h2>
        <p className="text-base text-zinc-600 mb-2 max-w-md">Now let's see this in action.</p>
        <p className="text-sm text-zinc-500 mb-8 max-w-md">First-attempt score: <span className="font-bold text-emerald-700">{score} / {questions.length}</span></p>
        <button
          onClick={() => onComplete(score, answerLog)}
          className="px-6 py-3 bg-brand-olive hover:bg-brand-olive-hover text-white text-sm font-bold rounded-lg shadow-lg transition"
        >
          Enter the simulator <ChevronRight size={16} className="inline ml-1" />
        </button>
      </div>
    );
  }

  const submit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const opt = q.options[selected];
    const attemptsSoFar = attemptsByQ[q.id] ?? 0;
    setAttemptsByQ(a => ({ ...a, [q.id]: attemptsSoFar + 1 }));
    if (attemptsSoFar === 0) {
      // First attempt — record for scoring
      setFirstAttempts(f => ({ ...f, [q.id]: opt.is_correct }));
    }
    setAnswerLog(a => [...a, { question_id: q.id, selected_label: opt.label, is_correct: opt.is_correct }]);
  };

  const tryAgain = () => {
    setSelected(null);
    setSubmitted(false);
  };

  const advance = () => {
    if (isLast) setFinalCard(true);
    else { setIdx(idx + 1); setSelected(null); setSubmitted(false); }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gradient-to-br from-brand-olive/[0.04] via-stone-50 to-brand-olive/[0.06]">
      {/* Olive-trimmed header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b-2 border-brand-olive/30 px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-brand-olive">
            Primer · Question {idx + 1} of {questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((qq, i) => (
              <div
                key={i}
                className={`h-1.5 w-10 rounded-full transition-colors ${
                  firstAttempts[qq.id] !== undefined && i < idx
                    ? 'bg-emerald-500'
                    : i === idx
                      ? 'bg-brand-olive'
                      : 'bg-brand-olive/15'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 px-6 py-6">
        <div className="rounded-xl border-2 border-brand-olive/20 bg-white shadow-sm p-5 mb-4">
          <h3 className="font-display text-xl font-semibold text-stone-900 leading-snug">{q.prompt}</h3>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {q.options.map((opt, i) => {
            const isSel = selected === i;
            const showResult = submitted;
            let cls = 'bg-white border-stone-200 text-stone-700 hover:border-brand-olive/40 hover:bg-brand-olive/[0.04]';
            let letterCls = 'bg-stone-100 text-stone-500 border-stone-200';
            if (!showResult && isSel) {
              cls = 'bg-brand-olive/10 border-brand-olive text-stone-900 ring-2 ring-brand-olive/30';
              letterCls = 'bg-brand-olive text-white border-brand-olive';
            }
            if (showResult) {
              if (opt.is_correct) {
                cls = 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-300';
                letterCls = 'bg-emerald-500 text-white border-emerald-500';
              } else if (isSel) {
                cls = 'bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-300';
                letterCls = 'bg-rose-500 text-white border-rose-500';
              } else {
                cls = 'bg-stone-50 border-stone-200 text-stone-500';
                letterCls = 'bg-stone-100 text-stone-400 border-stone-200';
              }
            }
            return (
              <button
                key={i}
                onClick={() => !submitted && setSelected(i)}
                disabled={submitted}
                className={`text-left px-4 py-3 rounded-lg border-2 text-[15px] font-medium transition-all leading-snug flex items-center gap-3 ${cls} ${
                  submitted ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <span className={`w-7 h-7 rounded-md border-2 font-black text-[12px] flex items-center justify-center shrink-0 transition-all ${letterCls}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt.label}</span>
                {showResult && opt.is_correct && <CheckCircle2 size={18} className="text-emerald-600 shrink-0" strokeWidth={2.5} />}
                {showResult && !opt.is_correct && isSel && <XCircle size={18} className="text-rose-600 shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>

        {submitted && selected !== null && (() => {
          const opt = q.options[selected];
          const isCorrect = opt.is_correct;
          return (
            <div
              className={`border-l-4 rounded-r-lg p-4 mb-5 ${
                isCorrect
                  ? 'bg-emerald-50/70 border-emerald-500'
                  : 'bg-rose-50/70 border-rose-500'
              }`}
            >
              <span
                className={`text-[11px] font-black uppercase tracking-widest mb-1.5 block ${
                  isCorrect ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {isCorrect ? 'Why this is right' : 'Why this is not it'}
              </span>
              <div className="text-[13.5px] text-stone-800 leading-relaxed">
                {opt.explanation ?? (isCorrect ? 'Correct.' : 'Incorrect.')}
              </div>
            </div>
          );
        })()}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2 border-t border-brand-olive/15">
          {submitted && !lastWasCorrect && (
            <span className="text-[12.5px] font-bold text-rose-600">
              Not quite — review the explanation and try again.
            </span>
          )}
          <div className="ml-auto flex gap-2 pt-3">
            {!submitted && (
              <button
                disabled={selected === null}
                onClick={submit}
                className="px-6 py-2.5 bg-brand-olive hover:bg-brand-olive-hover disabled:bg-stone-200 disabled:text-stone-400 text-white text-[14px] font-black uppercase tracking-wider rounded-lg transition shadow-md disabled:shadow-none ring-2 ring-brand-olive/30 disabled:ring-0"
              >
                Submit
              </button>
            )}
            {submitted && !lastWasCorrect && (
              <button
                onClick={tryAgain}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-[14px] font-bold rounded-lg transition flex items-center gap-1.5 shadow-md"
              >
                <RotateCcw size={14} strokeWidth={2.5} /> Try again
              </button>
            )}
            {submitted && lastWasCorrect && (
              <button
                onClick={advance}
                className="px-6 py-2.5 bg-brand-olive hover:bg-brand-olive-hover text-white text-[14px] font-black uppercase tracking-wider rounded-lg transition shadow-md ring-2 ring-brand-olive/30"
              >
                {isLast ? 'Continue' : 'Next'} <ChevronRight size={14} className="inline ml-1" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrimerQuiz;
