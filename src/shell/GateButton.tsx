import React from 'react';
import { Lock, ChevronRight } from 'lucide-react';

interface Props {
  enabled: boolean;
  pulse?: boolean;
  onClick: () => void;
  label?: string;
}

const GateButton: React.FC<Props> = ({ enabled, pulse, onClick, label = 'Continue to knowledge check' }) => {
  if (!enabled) {
    return (
      <button
        disabled
        title="Keep exploring the simulator."
        className="w-full mt-6 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-600 text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed"
      >
        <Lock size={14} /> {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`w-full mt-6 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/50 ${
        pulse ? 'animate-pulse' : ''
      }`}
    >
      {label} <ChevronRight size={16} />
    </button>
  );
};

export default GateButton;
