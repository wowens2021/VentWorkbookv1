import type { ModuleConfig } from '../shell/types';

export const M17: ModuleConfig = {
  id: 'M17',
  number: 17,
  title: 'Weaning Concepts',
  track: 'Weaning',
  estimated_minutes: 14,
  visible_learning_objectives: [
    'Switch a patient from full support to a spontaneous breathing trial and read the RSBI.',
    'Recognize the criteria for weaning readiness.',
  ],

  primer_questions: [
    {
      id: 'M17-P1',
      prompt: 'RSBI is calculated as:',
      options: [
        { label: 'RR × Vt(L)', is_correct: false, explanation: 'That\'s minute ventilation.' },
        { label: 'RR ÷ Vt(L)', is_correct: true, explanation: 'RSBI = RR / Vt(L). 30 breaths at 250 mL → RSBI 120. 18 breaths at 400 mL → 45. Captures "rapid and shallow" pattern of patients not ready to come off.' },
        { label: 'MV ÷ RR', is_correct: false, explanation: 'Returns Vt.' },
        { label: 'Vt ÷ peak', is_correct: false, explanation: 'Approximates compliance.' },
      ],
    },
    {
      id: 'M17-P2',
      prompt: 'RSBI < 105 generally predicts:',
      options: [
        { label: 'Too sick to extubate', is_correct: false, explanation: '105 is the upper bound for success.' },
        { label: 'Good chance of successful extubation', is_correct: true, explanation: 'Yang-Tobin study: < 105 sensitive for success. Above 105, failure rates climb. One of several criteria.' },
        { label: 'Severe ARDS', is_correct: false, explanation: 'P/F measures that.' },
        { label: 'Auto-triggering', is_correct: false, explanation: 'Separate phenomenon.' },
      ],
    },
    {
      id: 'M17-P3',
      prompt: 'An SBT typically involves:',
      options: [
        { label: 'Removing vent entirely for 30–120 min', is_correct: false, explanation: 'That\'s T-piece variant.' },
        { label: 'Minimal support (PSV 5–8 or CPAP) for 30–120 min', is_correct: true, explanation: 'Standard SBT. PSV 5–8 above PEEP 5 or CPAP-only. Watch for tolerance criteria.' },
        { label: 'Increasing PEEP to test response', is_correct: false, explanation: 'SBT reduces support.' },
        { label: 'Continuing full mandatory support', is_correct: false, explanation: 'Doesn\'t test breathing capacity.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'weaning_candidate',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 14, peep: 8, fiO2: 40, iTime: 1.0, psLevel: 8 },
      patient: { compliance: 55, resistance: 12, spontaneousRate: 16 },
    },
    unlocked_controls: ['mode', 'psLevel'],
    visible_readouts: ['actualRate', 'vte', 'rsbi', 'spo2', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    children: [
      {
        kind: 'manipulation',
        control: 'mode',
        condition: { type: 'equals', value: 'PSV' },
      },
      {
        kind: 'outcome',
        readouts: { rsbi: { operator: '<', value: 105 } },
        sustain_breaths: 5,
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M17-rsbi',
          trigger: { kind: 'on_load' },
          question: 'The RSBI has stabilized below 105. What does this predict?',
          options: [
            { label: 'Likely successful extubation', is_correct: true },
            { label: 'Likely failed extubation', is_correct: false },
            { label: 'Need more sedation', is_correct: false },
            { label: 'Need higher PEEP', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Weaning readiness is multifactorial.** RSBI is one number. Mental status, secretion management, cough strength, hemodynamic stability, and underlying-problem resolution all weigh in.' },
    { kind: 'callout', tone: 'tip', markdown: 'A passed SBT is necessary but not sufficient. Always ask: has the original reason for intubation resolved?' },
  ],

  hint_ladder: {
    tier1: 'Switch the mode to PSV and lower pressure support.',
    tier2: 'On PSV with low support, watch the RSBI readout. Threshold for success is < 105.',
    tier3: { hint_text: 'Use "Show me".' },
  },

  summative_quiz: [
    {
      id: 'M17-Q1',
      prompt: 'SBT: RR 28, Vt 280 mL. RSBI ≈',
      options: [
        { label: '25', is_correct: false },
        { label: '78', is_correct: false },
        { label: '100', is_correct: true },
        { label: '300', is_correct: false },
      ],
      explanation: '28 / 0.28 = 100. Just under threshold — borderline. Other criteria weigh heavily.',
    },
    {
      id: 'M17-Q2',
      prompt: 'NOT a standard weaning readiness criterion:',
      options: [
        { label: 'Resolution of underlying reason', is_correct: false },
        { label: 'Adequate oxygenation on minimal FiO2/PEEP', is_correct: false },
        { label: 'Hemodynamic stability without escalating pressors', is_correct: false },
        { label: 'Daily CXR completely clear', is_correct: true },
      ],
      explanation: 'CXR clearing not required. Many appropriately extubated with persistent abnormalities.',
    },
    {
      id: 'M17-Q3',
      prompt: 'Passes SBT but weak cough + bad secretions. Next step:',
      options: [
        { label: 'Extubate immediately', is_correct: false },
        { label: 'Reconsider; high failure risk', is_correct: true },
        { label: 'Increase PEEP to clear secretions', is_correct: false },
        { label: 'Add bronchodilators', is_correct: false },
      ],
      explanation: 'Cough strength and secretions independent predictors. Often more predictive than any single number.',
    },
    {
      id: 'M17-Q4',
      prompt: 'CPAP trial vs PSV-low support:',
      options: [
        { label: 'CPAP provides no inspiratory assistance, only PEEP', is_correct: true },
        { label: 'CPAP uses higher PS', is_correct: false },
        { label: 'CPAP requires paralysis', is_correct: false },
        { label: 'CPAP safer for all patients', is_correct: false },
      ],
      explanation: 'CPAP = PEEP only. Patient does all inspiratory work. Slightly more challenging SBT.',
    },
    {
      id: 'M17-Q5',
      prompt: 'Post-extubation stridor at 1 hour. First action:',
      options: [
        { label: 'Reintubate immediately', is_correct: false },
        { label: 'Nebulized epinephrine + consider steroids; reintubate if no improvement', is_correct: true },
        { label: 'Increase NC oxygen, observe', is_correct: false },
        { label: 'CT neck', is_correct: false },
      ],
      explanation: 'First-line racemic epinephrine; consider steroids. Reintubate if no quick improvement.',
    },
  ],

  explore_card: {
    patient_context: 'Post-op patient on full ventilator support for 48 hours. Hemodynamically stable, off vasopressors, FiO2 already weaned to 0.40, PEEP 8. Mental status intact. **This patient is a candidate for a spontaneous breathing trial today.**',
    unlocked_controls_description: [
      { name: 'Mode', description: 'toggle between VCV (full support) and PSV (spontaneous, minimal support).' },
      { name: 'Pressure support', description: 'range 0–60 cmH2O (only meaningful when mode is PSV).' },
    ],
    readouts_description: [
      { name: 'Measured rate (Actual RR)', description: 'currently locked to set rate because VCV is mandatory.' },
      { name: 'Tidal volume delivered (Vte)', description: 'set value while on VCV; patient-driven once on PSV.' },
      { name: 'RSBI', description: '*only computed when the patient is breathing spontaneously*. Threshold to remember: under 105 is favorable.' },
      { name: 'SpO2 and VE', description: 'clinical safety readouts during the trial.' },
    ],
    suggestions: [
      'Try switching mode to PSV. Notice the RSBI readout becomes active.',
      'Drop pressure support to 8 (this approximates a standard SBT). The patient is now doing most of the work.',
      'Watch for 30 simulated breaths. The RSBI will stabilize — that number tells you whether weaning is likely to succeed.',
    ],
  },
  user_facing_task: "You're rounding on this patient and the team wants you to start a spontaneous breathing trial. Move the ventilator to SBT settings, watch the patient for 30 breaths, and then tell your senior what the result predicts.",
  success_criteria_display: [
    'Switch to PSV with pressure support of 8 or less.',
    'Wait for the RSBI readout to stabilize.',
    'Identify what the stabilized RSBI value predicts for this patient.',
  ],
  task_framing_style: 'B',

  key_points: [
    'RSBI < 105 favors weaning success.',
    'SBTs are 30–120 min on minimal support.',
    'Readiness is multifactorial: mental status, secretions, cough, hemodynamics.',
    'Passed SBT is necessary but not sufficient.',
  ],
};

export const M18: ModuleConfig = {
  id: 'M18',
  number: 18,
  title: 'Extubation Criteria and Failure',
  track: 'Weaning',
  estimated_minutes: 14,
  visible_learning_objectives: [
    'Integrate multiple data points into a single extubation decision.',
    'Recognize predictors of extubation failure.',
  ],

  primer_questions: [
    {
      id: 'M18-P1',
      prompt: 'A cuff leak test assesses:',
      options: [
        { label: 'Whether the cuff functions mechanically', is_correct: false, explanation: 'Cuff function checked separately.' },
        { label: 'Risk of post-extubation upper airway obstruction', is_correct: true, explanation: 'Deflated cuff: measure air passing around tube. Small leak → laryngeal edema → post-extubation stridor risk.' },
        { label: 'Tidal volume capacity', is_correct: false, explanation: 'Unrelated.' },
        { label: 'Circuit integrity', is_correct: false, explanation: 'Separate check.' },
      ],
    },
    {
      id: 'M18-P2',
      prompt: 'Increases risk of extubation failure:',
      options: [
        { label: 'Strong cough, minimal secretions', is_correct: false, explanation: 'Protective.' },
        { label: 'RSBI 60', is_correct: false, explanation: 'Favorable.' },
        { label: 'Inability to follow simple commands', is_correct: true, explanation: 'Mental status matters. Can\'t protect airway, manage secretions, cooperate with cough. Consistently associated with failure.' },
        { label: 'P/F 350', is_correct: false, explanation: 'Normal-range, favorable.' },
      ],
    },
    {
      id: 'M18-P3',
      prompt: 'Patient passes SBT, team debating extubation. Most important question:',
      options: [
        { label: 'Is the underlying reason for intubation resolved?', is_correct: true, explanation: 'All decisions anchored in the original reason. Still active → may decompensate. The gestalt step protocols sometimes miss.' },
        { label: 'RSBI under 105?', is_correct: false, explanation: 'Part of picture, not the central question.' },
        { label: 'FiO2 below 0.4?', is_correct: false, explanation: 'Useful threshold but not central.' },
        { label: 'Ventilator > 5 days?', is_correct: false, explanation: 'Risk stratification, not direct decision.' },
      ],
    },
  ],

  // M18 is a decision-panel module — no waveform manipulation. We adapt to our
  // sim by locking everything and using a single integrated recognition prompt.
  scenario: {
    preset_id: 'extubation_readiness_panel',
    preset: {
      mode: 'PSV',
      settings: { psLevel: 6, peep: 5, fiO2: 40 },
      patient: { compliance: 55, resistance: 12, spontaneousRate: 16 },
    },
    unlocked_controls: [],
    visible_readouts: ['rsbi', 'actualRate', 'vte', 'mve', 'spo2'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'recognition',
    prompt: {
      prompt_id: 'M18-integrate',
      trigger: { kind: 'on_load' },
      question: 'RSBI 88, cuff leak 240 mL, weak cough, moderate secretions, follows commands, P/F 280, off pressors 24h, pneumonia improving but not resolved, day 6. Best decision?',
      options: [
        { label: 'Extubate now', is_correct: false },
        { label: 'Delay extubation, address weak cough + secretions', is_correct: true },
        { label: 'Continue full support indefinitely', is_correct: false },
        { label: 'Tracheostomy now', is_correct: false },
      ],
      max_attempts: 2,
    },
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Extubation is multifactorial.** Numbers help but don\'t decide. Weak cough + significant secretions are red flags even when other criteria look good.' },
    { kind: 'callout', tone: 'warn', markdown: 'Reintubation carries significantly increased mortality. Failing extubation is worse than delaying it by a day.' },
    { kind: 'figure', caption: 'Nine-item readiness panel (M18 spec).', ascii: 'RSBI 88              ✓ favorable\nCuff leak 240 mL     ✓ favorable\nCough strength weak  ✗ unfavorable\nSecretions moderate  ~ borderline\nFollows commands     ✓ favorable\nP/F 280              ✓ favorable\nOff pressors 24h     ✓ favorable\nPneumonia improving  ~ borderline\nDay 6 on vent        — neutral' },
  ],

  hint_ladder: {
    tier1: 'Read each panel item. Some clearly favorable, others unfavorable, some borderline.',
    tier2: 'Weak cough + moderate secretions are red flags. How does that change your call?',
    tier3: { hint_text: 'Use "Show me".' },
  },

  summative_quiz: [
    {
      id: 'M18-Q1',
      prompt: 'Cuff leak < 110 mL most likely indicates:',
      options: [
        { label: 'Cuff overinflated', is_correct: false },
        { label: 'Laryngeal edema or narrowing', is_correct: true },
        { label: 'Patient ready', is_correct: false },
        { label: 'Circuit leak', is_correct: false },
      ],
      explanation: 'Airway narrowed around tube. Steroids before extubation; some delay.',
    },
    {
      id: 'M18-Q2',
      prompt: 'Reintubation after failed extubation:',
      options: [
        { label: 'No change in mortality', is_correct: false },
        { label: 'Significantly increased mortality and longer ICU stay', is_correct: true },
        { label: 'Improved long-term outcomes', is_correct: false },
        { label: 'Shorter overall stay', is_correct: false },
      ],
      explanation: 'Strong independent predictor of worse outcomes. The decision matters.',
    },
    {
      id: 'M18-Q3',
      prompt: 'Most strongly predicts extubation success:',
      options: [
        { label: 'Strong cough, minimal secretions, alert, RSBI 70', is_correct: true },
        { label: 'Weak cough, copious secretions, drowsy, RSBI 70', is_correct: false },
        { label: 'Strong cough, copious secretions, alert, RSBI 130', is_correct: false },
        { label: 'Weak cough, minimal secretions, drowsy, RSBI 90', is_correct: false },
      ],
      explanation: 'A scores favorably on every axis. Multiple favorables far more predictive than any single number.',
    },
    {
      id: 'M18-Q4',
      prompt: 'Protocol-driven daily SBT and readiness assessment is associated with:',
      options: [
        { label: 'Shorter ventilator days', is_correct: true },
        { label: 'Longer ventilator days', is_correct: false },
        { label: 'Higher failure rates', is_correct: false },
        { label: 'No difference', is_correct: false },
      ],
      explanation: 'Discipline of asking daily prevents drift.',
    },
    {
      id: 'M18-Q5',
      prompt: 'Failed 2 extubations, ventilator-dependent at day 14. Next major decision:',
      options: [
        { label: 'Increase vent support', is_correct: false },
        { label: 'Discussion of tracheostomy', is_correct: true },
        { label: 'Withdrawal of care', is_correct: false },
        { label: 'Another immediate SBT', is_correct: false },
      ],
      explanation: 'Standard indication. Benefits: comfort, reduced sedation, easier weaning, less laryngeal injury.',
    },
  ],

  explore_card: {
    patient_context: '67-year-old admitted with pneumonia 6 days ago. Has been weaning over the last 48 hours. Today\'s SBT was completed. The right panel shows nine extubation-readiness data points for this patient. Your job will be to integrate them.',
    unlocked_controls_description: [],
    readouts_description: [
      { name: 'RSBI 88', description: 'favorable (below 105 threshold).' },
      { name: 'Cuff leak 240 mL', description: 'favorable (above 110 threshold).' },
      { name: 'Cough strength: weak', description: 'unfavorable.' },
      { name: 'Secretions burden: moderate', description: 'borderline.' },
      { name: 'Mental status: follows commands', description: 'favorable.' },
      { name: 'P/F 280', description: 'favorable (above 200).' },
      { name: 'Hemodynamics: off pressors 24h', description: 'favorable.' },
      { name: 'Pneumonia: improving but not resolved', description: 'borderline.' },
      { name: 'Days on vent: 6', description: 'neutral.' },
    ],
    suggestions: [
      'Identify which numbers clearly favor extubation, which clearly don\'t, and which are in the middle.',
      'Don\'t try to decide yet. The task will ask you to formally make the call.',
    ],
  },
  user_facing_task: "You're presenting this patient to the team. Walk through each of the nine readiness data points, then recommend what the team should do.",
  success_criteria_display: [
    'Recognize the favorable and unfavorable factors.',
    'Recommend the appropriate next step for this patient.',
  ],
  task_framing_style: 'C',

  key_points: [
    'Extubation is multifactorial.',
    'RSBI, cuff leak, cough, secretions, mental status, hemodynamics all contribute.',
    'Reintubation is harmful — delaying a day is better than failing.',
    'Protocolized assessments shorten ventilator days.',
    'Tracheostomy enters the conversation for prolonged ventilation.',
  ],
};

export const M19: ModuleConfig = {
  id: 'M19',
  number: 19,
  title: 'Troubleshooting the Vent (DOPE)',
  track: 'Synthesis',
  estimated_minutes: 18,
  visible_learning_objectives: [
    'Recognize and diagnose each of the four DOPE fault categories.',
    'Build a systematic mental model for rapid bedside troubleshooting.',
  ],

  primer_questions: [
    {
      id: 'M19-P1',
      prompt: 'The DOPE mnemonic stands for:',
      options: [
        { label: 'Displacement, Obstruction, Pneumothorax, Equipment', is_correct: true, explanation: 'Standard rapid-response framework when a ventilated patient acutely deteriorates.' },
        { label: 'Decompensation, Overdistension, Pressure, Edema', is_correct: false, explanation: 'Made-up alternate.' },
        { label: 'Disconnection, Oversedation, Pneumonia, Embolus', is_correct: false, explanation: 'Made-up alternate.' },
        { label: 'Dyspnea, Oxygen, PEEP, Endotracheal', is_correct: false, explanation: 'Made-up alternate.' },
      ],
    },
    {
      id: 'M19-P2',
      prompt: 'VC patient: peak 28 → 50; plateau (after pause) 22 → 24. Most likely:',
      options: [
        { label: 'Pneumothorax', is_correct: false, explanation: 'Compliance pattern (parallel rise). Here plateau barely changed.' },
        { label: 'Mucus plug or other airway obstruction', is_correct: true, explanation: 'Wide peak-plateau gap = resistance signature. Mucus, biting, kinking, bronchospasm fit. M4 applied at bedside.' },
        { label: 'Pulmonary edema', is_correct: false, explanation: 'Compliance problem.' },
        { label: 'Worsening ARDS', is_correct: false, explanation: 'Compliance.' },
      ],
    },
    {
      id: 'M19-P3',
      prompt: 'Sudden low-pressure / low-volume alarm. First action:',
      options: [
        { label: 'Increase FiO2', is_correct: false, explanation: "Doesn't fix circuit problem." },
        { label: 'Trace the circuit from patient back to vent', is_correct: true, explanation: 'Low pressure + low volume → breath isn\'t reaching patient. Disconnection most common cause. Bedside trace takes seconds.' },
        { label: 'Reduce PEEP', is_correct: false, explanation: 'Doesn\'t address.' },
        { label: 'Order CXR', is_correct: false, explanation: 'Imaging is downstream.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'troubleshooting_dope',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 14, peep: 5, fiO2: 50, iTime: 1.0 },
      patient: { compliance: 50, resistance: 10, spontaneousRate: 0 },
    },
    unlocked_controls: [],
    visible_readouts: ['pip', 'plat', 'vte', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    children: [
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M19-1',
          trigger: { kind: 'on_load' },
          question: 'Scenario 1/4: Sudden loss of returned tidal volume. Low pressure alarm. No ETCO2. Most likely cause?',
          options: [
            { label: 'Displacement (esophageal intubation)', is_correct: true },
            { label: 'Obstruction', is_correct: false },
            { label: 'Pneumothorax', is_correct: false },
            { label: 'Equipment leak', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M19-2',
          trigger: { kind: 'on_load' },
          question: 'Scenario 2/4: Peak rises 28 → 55. Plateau barely changes (24 → 26). High peak alarm. Most likely?',
          options: [
            { label: 'Displacement', is_correct: false },
            { label: 'Obstruction (mucus plug)', is_correct: true },
            { label: 'Pneumothorax', is_correct: false },
            { label: 'Equipment leak', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M19-3',
          trigger: { kind: 'on_load' },
          question: 'Scenario 3/4: Peak 28 → 48, plateau 22 → 42. Hemodynamics deteriorate (BP dropping). Most likely?',
          options: [
            { label: 'Displacement', is_correct: false },
            { label: 'Obstruction', is_correct: false },
            { label: 'Tension pneumothorax', is_correct: true },
            { label: 'Equipment leak', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M19-4',
          trigger: { kind: 'on_load' },
          question: 'Scenario 4/4: Delivered Vt 450, returned Vt 200. Pressure waveform shows early drop. Low volume alarm. Most likely?',
          options: [
            { label: 'Displacement', is_correct: false },
            { label: 'Obstruction', is_correct: false },
            { label: 'Pneumothorax', is_correct: false },
            { label: 'Equipment leak', is_correct: true },
          ],
          max_attempts: 2,
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**DOPE: Displacement, Obstruction, Pneumothorax, Equipment.** Each has a distinct alarm + waveform signature. The peak-plateau distinction from M4 is the central diagnostic move applied at the bedside.' },
    { kind: 'callout', tone: 'tip', markdown: 'Universal first step: **disconnect from the vent and bag-ventilate**. Easy bagging with poor return → displacement. Hard bagging → obstruction or pneumothorax. The diagnosis is often made in seconds.' },
    { kind: 'figure', caption: 'DOPE patterns side-by-side.', ascii: 'D - displacement: low pressure, no return, no ETCO2\nO - obstruction:  ↑peak, plateau ~same (wide gap)\nP - pneumothorax: ↑peak AND ↑plateau (parallel), hypotension\nE - equipment:    delivered ≠ returned Vt, early drop' },
  ],

  hint_ladder: {
    tier1: 'Read each scenario. Identify whether the pattern matches peak-only (resistance/displacement/equipment) or peak-and-plateau (compliance/pneumothorax) changes.',
    tier2: 'Use M4: parallel rise = compliance (pneumothorax). Widening gap = resistance (obstruction). No ETCO2 = displacement. Volume mismatch = equipment.',
    tier3: { hint_text: 'Use "Show me".' },
  },

  summative_quiz: [
    {
      id: 'M19-Q1',
      prompt: 'Peak 60, plateau 50, falling BP, diminished breath sounds right side. Most likely:',
      options: [
        { label: 'Mucus plug', is_correct: false },
        { label: 'Tension pneumothorax', is_correct: true },
        { label: 'Circuit disconnection', is_correct: false },
        { label: 'Esophageal intubation', is_correct: false },
      ],
      explanation: 'Parallel rise = compliance. Unilateral diminished sounds + hemodynamics = tension pneumothorax. Immediate needle decompression; X-ray after.',
    },
    {
      id: 'M19-Q2',
      prompt: 'Returned Vt consistently 200 mL less than delivered. Early pressure drop. Most likely:',
      options: [
        { label: 'Mucus plug', is_correct: false },
        { label: 'Pneumothorax', is_correct: false },
        { label: 'Circuit leak', is_correct: true },
        { label: 'Auto-PEEP', is_correct: false },
      ],
      explanation: 'Delivered ≠ returned = leak. Check connections, cuff, suction port. The "E" of DOPE.',
    },
    {
      id: 'M19-Q3',
      prompt: 'Patient fighting vent and biting tube would show:',
      options: [
        { label: 'Displacement pattern', is_correct: false },
        { label: 'Obstruction pattern', is_correct: true },
        { label: 'Pneumothorax pattern', is_correct: false },
        { label: 'Equipment pattern', is_correct: false },
      ],
      explanation: 'Tube biting = resistive obstruction at proximal airway. Wide peak-plateau gap. Treatment: bite block, sedation.',
    },
    {
      id: 'M19-Q4',
      prompt: 'Esophageal intubation on vent shows:',
      options: [
        { label: 'High peak, low plateau, normal ETCO2', is_correct: false },
        { label: 'Normal pressures, low/absent ETCO2, low returned Vt', is_correct: true },
        { label: 'High peak and plateau, hemodynamic collapse', is_correct: false },
        { label: 'Normal everything; only X-ray shows it', is_correct: false },
      ],
      explanation: 'Gas goes to stomach. CO2 not exchanged → ETCO2 absent (smoking gun). Capnography is rapid diagnostic.',
    },
    {
      id: 'M19-Q5',
      prompt: 'Deteriorating ventilated patient. First step:',
      options: [
        { label: 'Chest X-ray', is_correct: false },
        { label: 'Disconnect from vent and bag-ventilate while assessing', is_correct: true },
        { label: 'Order ABG', is_correct: false },
        { label: 'Bolus sedation', is_correct: false },
      ],
      explanation: 'Bag-and-go-look. Removes vent/circuit from differential. Hand-bagging assesses resistance. Often diagnoses in seconds.',
    },
  ],

  explore_card: {
    patient_context: 'This is the **bedside rapid-response** module. You won\'t be adjusting the ventilator. Instead, you\'ll be called to four different deteriorating patients, one at a time. The vent will alarm, the waveforms will change, and you\'ll be asked what\'s going on. The sim is currently showing a normal, stable patient as your baseline.',
    unlocked_controls_description: [],
    readouts_description: [
      { name: 'Baseline pressures', description: 'peak around 28, plateau around 22 (small gap — resistive component is small).' },
      { name: 'Vte and VE', description: 'tidal volume delivered ≈ tidal volume returned.' },
      { name: 'No alarms', description: 'normal patient — every case starts here and then diverges.' },
    ],
    suggestions: [
      'Memorize what "normal" looks like on these readouts — every case starts here and then diverges.',
      'Mentally rehearse the four DOPE categories: Displacement, Obstruction, Pneumothorax, Equipment. Each has a different signature.',
      'When you\'re comfortable, start the task. The cases will move quickly.',
    ],
  },
  user_facing_task: "You're paged to four ventilated patients in succession, each acutely deteriorating. For each one, the alarms and waveforms tell you which DOPE category is in play. Name the cause for each. Then there's a final round: all four again in random order, no labels, single try each.",
  success_criteria_display: [
    'Correctly identify each of the four DOPE patterns (two attempts each).',
    'Then identify all four again in the final round on the first attempt.',
  ],
  task_framing_style: 'C',

  key_points: [
    'DOPE = Displacement, Obstruction, Pneumothorax, Equipment.',
    'Each has distinct waveform/alarm signature.',
    'Bag-and-go-look is the universal first step.',
    'Capnography distinguishes esophageal intubation rapidly.',
    'The peak-plateau framework from M4 is the central bedside diagnostic move.',
  ],
};
