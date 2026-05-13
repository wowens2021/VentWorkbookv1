import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { InlinePromptConfig } from './types';
import { successPhrase, wrongPhrase, continueCTA } from './microcopy';

interface Props {
  prompt: InlinePromptConfig;
  /**
   * Called when the learner submits an answer — receives the option label
   * and whether it was correct. The tracker may or may not advance on a
   * wrong answer; the parent's `onContinue` callback below is what actually
   * progresses the flow.
   */
  onResponse: (selectedLabel: string, isCorrect: boolean) => void;
  /**
   * Called when the learner clicks the "Continue" button after seeing
   * feedback. The parent uses this to advance the tracker regardless of
   * whether the answer was correct — a wrong answer is logged for
   * telemetry but doesn't block forward progress.
   */
  onContinue?: () => void;
  onDismiss?: () => void;
}

/**
 * Inline multiple-choice card displayed over/inside the sim panel.
 *
 * UX contract:
 *   - The learner picks one option and clicks Submit (or the option doubles
 *     as the submit affordance).
 *   - The response fires immediately (right or wrong) so the tracker /
 *     telemetry sees the actual pick.
 *   - Feedback is shown — green panel with explanation on correct, rose
 *     panel with explanation on wrong.
 *   - A "Continue" button is shown regardless of correctness. Clicking it
 *     calls `onContinue`, which the parent uses to force-advance the
 *     tracker if needed. No retry; no max-attempts wall.
 */
const RecognitionPrompt: React.FC<Props> = ({ prompt, onResponse, onContinue, onDismiss }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (selected === null || submitted) return;
    const opt = prompt.options[selected];
    setSubmitted(true);
    onResponse(opt.label, opt.is_correct);
  };

  const selectedOpt = selected !== null ? prompt.options[selected] : null;
  const isCorrect = !!selectedOpt?.is_correct;
  const explanation = selectedOpt?.explanation ?? prompt.annotation_on_correct;
  const correctOpt = prompt.options.find(o => o.is_correct);

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

      {/* Feedback panel — shown after any submission. */}
      {submitted && (
        <div
          className={`mt-3 border rounded-md px-3 py-2 text-[12.5px] leading-snug ${
            isCorrect
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">
            {isCorrect
              ? successPhrase(prompt.prompt_id)
              : wrongPhrase(prompt.prompt_id)}
          </div>
          {!isCorrect && correctOpt && (
            <div className="mb-1">
              <span className="font-bold">Correct answer:</span> {correctOpt.label}
            </div>
          )}
          {explanation && <div>{explanation}</div>}
        </div>
      )}

      <div className="flex items-center justify-end mt-3 gap-2">
        {!submitted ? (
          <button
            onClick={submit}
            disabled={selected === null}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-100 disabled:text-zinc-400 text-white text-[12px] font-bold rounded transition"
          >
            Submit
          </button>
        ) : (
          <>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 px-2 py-1"
              >
                Close
              </button>
            )}
            <button
              onClick={() => (onContinue ?? onDismiss)?.()}
              className={`px-3 py-1.5 rounded text-[12px] font-bold transition shadow-sm ${
                isCorrect
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white'
              }`}
            >
              {continueCTA(prompt.prompt_id)}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RecognitionPrompt;
