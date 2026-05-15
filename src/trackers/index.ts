// ─── Hidden-Objective Tracker Primitives ────────────────────────────────────
// Implements §3 of master_shell_plan.md: Manipulation, Outcome, Recognition,
// and Compound trackers. Each is a plain class that subscribes to harness
// events and fires `satisfied` exactly once.

import type {
  TrackerConfig,
  ManipulationTrackerConfig,
  OutcomeTrackerConfig,
  RecognitionTrackerConfig,
  CompoundTrackerConfig,
  ComparisonCondition,
  ReadoutCondition,
  ReadoutName,
  ControlName,
  InlinePromptConfig,
  PerturbationSpec,
} from '../shell/types';

// ── Events emitted by the harness ──
export type HarnessEvent =
  | { type: 'control_changed'; control: ControlName; old_value: any; new_value: any; timestamp: number }
  | { type: 'sim_tick'; breath_number: number; computed_readouts: Partial<Record<ReadoutName, number | boolean>>; timestamp: number }
  | { type: 'recognition_response'; prompt_id: string; selected_label: string; is_correct: boolean; timestamp: number }
  | { type: 'demonstration_played'; control: ControlName; timestamp: number };

export interface TrackerContext {
  /** Snapshot of preset baseline values (for delta_pct comparisons). */
  baseline_controls: Partial<Record<ControlName, number>>;
  /** Push a recognition prompt onto the sim panel inline UI. */
  presentPrompt(prompt: InlinePromptConfig): void;
  /** Reset the sim back to its preset (used between compound children). */
  resetToPreset(): void;
  /** F4: announce step completion in a compound flow (idx is 0-based). */
  notifyStepComplete?(idx: number, total: number): void;
  /** F5: clear any inline prompt currently presented (used on reset_between). */
  clearActivePrompt?(): void;
  /** F3: announce per-child satisfaction in a compound flow. */
  onProgress?(states: boolean[]): void;
  /**
   * B2: announce partial progress toward a sustain-breath outcome
   * ("3 of 5 breaths within range"). Fires on every sim_tick from the active
   * OutcomeTracker. Null means no in-flight progress (either there's no
   * outcome-tracker child active, or it has just fired `satisfied`).
   *
   * Per novice-pass §15.2: `byReadout` is the live per-criterion breakdown
   * so TaskCard can render which specific readout is the bottleneck on a
   * compound outcome.
   */
  onOutcomeProgress?(
    progress: {
      current: number;
      target: number;
      label?: string;
      byReadout?: { name: ReadoutName; current: number | boolean; threshold: number | boolean; operator: string; passing: boolean }[];
    } | null,
  ): void;
  /**
   * v3.2 §9 — scripted sim-state override. RecognitionTracker calls
   * `applyPerturbation` from `start()` when its config has a perturbation
   * field, and `clearPerturbations` when satisfied. The harness routes both
   * to PlaygroundSim.
   */
  applyPerturbation?(p: PerturbationSpec): void;
  clearPerturbations?(): void;
}

export interface Tracker {
  /** Wire up listeners. Called once at module mount. */
  start(ctx: TrackerContext, onSatisfied: () => void): void;
  /** Tear down listeners. */
  stop(): void;
  /** Feed in a harness event. */
  handle(ev: HarnessEvent): void;
  /** Whether this tracker has fired `satisfied`. */
  isSatisfied(): boolean;
  /**
   * F5: clear transient mid-progress state (e.g. ManipulationTracker.awaitingAck)
   * without firing `satisfied`. Default no-op.
   */
  reset?(): void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function compareCondition(value: number, baseline: number | undefined, cond: ComparisonCondition): boolean {
  if (cond.type === 'any_change') return baseline === undefined ? false : value !== baseline;
  if (cond.type === 'absolute') return applyOp(value, cond.operator, cond.value);
  if (cond.type === 'range') return value >= cond.min && value <= cond.max;
  if (cond.type === 'equals') return value === cond.value;
  if (cond.type === 'delta_pct') {
    if (baseline === undefined || baseline === 0) return false;
    const deltaPct = ((value - baseline) / Math.abs(baseline)) * 100;
    if (cond.direction === 'increase') return deltaPct >= cond.min_pct;
    return -deltaPct >= cond.min_pct;
  }
  return false;
}

function applyOp(a: number | boolean, op: string, b: number | boolean): boolean {
  switch (op) {
    case '<': return (a as number) < (b as number);
    case '<=': return (a as number) <= (b as number);
    case '>': return (a as number) > (b as number);
    case '>=': return (a as number) >= (b as number);
    case '==': return a === b;
    case '!=': return a !== b;
    default: return false;
  }
}

function readoutsSatisfied(
  readings: Partial<Record<ReadoutName, number | boolean>>,
  required: Partial<Record<ReadoutName, ReadoutCondition>>,
): boolean {
  return (Object.keys(required) as ReadoutName[]).every(key => {
    const cond = required[key];
    const val = readings[key];
    if (cond === undefined || val === undefined) return false;
    return applyOp(val, cond.operator, cond.value);
  });
}

// ─── Manipulation Tracker ───────────────────────────────────────────────────

export class ManipulationTracker implements Tracker {
  private satisfied = false;
  private awaitingAck = false;
  private ackPromptId: string | null = null;
  private ctx: TrackerContext | null = null;
  private onSatisfied: (() => void) | null = null;

  constructor(private cfg: ManipulationTrackerConfig) {}

  start(ctx: TrackerContext, onSatisfied: () => void) {
    this.ctx = ctx;
    this.onSatisfied = onSatisfied;
  }
  stop() {
    this.ctx = null;
    this.onSatisfied = null;
  }
  isSatisfied() { return this.satisfied; }

  /** F5: drop any pending acknowledgment so a sibling-driven reset doesn't
   *  leave a stale prompt expecting an answer. */
  reset() {
    this.awaitingAck = false;
    this.ackPromptId = null;
  }

  handle(ev: HarnessEvent) {
    if (this.satisfied) return;

    if (this.awaitingAck && ev.type === 'recognition_response' && ev.prompt_id === this.ackPromptId) {
      if (ev.is_correct) this.fire();
      else this.awaitingAck = false; // allow re-manipulation to re-trigger ack
      return;
    }

    if (ev.type === 'control_changed' && ev.control === this.cfg.control) {
      const baseline = this.ctx?.baseline_controls[this.cfg.control];
      if (compareCondition(ev.new_value, baseline, this.cfg.condition)) {
        if (this.cfg.require_acknowledgment) {
          this.ackPromptId = `${this.cfg.control}_ack`;
          this.awaitingAck = true;
          this.ctx?.presentPrompt({
            prompt_id: this.ackPromptId,
            trigger: { kind: 'on_load' },
            question: this.cfg.require_acknowledgment.question,
            options: this.cfg.require_acknowledgment.options,
            annotation_on_correct: this.cfg.require_acknowledgment.annotation_on_correct,
          });
        } else {
          this.fire();
        }
      }
    }
  }

  private fire() {
    this.satisfied = true;
    this.onSatisfied?.();
  }
}

// ─── Outcome Tracker ────────────────────────────────────────────────────────

export class OutcomeTracker implements Tracker {
  private satisfied = false;
  private counter = 0;
  private ctx: TrackerContext | null = null;
  private onSatisfied: (() => void) | null = null;

  constructor(private cfg: OutcomeTrackerConfig) {}

  start(ctx: TrackerContext, onSatisfied: () => void) {
    this.ctx = ctx;
    this.onSatisfied = onSatisfied;
  }
  stop() {
    this.ctx = null;
    this.onSatisfied = null;
  }
  isSatisfied() { return this.satisfied; }

  handle(ev: HarnessEvent) {
    if (this.satisfied || ev.type !== 'sim_tick') return;
    const target = this.cfg.sustain_breaths ?? 1;
    // Novice-pass §15.2: per-readout breakdown for the TaskCard chip strip.
    // Each entry tells the learner WHICH specific criterion is failing.
    const required = this.cfg.readouts;
    const byReadout = (Object.keys(required) as ReadoutName[]).map(name => {
      const cond = required[name]!;
      const current = ev.computed_readouts[name];
      const passing = current !== undefined && applyOp(current, cond.operator, cond.value);
      return {
        name,
        current: current ?? 0,
        threshold: cond.value,
        operator: cond.operator,
        passing,
      };
    });
    const allPassing = byReadout.every(r => r.passing);
    if (allPassing) {
      this.counter++;
      this.ctx?.onOutcomeProgress?.({
        current: Math.min(this.counter, target),
        target,
        label: 'breaths within target',
        byReadout,
      });
      if (this.counter >= target) {
        this.satisfied = true;
        this.ctx?.onOutcomeProgress?.(null);
        this.onSatisfied?.();
      }
    } else {
      // Even before the streak starts, surface which criteria are failing so
      // the learner can target their adjustments.
      this.ctx?.onOutcomeProgress?.({
        current: 0,
        target,
        label: 'breaths within target',
        byReadout,
      });
      this.counter = 0;
    }
  }
}

// ─── Recognition Tracker ────────────────────────────────────────────────────

export class RecognitionTracker implements Tracker {
  private satisfied = false;
  private presented = false;
  private attempts = 0;
  private ctx: TrackerContext | null = null;
  private onSatisfied: (() => void) | null = null;

  constructor(private cfg: RecognitionTrackerConfig) {}

  start(ctx: TrackerContext, onSatisfied: () => void) {
    this.ctx = ctx;
    this.onSatisfied = onSatisfied;
    // v3.2 §9 — apply scripted sim state BEFORE presenting the prompt so
    // the readouts shown to the learner reflect the perturbation. The
    // CompoundTracker's reset_between fires resetToPreset() which in turn
    // calls clearPerturbations(), so the next child starts from baseline.
    if (this.cfg.perturbation) {
      ctx.applyPerturbation?.(this.cfg.perturbation);
    }
    if (this.cfg.prompt.trigger.kind === 'on_load') {
      this.present();
    }
  }
  stop() {
    this.ctx = null;
    this.onSatisfied = null;
  }
  isSatisfied() { return this.satisfied; }

  private present() {
    if (this.presented) return;
    this.presented = true;
    this.ctx?.presentPrompt(this.cfg.prompt);
  }

  handle(ev: HarnessEvent) {
    if (this.satisfied) return;

    if (ev.type === 'sim_tick' && !this.presented && this.cfg.prompt.trigger.kind === 'on_sim_state') {
      if (readoutsSatisfied(ev.computed_readouts, this.cfg.prompt.trigger.readouts)) this.present();
    }
    if (ev.type === 'control_changed' && !this.presented && this.cfg.prompt.trigger.kind === 'after_manipulation') {
      if (this.cfg.prompt.trigger.control === ev.control) this.present();
    }

    if (ev.type === 'recognition_response' && ev.prompt_id === this.cfg.prompt.prompt_id) {
      this.attempts++;
      if (ev.is_correct) {
        this.satisfied = true;
        // v3.2 §9 — clear the perturbation as soon as the learner names the
        // pattern, even if the parent compound has no reset_between (e.g.
        // standalone recognition trackers). Cheap and idempotent.
        if (this.cfg.perturbation) {
          this.ctx?.clearPerturbations?.();
        }
        this.onSatisfied?.();
      }
    }
  }

  attemptsMade() { return this.attempts; }
}

// ─── Compound Tracker ───────────────────────────────────────────────────────

export class CompoundTracker implements Tracker {
  private satisfied = false;
  private children: Tracker[];
  private currentIdx = 0;
  private ctx: TrackerContext | null = null;
  private onSatisfied: (() => void) | null = null;
  private childSatisfied: boolean[] = [];

  constructor(private cfg: CompoundTrackerConfig) {
    this.children = cfg.children.map(buildTracker);
    this.childSatisfied = this.children.map(() => false);
  }

  start(ctx: TrackerContext, onSatisfied: () => void) {
    this.ctx = ctx;
    this.onSatisfied = onSatisfied;
    // Compound recognitions are ALWAYS serialized — only one prompt can be
    // active at a time (the harness has a single activePrompt slot, and the
    // sim's click-target set is the active prompt's targets only). For
    // all-recognition compounds, "any_order" therefore means the same UX as
    // "strict": present prompts top-down in declaration order, advance to
    // the next on each correct answer. For mixed compounds (manipulation +
    // outcome + recognition), any_order keeps the parallel-start behaviour
    // because the non-recognition children fire from patient state, not
    // from a presented prompt.
    if (this.cfg.sequence === 'strict' || this.allRecognition()) {
      this.children[0].start(ctx, () => this.onChildSatisfied(0));
    } else {
      this.children.forEach((c, i) => c.start(ctx, () => this.onChildSatisfied(i)));
    }
  }

  private allRecognition(): boolean {
    return this.children.every(c => c instanceof RecognitionTracker);
  }
  stop() {
    this.children.forEach(c => c.stop());
    this.ctx = null;
    this.onSatisfied = null;
  }
  isSatisfied() { return this.satisfied; }

  handle(ev: HarnessEvent) {
    if (this.satisfied) return;
    if (this.cfg.sequence === 'strict' || this.allRecognition()) {
      this.children[this.currentIdx]?.handle(ev);
    } else {
      this.children.forEach((c, i) => {
        if (!this.childSatisfied[i]) c.handle(ev);
      });
    }
  }

  private onChildSatisfied(idx: number) {
    this.childSatisfied[idx] = true;

    // F3: announce checklist progress to the shell.
    this.ctx?.onProgress?.(this.childSatisfied.slice());

    if (this.cfg.reset_between) {
      // F4: tell the shell *which* step just landed so it can show a banner
      // BEFORE the visible reset wipes the sim.
      this.ctx?.notifyStepComplete?.(idx, this.children.length);
      // F5: drop any in-flight acknowledgment on siblings that haven't fired yet,
      // and clear the active prompt from the UI so a stale Q doesn't survive.
      this.ctx?.clearActivePrompt?.();
      this.children.forEach((c, i) => {
        if (!this.childSatisfied[i]) c.reset?.();
      });
      this.ctx?.resetToPreset();
    }

    if (this.childSatisfied.every(Boolean)) {
      this.satisfied = true;
      this.onSatisfied?.();
      return;
    }

    // Advance to the next un-satisfied child for any compound that
    // serializes prompts (strict OR all-recognition any_order). We
    // search forward for the next pending slot so completed children
    // don't get re-presented if any_order completion lands out of
    // declaration order in the future.
    if (this.cfg.sequence === 'strict' || this.allRecognition()) {
      const nextIdx = this.childSatisfied.findIndex(s => !s);
      if (nextIdx >= 0 && this.ctx) {
        this.currentIdx = nextIdx;
        this.children[nextIdx].start(this.ctx, () => this.onChildSatisfied(nextIdx));
      }
    }
  }

  /** Pass-through reset for nested compound trackers. */
  reset() {
    this.children.forEach((c, i) => {
      if (!this.childSatisfied[i]) c.reset?.();
    });
  }
}

// ─── Builder ────────────────────────────────────────────────────────────────

export function buildTracker(cfg: TrackerConfig): Tracker {
  switch (cfg.kind) {
    case 'manipulation': return new ManipulationTracker(cfg);
    case 'outcome': return new OutcomeTracker(cfg);
    case 'recognition': return new RecognitionTracker(cfg);
    case 'compound': return new CompoundTracker(cfg);
  }
}
