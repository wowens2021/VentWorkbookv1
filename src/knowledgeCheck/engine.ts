/**
 * Knowledge-Check selection engine + mastery evaluator.
 *
 * Selection logic
 * ───────────────
 *  - Determine the learner's "cohort" from which difficulty tier of MODULES
 *    they've completed.
 *  - Build an unlocked question pool: Novice is always in; Intermediate unlocks
 *    once ≥ 1 INTERMEDIATE-tier module is completed; Advanced unlocks once ≥ 1
 *    ADVANCED-tier module is completed.
 *  - Within the unlocked pool, weight selection toward the learner's current
 *    cohort (more questions at their level, fewer easier review questions).
 *  - Avoid recently-seen question ids (rolling window of the last N session
 *    attempts) until the pool has been fully cycled.
 *  - Shuffle both the question order and the option order each time.
 *
 * Mastery title
 * ─────────────
 * A 2-axis matrix of (cohort × score%) — keeps a strong Novice from being
 * mis-labeled as an "Expert," and a struggling Advanced learner from being
 * mis-labeled as a "Beginner." See §masteryTitle().
 */

import { KC_QUESTIONS, KC_BY_DIFFICULTY, type KCQuestion, type KCDifficulty } from './questions';
import { MODULES } from '../modules';
import { loadProgress } from '../persistence/progress';
import type { Track } from '../shell/types';

/* Module track → cohort tier (matches what ModulePicker uses). */
const trackTier: Record<Track, KCDifficulty> = {
  Foundations: 'Novice',
  Physiology: 'Novice',
  Modes: 'Intermediate',
  Strategy: 'Advanced',
  Weaning: 'Advanced',
  Synthesis: 'Advanced',
};

export interface LearnerProgress {
  /** Completed modules per tier — quiz_submitted_at is set. */
  completedByTier: Record<KCDifficulty, number>;
  /** Total count per tier (denominator for "of how many"). */
  totalByTier: Record<KCDifficulty, number>;
  /** Highest tier the learner has finished at least one module in. */
  highestUnlocked: KCDifficulty;
  /** Total modules completed (any tier). */
  totalCompleted: number;
}

/** Pull learner module-completion stats from localStorage. */
export function readLearnerProgress(): LearnerProgress {
  const completed: Record<KCDifficulty, number> = { Novice: 0, Intermediate: 0, Advanced: 0 };
  const total: Record<KCDifficulty, number> = { Novice: 0, Intermediate: 0, Advanced: 0 };
  MODULES.forEach(mod => {
    const tier = trackTier[mod.track];
    total[tier] += 1;
    const p = loadProgress(mod.id);
    if (p?.quiz_submitted_at) completed[tier] += 1;
  });
  const highest: KCDifficulty =
    completed.Advanced > 0 ? 'Advanced'
    : completed.Intermediate > 0 ? 'Intermediate'
    : 'Novice';
  return {
    completedByTier: completed,
    totalByTier: total,
    highestUnlocked: highest,
    totalCompleted: completed.Novice + completed.Intermediate + completed.Advanced,
  };
}

// ─── Question selection ─────────────────────────────────────────────────────

const SEEN_KEY = 'vp:kc:seen';
/** Keep N most-recent question ids out of the next round until the pool cycles. */
const RECENT_WINDOW = 18;

function readSeen(): number[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function writeSeen(ids: number[]) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-RECENT_WINDOW))); } catch {}
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Tier-unlock thresholds — exported so the start-screen banner can render
 * concrete counts ("Complete 2 more Foundations/Physiology modules to
 * unlock Intermediate"). Edit here, not in the banner copy.
 */
export const TIER_UNLOCK = {
  intermediateFromNovice: 3,
  advancedFromIntermediate: 2,
} as const;

/**
 * Build the pool of allowed difficulty tiers given progress.
 *
 * Tier thresholds were tightened (Fix 1) so a single 12-minute Novice module
 * no longer unlocks ARMA-level Intermediate questions. Mastery has to
 * accumulate before a new tier opens. A single completed module in the new
 * tier itself ALSO unlocks it — so a learner who skipped ahead and finished
 * one Intermediate module still gets that tier's questions.
 */
function unlockedTiers(progress: LearnerProgress): KCDifficulty[] {
  // Novice is always available so brand-new learners have something to do.
  const tiers: KCDifficulty[] = ['Novice'];
  if (progress.completedByTier.Novice >= 3 || progress.completedByTier.Intermediate >= 1) {
    tiers.push('Intermediate');
  }
  if (progress.completedByTier.Intermediate >= 2 || progress.completedByTier.Advanced >= 1) {
    tiers.push('Advanced');
  }
  return tiers;
}

/**
 * Mixing weights — how many questions to draw from each tier, weighted by
 * cohort. Returns a {tier: count} map summing to `totalCount`.
 */
function difficultyMix(
  cohort: KCDifficulty,
  unlocked: KCDifficulty[],
  totalCount: number,
): Record<KCDifficulty, number> {
  // Base ratios per cohort. Sums to 100. Filtered to unlocked tiers below.
  const ratios: Record<KCDifficulty, Record<KCDifficulty, number>> = {
    Novice:       { Novice: 80, Intermediate: 20, Advanced: 0 },
    Intermediate: { Novice: 30, Intermediate: 50, Advanced: 20 },
    Advanced:     { Novice: 15, Intermediate: 35, Advanced: 50 },
  };
  const r = ratios[cohort];
  // Zero out locked tiers and renormalize.
  const filtered: Record<KCDifficulty, number> = { Novice: 0, Intermediate: 0, Advanced: 0 };
  let sum = 0;
  (['Novice', 'Intermediate', 'Advanced'] as KCDifficulty[]).forEach(t => {
    if (unlocked.includes(t)) {
      filtered[t] = r[t];
      sum += r[t];
    }
  });
  if (sum === 0) filtered.Novice = 100;
  else {
    (['Novice', 'Intermediate', 'Advanced'] as KCDifficulty[]).forEach(t => {
      filtered[t] = Math.round((filtered[t] / sum) * 100);
    });
  }
  // Convert percentages → counts.
  const counts: Record<KCDifficulty, number> = { Novice: 0, Intermediate: 0, Advanced: 0 };
  let assigned = 0;
  (['Novice', 'Intermediate', 'Advanced'] as KCDifficulty[]).forEach(t => {
    counts[t] = Math.round((filtered[t] / 100) * totalCount);
    assigned += counts[t];
  });
  // Pad any rounding leftover into the cohort tier.
  while (assigned < totalCount) {
    counts[cohort] += 1; assigned += 1;
  }
  while (assigned > totalCount) {
    // Trim from the smallest non-cohort tier first.
    const order: KCDifficulty[] = ['Novice', 'Intermediate', 'Advanced'].filter(t => t !== cohort) as KCDifficulty[];
    const t = order.find(tt => counts[tt] > 0) ?? cohort;
    counts[t] -= 1; assigned -= 1;
  }
  return counts;
}

export interface SelectedQuestion extends KCQuestion {
  /** Shuffled option order used for this attempt. */
  shuffledOptions: string[];
  /** Index of the correct option after shuffle. */
  shuffledCorrectIndex: number;
}

/**
 * Pick a quiz set for the learner. Default 10 questions.
 * Returns `[]` only if the bank is empty.
 */
export function selectQuestions(progress: LearnerProgress, totalCount = 10): SelectedQuestion[] {
  const cohort = progress.highestUnlocked;
  const unlocked = unlockedTiers(progress);
  const mix = difficultyMix(cohort, unlocked, totalCount);

  const seen = new Set(readSeen());

  // Per-tier candidate pools — prefer not-recently-seen, fall back to all.
  function poolFor(tier: KCDifficulty, n: number): KCQuestion[] {
    const all = KC_BY_DIFFICULTY[tier];
    const fresh = all.filter(q => !seen.has(q.id));
    const ordered = [...shuffle(fresh), ...shuffle(all.filter(q => seen.has(q.id)))];
    return ordered.slice(0, n);
  }

  const picked: KCQuestion[] = [];
  (['Novice', 'Intermediate', 'Advanced'] as KCDifficulty[]).forEach(t => {
    if (mix[t] > 0) picked.push(...poolFor(t, mix[t]));
  });

  // Final order is a global shuffle (don't show all the Novice ones first).
  const finalOrder = shuffle(picked);

  // Update the seen-window.
  writeSeen([...readSeen(), ...finalOrder.map(q => q.id)]);

  // Shuffle option order per question.
  return finalOrder.map(q => {
    const indices = shuffle(q.options.map((_, i) => i));
    const shuffledOptions = indices.map(i => q.options[i]);
    const shuffledCorrectIndex = indices.indexOf(q.correctAnswer);
    return { ...q, shuffledOptions, shuffledCorrectIndex };
  });
}

// ─── Mastery title — cohort × performance matrix ────────────────────────────

export interface MasteryResult {
  /** Total points scored (correct answers). */
  score: number;
  /** Max possible. */
  total: number;
  /** Percent (0–100). */
  percent: number;
  /** Mastery title — what to show the learner. */
  title: string;
  /** One-line description of what the title means. */
  description: string;
  /** Cohort the learner is currently in. */
  cohort: KCDifficulty;
  /** Per-difficulty breakdown of correctness in this attempt. */
  perTier: Record<KCDifficulty, { asked: number; correct: number }>;
}

export interface AnsweredQuestion {
  question: SelectedQuestion;
  selectedIndex: number | null;
  isCorrect: boolean;
}

/** Evaluate a completed attempt and return the mastery picture. */
export function evaluateMastery(
  answers: AnsweredQuestion[],
  progress: LearnerProgress,
): MasteryResult {
  const total = answers.length;
  const score = answers.reduce((s, a) => s + (a.isCorrect ? 1 : 0), 0);
  const percent = total === 0 ? 0 : Math.round((score / total) * 100);

  const perTier: Record<KCDifficulty, { asked: number; correct: number }> = {
    Novice: { asked: 0, correct: 0 },
    Intermediate: { asked: 0, correct: 0 },
    Advanced: { asked: 0, correct: 0 },
  };
  answers.forEach(a => {
    const tier = a.question.difficulty;
    perTier[tier].asked += 1;
    if (a.isCorrect) perTier[tier].correct += 1;
  });

  const { title, description } = masteryTitle(progress, percent, perTier);

  return {
    score, total, percent, title, description,
    cohort: progress.highestUnlocked, perTier,
  };
}

/**
 * Two-axis title matrix.
 *
 * Vertical axis — what curriculum tier the learner has reached:
 *   - "novice"        : no modules completed yet (or only Novice attempted)
 *   - "beginner"      : has completed ≥ 1 Novice-track module
 *   - "intermediate"  : has completed ≥ 1 Intermediate-track module
 *   - "advanced"      : has completed ≥ 1 Advanced-track module
 *   - "full"          : has completed all 19 modules
 *
 * Horizontal axis — performance on the attempt (percent correct):
 *   - "low"     : < 60
 *   - "mid"     : 60-79
 *   - "high"    : 80-100
 *   - "perfect" : 100 with ≥ 3 Advanced questions answered correctly
 */
function masteryTitle(
  progress: LearnerProgress,
  percent: number,
  perTier: Record<KCDifficulty, { asked: number; correct: number }>,
): { title: string; description: string } {
  const totalMods = progress.totalByTier.Novice + progress.totalByTier.Intermediate + progress.totalByTier.Advanced;
  const allDone = progress.totalCompleted >= totalMods && totalMods > 0;

  let curriculum: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'full';
  if (allDone) curriculum = 'full';
  else if (progress.completedByTier.Advanced > 0) curriculum = 'advanced';
  else if (progress.completedByTier.Intermediate > 0) curriculum = 'intermediate';
  else if (progress.completedByTier.Novice > 0) curriculum = 'beginner';
  else curriculum = 'novice';

  const acedAdvanced = perTier.Advanced.asked >= 3 && perTier.Advanced.correct === perTier.Advanced.asked;
  const performance: 'low' | 'mid' | 'high' | 'perfect' =
    percent === 100 && acedAdvanced ? 'perfect'
    : percent >= 80 ? 'high'
    : percent >= 60 ? 'mid'
    : 'low';

  // Matrix lookup. Each cell is { title, description }.
  const matrix: Record<typeof curriculum, Record<typeof performance, { title: string; description: string }>> = {
    novice: {
      low:     { title: 'Exploring',               description: 'You\'re just getting started — work through the Foundations modules and try again.' },
      mid:     { title: 'Novice',                  description: 'Solid grasp of intro concepts. Keep moving through Foundations to broaden the base.' },
      high:    { title: 'Novice — Sharp Eye',       description: 'Strong on the basics for a brand-new learner. The modules will deepen this rapidly.' },
      perfect: { title: 'Novice — Sharp Eye',       description: 'Perfect on what you\'ve been asked — but you\'re still at the start of the curriculum.' },
    },
    beginner: {
      low:     { title: 'Beginner — Building',     description: 'You\'ve started the Foundations modules. The fundamentals are still settling in — review and try again.' },
      mid:     { title: 'Progressing Beginner',    description: 'Comfortable with foundational concepts. Move into the Modes track to advance.' },
      high:    { title: 'Beginner — Strong Foundation', description: 'You own the basics. Next: the Modes track (VC, PC, PRVC, PSV, SIMV).' },
      perfect: { title: 'Beginner — Strong Foundation', description: 'Perfect on what you\'ve been asked — but you haven\'t opened the harder modules yet. That changes the rating.' },
    },
    intermediate: {
      low:     { title: 'Progressing Beginner',    description: 'You\'ve opened intermediate content but the score suggests reviewing foundations first.' },
      mid:     { title: 'Progressing Intermediate', description: 'You\'re working through modes and partial-support concepts. Keep going.' },
      high:    { title: 'Intermediate — Capable',  description: 'You\'re fluent in the modes and basic strategy. The Strategy/Weaning tracks are next.' },
      perfect: { title: 'Intermediate — Capable',  description: 'Perfect on this attempt — but the highest-difficulty content is still ahead.' },
    },
    advanced: {
      low:     { title: 'Progressing Intermediate', description: 'You\'ve opened advanced content but the score suggests reinforcing the intermediate layer.' },
      mid:     { title: 'Progressing Advanced',    description: 'You\'re reasoning through advanced cases. Polish the trickier areas and revisit.' },
      high:    { title: 'Advanced — Near Mastery', description: 'Strong handling of ARDS, obstruction, weaning, and troubleshooting. One layer below full mastery.' },
      perfect: { title: 'Advanced — Near Mastery', description: 'Perfect on this attempt. Finish the full curriculum to reach Expert.' },
    },
    full: {
      low:     { title: 'Progressing Advanced',    description: 'You\'ve completed every module but this attempt fell off. Worth revisiting the modules you scored hint-heavy on.' },
      mid:     { title: 'Progressing Expert',      description: 'You\'ve completed the curriculum. Most concepts are secure — keep cycling the bank to firm up the weaker ones.' },
      high:    { title: 'Expert',                  description: 'Curriculum complete and strong cross-module command. This is where you should be.' },
      perfect: { title: 'Expert — Full Mastery',   description: 'Curriculum complete and a flawless attempt including the hardest items. Top of the rubric.' },
    },
  };

  return matrix[curriculum][performance];
}
