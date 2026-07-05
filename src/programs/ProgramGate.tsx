import React, { useEffect, useState } from 'react';
import { Activity, KeyRound, Building2, AlertCircle, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useProgram } from './ProgramContext';
import { createProgram, joinByCode, JoinError } from './programService';
import { writeRosterNow } from '../persistence/rosterSync';

type Mode = 'choose' | 'join' | 'create';

/**
 * Shown after sign-in when the account belongs to no program yet. Students
 * join with the shared enrollment key their administrator gave them;
 * administrators (the buyer / first person in) create the program here.
 */
const ProgramGate: React.FC = () => {
  const { user, signOutUser } = useAuth();
  const { refresh } = useProgram();
  const [mode, setMode] = useState<Mode>('choose');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [programName, setProgramName] = useState('');
  const [seatLimit, setSeatLimit] = useState(25);

  // Invite links look like `${origin}/?join=CODE` — jump straight to the
  // join step with the key prefilled (still shown, so it's explicit).
  useEffect(() => {
    const joinCode = new URLSearchParams(window.location.search).get('join');
    if (joinCode) {
      setCode(joinCode.toUpperCase());
      setMode('join');
    }
  }, []);

  const identity = {
    uid: user!.uid,
    email: user!.email ?? '',
    displayName: user!.displayName ?? user!.email?.split('@')[0] ?? 'Learner',
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await joinByCode(code, identity);
      await refresh();
      // Seed the roster immediately from any local progress this session.
      setTimeout(() => { void writeRosterNow(); }, 0);
    } catch (err: any) {
      setError(err instanceof JoinError ? err.message : 'Could not join — please try again.');
      setBusy(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!programName.trim()) { setError('Give your program a name.'); return; }
    setBusy(true);
    try {
      await createProgram(identity, { name: programName, seatLimit });
      // One-shot hint so the app lands the new admin straight on their program
      // console (seats / enrollment key / invites) rather than the learner
      // home — AppShell reads and clears this on its first mount.
      try { sessionStorage.setItem('vw_land_admin', '1'); } catch { /* private mode */ }
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Could not create the program — please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream px-6 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-brand-olive flex items-center justify-center mb-3 shadow-sm">
            <Activity size={22} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-zinc-900 tracking-tight">The Ventilator Workbook</h1>
          <p className="text-[13px] text-stone-500 mt-1">
            {mode === 'choose' && 'One more step to get you set up.'}
            {mode === 'join' && 'Enter the enrollment key from your program.'}
            {mode === 'create' && 'Set up a program for your learners.'}
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-7">
          {mode === 'choose' && (
            <div className="space-y-3">
              <button
                onClick={() => { setMode('join'); setError(null); }}
                className="w-full flex items-center gap-3 p-4 border border-stone-200 rounded-xl hover:border-brand-olive hover:bg-brand-olive/[0.03] transition text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-olive/10 flex items-center justify-center shrink-0">
                  <KeyRound size={18} className="text-brand-olive" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-zinc-900">I have an enrollment key</div>
                  <div className="text-[12px] text-stone-500">Join the program your instructor set up.</div>
                </div>
              </button>
              <button
                onClick={() => { setMode('create'); setError(null); }}
                className="w-full flex items-center gap-3 p-4 border border-stone-200 rounded-xl hover:border-brand-olive hover:bg-brand-olive/[0.03] transition text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-olive/10 flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-brand-olive" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-zinc-900">Set up a program</div>
                  <div className="text-[12px] text-stone-500">For administrators — invite your learners.</div>
                </div>
              </button>
            </div>
          )}

          {mode === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-stone-600 mb-1 block">Enrollment key</label>
                <input
                  autoFocus
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 7K3QX9RP"
                  className="w-full px-3 py-3 border border-stone-300 rounded-lg text-[16px] font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-brand-olive/30 focus:border-brand-olive"
                />
              </div>
              {error && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5 text-[12.5px] text-rose-800">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" /> <span>{error}</span>
                </div>
              )}
              <button type="submit" disabled={busy} className="w-full py-2.5 bg-brand-olive hover:bg-brand-olive-hover disabled:opacity-60 text-white text-[14px] font-bold rounded-lg transition">
                {busy ? 'Joining…' : 'Join program'}
              </button>
            </form>
          )}

          {mode === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-stone-600 mb-1 block">Program name</label>
                <input
                  autoFocus
                  value={programName}
                  onChange={e => setProgramName(e.target.value)}
                  placeholder="e.g. UMich Pulm/CC 2026"
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-olive/30 focus:border-brand-olive"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-stone-600 mb-1 block">Number of seats</label>
                <input
                  type="number" min={1} max={1000}
                  value={seatLimit}
                  onChange={e => setSeatLimit(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-olive/30 focus:border-brand-olive"
                />
                <p className="text-[11.5px] text-stone-400 mt-1">You can change this later. Your program is activated once your subscription is set up.</p>
              </div>
              {error && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5 text-[12.5px] text-rose-800">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" /> <span>{error}</span>
                </div>
              )}
              <button type="submit" disabled={busy} className="w-full py-2.5 bg-brand-olive hover:bg-brand-olive-hover disabled:opacity-60 text-white text-[14px] font-bold rounded-lg transition">
                {busy ? 'Creating…' : 'Create program'}
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-between mt-5 px-1">
          {mode !== 'choose' ? (
            <button onClick={() => { setMode('choose'); setError(null); }} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-stone-500 hover:text-stone-700">
              <ArrowLeft size={13} /> Back
            </button>
          ) : <span />}
          <button onClick={signOutUser} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-stone-400 hover:text-stone-600">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgramGate;
