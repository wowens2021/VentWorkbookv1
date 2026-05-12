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
  private onSatisfied: (() => void) | null = null;

  constructor(private cfg: OutcomeTrackerConfig) {}

  start(_ctx: TrackerContext, onSatisfied: () => void) {
    this.onSatisfied = onSatisfied;
  }
  stop() { this.onSatisfied = null; }
  isSatisfied() { return this.satisfied; }

  handle(ev: HarnessEvent) {
    if (this.satisfied || ev.type !== 'sim_tick') return;
    if (readoutsSatisfied(ev.computed_readouts, this.cfg.readouts)) {
      this.counter++;
      if (this.counter >= (this.cfg.sustain_breaths ?? 1)) {
        this.satisfied = true;
        this.onSatisfied?.();
      }
    } else {
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
    if (this.cfg.sequence === 'strict') {
      // Only start the first child
      this.children[0].start(ctx, () => this.onChildSatisfied(0));
    } else {
      this.children.forEach((c, i) => c.start(ctx, () => this.onChildSatisfied(i)));
    }
  }
  stop() {
    this.children.forEach(c => c.stop());
    this.ctx = null;
    this.onSatisfied = null;
  }
  isSatisfied() { return this.satisfied; }

  handle(ev: HarnessEvent) {
    if (this.satisfied) return;
    if (this.cfg.sequence === 'strict') {
      this.children[this.currentIdx]?.handle(ev);
    } else {
      this.children.forEach((c, i) => {
        if (!this.childSatisfied[i]) c.handle(ev);
      });
    }
  }

  private onChildSatisfied(idx: number) {
    this.childSatisfied[idx] = true;

    if (this.cfg.reset_between) this.ctx?.resetToPreset();

    if (this.childSatisfied.every(Boolean)) {
      this.satisfied = true;
      this.onSatisfied?.();
      return;
    }

    if (this.cfg.sequence === 'strict') {
      this.currentIdx = idx + 1;
      if (this.currentIdx < this.children.length && this.ctx) {
        this.children[this.currentIdx].start(this.ctx, () => this.onChildSatisfied(this.currentIdx));
      }
    }
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
