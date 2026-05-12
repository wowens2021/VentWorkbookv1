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
  | { kind: 'formative'; question: string; answer: string }
  | { kind: 'predict_observe'; predict: string; observe: string };

// ── Scenario / sim configuration ──
export type ControlName =
  | 'mode' | 'tidalVolume' | 'respiratoryRate' | 'iTime' | 'peep' | 'fiO2'
  | 'pInsp' | 'psLevel' | 'endInspiratoryPercent'
  | 'compliance' | 'resistance' | 'spontaneousRate'
  | 'inspiratory_pause' | 'expiratory_pause';

export type ReadoutName =
  | 'pip' | 'plat' | 'drivingPressure' | 'mve' | 'vte' | 'totalPeep' | 'autoPeep'
  | 'actualRate' | 'ieRatio' | 'rsbi' | 'ph' | 'paco2' | 'pao2' | 'spo2' | 'hco3'
  | 'fio2' | 'peep' | 'tidalVolumeSet' | 'meanAirwayPressure';

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

export interface InlinePromptConfig {
  prompt_id: string;
  trigger:
    | { kind: 'on_load' }
    | { kind: 'on_sim_state'; readouts: Partial<Record<ReadoutName, ReadoutCondition>> }
    | { kind: 'after_manipulation'; control: ControlName };
  question: string;
  options: QuizOption[];
  max_attempts?: number;
  annotation_on_correct?: string;
}

export interface RecognitionTrackerConfig {
  kind: 'recognition';
  prompt: InlinePromptConfig;
}

export interface CompoundTrackerConfig {
  kind: 'compound';
  sequence?: 'any_order' | 'strict';
  reset_between?: boolean;
  children: TrackerConfig[];
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
}

// ── Persistence record ──
export interface ProgressRecord {
  learner_id: string;
  module_id: string;
  started_at: string;
  primer_completed_at?: string;
  primer_score?: number;
  primer_answers?: { question_id: string; selected_label: string; is_correct: boolean }[];
  objective_satisfied_at?: string;
  hint_tiers_triggered: number;
  quiz_submitted_at?: string;
  quiz_score?: number;
  replay_snapshot_ref?: string;
  attempts_per_recognition?: Record<string, number>;
}
