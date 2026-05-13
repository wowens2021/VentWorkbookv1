import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
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
    <div className="flex flex-col h-full px-6 py-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          Knowledge check · {questions.length} questions
        </span>
        {submitted && (
          <span className="text-sm font-mono font-black text-emerald-600">
            {score} / {questions.length}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q, qi) => (
          <div key={q.id}>
            <h3 className="text-sm font-bold text-zinc-900 mb-3 leading-snug">
              <span className="text-zinc-500 font-mono mr-2">{qi + 1}.</span>
              {q.prompt}
            </h3>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const sel = answers[qi] === oi;
                const showResult = submitted;
                const stateClass = !showResult
                  ? sel
                    ? 'bg-sky-100 border-brand-olive text-sky-800'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  : opt.is_correct
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                    : sel
                      ? 'bg-rose-50 border-rose-600 text-rose-700'
                      : 'bg-white border-zinc-200 text-zinc-500';
                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => {
                      setAnswers(a => { const next = [...a]; next[qi] = oi; return next; });
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md border text-[13px] flex items-start gap-2 transition ${stateClass}`}
                  >
                    <span className="font-black text-[11px] pt-0.5">{String.fromCharCode(65 + oi)}.</span>
                    <span className="flex-1">{opt.label}</span>
                    {showResult && opt.is_correct && <CheckCircle2 size={14} className="text-emerald-600 mt-0.5" />}
                    {showResult && !opt.is_correct && sel && <XCircle size={14} className="text-rose-600 mt-0.5" />}
                  </button>
                );
              })}
            </div>
            {submitted && answers[qi] !== null && (() => {
              const selectedOpt = q.options[answers[qi] as number];
              const isCorrect = selectedOpt.is_correct;
              // Prefer the chosen option's own explanation when authored;
              // otherwise fall back to the question-level explanation.
              const text = selectedOpt.explanation ?? q.explanation;
              if (!text) return null;
              return (
                <div
                  className={`mt-2 px-3 py-2 border rounded text-[12px] leading-relaxed ${
                    isCorrect
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest mr-1.5 ${
                      isCorrect ? 'text-emerald-800' : 'text-rose-800'
                    }`}
                  >
                    {isCorrect ? 'Why this is right:' : 'Why this is not it:'}
                  </span>
                  {text}
                </div>
              );
            })()}
          </div>
        ))}
      </div>

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
          className="mt-6 px-5 py-2.5 bg-brand-olive hover:bg-brand-olive-hover disabled:bg-zinc-100 disabled:text-zinc-400 text-white text-sm font-bold rounded-lg transition"
        >
          Submit
        </button>
      ) : (
        <div className="mt-6 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          Submitted. Review your answers above, then check the key points below.
        </div>
      )}
    </div>
  );
};

export default SummativeQuiz;
