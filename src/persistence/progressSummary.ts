// Shared progress→summary logic, mirroring the per-module status/percent
// derivation already used (locally) in ModulePicker and Landing, so the
// admin roster reads the SAME numbers the learner sees. Kept in one place
// here specifically because the roster is a second consumer of it.

import type { ProgressRecord } from '../shell/types';
import { PASSING_THRESHOLD } from '../shell/scoring';
import { MODULES } from '../modules';
import type { ModuleStatus, RosterModuleSummary } from '../programs/types';

export function statusOf(p: ProgressRecord | null): ModuleStatus {
  if (!p) return 'NOT_STARTED';
  if (p.quiz_submitted_at) {
    const score = p.total_score_percent ?? 0;
    return score >= PASSING_THRESHOLD ? 'COMPLETED' : 'NEEDS_RETAKE';
  }
  if (p.primer_completed_at || p.started_at) return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

/** Coarse 5–80% phase signal, then the real graded score once submitted. */
export function modulePercent(p: ProgressRecord | null): number {
  if (!p) return 0;
  if (p.quiz_submitted_at) return p.total_score_percent ?? 100;
  if (p.objective_satisfied_at) return 80;
  if (p.task_started_at) return 60;
  if (p.exploration_started_at) return 40;
  if (p.reading_completed_at) return 30;
  if (p.primer_completed_at) return 20;
  return 5;
}

function moduleSummary(p: ProgressRecord | null): RosterModuleSummary {
  const primerScore = p?.primer_score;
  const quizScore = p?.quiz_score;
  return {
    status: statusOf(p),
    percent: p ? modulePercent(p) : 0,
    score: p?.total_score_percent,
    letter: p?.total_score_letter,
    primerScore: typeof primerScore === 'number' ? primerScore : undefined,
    quizScore: typeof quizScore === 'number' ? quizScore : undefined,
    hintsUsed: p?.hint_tiers_triggered,
  };
}

/**
 * Build the roster rollup (per-module summaries + aggregates) from every
 * progress record for one learner. `records` is that learner's full set of
 * ProgressRecords (from listAllProgress()).
 */
export function buildRosterModuleData(records: ProgressRecord[]): {
  perModule: Record<string, RosterModuleSummary>;
  modulesCompleted: number;
  modulesInProgress: number;
  overallPercent: number;
} {
  const byModule = new Map(records.map(r => [r.module_id, r]));
  const perModule: Record<string, RosterModuleSummary> = {};
  let completed = 0;
  let inProgress = 0;
  let percentSum = 0;

  for (const mod of MODULES) {
    const rec = byModule.get(mod.id) ?? null;
    const summary = moduleSummary(rec);
    // Only store modules the learner has actually touched — keeps the
    // roster doc small and the strengths/weaknesses view uncluttered.
    if (summary.status !== 'NOT_STARTED') perModule[mod.id] = summary;
    if (summary.status === 'COMPLETED') completed++;
    else if (summary.status === 'IN_PROGRESS' || summary.status === 'NEEDS_RETAKE') inProgress++;
    percentSum += summary.percent;
  }

  return {
    perModule,
    modulesCompleted: completed,
    modulesInProgress: inProgress,
    overallPercent: MODULES.length ? Math.round(percentSum / MODULES.length) : 0,
  };
}
