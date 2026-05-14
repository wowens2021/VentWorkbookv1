import type { ModuleConfig, TrackerConfig } from '../shell/types';
import { M1 } from './M1';
import { M2 } from './M2';
import { M3 } from './M3';            // Basic Vent Adjustments (Foundations)
import { M4 } from './M4';
import { M5, M6 } from './M5_M6';
import { M_EOM } from './M_EOM';      // Equation of Motion (Physiology, after M5)
import { M7, M8 } from './M7_M8';
import { M9, M10 } from './M9_M10';
import { M11, M12 } from './M11_M12';
import { M13, M14 } from './M13_M14';
import { M15, M16 } from './M15_M16';
import { M17, M18, M19 } from './M17_M18_M19';

// Curriculum order: Foundations (M1–M3), then Physiology (M4 → M5 →
// M-EOM → M6), then Modes/Strategy/Weaning/Synthesis. The picker
// groups by track but preserves array order within each, so M-EOM
// slots in between Gas Exchange Basics (M5) and Auto-PEEP (M6).
export const MODULES: ModuleConfig[] = [
  M1, M2, M3,
  M4, M5, M_EOM, M6,
  M7, M8, M9, M10,
  M11, M12, M13, M14, M15, M16, M17, M18, M19,
];

export const MODULE_BY_ID: Record<string, ModuleConfig> = Object.fromEntries(
  MODULES.map(m => [m.id, m]),
);

/**
 * Anti-pattern A2 guard (MASTER_SHELL_v3 §8): prompt_id must be globally
 * unique across modules. Duplicates cause subscriber-mux confusion when
 * multiple trackers think the same recognition_response is theirs.
 *
 * This walks every module's hidden_objective and every inline_prompt in
 * the scenario, collects every prompt_id, and throws loudly at startup if
 * any duplicates exist. Throwing here means the dev sees the problem in
 * the browser console the moment they reload; the alternative — silent
 * cross-contamination at runtime — is much worse.
 *
 * Convention: prompt_ids should be `{moduleId}-{shortname}` (e.g.
 * `M1-peak`, `M11-3`, `M19-2`). The check doesn't enforce convention,
 * just uniqueness.
 */
function collectPromptIds(tracker: TrackerConfig | undefined, into: Map<string, string>, moduleId: string) {
  if (!tracker) return;
  if (tracker.kind === 'recognition') {
    const existing = into.get(tracker.prompt.prompt_id);
    if (existing && existing !== moduleId) {
      throw new Error(
        `[modules] Duplicate prompt_id "${tracker.prompt.prompt_id}" — used by ${existing} and ${moduleId}. ` +
          `prompt_id must be globally unique across all modules (per MASTER_SHELL_v3 §8 A2).`,
      );
    }
    into.set(tracker.prompt.prompt_id, moduleId);
  } else if (tracker.kind === 'compound') {
    tracker.children.forEach(child => collectPromptIds(child, into, moduleId));
  }
}

(function validatePromptIdUniqueness() {
  const seen = new Map<string, string>();
  for (const mod of MODULES) {
    collectPromptIds(mod.hidden_objective, seen, mod.id);
    (mod.scenario.inline_prompts ?? []).forEach(p => {
      const existing = seen.get(p.prompt_id);
      if (existing && existing !== mod.id) {
        throw new Error(
          `[modules] Duplicate prompt_id "${p.prompt_id}" — used by ${existing} and ${mod.id}.`,
        );
      }
      seen.set(p.prompt_id, mod.id);
    });
  }
})();
