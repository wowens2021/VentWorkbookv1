import {
  doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  runTransaction, serverTimestamp, arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Program, ProgramStatus, UserProfile, RosterEntry } from './types';

// Unambiguous alphabet — no 0/O/1/I/L — for human-typable enrollment codes.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode(len = 8): string {
  let out = '';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[arr[i] % CODE_ALPHABET.length];
  return out;
}

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function programRef(id: string) { return doc(db, 'programs', id); }
function codeRef(code: string) { return doc(db, 'enrollmentCodes', code); }
function userRef(uid: string) { return doc(db, 'users', uid); }
function rosterRef(programId: string, uid: string) { return doc(db, 'programs', programId, 'roster', uid); }

/** Reserve a code that isn't already taken (best-effort; the create/rotate
 *  writes are transactional so a rare collision just fails and retries). */
async function reserveUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    const existing = await getDoc(codeRef(code));
    if (!existing.exists()) return code;
  }
  throw new Error('Could not generate a unique enrollment code — please try again.');
}

// ── Reads ──

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userRef(uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<UserProfile, 'uid'>) };
}

export async function loadProgram(programId: string): Promise<Program | null> {
  const snap = await getDoc(programRef(programId));
  if (!snap.exists()) return null;
  return { id: programId, ...(snap.data() as Omit<Program, 'id'>) };
}

/** Whether the program currently grants access, and if not, why.
 *
 *  Access is gated by ONE authoritative lever — `status` — which is exactly
 *  what the Stripe billing webhook will flip: a successful payment sets
 *  'active', a cancellation/kill sets 'suspended'. `expiresAt` is an OPTIONAL
 *  secondary hard cutoff (a fixed contract end-date); when set and passed it
 *  forces 'expired' even if status is still 'active'. A subscription with no
 *  fixed end simply leaves `expiresAt` null and stays active until suspended.
 *  Checking status (not two fields) avoids the old footgun where a program
 *  had a term but the wrong status and silently stayed blocked.
 *
 *  States:
 *    - 'suspended': status === 'suspended' (kill-switch / cancelled),
 *    - 'expired'  : expiresAt set and in the past (contract lapsed),
 *    - 'active'   : status === 'active' (paid / provisioned),
 *    - 'pending'  : status === 'pending' (awaiting payment — Stripe path). */
export type AccessState = 'active' | 'pending' | 'expired' | 'suspended';

export function programAccessState(program: Program): AccessState {
  if (program.status === 'suspended') return 'suspended';
  if (program.expiresAt && program.expiresAt.toMillis() < Date.now()) return 'expired';
  if (program.status === 'active') return 'active';
  return 'pending';
}

export function isAccessBlocked(program: Program): boolean {
  return programAccessState(program) !== 'active';
}

export async function listRoster(programId: string): Promise<RosterEntry[]> {
  const snap = await getDocs(collection(db, 'programs', programId, 'roster'));
  return snap.docs.map(d => ({ uid: d.id, ...(d.data() as Omit<RosterEntry, 'uid'>) }));
}

// ── Admin: create a program ──

export async function createProgram(
  admin: { uid: string; email: string; displayName: string },
  opts: { name: string; seatLimit: number },
): Promise<Program> {
  const code = await reserveUniqueCode();
  const ref = doc(collection(db, 'programs'));

  // Created 'active' — the admin lands on a live, ready-to-use console with a
  // working enrollment key, because in the real flow Stripe is the gate that
  // sits IN FRONT of program creation: by the time you're here, payment has
  // been collected. Stripe is not wired yet, so creation grants access
  // PROVISIONALLY as a stand-in for "already paid".
  //
  // TODO(stripe): when billing lands, program provisioning moves behind the
  // Stripe checkout/webhook — create as 'pending' here and let the paid-event
  // webhook flip it to 'active' (and set expiresAt to the paid term). The
  // Firestore create rule must be tightened at the same time (see
  // firestore.rules) so a bare signup can't self-provision a free active
  // program. `expiresAt` stays null = no fixed end-date (subscription model);
  // a fixed-term sale sets it to the contract end.
  //
  // Seats count students only; the admin is staff, not a seat.
  //
  // Writes are SEQUENTIAL, not one transaction, and program-first on purpose:
  // the enrollmentCodes create rule verifies the requester admins the program
  // (isProgramAdmin), which reads the program doc — so the program must be
  // committed before the code write, or the rule get() finds nothing and
  // denies it. (A rare partial failure just leaves a program without its code
  // lookup; rotating the key from the console/admin repairs it.)
  await setDoc(ref, {
    name: opts.name.trim(),
    enrollmentCode: code,
    seatLimit: opts.seatLimit,
    seatsUsed: 0,
    adminUids: [admin.uid],
    status: 'active' satisfies ProgramStatus,
    expiresAt: null,
    createdAt: serverTimestamp(),
    createdBy: admin.uid,
  });
  await setDoc(codeRef(code), { programId: ref.id });
  await setDoc(userRef(admin.uid), {
    email: admin.email,
    displayName: admin.displayName,
    role: 'admin',
    programId: ref.id,
  });

  const created = await loadProgram(ref.id);
  if (!created) throw new Error('Program creation failed.');
  return created;
}

// ── Student: join by code ──

export class JoinError extends Error {}

export async function joinByCode(
  code: string,
  learner: { uid: string; email: string; displayName: string },
): Promise<Program> {
  const normalized = normalizeCode(code);
  if (!normalized) throw new JoinError('Enter your enrollment key.');

  const codeSnap = await getDoc(codeRef(normalized));
  if (!codeSnap.exists()) throw new JoinError('That enrollment key isn\'t valid. Check with your program administrator.');
  const programId = (codeSnap.data() as { programId: string }).programId;

  await runTransaction(db, async (tx) => {
    const pSnap = await tx.get(programRef(programId));
    if (!pSnap.exists()) throw new JoinError('That program no longer exists.');
    const program = pSnap.data() as Omit<Program, 'id'>;

    const state = programAccessState({ ...program, id: programId } as Program);
    if (state === 'pending') throw new JoinError('This program isn\'t active yet — check with your administrator.');
    if (state === 'suspended') throw new JoinError('This program is not currently active.');
    if (state === 'expired') throw new JoinError('This program\'s access period has ended.');
    const alreadyMember = program.adminUids.includes(learner.uid);
    const rosterSnap = await tx.get(rosterRef(programId, learner.uid));
    if (!alreadyMember && !rosterSnap.exists() && program.seatsUsed >= program.seatLimit) {
      throw new JoinError('This program is full — all seats are taken. Contact your administrator.');
    }

    // Only consume a seat / write the roster stub for a genuinely new member.
    if (!rosterSnap.exists()) {
      tx.update(programRef(programId), { seatsUsed: program.seatsUsed + 1 });
      tx.set(rosterRef(programId, learner.uid), {
        email: learner.email,
        displayName: learner.displayName,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        modulesCompleted: 0,
        modulesInProgress: 0,
        overallPercent: 0,
        perModule: {},
      });
    }
    tx.set(userRef(learner.uid), {
      email: learner.email,
      displayName: learner.displayName,
      role: 'student',
      programId,
    });
  });

  const joined = await loadProgram(programId);
  if (!joined) throw new JoinError('Could not load the program after joining.');
  return joined;
}

// ── Admin: manage ──

export async function rotateEnrollmentCode(program: Program): Promise<string> {
  const next = await reserveUniqueCode();
  await runTransaction(db, async (tx) => {
    tx.set(codeRef(next), { programId: program.id });
    tx.update(programRef(program.id), { enrollmentCode: next });
    tx.delete(codeRef(program.enrollmentCode));
  });
  return next;
}

export async function setSeatLimit(programId: string, seatLimit: number): Promise<void> {
  await updateDoc(programRef(programId), { seatLimit });
}

export async function renameProgram(programId: string, name: string): Promise<void> {
  await updateDoc(programRef(programId), { name: name.trim() });
}

export async function addAdmin(programId: string, uid: string): Promise<void> {
  await updateDoc(programRef(programId), { adminUids: arrayUnion(uid) });
}

/** Offboard a student: free their seat, drop their roster row, and clear
 *  their program membership so they lose access. */
export async function removeStudent(program: Program, uid: string): Promise<void> {
  await deleteDoc(rosterRef(program.id, uid));
  await updateDoc(programRef(program.id), { seatsUsed: Math.max(0, program.seatsUsed - 1) });
  // Clear the student's membership (rules allow a program admin to null out
  // programId for a member of their program).
  try { await updateDoc(userRef(uid), { programId: null, role: 'student' }); } catch { /* best-effort */ }
}
