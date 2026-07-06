import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, Mail, Copy, Check, Trash2, UserCheck, Clock, Loader2, AlertCircle,
} from 'lucide-react';
import { addInvites, removeInvite, isValidEmail, normalizeEmail } from './programService';
import type { Program, RosterEntry, InviteEntry } from './types';

/**
 * Invite roster manager. The invite list is the authoritative allowlist:
 * joining is hard-gated on it (programService.joinByCode), so an admin adds
 * student emails HERE before those students can enroll — even with the key.
 * Sending is via the user's own mail client (mailto), so no backend is needed;
 * the button pre-fills a message (BCC to everyone not yet joined) carrying the
 * enrollment key + join link.
 */
const InviteManager: React.FC<{
  program: Program;
  roster: RosterEntry[] | null;
  invites: InviteEntry[] | null;
  invitedBy: string;
  reloadInvites: () => Promise<void>;
  onClose: () => void;
}> = ({ program, roster, invites, invitedBy, reloadInvites, onClose }) => {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const joinLink = `${window.location.origin}/?join=${program.enrollmentCode}`;

  // Which invited emails have actually joined (matched to a roster entry).
  const joinedEmails = useMemo(
    () => new Set((roster ?? []).map(r => normalizeEmail(r.email))),
    [roster],
  );

  const pending = useMemo(
    () => (invites ?? []).filter(i => !joinedEmails.has(i.email)),
    [invites, joinedEmails],
  );

  const parseEmails = (text: string): string[] => text.split(/[\s,;]+/).filter(Boolean);

  const handleAdd = async () => {
    setNotice(null);
    const tokens = parseEmails(draft);
    if (tokens.length === 0) return;
    const invalid = tokens.filter(t => !isValidEmail(t));
    setBusy(true);
    try {
      const added = await addInvites(program.id, invitedBy, tokens);
      await reloadInvites();
      setDraft('');
      const skipped = tokens.length - added.length;
      const parts = [`Added ${added.length}`];
      if (skipped > 0) parts.push(`${skipped} skipped (duplicate${invalid.length ? ' or invalid' : ''})`);
      setNotice(parts.join(' · '));
    } catch (e: any) {
      setNotice(e?.message ?? 'Could not add invites — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (emailId: string) => {
    setBusy(true);
    try { await removeInvite(program.id, emailId); await reloadInvites(); }
    finally { setBusy(false); }
  };

  const inviteSubject = `Join ${program.name} on The Ventilator Workbook`;
  const inviteBody =
    `You've been enrolled in ${program.name} on The Ventilator Workbook.\n\n` +
    `1. Open ${joinLink}\n` +
    `2. Create your account (or sign in) with THIS email address\n` +
    `3. Enter enrollment key: ${program.enrollmentCode}\n\n` +
    `Note: you must sign up with the email your administrator invited, or ` +
    `you won't be able to join.\n\n` +
    `Your progress saves to your account automatically.`;

  // Compose to everyone not yet joined. BCC keeps the class list private from
  // recipients. Gmail/Outlook open a pre-filled web compose window (so it
  // doesn't depend on the OS default mail app); "Default mail app" uses the
  // mailto: handler (Outlook desktop, Apple Mail, etc.).
  const composeToPending = (target: 'gmail' | 'outlook' | 'mailto') => {
    if (pending.length === 0) return;
    const recipients = pending.map(p => p.email).join(',');
    const bcc = encodeURIComponent(recipients);
    const su = encodeURIComponent(inviteSubject);
    const body = encodeURIComponent(inviteBody);
    if (target === 'gmail') {
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&bcc=${bcc}&su=${su}&body=${body}`, '_blank', 'noopener');
    } else if (target === 'outlook') {
      window.open(`https://outlook.office.com/mail/deeplink/compose?bcc=${bcc}&subject=${su}&body=${body}`, '_blank', 'noopener');
    } else {
      window.location.href = `mailto:?bcc=${bcc}&subject=${su}&body=${body}`;
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const invalidCount = parseEmails(draft).filter(t => t && !isValidEmail(t)).length;
  const total = invites?.length ?? 0;
  const joinedCount = total - pending.length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button onClick={onClose} className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-500 hover:text-stone-700 mb-4">
        <ArrowLeft size={15} /> Back to console
      </button>

      <div className="text-[11px] font-black uppercase tracking-widest text-brand-olive mb-1">Invite learners · {program.name}</div>
      <h1 className="font-display text-3xl font-semibold text-zinc-900 tracking-tight mb-2">Invite roster</h1>
      <p className="text-[13.5px] text-stone-600 leading-relaxed mb-6 max-w-2xl">
        Add the email addresses of the learners you want to enroll. Only invited
        emails can join this program — a student who signs up with an email that
        isn't on this list is turned away. They still enter the enrollment key
        (<span className="font-mono font-semibold">{program.enrollmentCode}</span>);
        this list is the validation on top of it.
      </p>

      {/* Add box */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-5">
        <label className="text-[12px] font-bold text-stone-600 mb-2 block">Add emails</label>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={3}
          placeholder="Paste emails — separated by commas, spaces, or new lines&#10;jane@hospital.org, john@hospital.org"
          className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-[13.5px] focus:outline-none focus:ring-2 focus:ring-brand-olive/30 focus:border-brand-olive resize-y"
        />
        <div className="flex items-center justify-between gap-3 mt-2">
          <div className="text-[12px] text-stone-500 min-h-[18px]">
            {notice && <span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-600" /> {notice}</span>}
            {!notice && invalidCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-700"><AlertCircle size={13} /> {invalidCount} address{invalidCount > 1 ? 'es' : ''} look invalid and will be skipped</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={busy || parseEmails(draft).length === 0}
            className="shrink-0 px-4 py-2 bg-brand-olive hover:bg-brand-olive-hover disabled:opacity-50 text-white text-[13px] font-bold rounded-lg transition inline-flex items-center gap-2"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : null} Add to list
          </button>
        </div>
      </div>

      {/* Send + link */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[12px] font-bold text-stone-600 mb-2">
          <Mail size={14} /> Send invite {pending.length > 0 ? `to ${pending.length} not yet joined` : '(everyone has joined)'} — pick your email:
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => composeToPending('gmail')}
            disabled={pending.length === 0}
            className="px-4 py-2.5 bg-brand-olive hover:bg-brand-olive-hover disabled:opacity-50 text-white text-[13px] font-bold rounded-lg transition"
          >
            Gmail
          </button>
          <button
            onClick={() => composeToPending('outlook')}
            disabled={pending.length === 0}
            className="px-4 py-2.5 bg-brand-olive hover:bg-brand-olive-hover disabled:opacity-50 text-white text-[13px] font-bold rounded-lg transition"
          >
            Outlook
          </button>
          <button
            onClick={() => composeToPending('mailto')}
            disabled={pending.length === 0}
            className="px-4 py-2.5 border border-stone-300 hover:border-brand-olive text-stone-700 disabled:opacity-50 text-[13px] font-bold rounded-lg transition"
          >
            Default mail app
          </button>
          <button onClick={copyLink} className="flex items-center gap-1.5 text-[13px] font-bold text-brand-olive ml-2">
            {copied ? <><Check size={14} /> Link copied</> : <><Copy size={14} /> Copy invite link</>}
          </button>
        </div>
        <p className="text-[12px] text-stone-400 mt-2">
          Gmail and Outlook open a pre-filled web compose window; everyone is in BCC to keep the list private. You review and hit send.
        </p>
      </div>

      {/* List */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <h2 className="text-[13px] font-black uppercase tracking-widest text-stone-500">
            Invited{total > 0 ? ` · ${joinedCount} joined / ${total}` : ''}
          </h2>
          {total > program.seatLimit && (
            <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1"><AlertCircle size={12} /> more invites than seats ({program.seatLimit})</span>
          )}
        </div>

        {invites === null ? (
          <div className="flex items-center justify-center gap-2 py-12 text-stone-400 text-[13px]"><Loader2 size={14} className="animate-spin" /> Loading…</div>
        ) : invites.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-[13px]">No one invited yet. Add emails above so your learners can join.</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {invites.slice().sort((a, b) => a.email.localeCompare(b.email)).map(inv => {
              const joined = joinedEmails.has(inv.email);
              return (
                <div key={inv.email} className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50/60">
                  <span className="flex-1 min-w-0 text-[13.5px] text-zinc-800 truncate">{inv.email}</span>
                  {joined ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><UserCheck size={12} /> Joined</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full"><Clock size={12} /> Invited</span>
                  )}
                  <button
                    onClick={() => handleRemove(inv.email)}
                    disabled={busy}
                    title={joined ? 'Remove from allowlist (already-joined learner keeps access — offboard from the roster to revoke)' : 'Remove invite'}
                    className="p-1.5 text-stone-400 hover:text-rose-600 shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteManager;
