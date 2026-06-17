import type { ModuleConfig, TrackerConfig } from '../shell/types';
// M1 is now the combined "Why We Ventilate & The Vent Display" module
// (legacy M1 + M2 merged per the M1M2_M4a_M4b shell spec). The legacy
// standalone M2 module is retired; its file is kept for back-compat
// but is no longer registered.
import { M1 } from './M1';
import { M3 } from './M3';            // Basic Vent Adjustments (Foundations)
// Legacy M4 ("Compliance and Resistance") is split into two focused
// Physiology modules with descriptive ids: 'compliance' and 'resistance'.
import { Compliance } from './Compliance';
import { Resistance } from './Resistance';
import { M5, M6 } from './M5_M6';
// M_EOM (Equation of Motion) retired — the equation-of-motion concept
// is folded into M4a/M4b and the EOM-specific module is removed from
// the registry. Source file kept on disk for back-compat.
import { M7, M8 } from './M7_M8';
// M9 (PRVC and Dual-Control Ventilation) is registered as its own
// standalone Modes module. It was briefly folded into M8 as a 5-minute
// addendum but pulled back out — per user feedback, hybrid / dual-control
// modes deserve their own module rather than tagging on to PCV.
import { M9, M10 } from './M9_M10';
import { M11, M12 } from './M11_M12';
// M13 and M14 are merged into a single Advanced-Topics module
// (id: 'M13_M14_merged') per docs/M13_M14_merged_shell_spec.pdf.
// The exported variable is still named M13 for back-compat; M14 is
// retired.
import { M13 } from './M13_M14';
import { M15, M16 } from './M15_M16';
import { M17, M18, M19 } from './M17_M18_M19';
// New Clinical-Skills capstone built from
// docs/Troubleshooting_2AM_v3.pdf — DOPES, four problem-specific
// first steps, and three cases at 2:45 AM.
import { M_TROUBLESHOOT } from './M_TROUBLESHOOT';

// Renumber after the M1+M2 merge and the M4 split: the new module
// Display numbers (the "M{n}" label in the picker) follow the picker's
// TRACK_ORDER traversal so they read strictly 1→19 as the learner
// scrolls. Note this is NOT array order — the picker groups by track,
// and Strategy is shown before Advanced Topics, so M15/M16 (Strategy)
// number ahead of M13 (Advanced Topics) even though M13 precedes them
// in the MODULES array. The raw string ids (M13_M14_merged, compliance,
// etc.) are unaffected — only the displayed number changes.
//
// Foundations
M1.number = 1;
M3.number = 2;
// Physiology
Compliance.number = 3;
Resistance.number = 4;
M5.number = 5;
M6.number = 6;
// Modes
M7.number = 7;
M8.number = 8;
M9.number = 9;
M10.number = 10;
M11.number = 11;
M12.number = 12;
// Strategy
M15.number = 13;
M16.number = 14;
// Advanced Topics
M13.number = 15;
// Weaning
M17.number = 16;
M18.number = 17;
// Synthesis
M19.number = 18;
// Clinical Skills
M_TROUBLESHOOT.number = 19;

// Curriculum order: Foundations (combined M1, M3), then Physiology
// (M4a → M4b → M5 → M-EOM → M6), then Modes/Strategy/Weaning/Synthesis.
// The picker groups by track but preserves array order within each.
export const MODULES: ModuleConfig[] = [
  M1, M3,
  Compliance, Resistance, M5, M6,
  M7, M8, M9, M10,
  M11, M12, M13, M15, M16, M17, M18, M19,
  M_TROUBLESHOOT,
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
