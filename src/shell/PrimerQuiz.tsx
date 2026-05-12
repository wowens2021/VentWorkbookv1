import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import type { QuizQuestion } from './types';

interface Props {
  questions: QuizQuestion[];
  onComplete: (score: number, answers: { question_id: string; selected_label: string; is_correct: boolean }[]) => void;
}

const PrimerQuiz: React.FC<Props> = ({ questions, onComplete }) => {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<{ question_id: string; selected_label: string; is_correct: boolean }[]>([]);
  const [finalCard, setFinalCard] = useState(false);

  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  if (finalCard) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12 animate-in fade-in duration-500">
        <div className="text-emerald-400 text-4xl font-black mb-3">✓</div>
        <h2 className="text-xl font-black text-zinc-100 mb-2 tracking-tight">Primer complete</h2>
        <p className="text-sm text-zinc-400 mb-8 max-w-md">Now let's see this in action. The simulator is unlocking.</p>
        <button
          onClick={() => {
            const score = answers.filter(a => a.is_correct).length;
            onComplete(score, answers);
          }}
          className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-lg shadow-lg transition"
        >
          Enter the simulator <ChevronRight size={16} className="inline ml-1" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-6 py-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          Primer · Question {idx + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1 w-8 rounded ${
                i < idx ? 'bg-emerald-500' : i === idx ? 'bg-sky-500' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>

      <h3 className="text-base font-bold text-zinc-100 mb-5 leading-snug">{q.prompt}</h3>

      <div className="flex flex-col gap-2 mb-5">
        {q.options.map((opt, i) => {
          const isSel = selected === i;
          const showResult = submitted;
          const stateClass = !showResult
            ? isSel
              ? 'bg-sky-900/40 border-sky-500 text-sky-100'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
            : opt.is_correct
              ? 'bg-emerald-900/30 border-emerald-600 text-emerald-100'
              : isSel
                ? 'bg-rose-900/30 border-rose-600 text-rose-100'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500';
          return (
            <button
              key={i}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
              className={`text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition leading-snug flex items-start gap-2 ${stateClass}`}
            >
              <span className="font-black text-xs pt-0.5">{String.fromCharCode(65 + i)}.</span>
              <span className="flex-1">{opt.label}</span>
              {showResult && opt.is_correct && <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />}
              {showResult && !opt.is_correct && isSel && <XCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-5 space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Explanations</span>
          {q.options.map((opt, i) => (
            <div key={i} className="text-[12px] leading-relaxed">
              <span className={`font-black ${opt.is_correct ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {String.fromCharCode(65 + i)}.
              </span>{' '}
              <span className="text-zinc-300">{opt.explanation ?? (opt.is_correct ? 'Correct.' : 'Incorrect.')}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto flex justify-end">
        {!submitted ? (
          <button
            disabled={selected === null}
            onClick={() => {
              if (selected === null) return;
              setSubmitted(true);
              const opt = q.options[selected];
              setAnswers(a => [...a, { question_id: q.id, selected_label: opt.label, is_correct: opt.is_correct }]);
            }}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-bold rounded-lg transition"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={() => {
              if (isLast) setFinalCard(true);
              else { setIdx(idx + 1); setSelected(null); setSubmitted(false); }
            }}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-lg transition"
          >
            {isLast ? 'Continue' : 'Next'} <ChevronRight size={14} className="inline ml-1" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PrimerQuiz;
