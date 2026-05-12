import type { ModuleConfig } from '../shell/types';

export const M9: ModuleConfig = {
  id: 'M9',
  number: 9,
  title: 'PRVC and Dual-Control Modes',
  track: 'Modes',
  estimated_minutes: 12,
  visible_learning_objectives: [
    "Recognize PRVC's breath-by-breath pressure adjustment behavior.",
    'Understand when dual-control modes are useful and how they can fail.',
  ],

  primer_questions: [
    {
      id: 'M9-P1',
      prompt: 'PRVC is best described as:',
      options: [
        { label: 'Pressure fixed, volume varies', is_correct: false, explanation: "That's standard PC. PRVC has a volume target." },
        { label: 'Volume fixed, pressure varies breath-to-breath to hit volume target', is_correct: true, explanation: 'PRVC sets a volume target and adjusts pressure each breath to converge on it. Predictability of VC with limited-pressure feel of PC.' },
        { label: 'Both pressure and volume fixed', is_correct: false, explanation: 'Physically impossible — would fix compliance.' },
        { label: 'A spontaneous mode requiring patient effort', is_correct: false, explanation: 'PRVC is mandatory.' },
      ],
    },
    {
      id: 'M9-P2',
      prompt: 'Patient on PRVC has coughing fit, bucks against vent. Over next breaths, PRVC likely:',
      options: [
        { label: 'Increase pressure to overcome effort', is_correct: false, explanation: "PRVC doesn't recognize patient effort as different from passive mechanics." },
        { label: 'Decrease pressure because delivered volume looked adequate', is_correct: true, explanation: 'Patient effort makes the breath look bigger — PRVC then reduces support, under-supporting a struggling patient. Naive about effort.' },
        { label: 'Switch to PSV', is_correct: false, explanation: 'No automatic mode switching.' },
        { label: 'Stop ventilating', is_correct: false, explanation: 'Alarms fire on thresholds, not bucking.' },
      ],
    },
    {
      id: 'M9-P3',
      prompt: 'PRVC offers which advantage over VC?',
      options: [
        { label: 'Guaranteed exact Vt every breath', is_correct: false, explanation: 'VC gives a more exact volume per breath; PRVC converges over several.' },
        { label: 'Pressure-limited delivery that adapts when mechanics change', is_correct: true, explanation: 'Vent adapts breath-by-breath when compliance fluctuates.' },
        { label: 'Better synchrony', is_correct: false, explanation: 'No special synchrony features.' },
        { label: 'Lower work of breathing', is_correct: false, explanation: 'Mandatory mode, not for spontaneous WOB.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'passive_baseline_prvc',
    preset: {
      mode: 'PRVC',
      settings: { tidalVolume: 450, respiratoryRate: 12, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 50, resistance: 10, spontaneousRate: 0 },
    },
    unlocked_controls: ['compliance'],
    visible_readouts: ['pip', 'plat', 'vte', 'drivingPressure'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  // The PRVC adaptive PI lives in PlaygroundSim — after a compliance drop the
  // vent should escalate the pressure target over several breaths. The outcome
  // tracker watches for PIP rising above baseline + 4 after compliance drops.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    children: [
      {
        kind: 'manipulation',
        control: 'compliance',
        condition: { type: 'delta_pct', direction: 'decrease', min_pct: 40 },
      },
      {
        kind: 'outcome',
        readouts: { pip: { operator: '>=', value: 20 } },
        sustain_breaths: 4,
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M9-summary',
          trigger: { kind: 'on_load' },
          question: 'What did the ventilator do over the last several breaths?',
          options: [
            { label: 'Increased delivered pressure to maintain volume target', is_correct: true },
            { label: 'Decreased delivered pressure', is_correct: false },
            { label: 'Switched modes', is_correct: false },
            { label: 'Nothing automatic happened', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Dual-control logic.** PRVC measures the delivered volume each breath and nudges the pressure target up or down on the next breath to converge on a set target volume.' },
    { kind: 'callout', tone: 'warn', markdown: 'PRVC has a well-known failure mode: a patient pulling hard contributes volume → PRVC thinks "got it" → reduces support. The patient ends up working harder while the vent does less. Watch for this in awake, struggling patients.' },
  ],

  hint_ladder: {
    tier1: 'Lower the compliance slider, then watch the PIP over the next 4–5 breaths.',
    tier2: 'Don\'t change anything else. Just watch the PIP rise as the algorithm adapts.',
    tier3: { hint_text: 'Use "Show me".', demonstration: { control: 'compliance', target_value: 25 } },
  },

  summative_quiz: [
    {
      id: 'M9-Q1',
      prompt: 'PRVC differs from PC in that PRVC:',
      options: [
        { label: 'Has no pressure target', is_correct: false },
        { label: 'Adjusts its pressure breath-by-breath to hit a volume target', is_correct: true },
        { label: 'Requires patient effort', is_correct: false },
        { label: 'Delivers constant flow', is_correct: false },
      ],
      explanation: 'Dual-control mode: pressure is controlled but volume is target.',
    },
    {
      id: 'M9-Q2',
      prompt: 'PRVC target Vt 450. Compliance worsens. Over 4–5 breaths:',
      options: [
        { label: 'Pressure unchanged; Vt falling', is_correct: false },
        { label: 'Pressure rises step-by-step; Vt converges back to 450', is_correct: true },
        { label: 'Switches to PSV', is_correct: false },
        { label: 'High pressure alarm, stops ventilating', is_correct: false },
      ],
      explanation: 'Defining behavior of PRVC: detects volume falling, raises pressure each breath until target reached.',
    },
    {
      id: 'M9-Q3',
      prompt: 'Most clinically dangerous PRVC failure mode:',
      options: [
        { label: 'Compliance loss raising pressures', is_correct: false },
        { label: 'Strong patient effort → algorithm reduces support', is_correct: true },
        { label: 'Auto-PEEP from rate', is_correct: false },
        { label: 'Failure to trigger', is_correct: false },
      ],
      explanation: 'PRVC can\'t tell patient-contributed volume from vent-delivered volume. Hard pull → vent thinks it\'s overdoing it → reduces support → patient struggles more.',
    },
    {
      id: 'M9-Q4',
      prompt: 'PRVC most useful in:',
      options: [
        { label: 'Heavily sedated patient with stable mechanics', is_correct: false },
        { label: 'Fluctuating compliance with consistent volume needs', is_correct: true },
        { label: 'High respiratory drive patient', is_correct: false },
        { label: 'Patient ready for extubation', is_correct: false },
      ],
      explanation: 'Adaptive behavior shines when mechanics change (recruitment, secretion changes, position).',
    },
    {
      id: 'M9-Q5',
      prompt: 'What does the PRVC pressure trend display?',
      options: [
        { label: 'Plateau pressure', is_correct: false },
        { label: 'Delivered pressure breath-by-breath', is_correct: true },
        { label: 'Patient effort', is_correct: false },
        { label: 'Mean airway pressure', is_correct: false },
      ],
      explanation: 'Trend graph shows the algorithm at work — you can see the ramp after a compliance change.',
    },
  ],

  explore_card: {
    patient_context: 'Passive patient on PRVC with a tidal volume target of 450 mL. The ventilator chooses its own pressure each breath to hit that target.',
    unlocked_controls_description: [
      { name: 'Compliance', description: 'the patient\'s lung compliance. Range 15–80 mL/cmH2O. Adjustable here so you can see how PRVC reacts.' },
    ],
    readouts_description: [
      { name: 'Set Vt vs delivered Vt (Vte)', description: 'does the vent hit the target?' },
      { name: 'Peak pressure', description: 'the pressure PRVC chose for the last breath. This is the key adaptive readout.' },
      { name: 'Driving pressure', description: 'how much pressure above PEEP was needed for this breath.' },
    ],
    suggestions: [
      'At baseline, observe that delivered volume tracks the target closely. The vent picked a pressure that works.',
      'Drop compliance by 40%. Don\'t change anything else. Watch the peak pressure over the next several breaths. What is PRVC doing on its own?',
      'The lesson: PRVC adjusts pressure breath-by-breath to keep volume on target.',
    ],
  },
  user_facing_task: "You'll simulate a sudden drop in this patient's lung compliance and observe how PRVC responds *on its own*. Don't touch anything else — just the compliance control. Then identify what the ventilator did over the next several breaths.",
  success_criteria_display: [
    'Reduce compliance by at least 40%.',
    'Wait several breaths and watch the pressure trend.',
    'Identify what the ventilator did in response.',
  ],
  task_framing_style: 'A',

  key_points: [
    'PRVC: volume target, pressure variable; algorithm adapts breath-to-breath.',
    'Adjustment happens over several breaths, not instantly.',
    'Failure mode: patient effort confuses the algorithm, support drops when patient needs more.',
  ],
};

export const M10: ModuleConfig = {
  id: 'M10',
  number: 10,
  title: 'Pressure Support and Spontaneous Modes',
  track: 'Modes',
  estimated_minutes: 14,
  visible_learning_objectives: [
    'Adjust pressure support and observe the effect on tidal volume.',
    'Adjust trigger sensitivity and observe the effect on patient-initiated breaths.',
  ],

  primer_questions: [
    {
      id: 'M10-P1',
      prompt: 'In PSV, what initiates each breath?',
      options: [
        { label: 'A timer based on set rate', is_correct: false, explanation: 'That\'s mandatory modes. PSV has no set rate.' },
        { label: "The patient's inspiratory effort", is_correct: true, explanation: 'PSV is spontaneous. Patient triggers via small negative pressure or flow. Vent then supports. No effort = no breath.' },
        { label: "The ventilator's algorithm", is_correct: false, explanation: 'Vent does not autonomously initiate in PSV.' },
        { label: 'ETCO2 thresholds', is_correct: false, explanation: 'Not a standard trigger.' },
      ],
    },
    {
      id: 'M10-P2',
      prompt: 'Increase PS from 10 to 15 on spontaneously breathing patient. Immediate effect:',
      options: [
        { label: 'Respiratory rate increases', is_correct: false, explanation: 'Higher support typically decreases rate.' },
        { label: 'Vt per breath increases', is_correct: true, explanation: 'More pressure during inspiration → more volume. PSV titrated to target Vt and comfortable rate.' },
        { label: 'WOB increases', is_correct: false, explanation: 'Opposite — vent doing more work, patient doing less.' },
        { label: 'Triggers fewer breaths', is_correct: false, explanation: "Trigger freq governed by patient's drive." },
      ],
    },
    {
      id: 'M10-P3',
      prompt: 'Trigger sensitivity set too insensitive. Consequence:',
      options: [
        { label: 'Auto-triggering', is_correct: false, explanation: 'Auto-triggering happens with too-sensitive triggers.' },
        { label: 'Missed efforts — patient tries, vent doesn\'t deliver', is_correct: true, explanation: 'Ineffective triggering. Small deflections on pressure waveform but no breath. M11 explores this.' },
        { label: 'Vent switches to backup mode', is_correct: false, explanation: 'Backup requires apnea time threshold.' },
        { label: 'Vt becomes irregular', is_correct: false, explanation: 'Vt depends on support level and effort, not trigger sensitivity.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'spontaneous_psv_baseline',
    preset: {
      mode: 'PSV',
      settings: { psLevel: 10, peep: 5, fiO2: 40, endInspiratoryPercent: 25 },
      patient: { compliance: 50, resistance: 10, spontaneousRate: 18 },
    },
    unlocked_controls: ['psLevel', 'endInspiratoryPercent'],
    visible_readouts: ['pip', 'vte', 'actualRate'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: true,
    children: [
      {
        kind: 'manipulation',
        control: 'psLevel',
        condition: { type: 'range', min: 14, max: 16 },
        require_acknowledgment: {
          question: 'You raised PS to ~15. What happened to delivered Vt?',
          options: [
            { label: 'Rose', is_correct: true },
            { label: 'Fell', is_correct: false },
            { label: 'Unchanged', is_correct: false },
          ],
        },
      },
      {
        kind: 'manipulation',
        control: 'endInspiratoryPercent',
        condition: { type: 'any_change' },
        require_acknowledgment: {
          question: 'You changed the cycle-off threshold. What\'s the clinical effect?',
          options: [
            { label: 'Changes when each breath ends — matches breath duration to patient', is_correct: true },
            { label: 'Changes how easily breaths are triggered', is_correct: false },
            { label: 'Changes the FiO2 delivered', is_correct: false },
            { label: 'No clinical effect', is_correct: false },
          ],
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**PSV is a partnership.** Patient initiates → vent assists with pressure → vent cycles off when flow decays. Three knobs: PS level (how much support), trigger sensitivity (how easy to start), cycle-off % (when to end).' },
    { kind: 'callout', tone: 'tip', markdown: 'Trigger too sensitive → auto-triggering (vent fires on noise). Too insensitive → ineffective triggering (patient tries, no breath). Goldilocks problem.' },
  ],

  hint_ladder: {
    tier1: 'Try raising the PS level. Watch Vt.',
    tier2: 'After exploring PS, adjust the End-Insp % to change cycle-off behavior.',
    tier3: { hint_text: 'Use "Show me".', demonstration: { control: 'psLevel', target_value: 15 } },
  },

  summative_quiz: [
    {
      id: 'M10-Q1',
      prompt: 'In PSV, every breath:',
      options: [
        { label: 'Is mandatory on a fixed schedule', is_correct: false },
        { label: 'Is initiated by patient, supported by vent', is_correct: true },
        { label: 'Is initiated by vent, finished by patient', is_correct: false },
        { label: 'Is delivered at fixed volume', is_correct: false },
      ],
      explanation: 'PSV is fully spontaneous. No effort = no breath. Requires intact drive and apnea backup settings.',
    },
    {
      id: 'M10-Q2',
      prompt: 'Raise PS from 8 to 12. Likely effects:',
      options: [
        { label: 'Vt rises; rate may fall', is_correct: true },
        { label: 'Vt falls; rate rises', is_correct: false },
        { label: 'Both rise', is_correct: false },
        { label: 'Both fall', is_correct: false },
      ],
      explanation: 'More support → more Vt per breath → patient often slows down. Reverse when weaning.',
    },
    {
      id: 'M10-Q3',
      prompt: 'PSV trigger at -3 cmH2O. Visible inspiratory efforts, few breaths delivered. This is:',
      options: [
        { label: 'Auto-triggering', is_correct: false },
        { label: 'Ineffective triggering', is_correct: true },
        { label: 'Premature cycling', is_correct: false },
        { label: 'Flow starvation', is_correct: false },
      ],
      explanation: 'Trigger too insensitive. Efforts produce small deflections but don\'t cross threshold. Fix: more sensitive trigger (e.g., -1).',
    },
    {
      id: 'M10-Q4',
      prompt: 'In PSV, cycle-off is based on:',
      options: [
        { label: 'Time elapsed', is_correct: false },
        { label: 'Decline in inspiratory flow to % of peak', is_correct: true },
        { label: 'Set Vt reached', is_correct: false },
        { label: 'PEEP returning to baseline', is_correct: false },
      ],
      explanation: 'Cycles off when flow drops to set % of peak (commonly 25%). Patient sets Ti by their own mechanics.',
    },
    {
      id: 'M10-Q5',
      prompt: 'COPD patient on PSV cycle-off 25% exhaling against vent at end-breath. Best adjustment:',
      options: [
        { label: 'Lower cycle-off to 10%', is_correct: false },
        { label: 'Raise cycle-off to 40%', is_correct: true },
        { label: 'Increase PS', is_correct: false },
        { label: 'Lower trigger sensitivity', is_correct: false },
      ],
      explanation: 'COPD has prolonged time constants. At 25%, breath continues past patient\'s neural inspiratory end. Raising cycle-off ends breath earlier.',
    },
  ],

  explore_card: {
    patient_context: 'Spontaneously breathing patient on PSV. The patient is taking breaths on their own; the vent is just adding support.',
    unlocked_controls_description: [
      { name: 'Pressure support (PS)', description: 'how much pressure assist the vent adds when the patient triggers. Range 0–60 cmH2O.' },
      { name: 'End-Inspiratory %', description: 'cycle-off threshold — the % of peak flow at which the breath terminates. Range 5–50%.' },
    ],
    readouts_description: [
      { name: 'Delivered tidal volume (Vte)', description: 'depends on patient effort + pressure support.' },
      { name: 'Measured rate (Actual RR)', description: 'how many breaths the patient is actually triggering.' },
      { name: 'Pressure and flow waveforms', description: 'note the small negative deflection before each breath (the trigger).' },
    ],
    suggestions: [
      'Raise pressure support from 10 to 15. What happens to tidal volume?',
      'Try lowering cycle-off from 25 → 10. Patients with long time constants (COPD) need this to avoid delayed cycling.',
      'The two dials are independent: pressure support sizes each breath; cycle-off controls how each breath ends.',
    ],
  },
  user_facing_task: "This patient is breathing spontaneously on PSV. You'll make two adjustments to confirm how the PSV controls behave. First, raise the pressure support to 15 and identify the effect. Then change the cycle-off threshold and identify the effect on breath duration.",
  success_criteria_display: [
    'Set pressure support to about 15 cmH2O and identify what happened to tidal volume.',
    'Then change the End-Insp % control and identify the effect.',
    'Sim resets between the two.',
  ],
  task_framing_style: 'A',

  key_points: [
    'PSV = patient triggers, vent supports, flow-cycled termination.',
    'Three knobs: PS level, trigger sensitivity, cycle-off %.',
    'Higher PS → more Vt → slower rate.',
    'Trigger too sensitive: auto-triggering. Too insensitive: ineffective triggering.',
    'Cycle-off too high: premature cycling (COPD). Too low: delayed cycling.',
  ],
};
