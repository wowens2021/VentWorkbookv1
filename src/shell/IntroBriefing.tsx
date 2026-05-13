import React from 'react';
import { ArrowLeft, BookOpen, Clock, ChevronRight, Compass, Target } from 'lucide-react';
import type { ModuleConfig } from './types';
import { trackTone } from './trackColors';

interface Props {
  module: ModuleConfig;
  onBegin: () => void;
  onBack: () => void;
}

/**
 * One-time intro splash shown when the learner enters a module. Paints the
 * broad picture — what this module is about and what the learner will do —
 * before the primer quiz starts. Acknowledged via "Begin module →"; the
 * acknowledgment is persisted so resuming a module skips straight to the
 * normal phase flow.
 *
 * Falls back to generic copy when a module hasn't authored its own briefing.
 */
const IntroBriefing: React.FC<Props> = ({ module, onBegin, onBack }) => {
  const tone = trackTone(module.track);
  // Briefing content — authored if present, derived otherwise.
  const overview =
    module.briefing?.overview
    ?? `Welcome to ${module.title} — a module in the ${module.track} track. You'll work through a brief primer, read the core concepts, explore the simulator freely, then take on a task that puts the ideas into practice.`;

  // "What you'll do" bullets — authored first; fall back to learning
  // objectives if the author didn't author bullets; final fallback if neither.
  const bullets =
    module.briefing?.what_youll_do
    ?? module.visible_learning_objectives
    ?? [];

  return (
    <div className="flex flex-col h-screen bg-brand-cream text-zinc-900 font-sans overflow-hidden select-none">
      {/* Top nav strip — track-tinted to match the module shell. */}
      <div className={`flex items-center justify-between ${tone.bg} ${tone.fgOnSolid} px-5 py-2.5 shrink-0`}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-white/80 hover:text-white transition"
        >
          <ArrowLeft size={14} /> Back to simulations
        </button>
        <div className="flex items-center gap-2 text-[12px]">
          <BookOpen size={13} className="text-white/70" />
          <span className="font-bold text-white">{module.id}</span>
          <span className="text-white/40">·</span>
          <span className="text-[14px] font-semibold text-white/95">{module.title}</span>
        </div>
        <div className="w-[160px]" />
      </div>

      {/* Centered briefing card */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl bg-white border border-stone-200 rounded-2xl shadow-sm p-8">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-black uppercase tracking-widest ${tone.chipText} ${tone.chipBg} border ${tone.chipBorder} px-2 py-0.5 rounded`}>
              {module.track}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">{module.id}</span>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Clock size={11} /> {module.estimated_minutes} min
            </span>
          </div>

          <h1 className="font-display text-3xl font-semibold text-zinc-900 leading-tight tracking-tight mb-1">
            {module.title}
          </h1>
          <div className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 mb-6">
            Module briefing
          </div>

          {/* Overview */}
          <section className="mb-6">
            <div className="flex items-center gap-1.5 mb-2">
              <Compass size={13} className={tone.accentText} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${tone.accentText}`}>
                What's this about
              </span>
            </div>
            <p className="text-[15px] text-zinc-700 leading-relaxed">{overview}</p>
          </section>

          {/* What you'll do */}
          {bullets.length > 0 && (
            <section className="mb-7">
              <div className="flex items-center gap-1.5 mb-2">
                <Target size={13} className={tone.accentText} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${tone.accentText}`}>
                  What you'll do
                </span>
              </div>
              <ul className="space-y-1.5">
                {bullets.map((b, i) => (
                  <li key={i} className="text-[14px] text-zinc-700 leading-snug flex items-start gap-2">
                    <span className={`${tone.accentText} font-bold mt-0.5`}>{i + 1}.</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Footnote about the 5-phase flow */}
          <div className="text-[11.5px] text-zinc-500 italic mb-6 pb-5 border-b border-stone-100">
            The module walks you through five phases: a quick primer, a short
            reading, free exploration of the simulator, a clinical task, and
            a debrief with your score.
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <button
              onClick={onBegin}
              className={`flex items-center gap-1.5 px-5 py-2.5 ${tone.bg} ${tone.bgHover} ${tone.fgOnSolid} text-sm font-bold rounded-lg transition shadow-sm`}
            >
              Begin module <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroBriefing;
