// ─── Persistence Layer ─────────────────────────────────────────────────────
// localStorage-backed implementation of the §1.8 contract. The shell calls
// persistProgress(record) on every transition; we merge into the existing
// record for that learner/module. Every read/write in this file stays
// SYNCHRONOUS — dozens of call sites across ModuleShell, usePhaseFlow,
// ModulePicker, Landing, etc. read progress inline on render, and rewriting
// all of those to be async would be a large, risky change.
//
// Firestore sync (src/persistence/firestoreSync.ts) plugs into this file
// from the outside via onProgressWrite/onProgressClear listeners rather
// than being imported here directly, so this module has zero Firebase
// dependency and keeps working exactly as before if Firestore is ever
// unreachable (offline, etc.) — writes still land in localStorage first.

import type { ProgressRecord } from '../shell/types';

const KEY_PREFIX = 'vp:progress:';
const LEARNER_KEY = 'vp:learner_id';

// Once a Firebase user is signed in, `setActiveUserId` points every
// progress read/write at their uid instead of the anonymous per-browser id.
// This is what makes progress "belong" to the account rather than the
// device. `null` (signed out) falls back to the old anonymous behavior,
// which only matters transiently before the auth-gated login screen takes
// over the whole app.
let activeUserId: string | null = null;
export function setActiveUserId(uid: string | null) {
  activeUserId = uid;
}

function anonymousLearnerId(): string {
  let id = '';
  try { id = localStorage.getItem(LEARNER_KEY) ?? ''; } catch {}
  if (!id) {
    id = `learner_${Math.random().toString(36).slice(2, 10)}`;
    try { localStorage.setItem(LEARNER_KEY, id); } catch {}
  }
  return id;
}

export function getLearnerId(): string {
  return activeUserId ?? anonymousLearnerId();
}

// ── Cloud-sync hooks ──
// firestoreSync.ts registers listeners here at import time; this file never
// imports Firestore itself. `skipCloudSync` lets the sync layer write
// server-pulled records into the local cache without immediately
// re-queuing them as an outbound write.
type WriteListener = (learner_id: string, module_id: string, record: ProgressRecord) => void;
type ClearListener = (learner_id: string, module_id: string) => void;
const writeListeners: WriteListener[] = [];
const clearListeners: ClearListener[] = [];
export function onProgressWrite(fn: WriteListener) {
  writeListeners.push(fn);
}
export function onProgressClear(fn: ClearListener) {
  clearListeners.push(fn);
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

export function persistProgress(
  partial: Partial<ProgressRecord> & { module_id: string },
  opts?: { skipCloudSync?: boolean },
): ProgressRecord {
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
  // Cloud sync — skipped when the sync layer itself is writing a record it
  // just pulled DOWN from Firestore, so we don't immediately queue it back
  // up as an outbound write.
  if (!opts?.skipCloudSync) {
    for (const fn of writeListeners) {
      try { fn(learner_id, partial.module_id, merged); } catch {}
    }
  }
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
  for (const fn of clearListeners) {
    try { fn(learner_id, module_id); } catch {}
  }
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
