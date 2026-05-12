// ─── Scenario Harness ──────────────────────────────────────────────────────
// Implements §2 of master_shell_plan.md. Thin pub-sub layer between the
// PlaygroundSim and the tracker primitives. The sim is the source of truth
// for state; the harness normalizes its events and dispatches to subscribers.

import type {
  Scenario, ControlName, ReadoutName, InlinePromptConfig,
} from '../shell/types';
import type { HarnessEvent } from '../trackers';

type Subscriber = (ev: HarnessEvent) => void;

export class ScenarioHarness {
  private subscribers: Subscriber[] = [];
  private promptListeners: ((prompt: InlinePromptConfig) => void)[] = [];
  private resetListeners: (() => void)[] = [];
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
    this.resetProvider?.();
    this.resetListeners.forEach(l => l());
  }
  onReset(fn: () => void): () => void {
    this.resetListeners.push(fn);
    return () => { this.resetListeners = this.resetListeners.filter(l => l !== fn); };
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
