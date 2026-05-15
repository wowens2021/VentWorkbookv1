// ─── Persistence Layer ─────────────────────────────────────────────────────
// localStorage-backed implementation of the §1.8 contract. The shell calls
// persistProgress(record) on every transition; we merge into the existing
// record for that learner/module.

import type { ProgressRecord } from '../shell/types';

const KEY_PREFIX = 'vp:progress:';
const LEARNER_KEY = 'vp:learner_id';

export function getLearnerId(): string {
  let id = '';
  try { id = localStorage.getItem(LEARNER_KEY) ?? ''; } catch {}
  if (!id) {
    id = `learner_${Math.random().toString(36).slice(2, 10)}`;
    try { localStorage.setItem(LEARNER_KEY, id); } catch {}
  }
  return id;
}

function key(learner_id: string, module_id: string) {
  return `${KEY_PREFIX}${learner_id}:${module_id}`;
}

export function loadProgress(module_id: string): ProgressRecord | null {
  const learner_id = getLearnerId();
  try {
    const raw = localStorage.getItem(key(learner_id, module_id));
    if (!raw) return null;
    return JSON.parse(raw) as ProgressRecord;
  } catch {
    return null;
  }
}

export function persistProgress(partial: Partial<ProgressRecord> & { module_id: string }): ProgressRecord {
  const learner_id = getLearnerId();
  const existing = loadProgress(partial.module_id) ?? {
    learner_id,
    module_id: partial.module_id,
    started_at: new Date().toISOString(),
    hint_tiers_triggered: 0,
  };
  const merged: ProgressRecord = { ...existing, ...partial, learner_id };
  // Fix 4 — deep-merge `phase_entries` so an incremental write of a
  // single counter doesn't wipe the rest. Shallow merge is correct for
  // every other field (each writer owns its key); phase_entries is the
  // exception because multiple writers contribute disjoint keys to the
  // same nested object.
  if (partial.phase_entries || existing.phase_entries) {
    merged.phase_entries = {
      ...(existing.phase_entries ?? {}),
      ...(partial.phase_entries ?? {}),
    };
  }
  try { localStorage.setItem(key(learner_id, partial.module_id), JSON.stringify(merged)); } catch {}
  return merged;
}

/**
 * Wipe a single module's progress (used by the "Restart module" button).
 * Also clears any replay snapshots referenced by the deleted record.
 */
export function clearProgress(module_id: string) {
  const learner_id = getLearnerId();
  try {
    const raw = localStorage.getItem(key(learner_id, module_id));
    if (raw) {
      const rec = JSON.parse(raw) as ProgressRecord;
      if (rec.replay_snapshot_ref) {
        try { localStorage.removeItem(`vp:snap:${rec.replay_snapshot_ref}`); } catch {}
      }
    }
    localStorage.removeItem(key(learner_id, module_id));
  } catch {}
}

export function listAllProgress(): ProgressRecord[] {
  const learner_id = getLearnerId();
  const records: ProgressRecord[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(`${KEY_PREFIX}${learner_id}:`)) continue;
      const raw = localStorage.getItem(k);
      if (raw) records.push(JSON.parse(raw));
    }
  } catch {}
  return records;
}
