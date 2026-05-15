// ─── Scenario Harness ──────────────────────────────────────────────────────
// Implements §2 of master_shell_plan.md. Thin pub-sub layer between the
// PlaygroundSim and the tracker primitives. The sim is the source of truth
// for state; the harness normalizes its events and dispatches to subscribers.

import type {
  Scenario, ControlName, ReadoutName, InlinePromptConfig, PerturbationSpec,
} from '../shell/types';
import type { HarnessEvent } from '../trackers';

type Subscriber = (ev: HarnessEvent) => void;

export class ScenarioHarness {
  private subscribers: Subscriber[] = [];
  private promptListeners: ((prompt: InlinePromptConfig) => void)[] = [];
  private resetListeners: (() => void)[] = [];
  // v3.2 §9 — perturbation channel. PlaygroundSim subscribes; trackers push.
  private perturbationListeners: ((p: PerturbationSpec | null) => void)[] = [];
  private activePerturbation: PerturbationSpec | null = null;
  private snapshotProvider: (() => any) | null = null;
  private resetProvider: (() => void) | null = null;

  baseline_controls: Partial<Record<ControlName, number>> = {};

  constructor(public scenario: Scenario) {
    // Snapshot baseline values from the preset
    const s = scenario.preset.settings ?? {};
    const p = scenario.preset.patient ?? {};
    (Object.keys(s) as ControlName[]).forEach(k => {
      const v = (s as any)[k];
      if (typeof v === 'number') this.baseline_controls[k] = v;
    });
    (Object.keys(p) as ControlName[]).forEach(k => {
      const v = (p as any)[k];
      if (typeof v === 'number') this.baseline_controls[k] = v;
    });
  }

  // ── Pub/sub for tracker events ──
  subscribe(fn: Subscriber): () => void {
    this.subscribers.push(fn);
    return () => { this.subscribers = this.subscribers.filter(s => s !== fn); };
  }
  emit(ev: HarnessEvent) {
    this.subscribers.forEach(s => s(ev));
  }

  // ── Sim drivers register their snapshot/reset implementations ──
  registerSnapshotProvider(fn: () => any) { this.snapshotProvider = fn; }
  registerResetProvider(fn: () => void) { this.resetProvider = fn; }

  snapshot(): any { return this.snapshotProvider?.() ?? null; }
  resetToPreset() {
    // v3.2 §9.3 — resetting the sim always clears any active perturbation
    // so the next baseline reflects the preset, not the last scripted
    // state. Compounds with `reset_between` rely on this for M19.
    this.clearPerturbations();
    this.resetProvider?.();
    this.resetListeners.forEach(l => l());
  }
  onReset(fn: () => void): () => void {
    this.resetListeners.push(fn);
    return () => { this.resetListeners = this.resetListeners.filter(l => l !== fn); };
  }

  // ── v3.2 §9 perturbation channel ──
  /**
   * Apply a scripted state override on top of the current preset. The sim
   * subscribes via `onPerturbation` and re-merges its `settings`/`patient`
   * state. Replaces any previous perturbation (one active at a time).
   */
  applyPerturbation(p: PerturbationSpec) {
    this.activePerturbation = p;
    this.perturbationListeners.forEach(l => l(p));
  }
  /** Restore baseline preset values. Called by `resetToPreset` and by
   *  trackers on `satisfied`. */
  clearPerturbations() {
    if (!this.activePerturbation) return;
    this.activePerturbation = null;
    this.perturbationListeners.forEach(l => l(null));
  }
  /** Current active perturbation (for sim mount-time sync). */
  currentPerturbation(): PerturbationSpec | null { return this.activePerturbation; }
  onPerturbation(fn: (p: PerturbationSpec | null) => void): () => void {
    this.perturbationListeners.push(fn);
    return () => { this.perturbationListeners = this.perturbationListeners.filter(l => l !== fn); };
  }

  // ── Inline recognition prompts ──
  onPrompt(fn: (prompt: InlinePromptConfig) => void): () => void {
    this.promptListeners.push(fn);
    return () => { this.promptListeners = this.promptListeners.filter(l => l !== fn); };
  }
  presentPrompt(prompt: InlinePromptConfig) {
    this.promptListeners.forEach(l => l(prompt));
  }

  // ── Lock query ──
  isLocked(control: ControlName): boolean {
    return !this.scenario.unlocked_controls.includes(control);
  }
}

export type { HarnessEvent };
export type { ReadoutName };
