import React from 'react';
import { CalendarX, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useProgram } from './ProgramContext';

/**
 * Full-screen block shown to EVERY member (students and admins) of a program
 * whose access period has ended or been suspended. The enrollment code does
 * not gate this — the program's expiresAt/status does — so a lapsed contract
 * cleanly locks out the whole cohort until it's renewed.
 */
const ExpiryWall: React.FC = () => {
  const { signOutUser } = useAuth();
  const { program, isAdmin } = useProgram();

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream px-6 py-10">
      <div className="w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <CalendarX size={26} className="text-amber-700" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-zinc-900 tracking-tight mb-2">
          Access period ended
        </h1>
        <p className="text-[14px] text-stone-600 leading-relaxed mb-6">
          {program?.name ? <><span className="font-semibold">{program.name}</span>’s </> : 'Your program’s '}
          access to The Ventilator Workbook has ended.
          {isAdmin
            ? ' Renew your program to restore access for you and your learners.'
            : ' Please reach out to your program administrator to renew.'}
        </p>
        <div className="bg-white border border-stone-200 rounded-xl p-4 text-left mb-6">
          <div className="flex items-center gap-2 text-[13px] text-stone-700">
            <Mail size={15} className="text-brand-olive shrink-0" />
            {isAdmin
              ? <span>Contact <a href="mailto:support@ventilatorworkbook.com" className="font-semibold text-brand-olive underline">support</a> to renew your contract.</span>
              : <span>Your progress is saved and will be waiting when access is restored.</span>}
          </div>
        </div>
        <button onClick={signOutUser} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-stone-500 hover:text-stone-700">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
};

export default ExpiryWall;
