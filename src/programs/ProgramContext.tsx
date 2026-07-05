import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { loadProgram, loadUserProfile } from './programService';
import { isProgramExpired } from './programService';
import type { Program, UserProfile } from './types';
import { setRosterContext } from '../persistence/rosterSync';

interface ProgramContextValue {
  loading: boolean;
  profile: UserProfile | null;
  program: Program | null;
  /** True once profile + program are resolved and the learner belongs to no
   *  program — they must join with a code or create one. */
  needsOnboarding: boolean;
  /** True when the learner's program's access period has ended / is suspended. */
  expired: boolean;
  /** Auth is driven by the program's adminUids, not the user doc's role field. */
  isAdmin: boolean;
  /** Re-fetch profile + program (call after join/create/admin changes). */
  refresh: () => Promise<void>;
}

const ProgramContext = createContext<ProgramContextValue | null>(null);

export const ProgramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [program, setProgram] = useState<Program | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProgram(null);
      setRosterContext(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const prof = await loadUserProfile(user.uid);
      setProfile(prof);
      const prog = prof?.programId ? await loadProgram(prof.programId) : null;
      setProgram(prog);
      // Point the roster-sync layer at this learner's program (or clear it).
      if (prog && prof) {
        setRosterContext({
          programId: prog.id,
          uid: user.uid,
          email: user.email ?? prof.email ?? '',
          displayName: user.displayName ?? prof.displayName ?? '',
        });
      } else {
        setRosterContext(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const isAdmin = !!(program && user && program.adminUids.includes(user.uid));
  const needsOnboarding = !loading && !!user && !program;
  const expired = !!program && isProgramExpired(program);

  return (
    <ProgramContext.Provider
      value={{ loading, profile, program, needsOnboarding, expired, isAdmin, refresh: load }}
    >
      {children}
    </ProgramContext.Provider>
  );
};

export function useProgram(): ProgramContextValue {
  const ctx = useContext(ProgramContext);
  if (!ctx) throw new Error('useProgram must be used within a ProgramProvider');
  return ctx;
}
