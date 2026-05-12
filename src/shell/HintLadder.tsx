import React, { useEffect, useState } from 'react';
import { Lightbulb, Eye, X } from 'lucide-react';
import type { HintConfig } from './types';

interface Props {
  hint: HintConfig;
  /** Number of ms since the last relevant sim interaction. */
  idleMs: number;
  /** Called when learner clicks "Show me". */
  onShowMe?: () => void;
  /** Called when a tier appears for the first time. */
  onTierTriggered?: (tier: 1 | 2 | 3) => void;
  /** When true, the ladder is fully suppressed. */
  suppressed?: boolean;
}

const HintLadder: React.FC<Props> = ({ hint, idleMs, onShowMe, onTierTriggered, suppressed }) => {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [seen, setSeen] = useState<Set<number>>(new Set());

  const intervals = hint.intervals_seconds ?? [60, 120, 180];
  const tier =
    idleMs >= intervals[2] * 1000 ? 3 :
    idleMs >= intervals[1] * 1000 ? 2 :
    idleMs >= intervals[0] * 1000 ? 1 : 0;

  useEffect(() => {
    if (suppressed) return;
    if (tier > 0 && !seen.has(tier)) {
      setSeen(s => new Set([...s, tier]));
      onTierTriggered?.(tier as 1 | 2 | 3);
    }
  }, [tier, suppressed]);

  if (suppressed || tier === 0 || dismissed.has(tier)) return null;

  const message =
    tier === 1 ? hint.tier1 :
    tier === 2 ? hint.tier2 :
    hint.tier3?.hint_text ?? 'Stuck? Use "Show me" to see the answer played out.';

  // "Show me" is always available at tier 3 — either runs a demonstration if
  // one is configured, or simply nudges the learner with an emphatic re-state.
  const showMeAvailable = tier === 3 && !!onShowMe;

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg px-3.5 py-2.5 flex items-start gap-2 mb-3 shadow-sm">
      <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 text-[13px] font-semibold text-amber-900 leading-snug">
        {message}
        {showMeAvailable && (
          <button
            onClick={onShowMe}
            className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-black rounded transition shadow-sm"
          >
            <Eye size={12} /> Show me
          </button>
        )}
      </div>
      <button
        onClick={() => setDismissed(d => new Set([...d, tier]))}
        className="text-amber-600 hover:text-amber-700 shrink-0"
        aria-label="Dismiss hint"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default HintLadder;
