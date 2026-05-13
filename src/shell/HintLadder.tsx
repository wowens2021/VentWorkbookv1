import React, { useState } from 'react';
import { Lightbulb, Eye, X } from 'lucide-react';
import type { HintConfig } from './types';

interface Props {
  hint: HintConfig;
  /** Number of ms since the last relevant sim interaction. */
  idleMs: number;
  /**
   * B3: number of control changes since the last forward progress on the
   * tracker. Active learners stuck in a loop never go idle, so idle-only
   * trigger never fires for them. This signal surfaces a tier when the
   * learner has made N moves without nudging the tracker forward.
   */
  changesSinceProgress?: number;
  /** Called when learner clicks "Show me". Always counts as tier-3 engagement. */
  onShowMe?: () => void;
  /**
   * Called when the learner ACTUALLY engages with a tier — they either
   * dismissed the hint card or clicked "Show me". Auto-surfacing a card on
   * idle does NOT call this; if the learner ignores it, the hint isn't
   * counted toward their score penalty.
   */
  onTierTriggered?: (tier: 1 | 2 | 3) => void;
  /** When true, the ladder is fully suppressed. */
  suppressed?: boolean;
}

const HintLadder: React.FC<Props> = ({ hint, idleMs, changesSinceProgress = 0, onShowMe, onTierTriggered, suppressed }) => {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  // F7: tighter cadence. Confused learners abandon long before 60 s of idle —
  // tier 1 at 25 s gets them help while they still care.
  const intervals = hint.intervals_seconds ?? [25, 75, 150];
  // B3: parallel thresholds for control-changes without progress. A learner
  // actively trying but stuck in a loop never goes idle, so the idle timer
  // never escalates — these change-count thresholds catch that case.
  const changeThresholds = [5, 10, 15];
  const tierFromIdle =
    idleMs >= intervals[2] * 1000 ? 3 :
    idleMs >= intervals[1] * 1000 ? 2 :
    idleMs >= intervals[0] * 1000 ? 1 : 0;
  const tierFromChanges =
    changesSinceProgress >= changeThresholds[2] ? 3 :
    changesSinceProgress >= changeThresholds[1] ? 2 :
    changesSinceProgress >= changeThresholds[0] ? 1 : 0;
  // Surface whichever tier is higher — generous to the learner.
  const tier = Math.max(tierFromIdle, tierFromChanges) as 0 | 1 | 2 | 3;

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
            onClick={() => {
              // Show Me always counts as the strongest hint engagement (tier 3).
              onTierTriggered?.(3);
              onShowMe?.();
            }}
            className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-black rounded transition shadow-sm"
          >
            <Eye size={12} /> Show me
          </button>
        )}
      </div>
      <button
        onClick={() => {
          // Dismissing the hint card is the explicit "I read it" signal — only
          // count the tier toward the score penalty when the learner does this
          // (or clicks Show Me). Auto-surfacing alone isn't counted.
          setDismissed(d => new Set([...d, tier]));
          onTierTriggered?.(tier as 1 | 2 | 3);
        }}
        className="text-amber-600 hover:text-amber-700 shrink-0"
        aria-label="Dismiss hint"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default HintLadder;
