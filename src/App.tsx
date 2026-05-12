import React, { useState } from 'react';
import PlaygroundSim from './components/PlaygroundSim';
import ModulePicker from './components/ModulePicker';
import Landing from './components/Landing';
import KnowledgeCheckPage from './components/KnowledgeCheckPage';
import TopNav, { type NavTarget } from './components/TopNav';
import ModuleShell from './shell/ModuleShell';
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

const App: React.FC = () => {
  const [view, setView] = useState<View>({ kind: 'home' });

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
        onBack={() => setView({ kind: 'modules' })}
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
          <ModulePicker
            onPickModule={(mod) => setView({ kind: 'module', module: mod })}
          />
        )}
        {view.kind === 'knowledge-check' && (
          <KnowledgeCheckPage onBrowseModules={() => setView({ kind: 'modules' })} />
        )}
        {view.kind === 'playground' && (
          <div className="h-[calc(100vh-64px)]">
            <PlaygroundSim />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
