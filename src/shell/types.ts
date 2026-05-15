// ─── Shell + module configuration types ─────────────────────────────────────
// Implements the contract from master_shell_plan.md Parts 1–3.

// ── MCQ shape ──
export interface QuizOption {
  label: string;
  is_correct: boolean;
  explanation?: string; // Optional per-option explanation (primer questions use it)
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  explanation?: string; // Fallback explanation shown after submission
}

// ── Content blocks (left/workbook column) ──
export type ContentBlock =
  | { kind: 'prose'; markdown: string }
  | { kind: 'figure'; src?: string; caption?: string; ascii?: string }
  | { kind: 'callout'; tone: 'info' | 'warn' | 'tip'; markdown: string }
  | {
      kind: 'formative';
      question: string;
      /** Plain-text explanation. Used as the "Show answer" reveal in legacy
       *  modules; reused as the explanation shown after MCQ submission. */
      answer: string;
      /** Optional MCQ options. When present, the check-yourself page renders a
       *  multiple-choice prompt and `answer` becomes the post-submission
       *  explanation. When absent, the legacy "Show answer →" reveal is used. */
      options?: { label: string; is_correct: boolean }[];
    }
  | {
      kind: 'predict_observe';
      predict: string;
      observe: string;
      /** When set, the "Observe" half auto-reveals the first time the learner
       *  changes the named control on the sim during the read phase — turning
       *  the block from a click-to-reveal nudge into a genuine interactive
       *  prediction. The legacy "Then observe →" button remains as a fallback.
       *
       *  DEPRECATED (v3.2 §0): use `predict_mcq` for new authoring. Existing
       *  predict_observe blocks render as a click-to-reveal nudge as before;
       *  new predict_mcq blocks render as a gated multiple-choice question
       *  that must be answered correctly before the "observe" half reveals.
       */
      awaits_control?: ControlName;
    }
  | {
      /**
       * Per v3.2 §0: a gated multiple-choice prediction. The learner must
       * commit to an answer; a wrong answer reveals the option's
       * `explanation` and leaves the others enabled; a correct answer
       * reveals the `observe` prose and marks the block satisfied.
       *
       * The ReadPane gates its "Continue" CTA on ALL predict_mcq blocks
       * in the module being satisfied (per v3.2 §0.3). Disabled-CTA copy:
       * "Answer N more predictions to continue."
       *
       * Telemetry: per-block attempts persisted to
       * ProgressRecord.predict_mcq_attempts for dashboard signal only;
       * does not affect the score.
       */
      kind: 'predict_mcq';
      /** The prediction question — forward question, not statement. */
      predict: string;
      /** 3-4 options; exactly one must have is_correct: true. */
      options: { label: string; is_correct: boolean; explanation?: string }[];
      /** Revealed only after the correct option is picked. */
      observe: string;
      /** Optional alternative unlock: changing the named control on the
       *  live sim also marks the block satisfied (without requiring an
       *  MCQ answer). Use sparingly — only when the manipulation IS the
       *  prediction. The MCQ stays visible and answerable. */
      awaits_control?: ControlName;
    };

// ── Scenario / sim configuration ──
export type ControlName =
  | 'mode' | 'tidalVolume' | 'respiratoryRate' | 'iTime' | 'peep' | 'fiO2'
  | 'pInsp' | 'psLevel' | 'endInspiratoryPercent'
  | 'compliance' | 'resistance' | 'spontaneousRate'
  | 'inspiratory_pause' | 'expiratory_pause';

export type ReadoutName =
  | 'pip' | 'plat' | 'drivingPressure' | 'mve' | 'vte' | 'totalPeep' | 'autoPeep'
  | 'actualRate' | 'ieRatio' | 'rsbi' | 'ph' | 'paco2' | 'pao2' | 'spo2' | 'hco3'
  | 'fio2' | 'peep' | 'tidalVolumeSet' | 'meanAirwayPressure' | 'sbp' | 'etco2';

export type WaveformName = 'pressure_time' | 'flow_time' | 'volume_time';

export interface SimPreset {
  mode?: string;
  settings?: Partial<{
    tidalVolume: number;
    pInsp: number;
    psLevel: number;
    endInspiratoryPercent: number;
    respiratoryRate: number;
    peep: number;
    iTime: number;
    fiO2: number;
  }>;
  patient?: Partial<{
    compliance: number;
    resistance: number;
    spontaneousRate: number;
    deadSpaceFraction: number;
    gender: 'M' | 'F';
    heightInches: number;
    /**
     * v3.2 §1.3 — scripted intrapulmonary shunt fraction (0–1). When set,
     * overrides the default compliance-based shunt ladder so a module
     * can teach shunt without conflating it with stiff-lung mechanics.
     * Used by M5 (scripted ARDS shunt) and M19's pneumothorax perturbation.
     */
    shuntFraction: number;
    /**
     * v3.2 §9.6 — sim parameters for M19 scripted perturbations.
     * `leak_mL_per_breath` is subtracted from Vte each breath (capped at
     * Vt — Vte can\'t go negative). `etco2_loss_fraction` is multiplied
     * against the computed ETCO2 (1.0 = no signal). `bpSys` is the
     * baseline systolic for the M13 SBP guardrail.
     */
    leak_mL_per_breath: number;
    etco2_loss_fraction: number;
    bpSys: number;
  }>;
}

export interface Scenario {
  preset_id: string;
  preset: SimPreset;
  unlocked_controls: ControlName[];
  visible_readouts?: ReadoutName[];
  visible_waveforms?: WaveformName[];
  inline_prompts?: InlinePromptConfig[]; // recognition prompts driven by trigger
}

// ── Tracker configurations ──
export type ComparisonCondition =
  | { type: 'delta_pct'; direction: 'increase' | 'decrease'; min_pct: number }
  | { type: 'absolute'; operator: '<' | '<=' | '>' | '>=' | '=='; value: number }
  | { type: 'range'; min: number; max: number }
  | { type: 'equals'; value: any }
  | { type: 'any_change' };

export interface ReadoutCondition {
  operator: '<' | '<=' | '>' | '>=' | '==' | '!=';
  value: number | boolean;
}

export interface ManipulationTrackerConfig {
  kind: 'manipulation';
  control: ControlName;
  condition: ComparisonCondition;
  require_acknowledgment?: {
    question: string;
    options: QuizOption[];
    annotation_on_correct?: string;
  };
}

export interface OutcomeTrackerConfig {
  kind: 'outcome';
  readouts: Partial<Record<ReadoutName, ReadoutCondition>>;
  sustain_breaths?: number; // default 1
}

/** A specific clickable element on the sim that a recognition prompt can target. */
export type RecognitionTargetElement =
  | { kind: 'readout'; name: ReadoutName }
  | { kind: 'control'; name: ControlName };

export interface InlinePromptConfig {
  prompt_id: string;
  trigger:
    | { kind: 'on_load' }
    | { kind: 'on_sim_state'; readouts: Partial<Record<ReadoutName, ReadoutCondition>> }
    | { kind: 'after_manipulation'; control: ControlName };
  question: string;
  /**
   * Required for MCQ-style prompts. When `click_targets` is also set, these
   * are NOT shown to the learner — they remain as the canonical record of
   * acceptable answers and their explanations.
   */
  options: QuizOption[];
  max_attempts?: number;
  annotation_on_correct?: string;
  /**
   * Click-target mode. When non-empty, the learner answers by clicking a
   * specific reading or control on the simulator instead of picking from an
   * MCQ list. Each entry maps an on-sim element to a label / correctness /
   * explanation so wrong clicks still surface useful feedback.
   */
  click_targets?: Array<{
    element: RecognitionTargetElement;
    label: string;
    is_correct: boolean;
    explanation?: string;
  }>;
  /**
   * v3.2 §3 — path to a static SVG clip (relative to `/public`) shown
   * above the question text. Used by M11's dyssynchrony recognition so
   * the prompt is genuine pattern-recognition rather than text-matching.
   * RecognitionPrompt renders the clip when set; otherwise the prompt
   * is prose-only as before.
   */
  clip_src?: string;
}

/**
 * Per v3.2 §9 — a one-shot sim state override applied for the duration of
 * a recognition prompt. Used by M19's DOPES scenarios: before the prompt
 * presents, the perturbation is applied; on satisfaction (or when the
 * compound's `reset_between` fires), it's cleared. Settings and patient
 * overrides shallow-merge over the preset.
 */
export interface PerturbationSpec {
  id: string;
  settings?: Partial<{
    tidalVolume: number;
    pInsp: number;
    respiratoryRate: number;
    peep: number;
    iTime: number;
    fiO2: number;
  }>;
  patient?: Partial<{
    compliance: number;
    resistance: number;
    shuntFraction: number;
    leak_mL_per_breath: number;
    etco2_loss_fraction: number;
    bpSys: number;
  }>;
}

export interface RecognitionTrackerConfig {
  kind: 'recognition';
  prompt: InlinePromptConfig;
  /**
   * v3.2 §9 — applied to the sim before the prompt is presented. Cleared
   * on `satisfied` or when the parent compound's `reset_between` fires.
   * Lets a recognition prompt teach pattern recognition off live sim
   * deltas rather than off prose vignettes.
   */
  perturbation?: PerturbationSpec;
}

export interface CompoundTrackerConfig {
  kind: 'compound';
  sequence?: 'any_order' | 'strict';
  reset_between?: boolean;
  children: TrackerConfig[];
  /**
   * A6: when true, the TaskCard renders ONE active step at a time
   * (instead of showing all N criteria up front). After a child fires,
   * an `observation` prose block reveals along with a "Next →" button
   * that advances to the next un-satisfied child. Pairs with the
   * existing `sequence: 'strict'` flag (A6 implies strict ordering).
   *
   * Use this for "guided tour" style modules where each manipulation
   * has its own pedagogical commentary — e.g. "Change Vt → here's what
   * happens to PIP → next, change rate."
   */
  present_one_at_a_time?: boolean;
  /**
   * Per-step prose strings shown after each child satisfies, only when
   * `present_one_at_a_time` is set. Length should match `children.length`.
   * The TaskCard shows `observation[i]` plus a "Next →" button after
   * child[i] fires; advancing reveals child[i+1]'s direction.
   */
  observations?: string[];
}

export type TrackerConfig =
  | ManipulationTrackerConfig
  | OutcomeTrackerConfig
  | RecognitionTrackerConfig
  | CompoundTrackerConfig;

// ── Hint ladder ──
export interface HintConfig {
  tier1: string;
  tier2: string;
  tier3?: { hint_text: string; demonstration?: { control: ControlName; target_value: number } };
  // Custom timing (defaults 60s, 120s, 180s)
  intervals_seconds?: [number, number, number];
}

// ── Module configuration ──
export type Track = 'Foundations' | 'Physiology' | 'Modes' | 'Strategy' | 'Weaning' | 'Synthesis';

// ── Explore card (Phase 3 content) ──
export interface ExploreCardConfig {
  /** One paragraph of clinical context shown at the top of the card. */
  patient_context?: string;
  /** Each unlocked control with a short description of what it does. */
  unlocked_controls_description: { name: string; description: string }[];
  /** Each readout the learner should watch with a brief description. */
  readouts_description: { name: string; description: string }[];
  /** Two to four specific things to try without pressure. */
  suggestions: string[];
}

/**
 * §1.6 — three styles of task framing:
 *  - A: direct (foundations; name the controls to change)
 *  - B: clinical (advanced; name the targets, not the controls)
 *  - C: recognition (recognition-only modules; interrogative)
 */
export type TaskFramingStyle = 'A' | 'B' | 'C';

// ── Module configuration ──
export interface ModuleConfig {
  id: string; // e.g. 'M1'
  number: number;
  title: string;
  track: Track;
  estimated_minutes: number;
  visible_learning_objectives: string[];

  primer_questions: QuizQuestion[]; // exactly 3
  scenario: Scenario;
  hidden_objective: TrackerConfig;
  content_blocks: ContentBlock[];
  hint_ladder: HintConfig;
  summative_quiz: QuizQuestion[]; // 5
  key_points: string[];

  // ── v2 additions (§1.4 phase model, §1.6 task framing) ──
  /** Phase 3 — explore card content. */
  explore_card?: ExploreCardConfig;
  /** Phase 4 — second-person clinical framing shown on the task card. */
  user_facing_task?: string;
  /** Phase 4 — plain-language bullets under the task framing. */
  success_criteria_display?: string[];
  /** Phase 4 — A/B/C framing style. Determines tone but not behavior. */
  task_framing_style?: TaskFramingStyle;

  /**
   * One-time intro splash shown when the learner first enters the module
   * (and after a Restart). Paints the broad picture of what's coming before
   * the primer quiz starts. If omitted, the shell derives a generic
   * orientation from `visible_learning_objectives` and `track`.
   */
  briefing?: {
    /** 2-4 sentence orientation paragraph. */
    overview: string;
    /** 2-4 short bullets — what the learner will actually do in this module. */
    what_youll_do?: string[];
    /** G1: ~50-char sticky chip text shown in the in-module top nav so the
     *  briefing's headline lesson stays in peripheral view. Falls back to the
     *  first visible_learning_objective if not authored. */
    tagline?: string;
  };
}

// ── Persistence record (v2 — richer per-phase telemetry per §1.9) ──
export interface ProgressRecord {
  learner_id: string;
  module_id: string;
  started_at: string;
  /** When the learner clicked through the one-time intro briefing splash. */
  briefing_acknowledged_at?: string;
  // Phase 1
  primer_completed_at?: string;
  primer_score?: number;
  primer_answers?: { question_id: string; selected_label: string; is_correct: boolean }[];
  // Phase 2
  reading_completed_at?: string;
  // Phase 3
  exploration_started_at?: string;
  exploration_duration_sec?: number;
  exploration_control_changes?: number;
  // Phase 4
  task_started_at?: string;
  objective_satisfied_at?: string;
  time_to_objective_sec?: number;
  hint_tiers_triggered: number;
  task_control_changes?: number;
  reset_to_start_clicks?: number;
  replay_snapshot_ref?: string;
  attempts_per_recognition?: Record<string, number>;
  // Phase 5
  quiz_submitted_at?: string;
  quiz_score?: number;
  quiz_answers?: { question_id: string; selected_label: string; is_correct: boolean }[];

  /** Per-question answer log for the in-flow "Check yourself" formative
   *  questions shown between Read and Explore. Powers a debrief review and
   *  a small score bonus. */
  check_yourself_answers?: { question_id: string; selected_label: string; is_correct: boolean }[];

  // ── Composite performance score (computed at module completion) ──
  /** Weighted 0–100 score: primer 30% + summative 50% + hint/reset bonuses. */
  total_score_percent?: number;
  /** A–F letter grade derived from total_score_percent. */
  total_score_letter?: 'A' | 'B' | 'C' | 'D' | 'F';

  /**
   * Active engagement time in seconds — accumulated only while the module
   * tab is visible, the learner is mid-flow, and not idle for > 5 min.
   * Replaces the misleading wall-clock between `started_at` and the most
   * recent action, which could span days across sessions.
   */
  time_active_sec?: number;
  /** Last point in time we wrote to time_active_sec — used to extend on
   *  each phase advance or periodic flush. */
  last_active_at?: string;

  /**
   * How many times the learner has submitted the summative quiz on this
   * module. The score is "best attempt wins" (per Will's instruction):
   * `quiz_score` always reflects the highest score achieved so far, and
   * `total_score_percent` is recomputed against that best quiz score.
   */
  quiz_attempts?: number;
  /** Highest summative score the learner has earned on this module. */
  quiz_best_score?: number;

  /**
   * Per v3.2 §0.4: per-block telemetry for gated predict_mcq blocks in the
   * read phase. Records the attempt history for dashboard signal only —
   * does NOT affect the composite score.
   */
  predict_mcq_attempts?: {
    /** {moduleId}-PM{idx+1}, derived from the predict_mcq block's position. */
    block_id: string;
    /** Total clicks recorded until the correct option was selected. */
    attempts: number;
    /** Ordered history of selected option labels. */
    selected_labels: string[];
  }[];
}
