import React from 'react';
import { Sparkles, RotateCcw, ChevronRight, Sliders, Activity } from 'lucide-react';
import type { ExploreCardConfig } from './types';

interface Props {
  config: ExploreCardConfig;
  onReset: () => void;
  onStartTask: () => void;
}

/**
 * Phase 3 — Explore card.
 * "Try the controls. Nothing counts yet."
 * §1.4 Phase 3.
 */
const ExploreCard: React.FC<Props> = ({ config, onReset, onStartTask }) => {
  return (
    <div className="h-full flex flex-col px-5 py-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-sky-600" />
        <h2 className="text-lg font-bold text-zinc-900 leading-tight">
          Try the controls. <span className="text-zinc-500 font-medium">Nothing counts yet.</span>
        </h2>
      </div>

      {config.patient_context && (
        <p className="text-[14px] text-zinc-700 leading-relaxed mb-4 pb-3 border-b border-zinc-200">
          {config.patient_context}
        </p>
      )}

      {/* Unlocked controls */}
      {config.unlocked_controls_description.length > 0 && (
        <section className="mb-4">
          <div className="flex items-center gap-1.5 mb-1.5 text-zinc-500">
            <Sliders size={12} />
            <span className="text-[11px] font-black uppercase tracking-widest">Controls you can use</span>
          </div>
          <ul className="space-y-1.5">
            {config.unlocked_controls_description.map((c, i) => (
              <li key={i} className="text-[13px] leading-snug">
                <strong className="text-zinc-900">{c.name}</strong>
                <span className="text-zinc-600"> — {c.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Readouts */}
      {config.readouts_description.length > 0 && (
        <section className="mb-4">
          <div className="flex items-center gap-1.5 mb-1.5 text-zinc-500">
            <Activity size={12} />
            <span className="text-[11px] font-black uppercase tracking-widest">Readouts to watch</span>
          </div>
          <ul className="space-y-1.5">
            {config.readouts_description.map((r, i) => (
              <li key={i} className="text-[13px] leading-snug">
                <strong className="text-zinc-900">{r.name}</strong>
                <span className="text-zinc-600"> — {r.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Suggestions */}
      {config.suggestions.length > 0 && (
        <section className="mb-4">
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
            Suggestions
          </span>
          <ul className="space-y-1.5">
            {config.suggestions.map((s, i) => (
              <li key={i} className="text-[13px] text-zinc-700 leading-snug flex items-start gap-1.5">
                <span className="text-sky-600 mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-auto flex items-center gap-2 pt-4 border-t border-zinc-200">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg text-[12px] font-bold text-zinc-700 transition"
        >
          <RotateCcw size={13} /> Reset to start
        </button>
        <button
          onClick={onStartTask}
          title="When you're ready, the patient will need your help."
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition shadow-sm"
        >
          Start the task <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default ExploreCard;
