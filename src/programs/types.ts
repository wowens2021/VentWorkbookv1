import type { Timestamp } from 'firebase/firestore';

/** A learner's role within their program. */
export type Role = 'student' | 'admin';

// 'pending'  — created but not yet activated by the seller; no access.
// 'active'   — paid/active; access allowed until expiresAt.
// 'suspended'— access revoked (non-payment, etc.).
export type ProgramStatus = 'pending' | 'active' | 'suspended';

/**
 * A program = one sold cohort (e.g. "UMich Pulm/CC 2026"). Bought by an
 * administrator, joined by students with a shared enrollment code.
 * Firestore path: programs/{programId}.
 */
export interface Program {
  id: string;
  name: string;
  /** Shared code students paste to join. Uppercase, globally unique via
   *  the enrollmentCodes/{code} lookup collection. */
  enrollmentCode: string;
  seatLimit: number;
  /** Best-effort join-time counter (see programService for the soft-limit
   *  caveat). The admin console recomputes the true number from the roster. */
  seatsUsed: number;
  adminUids: string[];
  status: ProgramStatus;
  /** Access lifetime once active. When this passes, EVERY member (students +
   *  admins) is locked out until it's extended — this is the contract-expiry
   *  gate, not the enrollment code. New programs are created 'pending' with
   *  no expiry; the seller activates them (status 'active' + a term) on
   *  payment, and bumps expiresAt on renewal. */
  expiresAt: Timestamp | null;
  createdAt: Timestamp | null;
  createdBy: string;
}

/** users/{uid} — the account's role + program membership. Progress detail
 *  still lives under users/{uid}/progress/* exactly as before. */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  programId: string | null;
  /** Self-reported role/occupation captured at sign-up (free text allowed via
   *  the "Other" option). Optional — Google sign-ups and pre-existing accounts
   *  won't have it. */
  occupation?: string;
}

/**
 * An invited student. The invite list is the authoritative allowlist: joining
 * is HARD-GATED on a matching invite (see programService.joinByCode), so only
 * emails an admin has added here can enroll, even with the correct key.
 * Firestore path: programs/{programId}/invites/{emailId}, where emailId is the
 * normalized (lowercased, trimmed) email — so a joining student can `get` their
 * OWN invite doc by id to self-validate, without listing everyone else's.
 */
export interface InviteEntry {
  /** Doc id = normalized email; this is the same value, kept for display. */
  email: string;
  invitedAt: Timestamp | null;
  invitedBy: string;
}

export type ModuleStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_RETAKE';

/** Per-module strengths/weaknesses snapshot the admin dashboard reads. */
export interface RosterModuleSummary {
  status: ModuleStatus;
  percent: number;
  /** Composite graded score once the module's quiz is submitted. */
  score?: number;
  letter?: string;
  primerScore?: number;
  quizScore?: number;
  hintsUsed?: number;
}

/**
 * Denormalized per-student rollup, written by the student's own browser on
 * every progress change. This is what powers the admin roster + drill-down,
 * so an admin doesn't need blanket read access to raw progress docs for the
 * roster view (they can still drill into one student's full detail, gated by
 * a rule that they admin that student's program).
 * Firestore path: programs/{programId}/roster/{uid}.
 */
export interface RosterEntry {
  uid: string;
  email: string;
  displayName: string;
  /** Self-reported occupation, mirrored from the learner's profile so the
   *  admin roster can show who each learner is. Optional (older/Google accounts). */
  occupation?: string;
  joinedAt: Timestamp | null;
  updatedAt: Timestamp | null;
  modulesCompleted: number;
  modulesInProgress: number;
  overallPercent: number;
  perModule: Record<string, RosterModuleSummary>;
}
