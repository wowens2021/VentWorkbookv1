/**
 * Persisted history of Knowledge-Check attempts. Each session captures the
 * full set of asked questions, the chosen answers, the resulting mastery
 * title and percent. Stored in localStorage so the admin dashboard (when
 * built) can read straight from `listSessions()`.
 */

import type { KCDifficulty } from './questions';

export interface KCSession {
  /** Stable session id (timestamp-based). */
  id: string;
  /** ISO timestamp the session was completed. */
  completed_at: string;
  /** Final score (0..total). */
  score: number;
  /** Number of questions asked. */
  total: number;
  /** Percent (0..100). */
  percent: number;
  /** Mastery title shown to the learner. */
  mastery_title: string;
  /** Cohort the learner was in at the time of the attempt. */
  cohort: KCDifficulty;
  /** Per-question record for analytics. */
  answers: {
    question_id: number;
    difficulty: KCDifficulty;
    tags: string[];
    selected_label: string | null;
    is_correct: boolean;
  }[];
  /** Modules completed at the time of the session — useful for context. */
  modules_completed_at_attempt: number;
}

const KEY = 'vp:kc:sessions';

export function listSessions(): KCSession[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as KCSession[]) : [];
  } catch { return []; }
}

export function saveSession(s: KCSession) {
  const all = listSessions();
  all.push(s);
  try { localStorage.setItem(KEY, JSON.stringify(all.slice(-50))); } catch {}
}

export function clearSessions() {
  try { localStorage.removeItem(KEY); } catch {}
}
