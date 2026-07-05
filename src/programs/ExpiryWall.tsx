import React from 'react';
import { CalendarX, Clock, LogOut, Mail, Copy, Check } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useProgram } from './ProgramContext';

/**
 * Full-screen block shown to EVERY member (students and admins) of a program
 * that isn't currently granting access. The enrollment code doesn't gate
 * this — the program's status/expiresAt does — so:
 *   - 'pending'  : self-created, awaiting the seller's activation,
 *   - 'expired'  : the paid term has lapsed,
 *   - 'suspended': access revoked.
 * There is no free trial, so a freshly created program lands here until
 * activated.
 */
const ExpiryWall: React.FC = () => {
  const { signOutUser } = useAuth();
  const { program, isAdmin, accessState } = useProgram();
  const [copied, setCopied] = React.useState(false);

  const pending = accessState === 'pending';
  const Icon = pending ? Clock : CalendarX;

  const title = pending ? 'Awaiting activation' : accessState === 'suspended' ? 'Access suspended' : 'Access period ended';

  const body = pending
    ? isAdmin
      ? <>Your program <span className="font-semibold">{program?.name}</span> is set up and ready. It will unlock for you and your learners as soon as it's activated.</>
      : <>This program isn't active yet. Your administrator will let you know when it's ready.</>
    : isAdmin
      ? <><span className="font-semibold">{program?.name}</span>'s access to The Ventilator Workbook has ended. Renew to restore access for you and your learners.</>
      : <>Your program's access has ended. Please reach out to your program administrator to renew.</>;

  const copyCode = () => {
    if (!program) return;
    navigator.clipboard?.writeText(program.enrollmentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream px-6 py-10">
      <div className="w-full max-w-md text-center">
        <div className={`w-14 h-14 rounded-full ${pending ? 'bg-brand-olive/10' : 'bg-amber-100'} flex items-center justify-center mx-auto mb-4`}>
          <Icon size={26} className={pending ? 'text-brand-olive' : 'text-amber-700'} />
        </div>
        <h1 className="font-display text-2xl font-semibold text-zinc-900 tracking-tight mb-2">{title}</h1>
        <p className="text-[14px] text-stone-600 leading-relaxed mb-6">{body}</p>

        {isAdmin && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-left mb-6 space-y-3">
            {pending && program && (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-stone-400">Enrollment key</div>
                  <div className="text-[15px] font-mono font-bold tracking-widest text-zinc-900">{program.enrollmentCode}</div>
                </div>
                <button onClick={copyCode} className="flex items-center gap-1 text-[12px] font-bold text-brand-olive">
                  {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 text-[13px] text-stone-700 pt-1">
              <Mail size={15} className="text-brand-olive shrink-0" />
              <span>Contact <a href="mailto:support@ventilatorworkbook.com" className="font-semibold text-brand-olive underline">support</a> to {pending ? 'activate your program' : 'renew your contract'}.</span>
            </div>
          </div>
        )}
        {!isAdmin && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-left mb-6">
            <div className="flex items-center gap-2 text-[13px] text-stone-700">
              <Mail size={15} className="text-brand-olive shrink-0" />
              <span>Your progress is saved and will be waiting when access is {pending ? 'ready' : 'restored'}.</span>
            </div>
          </div>
        )}

        <button onClick={signOutUser} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-stone-500 hover:text-stone-700">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
};

export default ExpiryWall;
