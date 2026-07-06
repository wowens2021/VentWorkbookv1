// ─── Roster rollup sync ─────────────────────────────────────────────────────
// Keeps programs/{programId}/roster/{uid} — the denormalized per-student
// summary the admin dashboard reads — in step with the learner's progress.
// Like firestoreSync.ts, it registers as a listener on progress.ts and never
// makes progress.ts async. Recomputes the WHOLE summary (all modules) from
// the local cache on each change, debounced, so partial writes still produce
// a coherent rollup.

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { onProgressWrite, listAllProgress } from './progress';
import { buildRosterModuleData } from './progressSummary';

interface RosterContext {
  programId: string;
  uid: string;
  email: string;
  displayName: string;
  occupation?: string;
}

let ctx: RosterContext | null = null;

/** Set (or clear, on sign-out / no-program) the current learner's roster
 *  target. ProgramContext calls this once membership is known. */
export function setRosterContext(next: RosterContext | null) {
  ctx = next;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRosterWrite() {
  if (!ctx) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(writeRosterNow, 1500);
}

/** Recompute + push the rollup immediately. Exposed so a caller (e.g. right
 *  after joining) can seed the roster without waiting for the debounce. */
export async function writeRosterNow() {
  if (!ctx) return;
  const { programId, uid, email, displayName, occupation } = ctx;
  const data = buildRosterModuleData(listAllProgress());
  try {
    await setDoc(
      doc(db, 'programs', programId, 'roster', uid),
      {
        email,
        displayName,
        ...(occupation ? { occupation } : {}),
        updatedAt: serverTimestamp(),
        ...data,
      },
      { merge: true },
    );
  } catch (err) {
    // Not a member / rules / offline — best-effort, never blocks the learner.
    console.warn('[rosterSync] roster write failed:', err);
  }
}

// Every local progress write nudges a debounced roster recompute.
onProgressWrite(() => scheduleRosterWrite());
