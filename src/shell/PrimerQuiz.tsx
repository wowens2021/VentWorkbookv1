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
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg transition"
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
    <div className="flex flex-col h-full px-6 py-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
          Primer · Question {idx + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((qq, i) => (
            <div
              key={i}
              className={`h-1.5 w-10 rounded ${
                firstAttempts[qq.id] !== undefined && i < idx
                  ? 'bg-emerald-500'
                  : i === idx
                    ? 'bg-sky-500'
                    : 'bg-zinc-200'
              }`}
            />
          ))}
        </div>
      </div>

      <h3 className="text-lg font-bold text-zinc-900 mb-5 leading-snug">{q.prompt}</h3>

      <div className="flex flex-col gap-2 mb-5">
        {q.options.map((opt, i) => {
          const isSel = selected === i;
          const showResult = submitted;
          const stateClass = !showResult
            ? isSel
              ? 'bg-sky-50 border-sky-500 text-sky-900'
              : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
            : opt.is_correct
              ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
              : isSel
                ? 'bg-rose-50 border-rose-500 text-rose-900'
                : 'bg-white border-zinc-200 text-zinc-500';
          return (
            <button
              key={i}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
              className={`text-left px-4 py-3 rounded-lg border text-[15px] font-medium transition leading-snug flex items-start gap-2 ${stateClass}`}
            >
              <span className="font-black text-sm pt-0.5">{String.fromCharCode(65 + i)}.</span>
              <span className="flex-1">{opt.label}</span>
              {showResult && opt.is_correct && <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />}
              {showResult && !opt.is_correct && isSel && <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-5 space-y-2.5">
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Explanations</span>
          {q.options.map((opt, i) => (
            <div key={i} className="text-[13px] leading-relaxed">
              <span className={`font-black ${opt.is_correct ? 'text-emerald-700' : 'text-zinc-500'}`}>
                {String.fromCharCode(65 + i)}.
              </span>{' '}
              <span className="text-zinc-700">{opt.explanation ?? (opt.is_correct ? 'Correct.' : 'Incorrect.')}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3">
        {submitted && !lastWasCorrect && (
          <span className="text-[12px] font-bold text-rose-600">
            Not quite — review the explanations and try again.
          </span>
        )}
        <div className="ml-auto flex gap-2">
          {!submitted && (
            <button
              disabled={selected === null}
              onClick={submit}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-sm font-bold rounded-lg transition"
            >
              Submit
            </button>
          )}
          {submitted && !lastWasCorrect && (
            <button
              onClick={tryAgain}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-lg transition flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> Try again
            </button>
          )}
          {submitted && lastWasCorrect && (
            <button
              onClick={advance}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition"
            >
              {isLast ? 'Continue' : 'Next'} <ChevronRight size={14} className="inline ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrimerQuiz;
