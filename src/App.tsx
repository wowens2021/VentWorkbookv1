import React, { useEffect, useRef, useState } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import PlaygroundSim from './components/PlaygroundSim';
import ModulePicker from './components/ModulePicker';
import Landing from './components/Landing';
import KnowledgeCheckPage from './components/KnowledgeCheckPage';
import TopNav, { type NavTarget } from './components/TopNav';
import ModuleShell from './shell/ModuleShell';
import DebugDropOffPanel from './shell/DebugDropOffPanel';
import { MODULES } from './modules';
import type { ModuleConfig } from './shell/types';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { firebaseConfigured, missingFirebaseKeys } from './firebase/config';
import LoginPage from './auth/LoginPage';
import { setActiveUserId } from './persistence/progress';
import { syncProgressFromCloud } from './persistence/firestoreSync';
import './persistence/rosterSync'; // registers the roster-write listener
import { ProgramProvider, useProgram } from './programs/ProgramContext';
import ProgramGate from './programs/ProgramGate';
import ExpiryWall from './programs/ExpiryWall';
import AdminConsole from './programs/AdminConsole';

type View =
  | { kind: 'home' }
  | { kind: 'modules' }
  | { kind: 'knowledge-check' }
  | { kind: 'playground' }
  | { kind: 'admin' }
  | { kind: 'module'; module: ModuleConfig };

const navTargetForView = (view: View): NavTarget => {
  switch (view.kind) {
    case 'home': return 'home';
    case 'modules': return 'modules';
    case 'knowledge-check': return 'knowledge-check';
    case 'playground': return 'playground';
    case 'admin': return 'admin';
    case 'module': return 'modules';
  }
};

// ── Browser history integration ───────────────────────────────────────────
// The app is a single-page React app with no React Router — view changes
// were pure state, so the browser's back button bypassed our in-app navs
// and exited the site outright. The fix below mirrors each view change to
// `history.pushState` and reverses popstate events back into setView, so
// Chrome's back button feels like in-app back instead of "leave the site."
// On the home view we don't push (it's the entry point), so a back from
// home still leaves the SPA as expected.
function viewToKey(view: View): string {
  switch (view.kind) {
    case 'home': return 'home';
    case 'modules': return 'modules';
    case 'knowledge-check': return 'knowledge-check';
    case 'playground': return 'playground';
    case 'admin': return 'admin';
    case 'module': return `module:${view.module.id}`;
  }
}
function viewFromKey(key: string | undefined): View | null {
  if (!key) return null;
  if (key === 'home') return { kind: 'home' };
  if (key === 'modules') return { kind: 'modules' };
  if (key === 'knowledge-check') return { kind: 'knowledge-check' };
  if (key === 'playground') return { kind: 'playground' };
  if (key === 'admin') return { kind: 'admin' };
  if (key.startsWith('module:')) {
    const id = key.slice('module:'.length);
    const mod = MODULES.find(m => m.id === id);
    if (mod) return { kind: 'module', module: mod };
    return { kind: 'modules' }; // unknown id — fall back to modules list
  }
  return null;
}

/**
 * The pre-existing app body — view routing, history integration, and the
 * page shell. Unchanged apart from threading the signed-in learner's label
 * and a sign-out handler into TopNav. Always rendered inside AuthGate, so a
 * Firebase user is guaranteed to exist here.
 */
const AppShell: React.FC = () => {
  const { user, signOutUser } = useAuth();
  const { isAdmin } = useProgram();
  const [view, setView] = useState<View>({ kind: 'home' });

  // Seed history.state on first mount so subsequent popstate events have
  // something to land on instead of `null`. We use replaceState (not push)
  // so the user's existing back-history outside the SPA is preserved.
  useEffect(() => {
    if (!window.history.state || !window.history.state.__vw) {
      window.history.replaceState({ __vw: viewToKey({ kind: 'home' }) }, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push a new history entry whenever the view changes — but only when
  // the change came from in-app navigation, not from a popstate restoring
  // an earlier view. We detect that by comparing against history.state.
  useEffect(() => {
    const key = viewToKey(view);
    if (window.history.state?.__vw !== key) {
      window.history.pushState({ __vw: key }, '');
    }
  }, [view]);

  // Listen for popstate (browser back/forward) and restore the matching
  // view. If the popped state has no __vw marker, it's a navigation back
  // beyond our SPA entry — let the browser do its default thing.
  useEffect(() => {
    const onPop = (ev: PopStateEvent) => {
      const next = viewFromKey(ev.state?.__vw);
      if (next) setView(next);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleNav = (target: NavTarget) => {
    switch (target) {
      case 'home': return setView({ kind: 'home' });
      case 'modules': return setView({ kind: 'modules' });
      case 'knowledge-check': return setView({ kind: 'knowledge-check' });
      case 'playground': return setView({ kind: 'playground' });
      case 'admin': return setView({ kind: 'admin' });
    }
  };

  // The in-module shell renders its own chrome; the top nav is hidden there.
  if (view.kind === 'module') {
    const idx = MODULES.findIndex(m => m.id === view.module.id);
    const next = idx >= 0 && idx < MODULES.length - 1 ? MODULES[idx + 1] : undefined;
    return (
      <ModuleShell
        key={view.module.id}
        module={view.module}
        nextModule={next}
        onBack={() => setView({ kind: 'modules' })}
        onHome={() => setView({ kind: 'home' })}
        onNext={next ? () => setView({ kind: 'module', module: next }) : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-cream">
      <TopNav
        current={navTargetForView(view)}
        onNavigate={handleNav}
        userLabel={user?.displayName || user?.email || undefined}
        onSignOut={signOutUser}
        showAdmin={isAdmin}
      />
      <main className="flex-1">
        {view.kind === 'home' && (
          <Landing
            onBrowseModules={() => setView({ kind: 'modules' })}
            onOpenPlayground={() => setView({ kind: 'playground' })}
            onOpenModule={(mod) => setView({ kind: 'module', module: mod })}
          />
        )}
        {view.kind === 'modules' && (
          <>
            <ModulePicker
              onPickModule={(mod) => setView({ kind: 'module', module: mod })}
            />
            {/* Fix 4 — dev-only drop-off panel. Shift+? to toggle. */}
            <DebugDropOffPanel />
          </>
        )}
        {view.kind === 'knowledge-check' && (
          <KnowledgeCheckPage onBrowseModules={() => setView({ kind: 'modules' })} />
        )}
        {view.kind === 'playground' && (
          <div className="h-[calc(100vh-64px)]">
            <PlaygroundSim playgroundMode />
          </div>
        )}
        {view.kind === 'admin' && isAdmin && <AdminConsole />}
      </main>
    </div>
  );
};

/** Centered brand spinner shown while auth state resolves or progress is
 *  being pulled down from Firestore — the two brief windows before the
 *  app's normal views can safely assume localStorage is already populated. */
const SplashScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-brand-cream">
    <div className="w-12 h-12 rounded-full bg-brand-olive flex items-center justify-center">
      <Activity size={22} className="text-white" />
    </div>
    <div className="flex items-center gap-2 text-stone-500 text-[13px] font-semibold">
      <Loader2 size={14} className="animate-spin" /> {message}
    </div>
  </div>
);

/**
 * Auth gate — sits between AuthProvider and AppShell. Renders, in order:
 *   1. a splash while the initial Firebase auth check is in flight,
 *   2. the login screen if there's no signed-in user,
 *   3. a brief "syncing" splash while that user's Firestore progress is
 *      pulled down into the local cache for the first time this session,
 *   4. the real app.
 * Step 3 exists because every read in the app (ModulePicker, Landing,
 * TrackProgressStrip, etc.) reads progress synchronously from localStorage
 * on mount — the same assumption that held before Firebase existed. Doing
 * the pull-down BEFORE AppShell ever mounts preserves that assumption
 * instead of requiring every one of those call sites to become async.
 */
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [syncing, setSyncing] = useState(true);
  const syncedForUid = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      setActiveUserId(null);
      syncedForUid.current = null;
      setSyncing(false);
      return;
    }
    if (syncedForUid.current === user.uid) return; // already synced this session
    setActiveUserId(user.uid);
    setSyncing(true);
    syncProgressFromCloud(user.uid).finally(() => {
      syncedForUid.current = user.uid;
      setSyncing(false);
    });
  }, [user]);

  if (loading) return <SplashScreen message="Loading…" />;
  if (!user) return <LoginPage />;
  if (syncing) return <SplashScreen message="Syncing your progress…" />;
  return <>{children}</>;
};

/**
 * Program gate — sits between ProgramProvider and AppShell. Once auth +
 * progress-sync are done, this resolves the learner's program membership:
 *   - splash while profile/program load,
 *   - the join/create onboarding gate if they belong to no program,
 *   - the expiry wall if their program's access period has ended,
 *   - otherwise the app.
 */
const ProgramGateLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, needsOnboarding, blocked } = useProgram();
  if (loading) return <SplashScreen message="Loading your program…" />;
  if (needsOnboarding) return <ProgramGate />;
  if (blocked) return <ExpiryWall />;
  return <>{children}</>;
};

/**
 * Shown when the VITE_FIREBASE_* env vars weren't present in the build (e.g.
 * they weren't set on the host, or the site wasn't redeployed after adding
 * them). Prevents the blank-page crash that would otherwise happen when
 * Firebase initializes with an empty config, and names what's missing.
 */
const ConfigError: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-cream px-6 py-10">
    <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-sm p-7 text-center">
      <h1 className="font-display text-xl font-semibold text-zinc-900 mb-2">Configuration needed</h1>
      <p className="text-[13.5px] text-stone-600 leading-relaxed mb-4">
        This deployment is missing its Firebase configuration, so sign-in can't load.
        Set these environment variables on the host and redeploy:
      </p>
      <ul className="text-left text-[12px] font-mono bg-stone-50 border border-stone-200 rounded-lg p-3 mb-4 space-y-0.5 text-stone-700">
        {missingFirebaseKeys.map(k => <li key={k}>{k}</li>)}
      </ul>
      <p className="text-[11.5px] text-stone-400">
        On Vercel: Settings → Environment Variables → add them → then redeploy
        (env vars only apply to a new build).
      </p>
    </div>
  </div>
);

const App: React.FC = () => {
  if (!firebaseConfigured) return <ConfigError />;
  return (
    <AuthProvider>
      <AuthGate>
        <ProgramProvider>
          <ProgramGateLayer>
            <AppShell />
          </ProgramGateLayer>
        </ProgramProvider>
      </AuthGate>
    </AuthProvider>
  );
};

export default App;
