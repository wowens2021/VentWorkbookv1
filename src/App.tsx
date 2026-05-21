import React, { useEffect, useState } from 'react';
import PlaygroundSim from './components/PlaygroundSim';
import ModulePicker from './components/ModulePicker';
import Landing from './components/Landing';
import KnowledgeCheckPage from './components/KnowledgeCheckPage';
import TopNav, { type NavTarget } from './components/TopNav';
import ModuleShell from './shell/ModuleShell';
import DebugDropOffPanel from './shell/DebugDropOffPanel';
import { MODULES } from './modules';
import type { ModuleConfig } from './shell/types';

type View =
  | { kind: 'home' }
  | { kind: 'modules' }
  | { kind: 'knowledge-check' }
  | { kind: 'playground' }
  | { kind: 'module'; module: ModuleConfig };

const navTargetForView = (view: View): NavTarget => {
  switch (view.kind) {
    case 'home': return 'home';
    case 'modules': return 'modules';
    case 'knowledge-check': return 'knowledge-check';
    case 'playground': return 'playground';
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
    case 'module': return `module:${view.module.id}`;
  }
}
function viewFromKey(key: string | undefined): View | null {
  if (!key) return null;
  if (key === 'home') return { kind: 'home' };
  if (key === 'modules') return { kind: 'modules' };
  if (key === 'knowledge-check') return { kind: 'knowledge-check' };
  if (key === 'playground') return { kind: 'playground' };
  if (key.startsWith('module:')) {
    const id = key.slice('module:'.length);
    const mod = MODULES.find(m => m.id === id);
    if (mod) return { kind: 'module', module: mod };
    return { kind: 'modules' }; // unknown id — fall back to modules list
  }
  return null;
}

const App: React.FC = () => {
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
      <TopNav current={navTargetForView(view)} onNavigate={handleNav} />
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
      </main>
    </div>
  );
};

export default App;
