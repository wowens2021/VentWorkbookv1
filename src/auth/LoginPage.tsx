import React, { useState } from 'react';
import { Activity, Mail, Lock, User as UserIcon, Briefcase, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from './AuthContext';

type Mode = 'signin' | 'signup';

/** Grouped occupation options for the sign-up dropdown. Stored value is the
 *  human-readable label; "Other" reveals a free-text field. */
const OCCUPATION_GROUPS: { group: string; options: string[] }[] = [
  { group: 'Respiratory Therapy', options: ['Respiratory Therapist (RT/RRT)', 'Respiratory Therapy Student'] },
  { group: 'Nursing', options: ['ICU / Critical Care Nurse', 'Nursing Student', 'Patient Care Technician (PCT)'] },
  { group: 'Physicians', options: ['Critical Care Physician / Intensivist', 'Pulmonary/Critical Care Fellow', 'Anesthesiologist', 'Emergency Medicine Physician', 'Medical Student', 'Resident (non-ICU specialty rotating through)'] },
  { group: 'Advanced Practice', options: ['Nurse Practitioner', 'Physician Assistant', 'CRNA (Certified Registered Nurse Anesthetist)', 'PA/NP Student'] },
  { group: 'Prehospital / Transport', options: ['Paramedic', 'Flight Paramedic / Critical Care Transport'] },
  { group: 'Allied & Technical', options: ['Perfusionist', 'Biomedical / Clinical Engineer (services/configures ventilators)'] },
  { group: 'Education & Training', options: ['Clinical Educator / Simulation Faculty', 'Nurse Educator'] },
];
const OCCUPATION_OTHER = 'Other';

/** Inline Google "G" mark — lucide has no brand icons, and pulling in a
 *  whole icon-brand package for one glyph isn't worth the dependency. */
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l6-6C34.5 5.4 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.5-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.7 18.9 13 24 13c3 0 5.8 1.1 7.9 3l6-6C34.5 5.4 29.5 3 24 3c-7.4 0-13.8 4.2-17 10.3z" />
    <path fill="#4CAF50" d="M24 45c5.4 0 10.3-2.1 14-5.5l-6.5-5.5C29.4 35.9 26.8 36.8 24 36.8c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.9 40.5 16.4 45 24 45z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.5C41.5 36.4 45 30.9 45 24c0-1.4-.1-2.5-.4-3.5z" />
  </svg>
);

/**
 * Full-screen sign-in / create-account gate shown when there is no
 * authenticated Firebase user. `App.tsx` renders this in place of the app
 * until `useAuth().user` is set.
 */
const LoginPage: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [occupation, setOccupation] = useState('');
  const [occupationOther, setOccupationOther] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Effective occupation: the free-text value when "Other" is picked.
  const effectiveOccupation = occupation === OCCUPATION_OTHER ? occupationOther.trim() : occupation;

  const friendlyError = (code: string): string => {
    switch (code) {
      case 'auth/invalid-email': return 'That email address doesn\'t look right.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'Incorrect email or password.';
      case 'auth/email-already-in-use': return 'An account already exists for that email — try signing in instead.';
      case 'auth/weak-password': return 'Password should be at least 6 characters.';
      case 'auth/popup-closed-by-user': return '';
      case 'auth/too-many-requests': return 'Too many attempts — wait a moment and try again.';
      default: return 'Something went wrong. Please try again.';
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSent(false);
    if (mode === 'signup' && !effectiveOccupation) {
      setError(occupation === OCCUPATION_OTHER ? 'Tell us your role in the box.' : 'Select your role/occupation.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password, name, effectiveOccupation);
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      const msg = friendlyError(err?.code ?? '');
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setResetSent(false);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const msg = friendlyError(err?.code ?? '');
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email above first, then click "Forgot password?"');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (err: any) {
      setError(friendlyError(err?.code ?? ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream px-6 py-10">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-12 h-12 rounded-full bg-brand-olive flex items-center justify-center mb-3 shadow-sm">
            <Activity size={22} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-zinc-900 tracking-tight">
            The Ventilator Workbook
          </h1>
          <p className="text-[13px] text-stone-500 mt-1">
            {mode === 'signin' ? 'Sign in to continue your progress.' : 'Create an account to get started.'}
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-7">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); setResetSent(false); }}
              className={`flex-1 py-2 text-[13px] font-bold rounded-md transition ${
                mode === 'signin' ? 'bg-white text-brand-olive shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setResetSent(false); }}
              className={`flex-1 py-2 text-[13px] font-bold rounded-md transition ${
                mode === 'signup' ? 'bg-white text-brand-olive shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="text-[12px] font-bold text-stone-600 mb-1 block">Name</label>
                <div className="relative">
                  <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Dr. Jane Smith"
                    className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-olive/30 focus:border-brand-olive"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="text-[12px] font-bold text-stone-600 mb-1 block">Role / occupation</label>
                <div className="relative">
                  <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <select
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-lg text-[14px] bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-olive/30 focus:border-brand-olive ${occupation ? 'text-zinc-900' : 'text-stone-400'}`}
                  >
                    <option value="" disabled>Select your role…</option>
                    {OCCUPATION_GROUPS.map(g => (
                      <optgroup key={g.group} label={g.group}>
                        {g.options.map(o => <option key={o} value={o} className="text-zinc-900">{o}</option>)}
                      </optgroup>
                    ))}
                    <optgroup label="Other">
                      <option value={OCCUPATION_OTHER} className="text-zinc-900">Other (free text)</option>
                    </optgroup>
                  </select>
                </div>
                {occupation === OCCUPATION_OTHER && (
                  <input
                    type="text"
                    value={occupationOther}
                    onChange={e => setOccupationOther(e.target.value)}
                    placeholder="Your role"
                    autoFocus
                    className="w-full mt-2 px-3 py-2.5 border border-stone-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-olive/30 focus:border-brand-olive"
                  />
                )}
              </div>
            )}

            <div>
              <label className="text-[12px] font-bold text-stone-600 mb-1 block">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@hospital.org"
                  className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-olive/30 focus:border-brand-olive"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[12px] font-bold text-stone-600">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11.5px] font-semibold text-brand-olive hover:text-brand-olive-hover"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-olive/30 focus:border-brand-olive"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5 text-[12.5px] text-rose-800">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {resetSent && !error && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-[12.5px] text-emerald-800">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                <span>Password reset email sent — check your inbox.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 bg-brand-olive hover:bg-brand-olive-hover disabled:opacity-60 text-white text-[14px] font-bold rounded-lg transition shadow-sm"
            >
              {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">or</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 disabled:opacity-60 text-stone-800 text-[14px] font-semibold rounded-lg transition"
          >
            <GoogleIcon /> Continue with Google
          </button>
        </div>

        <p className="text-center text-[11.5px] text-stone-400 mt-5">
          Your progress is saved to your account and follows you across devices.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
