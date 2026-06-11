import type { ModuleConfig, TrackerConfig } from '../shell/types';
// M1 is now the combined "Why We Ventilate & The Vent Display" module
// (legacy M1 + M2 merged per the M1M2_M4a_M4b shell spec). The legacy
// standalone M2 module is retired; its file is kept for back-compat
// but is no longer registered.
import { M1 } from './M1';
import { M3 } from './M3';            // Basic Vent Adjustments (Foundations)
// Legacy M4 ("Compliance and Resistance") is split into two focused
// Physiology modules: M4a (Compliance) and M4b (Resistance).
import { M4a } from './M4a';
import { M4b } from './M4b';
import { M5, M6 } from './M5_M6';
// M_EOM (Equation of Motion) retired — the equation-of-motion concept
// is folded into M4a/M4b and the EOM-specific module is removed from
// the registry. Source file kept on disk for back-compat.
import { M7, M8 } from './M7_M8';
// Fix 5 (Option A) — M9 (PRVC, standalone) folded into M8 as a
// "dual-control variants" read-phase section. M9 is still defined in
// src/modules/M9_M10.ts (kept so any legacy progress records pointing
// at id 'M9' don't error on lookup), but is removed from the MODULES
// array and from MODULE_BY_ID. The remaining modules' .number fields
// shift down by 1 from this point forward so the picker labels stay
// dense (1–18 with no gap), even though their string ids (e.g. 'M10')
// stay as written.
import { /* M9, */ M10 } from './M9_M10';
import { M11, M12 } from './M11_M12';
// M13 and M14 are merged into a single Advanced-Topics module
// (id: 'M13_M14_merged') per docs/M13_M14_merged_shell_spec.pdf.
// The exported variable is still named M13 for back-compat; M14 is
// retired.
import { M13 } from './M13_M14';
import { M15, M16 } from './M15_M16';
import { M17, M18, M19 } from './M17_M18_M19';

// Renumber after the M1+M2 merge and the M4 split: the new module
// order is M1(combined), M3, M4a, M4b, M5, M-EOM, M6, M7, M8, M10,
// M11–M19 — total 18 entries, display numbers 1..18.
M1.number = 1;
M3.number = 2;
M4a.number = 3;
M4b.number = 4;
M5.number = 5;
M6.number = 6;
M7.number = 7;
M8.number = 8;
M10.number = 9;
M11.number = 10;
M12.number = 11;
M13.number = 12;
M15.number = 13;
M16.number = 14;
M17.number = 15;
M18.number = 16;
M19.number = 17;

// Curriculum order: Foundations (combined M1, M3), then Physiology
// (M4a → M4b → M5 → M-EOM → M6), then Modes/Strategy/Weaning/Synthesis.
// The picker groups by track but preserves array order within each.
export const MODULES: ModuleConfig[] = [
  M1, M3,
  M4a, M4b, M5, M6,
  M7, M8, M10,
  M11, M12, M13, M15, M16, M17, M18, M19,
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
