import React, { useState } from 'react';
import PlaygroundSim from './components/PlaygroundSim';
import ModulePicker from './components/ModulePicker';
import ModuleShell from './shell/ModuleShell';
import { MODULES } from './modules';
import type { ModuleConfig } from './shell/types';

type View =
  | { kind: 'picker' }
  | { kind: 'playground' }
  | { kind: 'module'; module: ModuleConfig };

const App: React.FC = () => {
  const [view, setView] = useState<View>({ kind: 'picker' });

  if (view.kind === 'playground') {
    return (
      <div className="relative">
        <PlaygroundSim />
        <button
          onClick={() => setView({ kind: 'picker' })}
          className="fixed top-3 left-3 z-[500] px-3 py-1.5 bg-white border border-zinc-300 hover:border-sky-500 rounded text-[11px] font-bold text-zinc-700 hover:text-white transition shadow-lg"
        >
          ← Back to modules
        </button>
      </div>
    );
  }

  if (view.kind === 'module') {
    const idx = MODULES.findIndex(m => m.id === view.module.id);
    const next = idx >= 0 && idx < MODULES.length - 1 ? MODULES[idx + 1] : undefined;
    return (
      <ModuleShell
        key={view.module.id}
        module={view.module}
        onBack={() => setView({ kind: 'picker' })}
        onNext={next ? () => setView({ kind: 'module', module: next }) : undefined}
      />
    );
  }

  return (
    <ModulePicker
      onPickModule={mod => setView({ kind: 'module', module: mod })}
      onOpenPlayground={() => setView({ kind: 'playground' })}
    />
  );
};

export default App;
