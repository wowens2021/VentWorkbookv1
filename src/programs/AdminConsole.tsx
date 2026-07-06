import React, { useEffect, useState } from 'react';
import {
  Users, KeyRound, RefreshCw, Copy, Check, Mail, ChevronDown, ChevronRight,
  ShieldCheck, UserMinus, Pencil, Loader2, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useProgram } from './ProgramContext';
import {
  listRoster, listInvites, rotateEnrollmentCode, setSeatLimit, renameProgram, addAdmin, removeStudent,
  programAccessState, normalizeEmail,
} from './programService';
import type { RosterEntry, InviteEntry } from './types';
import { MODULES } from '../modules';
import InviteManager from './InviteManager';

/** Color a 0–100 mastery number: red weakness → amber → green strength. */
const pctTone = (p: number): string =>
  p >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : p >= 50 ? 'text-amber-800 bg-amber-50 border-amber-200'
      : 'text-rose-700 bg-rose-50 border-rose-200';

const AdminConsole: React.FC = () => {
  const { user } = useAuth();
  const { program, refresh } = useProgram();
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [invites, setInvites] = useState<InviteEntry[] | null>(null);
  const [showInvites, setShowInvites] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(program?.name ?? '');
  const [seatDraft, setSeatDraft] = useState(program?.seatLimit ?? 0);

  const loadRoster = async () => {
    if (!program) return;
    try { setRoster(await listRoster(program.id)); } catch { setRoster([]); }
  };
  const loadInvites = async () => {
    if (!program) return;
    try { setInvites(await listInvites(program.id)); } catch { setInvites([]); }
  };
  useEffect(() => { void loadRoster(); void loadInvites(); /* eslint-disable-next-line */ }, [program?.id]);
  useEffect(() => { setNameDraft(program?.name ?? ''); setSeatDraft(program?.seatLimit ?? 0); }, [program]);

  if (!program) return null;

  if (showInvites) {
    return (
      <InviteManager
        program={program}
        roster={roster}
        invites={invites}
        invitedBy={user?.uid ?? ''}
        reloadInvites={loadInvites}
        onClose={() => setShowInvites(false)}
      />
    );
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  const doRotate = async () => {
    if (!window.confirm('Rotate the enrollment key? The old key stops working immediately — anyone who already joined stays enrolled, but you\'ll need to share the new key for future learners.')) return;
    setRotating(true);
    try { await rotateEnrollmentCode(program); await refresh(); } finally { setRotating(false); }
  };

  const saveName = async () => {
    if (nameDraft.trim() && nameDraft !== program.name) { await renameProgram(program.id, nameDraft); await refresh(); }
    setEditingName(false);
  };
  const saveSeats = async () => {
    if (seatDraft > 0 && seatDraft !== program.seatLimit) { await setSeatLimit(program.id, seatDraft); await refresh(); }
  };

  const promote = async (uid: string) => {
    if (!window.confirm('Make this learner a co-administrator? They\'ll get full access to this roster and program settings.')) return;
    await addAdmin(program.id, uid); await refresh();
  };
  const offboard = async (entry: RosterEntry) => {
    if (!window.confirm(`Remove ${entry.displayName || entry.email} from ${program.name}? This frees their seat and revokes their access.`)) return;
    await removeStudent(program, entry.uid); await loadRoster(); await refresh();
  };

  const accessState = programAccessState(program);
  const seatsUsed = roster ? roster.length : program.seatsUsed;
  const invitedTotal = invites?.length ?? 0;
  const joinedEmailSet = new Set((roster ?? []).map(r => normalizeEmail(r.email)));
  const invitedPending = (invites ?? []).filter(i => !joinedEmailSet.has(i.email)).length;
  const expiresLabel = program.expiresAt
    ? new Date(program.expiresAt.toMillis()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';
  const daysLeft = program.expiresAt ? Math.ceil((program.expiresAt.toMillis() - Date.now()) / 86400000) : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-widest text-brand-olive mb-1">Program administration</div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input value={nameDraft} onChange={e => setNameDraft(e.target.value)} className="text-2xl font-display font-semibold text-zinc-900 border-b border-brand-olive focus:outline-none" autoFocus />
              <button onClick={saveName} className="text-[12px] font-bold text-brand-olive">Save</button>
            </div>
          ) : (
            <h1 className="font-display text-3xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
              {program.name}
              <button onClick={() => setEditingName(true)} className="text-stone-400 hover:text-stone-600"><Pencil size={16} /></button>
            </h1>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${accessState === 'active' ? 'bg-emerald-100 text-emerald-800' : accessState === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
            {accessState}
          </span>
          <div className="text-[12px] text-stone-500 mt-1.5">
            Expires {expiresLabel}{typeof daysLeft === 'number' && daysLeft >= 0 ? ` · ${daysLeft}d left` : ''}
          </div>
        </div>
      </div>

      {accessState === 'pending' && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-[13px] text-amber-900">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>This program is awaiting activation. Learners can't access it yet — contact support to activate your contract.</span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Seats */}
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-stone-400 mb-2"><Users size={13} /> Seats</div>
          <div className="text-2xl font-bold text-zinc-900 tabular-nums">{seatsUsed}<span className="text-stone-400 text-lg"> / {program.seatLimit}</span></div>
          <div className="flex items-center gap-2 mt-2">
            <input type="number" min={1} value={seatDraft} onChange={e => setSeatDraft(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 px-2 py-1 border border-stone-300 rounded text-[13px]" />
            <button onClick={saveSeats} className="text-[12px] font-bold text-brand-olive">Update</button>
          </div>
        </div>
        {/* Enrollment key */}
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-stone-400 mb-2"><KeyRound size={13} /> Enrollment key</div>
          <div className="text-xl font-mono font-bold tracking-widest text-zinc-900">{program.enrollmentCode}</div>
          <div className="flex items-center gap-3 mt-2">
            <button onClick={() => copy(program.enrollmentCode, 'code')} className="flex items-center gap-1 text-[12px] font-bold text-brand-olive">
              {copied === 'code' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
            <button onClick={doRotate} disabled={rotating} className="flex items-center gap-1 text-[12px] font-bold text-stone-500 hover:text-stone-700">
              {rotating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Rotate
            </button>
          </div>
        </div>
        {/* Invite */}
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-stone-400 mb-2"><Mail size={13} /> Invite learners</div>
          <button onClick={() => setShowInvites(true)} className="w-full py-2 bg-brand-olive hover:bg-brand-olive-hover text-white text-[13px] font-bold rounded-lg transition mb-2">Manage invites</button>
          <div className="text-[12px] text-stone-500">
            {invites === null ? 'Loading…' : invitedTotal === 0 ? 'No one invited yet — add emails to let learners join' : `${invitedTotal} invited · ${invitedPending} pending`}
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <h2 className="text-[13px] font-black uppercase tracking-widest text-stone-500">Roster</h2>
          <button onClick={loadRoster} className="flex items-center gap-1 text-[12px] font-semibold text-stone-400 hover:text-stone-600"><RefreshCw size={12} /> Refresh</button>
        </div>

        {roster === null ? (
          <div className="flex items-center justify-center gap-2 py-12 text-stone-400 text-[13px]"><Loader2 size={14} className="animate-spin" /> Loading roster…</div>
        ) : roster.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-[13px]">No learners have joined yet. Add emails under <button onClick={() => setShowInvites(true)} className="font-semibold text-brand-olive underline">Manage invites</button>, then share the enrollment key.</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {roster.slice().sort((a, b) => b.overallPercent - a.overallPercent).map(entry => {
              const isMe = entry.uid === user?.uid;
              const isEntryAdmin = program.adminUids.includes(entry.uid);
              const open = expanded === entry.uid;
              const touched = MODULES.filter(m => entry.perModule?.[m.id]);
              return (
                <div key={entry.uid}>
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50/60">
                    <button onClick={() => setExpanded(open ? null : entry.uid)} className="text-stone-400 shrink-0">
                      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-zinc-900 truncate">{entry.displayName || entry.email}</span>
                        {isEntryAdmin && <span className="text-[9px] font-black uppercase tracking-widest text-brand-olive bg-brand-olive/10 px-1.5 py-0.5 rounded">Admin</span>}
                        {isMe && <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">You</span>}
                        {entry.occupation && <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded truncate max-w-[200px] shrink-0">{entry.occupation}</span>}
                      </div>
                      <div className="text-[12px] text-stone-500 truncate">{entry.email}</div>
                    </div>
                    <div className="text-right shrink-0 w-28">
                      <div className={`inline-block text-[12px] font-bold px-2 py-0.5 rounded border ${pctTone(entry.overallPercent)}`}>{entry.overallPercent}%</div>
                      <div className="text-[11px] text-stone-400 mt-0.5">{entry.modulesCompleted} done</div>
                    </div>
                    {!isEntryAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => promote(entry.uid)} title="Make co-admin" className="p-1.5 text-stone-400 hover:text-brand-olive"><ShieldCheck size={15} /></button>
                        <button onClick={() => offboard(entry)} title="Remove from program" className="p-1.5 text-stone-400 hover:text-rose-600"><UserMinus size={15} /></button>
                      </div>
                    )}
                  </div>

                  {open && (
                    <div className="px-4 pb-4 pt-1 bg-stone-50/40">
                      {touched.length === 0 ? (
                        <div className="text-[12px] text-stone-400 py-2">No module activity yet.</div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {touched.map(m => {
                            const s = entry.perModule[m.id];
                            return (
                              <div key={m.id} className="bg-white border border-stone-200 rounded-lg px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[12px] font-semibold text-zinc-800 truncate">M{m.number} · {m.title}</span>
                                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${pctTone(s.percent)}`}>{s.percent}%</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-500">
                                  {typeof s.quizScore === 'number' && <span>Quiz {s.quizScore}</span>}
                                  {typeof s.primerScore === 'number' && <span>Primer {s.primerScore}</span>}
                                  {typeof s.hintsUsed === 'number' && s.hintsUsed > 0 && <span>{s.hintsUsed} hints</span>}
                                  <span className="ml-auto uppercase tracking-wide text-[10px] font-bold text-stone-400">{s.status.replace('_', ' ')}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConsole;
