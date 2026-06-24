// ─── Scenario Harness ──────────────────────────────────────────────────────
// Implements §2 of master_shell_plan.md. Thin pub-sub layer between the
// PlaygroundSim and the tracker primitives. The sim is the source of truth
// for state; the harness normalizes its events and dispatches to subscribers.

import type {
  Scenario, ControlName, ReadoutName, InlinePromptConfig, PerturbationSpec,
} from '../shell/types';
import type { HarnessEvent } from '../trackers';

type Subscriber = (ev: HarnessEvent) => void;

/**
 * One entry in the unified shell notification stack. `kind` controls
 * the icon/color; `id` is stable so a source can replace its own
 * notification without piling duplicates.
 */
export interface ShellNotification {
  id: string;
  kind: 'alert' | 'hint' | 'prompt' | 'reminder';
  message: string;
  dismissable: boolean;
}

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

  /**
   * Unified notifications system. Every in-app alert / soft prompt /
   * idle reminder / hint surfaces here so the learner sees one
   * consolidated stack at the top-right of the viewport instead of
   * three competing UIs (AlertContainer toast + workbook Hints panel
   * + ModuleShell soft-prompt chip + fixed idle-reminder toast).
   *
   * Sources call `notify` and get back an id; later they can dismiss
   * via `dismiss(id)` to retract a notification when its triggering
   * condition resolves. Stable string ids (e.g. `pplat-high`) let a
   * source replace its own notification by id without piling
   * duplicates.
   */
  private _notifications: ShellNotification[] = [];
  private _nextNotifId = 1;
  private notifListeners: ((list: ShellNotification[]) => void)[] = [];
  notify(n: { kind: ShellNotification['kind']; message: string; id?: string; dismissable?: boolean; autoDismissMs?: number }): string {
    const id = n.id ?? `n${this._nextNotifId++}`;
    // Replace by id if present, else append.
    const idx = this._notifications.findIndex(x => x.id === id);
    const entry: ShellNotification = { id, kind: n.kind, message: n.message, dismissable: n.dismissable ?? true };
    if (idx >= 0) this._notifications[idx] = entry; else this._notifications = [...this._notifications, entry];
    this.notifListeners.forEach(l => l(this._notifications));
    if (n.autoDismissMs && n.autoDismissMs > 0) {
      const ms = n.autoDismissMs;
      setTimeout(() => this.dismiss(id), ms);
    }
    return id;
  }
  dismiss(id: string) {
    const before = this._notifications.length;
    this._notifications = this._notifications.filter(n => n.id !== id);
    if (this._notifications.length !== before) {
      this.notifListeners.forEach(l => l(this._notifications));
    }
  }
  getNotifications(): ShellNotification[] { return this._notifications; }
  onNotifications(fn: (list: ShellNotification[]) => void): () => void {
    this.notifListeners.push(fn);
    return () => { this.notifListeners = this.notifListeners.filter(l => l !== fn); };
  }

  /**
   * v3 Troubleshooting spec — active-step clinical findings exposed
   * to the Auscultate / Examine-patient buttons in PlaygroundSim.
   * ModuleShell calls `setActiveFindings` when a tracker step
   * activates; PlaygroundSim reads the latest snapshot when the
   * button is clicked.
   */
  private _activeFindings: { auscultation?: string; exam?: string } | null = null;
  private findingsListeners: ((f: { auscultation?: string; exam?: string } | null) => void)[] = [];
  setActiveFindings(f: { auscultation?: string; exam?: string } | null) {
    this._activeFindings = f;
    this.findingsListeners.forEach(l => l(f));
  }
  getActiveFindings(): { auscultation?: string; exam?: string } | null { return this._activeFindings; }
  onFindings(fn: (f: { auscultation?: string; exam?: string } | null) => void): () => void {
    this.findingsListeners.push(fn);
    return () => { this.findingsListeners = this.findingsListeners.filter(l => l !== fn); };
  }

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

  // ── Drive-control channel ──
  // Lets the shell (specifically the "Show Me" hint) actually move a
  // control on the sim, rather than only emitting a tracker event. The
  // PlaygroundSim subscribes via `onDriveControl` and applies the value
  // to its real settings/patient state (and, for the hold pseudo-
  // controls, triggers the maneuver). Applying the value is what makes
  // the demonstrated change visible on the waveform and what advances a
  // gated step.
  private driveListeners: ((control: ControlName, value: number) => void)[] = [];
  driveControl(control: ControlName, value: number) {
    this.driveListeners.forEach(l => l(control, value));
  }
  onDriveControl(fn: (control: ControlName, value: number) => void): () => void {
    this.driveListeners.push(fn);
    return () => { this.driveListeners = this.driveListeners.filter(l => l !== fn); };
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
