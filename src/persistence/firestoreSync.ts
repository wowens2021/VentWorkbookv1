// ─── Firestore progress sync ───────────────────────────────────────────────
// Bridges the synchronous localStorage-backed persistence API (progress.ts)
// to Firestore, WITHOUT changing that API's shape or making any of its
// callers async. Two directions:
//
//   local write  -> best-effort, fire-and-forget push to Firestore
//   (on login)   -> one-time pull from Firestore into the local cache
//
// This file registers itself as a listener on progress.ts via
// onProgressWrite/onProgressClear at import time; progress.ts has no idea
// Firestore exists. Firestore document path: users/{uid}/progress/{module_id}.

import {
  collection, doc, getDocs, setDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { ProgressRecord } from '../shell/types';
import { onProgressWrite, onProgressClear, loadProgress, persistProgress } from './progress';

function progressDocRef(uid: string, module_id: string) {
  return doc(db, 'users', uid, 'progress', module_id);
}

function pushToFirestore(uid: string, module_id: string, record: ProgressRecord) {
  // Fire-and-forget. Offline / rules-rejected (e.g. a stray write under the
  // anonymous pre-login id) writes fail silently — localStorage already has
  // the authoritative copy for this browser, so nothing is lost; the next
  // successful write (or the next login's reconciliation pass) catches up.
  setDoc(progressDocRef(uid, module_id), record, { merge: true }).catch(() => {});
}

function deleteFromFirestore(uid: string, module_id: string) {
  deleteDoc(progressDocRef(uid, module_id)).catch(() => {});
}

// Activate the bridge — every local write/clear now also targets Firestore.
onProgressWrite((uid, module_id, record) => pushToFirestore(uid, module_id, record));
onProgressClear((uid, module_id) => deleteFromFirestore(uid, module_id));

/**
 * Rough "most recently active" timestamp for a progress record, used only
 * to decide which side wins during login-time reconciliation. Takes the
 * max of every timestamp-shaped field already on the record — no schema
 * change needed just to support sync.
 */
function latestActivityMs(rec: ProgressRecord | null): number {
  if (!rec) return 0;
  const stamps = [
    rec.started_at, rec.briefing_acknowledged_at, rec.primer_completed_at,
    rec.reading_completed_at, rec.exploration_started_at, rec.task_started_at,
    rec.objective_satisfied_at, rec.quiz_submitted_at,
  ];
  let max = 0;
  for (const s of stamps) {
    if (!s) continue;
    const ms = Date.parse(s);
    if (!Number.isNaN(ms) && ms > max) max = ms;
  }
  return max;
}

/**
 * One-time pull-down, called right after sign-in (see App.tsx). For each
 * module the account has cloud progress for, keep whichever side (local
 * cache vs. cloud) has the more recent activity timestamp, and reconcile
 * the other side to match — so a stale copy on either end doesn't linger.
 *
 * Deliberately synchronous-feeling from the caller's perspective (an
 * awaited async function called once before the app's first render) rather
 * than a live/reactive subscription — every existing read in the app
 * assumes localStorage is already populated by the time it runs, exactly
 * as it was before Firebase existed.
 *
 * Hard-capped at PULL_TIMEOUT_MS: misconfigured security rules or a flaky
 * network can make the underlying request hang/retry far longer than a
 * clean rejection would, and this function gates the app's first render
 * (see App.tsx's AuthGate) — it must never block the learner out of their
 * own already-downloaded local progress indefinitely.
 */
const PULL_TIMEOUT_MS = 6000;

export async function syncProgressFromCloud(uid: string): Promise<void> {
  try {
    const snap = await Promise.race([
      getDocs(collection(db, 'users', uid, 'progress')),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore pull-down timed out')), PULL_TIMEOUT_MS),
      ),
    ]);
    snap.forEach(docSnap => {
      const module_id = docSnap.id;
      const cloudRecord = docSnap.data() as ProgressRecord;
      const localRecord = loadProgress(module_id);
      if (latestActivityMs(cloudRecord) >= latestActivityMs(localRecord)) {
        // Cloud is at least as fresh — adopt it locally.
        persistProgress({ ...cloudRecord, module_id }, { skipCloudSync: true });
      } else if (localRecord) {
        // This device has newer progress than the cloud (e.g. an earlier
        // offline session) — push it up so the cloud copy catches up too.
        pushToFirestore(uid, module_id, localRecord);
      }
    });
  } catch (err) {
    // Offline / permissions / timeout — fall back to whatever is already
    // in localStorage for this browser rather than blocking the app. Most
    // likely cause in practice: Firestore security rules haven't been
    // deployed yet (see the rules block shipped alongside this file).
    console.warn('[firestoreSync] progress pull-down failed, using local cache:', err);
  }
}
