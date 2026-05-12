import React, { useMemo, useState } from 'react';
import { Brain, ChevronRight, RotateCcw, CheckCircle2, XCircle, ArrowLeft, Trophy, Sparkles, BookOpen, History } from 'lucide-react';
import {
  readLearnerProgress,
  selectQuestions,
  evaluateMastery,
  type SelectedQuestion,
  type AnsweredQuestion,
  type MasteryResult,
  type LearnerProgress,
} from '../knowledgeCheck/engine';
import { saveSession, listSessions } from '../knowledgeCheck/sessions';
import type { KCDifficulty } from '../knowledgeCheck/questions';

interface Props {
  onBrowseModules: () => void;
}

type Phase = 'start' | 'quiz' | 'results';

const QUESTION_COUNT = 10;

const KnowledgeCheckPage: React.FC<Props> = ({ onBrowseModules }) => {
  const progress = useMemo(() => readLearnerProgress(), []);
  const recentSessions = useMemo(() => listSessions().slice(-5).reverse(), []);

  const [phase, setPhase] = useState<Phase>('start');
  const [questions, setQuestions] = useState<SelectedQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);
  const [result, setResult] = useState<MasteryResult | null>(null);

  const startQuiz = () => {
    const qs = selectQuestions(progress, QUESTION_COUNT);
    setQuestions(qs);
    setCurrentIdx(0);
    setSelectedIdx(null);
    setSubmitted(false);
    setAnswers([]);
    setResult(null);
    setPhase('quiz');
  };

  const submitAnswer = () => {
    if (selectedIdx === null) return;
    const q = questions[currentIdx];
    const isCorrect = selectedIdx === q.shuffledCorrectIndex;
    setAnswers(a => [...a, { question: q, selectedIndex: selectedIdx, isCorrect }]);
    setSubmitted(true);
  };

  const nextQuestion = () => {
    if (currentIdx >= questions.length - 1) {
      // Build result from final answers
      const finalAnswers = [...answers]; // current state already includes this answer
      const r = evaluateMastery(finalAnswers, progress);
      setResult(r);
      // Persist session
      saveSession({
        id: `kc_${Date.now()}`,
        completed_at: new Date().toISOString(),
        score: r.score,
        total: r.total,
        percent: r.percent,
        mastery_title: r.title,
        cohort: r.cohort,
        modules_completed_at_attempt: progress.totalCompleted,
        answers: finalAnswers.map(a => ({
          question_id: a.question.id,
          difficulty: a.question.difficulty,
          tags: a.question.tags,
          selected_label: a.selectedIndex !== null ? a.question.shuffledOptions[a.selectedIndex] : null,
          is_correct: a.isCorrect,
        })),
      });
      setPhase('results');
      return;
    }
    setCurrentIdx(i => i + 1);
    setSelectedIdx(null);
    setSubmitted(false);
  };

  // ── Render ──
  if (phase === 'start') {
    return (
      <StartScreen
        progress={progress}
        recentSessions={recentSessions}
        onStart={startQuiz}
        onBrowseModules={onBrowseModules}
      />
    );
  }
  if (phase === 'quiz') {
    return (
      <QuizScreen
        questions={questions}
        currentIdx={currentIdx}
        selectedIdx={selectedIdx}
        submitted={submitted}
        onPick={setSelectedIdx}
        onSubmit={submitAnswer}
        onNext={nextQuestion}
      />
    );
  }
  return (
    <ResultsScreen
      result={result!}
      progress={progress}
      answers={answers}
      onRetake={startQuiz}
      onBrowseModules={onBrowseModules}
    />
  );
};

// ─── Start screen ──────────────────────────────────────────────────────────

const StartScreen: React.FC<{
  progress: LearnerProgress;
  recentSessions: ReturnType<typeof listSessions>;
  onStart: () => void;
  onBrowseModules: () => void;
}> = ({ progress, recentSessions, onStart, onBrowseModules }) => {
  const cohortLabel = progress.highestUnlocked === 'Advanced' ? 'Advanced cohort'
    : progress.highestUnlocked === 'Intermediate' ? 'Intermediate cohort'
    : 'Novice cohort';

  const unlocked = unlockedTiersForDisplay(progress);

  return (
    <div className="min-h-full bg-brand-cream">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-200 rounded-full text-[11px] font-bold uppercase tracking-widest text-brand-olive mb-4">
            <Brain size={12} /> Knowledge check
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-stone-900 mb-3">
            Cross-module knowledge check
          </h1>
          <p className="text-[15px] text-stone-600 max-w-2xl leading-relaxed">
            A {QUESTION_COUNT}-question mixed assessment drawn from <em>The Ventilator Book</em>.
            Questions are picked to match the difficulty of the modules you've completed —
            beginners get foundational items; as you progress, harder questions unlock.
            Each attempt cycles in new questions so you can take it as often as you like.
          </p>
        </div>

        {/* Cohort + unlocked tiers */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-stone-500">
            <Sparkles size={14} className="text-brand-olive" />
            <span className="text-[10px] font-black uppercase tracking-widest">Your current cohort</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-stone-900 mb-1">{cohortLabel}</h2>
          <p className="text-[13px] text-stone-600 mb-4">
            {progress.totalCompleted === 0
              ? 'You haven\'t completed any modules yet — questions will draw from the Novice tier only.'
              : `Based on the ${progress.totalCompleted} module${progress.totalCompleted === 1 ? '' : 's'} you've completed.`}
          </p>

          <div className="grid grid-cols-3 gap-2">
            <TierCard
              tier="Novice"
              unlocked={unlocked.Novice}
              completed={progress.completedByTier.Novice}
              total={progress.totalByTier.Novice}
            />
            <TierCard
              tier="Intermediate"
              unlocked={unlocked.Intermediate}
              completed={progress.completedByTier.Intermediate}
              total={progress.totalByTier.Intermediate}
            />
            <TierCard
              tier="Advanced"
              unlocked={unlocked.Advanced}
              completed={progress.completedByTier.Advanced}
              total={progress.totalByTier.Advanced}
            />
          </div>

          <button
            onClick={onStart}
            className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-brand-olive hover:bg-brand-olive-hover text-white rounded-full text-[14px] font-bold transition shadow-sm"
          >
            Start the {QUESTION_COUNT}-question check <ChevronRight size={15} />
          </button>
        </div>

        {/* Recent attempts */}
        {recentSessions.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-stone-500">
              <History size={14} className="text-brand-olive" />
              <span className="text-[10px] font-black uppercase tracking-widest">Recent attempts</span>
            </div>
            <ul className="space-y-2">
              {recentSessions.map(s => (
                <li key={s.id} className="flex items-center gap-3 py-2 border-b border-stone-100 last:border-0">
                  <span className="font-display text-lg font-semibold text-stone-900 w-14">{s.percent}%</span>
                  <span className="text-[12px] text-stone-700 flex-1">
                    {s.mastery_title} · <span className="text-stone-500">{s.score}/{s.total} correct</span>
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {new Date(s.completed_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Module reminder */}
        {progress.totalCompleted < 19 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <BookOpen size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[13px] text-amber-900 leading-relaxed">
                Higher-tier questions unlock as you complete more modules.
                {progress.completedByTier.Intermediate === 0 && progress.totalByTier.Intermediate > 0 && ' Complete a Modes module to unlock Intermediate-tier questions.'}
                {progress.completedByTier.Advanced === 0 && progress.totalByTier.Advanced > 0 && ' Complete a Strategy/Weaning/Synthesis module to unlock Advanced-tier questions.'}
              </p>
              <button
                onClick={onBrowseModules}
                className="mt-2 text-[12px] font-bold text-amber-800 hover:text-amber-900 underline underline-offset-2"
              >
                Browse simulations →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TierCard: React.FC<{ tier: KCDifficulty; unlocked: boolean; completed: number; total: number }> = ({
  tier, unlocked, completed, total,
}) => {
  const cls = unlocked
    ? tier === 'Advanced'
      ? 'border-rose-300 bg-rose-50'
      : tier === 'Intermediate'
        ? 'border-blue-300 bg-blue-50'
        : 'border-emerald-300 bg-emerald-50'
    : 'border-stone-200 bg-stone-50 opacity-60';
  const text = unlocked
    ? tier === 'Advanced' ? 'text-rose-800'
      : tier === 'Intermediate' ? 'text-blue-800'
      : 'text-emerald-800'
    : 'text-stone-500';
  return (
    <div className={`border rounded-xl p-3 ${cls}`}>
      <div className={`text-[10px] font-black uppercase tracking-widest ${text} mb-0.5`}>{tier}</div>
      <div className={`text-[11px] ${text}`}>
        {unlocked ? 'Unlocked' : 'Locked'}
      </div>
      <div className="text-[11px] text-stone-600 mt-1">
        Modules: {completed}/{total}
      </div>
    </div>
  );
};

function unlockedTiersForDisplay(p: LearnerProgress): Record<KCDifficulty, boolean> {
  return {
    Novice: true,
    Intermediate: p.completedByTier.Novice >= 1 || p.completedByTier.Intermediate >= 1,
    Advanced: p.completedByTier.Intermediate >= 1 || p.completedByTier.Advanced >= 1,
  };
}

// ─── Quiz screen ──────────────────────────────────────────────────────────

const QuizScreen: React.FC<{
  questions: SelectedQuestion[];
  currentIdx: number;
  selectedIdx: number | null;
  submitted: boolean;
  onPick: (i: number) => void;
  onSubmit: () => void;
  onNext: () => void;
}> = ({ questions, currentIdx, selectedIdx, submitted, onPick, onSubmit, onNext }) => {
  const q = questions[currentIdx];
  const isCorrect = submitted && selectedIdx === q.shuffledCorrectIndex;

  return (
    <div className="min-h-full bg-brand-cream">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Progress header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
              Question {currentIdx + 1} of {questions.length}
            </span>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
              q.difficulty === 'Advanced' ? 'bg-rose-100 text-rose-800 border-rose-200'
              : q.difficulty === 'Intermediate' ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}>{q.difficulty}</span>
          </div>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded ${
                  i < currentIdx ? 'bg-brand-olive' : i === currentIdx ? 'bg-amber-500' : 'bg-stone-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-stone-900 leading-snug mb-5">
            {q.text}
          </h2>

          <div className="space-y-2 mb-5">
            {q.shuffledOptions.map((opt, i) => {
              const isSel = selectedIdx === i;
              const correct = i === q.shuffledCorrectIndex;
              const stateClass = !submitted
                ? isSel
                  ? 'bg-stone-50 border-brand-olive text-stone-900'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                : correct
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                  : isSel
                    ? 'bg-rose-50 border-rose-500 text-rose-900'
                    : 'bg-white border-stone-200 text-stone-500';
              return (
                <button
                  key={i}
                  onClick={() => !submitted && onPick(i)}
                  disabled={submitted}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-[14px] font-medium transition leading-snug flex items-start gap-2 ${stateClass}`}
                >
                  <span className="font-black text-xs pt-0.5">{String.fromCharCode(65 + i)}.</span>
                  <span className="flex-1">{opt}</span>
                  {submitted && correct && <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />}
                  {submitted && !correct && isSel && <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          {submitted && (
            <div className={`border rounded-lg p-4 mb-5 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <span className={`text-[11px] font-black uppercase tracking-widest mb-1.5 block ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
                {isCorrect ? 'Why this is right' : 'Why this is not it'}
              </span>
              <div className="text-[13px] text-stone-800 leading-relaxed">{q.rationale}</div>
              <div className="mt-2 pt-2 border-t border-stone-200/50 text-[11px] text-stone-500">
                {q.reference}
                {q.tags.length > 0 && (
                  <span className="ml-2">
                    {q.tags.map(t => (
                      <span key={t} className="inline-block bg-white border border-stone-200 text-stone-600 px-1.5 py-0.5 rounded text-[10px] mr-1">
                        #{t}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            {!submitted ? (
              <button
                onClick={onSubmit}
                disabled={selectedIdx === null}
                className="px-5 py-2.5 bg-brand-olive hover:bg-brand-olive-hover disabled:bg-stone-200 disabled:text-stone-400 text-white text-sm font-bold rounded-full transition"
              >
                Submit answer
              </button>
            ) : (
              <button
                onClick={onNext}
                className="px-5 py-2.5 bg-brand-olive hover:bg-brand-olive-hover text-white text-sm font-bold rounded-full transition flex items-center gap-1.5"
              >
                {currentIdx >= questions.length - 1 ? 'See your result' : 'Next question'}
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Results screen ──────────────────────────────────────────────────────

const ResultsScreen: React.FC<{
  result: MasteryResult;
  progress: LearnerProgress;
  answers: AnsweredQuestion[];
  onRetake: () => void;
  onBrowseModules: () => void;
}> = ({ result, progress, answers, onRetake, onBrowseModules }) => {
  const letterColor =
    result.percent >= 90 ? 'text-emerald-700'
    : result.percent >= 80 ? 'text-emerald-600'
    : result.percent >= 60 ? 'text-amber-600'
    : 'text-rose-600';

  return (
    <div className="min-h-full bg-brand-cream">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Headline result */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-stone-500">
            <Trophy size={16} className="text-brand-olive" />
            <span className="text-[10px] font-black uppercase tracking-widest">Knowledge check result</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-stone-900 leading-tight mb-1">
            {result.title}
          </h1>
          <p className="text-[14px] text-stone-600 leading-relaxed mb-5">{result.description}</p>

          <div className="flex items-baseline gap-3 mb-4">
            <span className={`font-display text-5xl font-semibold ${letterColor} leading-none`}>
              {result.percent}%
            </span>
            <span className="text-[14px] text-stone-500">
              {result.score} of {result.total} correct
            </span>
          </div>

          {/* Per-tier breakdown */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-stone-100">
            {(['Novice', 'Intermediate', 'Advanced'] as KCDifficulty[]).map(tier => {
              const tt = result.perTier[tier];
              if (tt.asked === 0) {
                return (
                  <div key={tier} className="border border-stone-200 rounded-lg p-3 bg-stone-50 opacity-60">
                    <div className="text-[10px] font-black uppercase tracking-widest text-stone-500">{tier}</div>
                    <div className="text-[11px] text-stone-500">Not asked this round</div>
                  </div>
                );
              }
              const pct = Math.round((tt.correct / tt.asked) * 100);
              return (
                <div key={tier} className="border border-stone-200 rounded-lg p-3 bg-white">
                  <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">{tier}</div>
                  <div className="font-display text-xl font-semibold text-stone-900 leading-none">
                    {tt.correct}/{tt.asked}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{pct}% correct</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Context: where you are in the curriculum */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-5 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
            Your curriculum context
          </div>
          <p className="text-[13px] text-stone-700 leading-relaxed">
            You've completed <strong className="text-stone-900">{progress.totalCompleted} of {progress.totalByTier.Novice + progress.totalByTier.Intermediate + progress.totalByTier.Advanced}</strong> modules
            ({progress.completedByTier.Novice} Novice · {progress.completedByTier.Intermediate} Intermediate · {progress.completedByTier.Advanced} Advanced).
            {' '}The mastery title above reflects both this curriculum progress and your performance on this attempt — a perfect score at the Novice tier is rated differently from one at the Advanced tier.
          </p>
        </div>

        {/* Missed questions */}
        {answers.some(a => !a.isCorrect) && (
          <details className="bg-white border border-stone-200 rounded-2xl p-5 mb-5 shadow-sm">
            <summary className="cursor-pointer text-[11px] font-black uppercase tracking-widest text-stone-500 hover:text-stone-700">
              Review missed questions ({answers.filter(a => !a.isCorrect).length})
            </summary>
            <ul className="mt-3 space-y-3">
              {answers.filter(a => !a.isCorrect).map((a, i) => (
                <li key={i} className="text-[13px] text-stone-700 leading-relaxed">
                  <div className="font-semibold text-stone-900 mb-0.5">{a.question.text}</div>
                  <div className="text-[12px] text-emerald-700 mb-0.5">
                    ✓ {a.question.shuffledOptions[a.question.shuffledCorrectIndex]}
                  </div>
                  <div className="text-[12px] text-stone-600">{a.question.rationale}</div>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            onClick={onRetake}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-brand-olive hover:bg-brand-olive-hover text-white rounded-full text-[13px] font-bold transition"
          >
            <RotateCcw size={14} /> Take another (new questions)
          </button>
          <button
            onClick={onBrowseModules}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-full text-[13px] font-bold transition"
          >
            <ArrowLeft size={14} /> Back to simulations
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCheckPage;
