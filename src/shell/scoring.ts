/**
 * Pure score-math, extracted from ModuleShell.tsx per MASTER_SHELL_v3 §9.
 *
 * Keeping this in its own module makes the formula trivially unit-testable
 * and prevents drift between debrief renders (anti-pattern A10): every part
 * of the UI that needs a score reads from the persisted total or calls
 * `computeTotalScore` here, never recomputes inline with subtly different
 * inputs.
 *
 * Carved-in-stone formula (MASTER_SHELL_v3 §1.5):
 *
 *   total = primer_pts + quiz_pts + hint_bonus + reset_bonus + cy_bonus
 *         = (primer_correct / 3) * 30        // 30 pts
 *         + (quiz_correct / 5) * 50          // 50 pts
 *         + {0 hints: 10, 1 tier: 5, 2+: 0}  // up to 10
 *         + {0 resets: 10, 1: 5, 2+: 0}      // up to 10
 *         + (cy_correct / cy_total) * 5      // up to 5  (proportional, floored)
 *
 *   Raw can reach 105; displayed percent is capped at 100. The 5-pt cushion
 *   lets a strong learner absorb a small hint/reset penalty without losing
 *   their A.
 *
 *   Letter: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F < 60.
 */

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface ScoreInput {
  primer_score?: number;
  primer_total?: number;
  quiz_score?: number;
  quiz_total?: number;
  hint_tiers_triggered?: number;
  reset_to_start_clicks?: number;
  check_yourself_correct?: number;
  check_yourself_total?: number;
}

export interface ScoreBreakdown {
  primerPts: number;
  quizPts: number;
  hintBonus: number;
  resetBonus: number;
  checkYourselfBonus: number;
}

export interface ScoreResult {
  percent: number;
  letter: LetterGrade;
  breakdown: ScoreBreakdown;
}

export function computeTotalScore(rec: ScoreInput): ScoreResult {
  const primerPts =
    rec.primer_total && rec.primer_score !== undefined
      ? Math.round((rec.primer_score / rec.primer_total) * 30)
      : 0;
  const quizPts =
    rec.quiz_total && rec.quiz_score !== undefined
      ? Math.round((rec.quiz_score / rec.quiz_total) * 50)
      : 0;
  const hintBonus =
    (rec.hint_tiers_triggered ?? 0) === 0
      ? 10
      : (rec.hint_tiers_triggered ?? 0) === 1
        ? 5
        : 0;
  const resetBonus =
    (rec.reset_to_start_clicks ?? 0) === 0
      ? 10
      : (rec.reset_to_start_clicks ?? 0) === 1
        ? 5
        : 0;
  const checkYourselfBonus =
    rec.check_yourself_total && rec.check_yourself_total > 0
      ? Math.floor(((rec.check_yourself_correct ?? 0) / rec.check_yourself_total) * 5)
      : 0;
  const raw = primerPts + quizPts + hintBonus + resetBonus + checkYourselfBonus;
  const percent = Math.max(0, Math.min(100, raw));
  const letter: LetterGrade =
    percent >= 90 ? 'A' : percent >= 80 ? 'B' : percent >= 70 ? 'C' : percent >= 60 ? 'D' : 'F';
  return { percent, letter, breakdown: { primerPts, quizPts, hintBonus, resetBonus, checkYourselfBonus } };
}
