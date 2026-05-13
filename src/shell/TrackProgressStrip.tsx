import React from 'react';
import { MODULES } from '../modules';
import type { ModuleConfig, Track } from './types';
import { loadProgress } from '../persistence/progress';
import { trackTone } from './trackColors';

interface Props {
  /** Track to summarize — usually the current module's track. */
  track: Track;
  /** Optional id of the module that's about to be marked complete (so it
   *  paints as "complete" even before the persist flush lands). */
  highlightCompleteId?: string;
}

/**
 * C2: a one-line summary of the learner's progress through the current
 * track. Pill-ladder visual: filled = complete, half-fill = in-progress,
 * empty = not started. Sits above the debrief score card so the learner
 * sees the larger arc and feels momentum toward the next module.
 */
const TrackProgressStrip: React.FC<Props> = ({ track, highlightCompleteId }) => {
  const tone = trackTone(track);
  const inTrack: ModuleConfig[] = MODULES.filter(m => m.track === track);
  const states = inTrack.map(m => {
    const rec = loadProgress(m.id);
    if (m.id === highlightCompleteId) return 'complete' as const;
    if (rec?.quiz_submitted_at) return 'complete' as const;
    if (rec?.started_at) return 'in-progress' as const;
    return 'not-started' as const;
  });
  const completeCount = states.filter(s => s === 'complete').length;

  return (
    <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none">
          {track} track
        </span>
        <span className="text-[12px] font-bold leading-none mt-1" style={{ color: tone.hex }}>
          {completeCount} of {inTrack.length} complete
        </span>
      </div>
      <div className="flex-1 flex items-center gap-1">
        {inTrack.map((m, i) => {
          const s = states[i];
          const filled = s === 'complete';
          const half = s === 'in-progress';
          return (
            <div
              key={m.id}
              title={`${m.id} · ${m.title} — ${s}`}
              className="flex-1 h-2 rounded-full"
              style={{
                backgroundColor: filled
                  ? tone.hex
                  : half
                    ? `${tone.hex}55`
                    : '#e7e5e4',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TrackProgressStrip;
