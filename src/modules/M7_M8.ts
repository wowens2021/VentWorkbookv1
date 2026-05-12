import type { ModuleConfig } from '../shell/types';

export const M7: ModuleConfig = {
  id: 'M7',
  number: 7,
  title: 'Volume Control',
  track: 'Modes',
  estimated_minutes: 12,
  visible_learning_objectives: [
    'Identify the characteristic VC waveform pattern.',
    'Predict how Vt and inspiratory flow changes affect the pressure waveform.',
  ],

  primer_questions: [
    {
      id: 'M7-P1',
      prompt: 'In volume control, which is the dependent variable?',
      options: [
        { label: 'Tidal volume', is_correct: false, explanation: 'Vt is what you set — the defining feature of VC.' },
        { label: 'Inspiratory flow rate', is_correct: false, explanation: 'Also operator-set.' },
        { label: 'Pressure', is_correct: true, explanation: 'In VC, the vent does whatever pressure is required to deliver set volume at set flow. Compliance drops or resistance rises → pressure rises.' },
        { label: 'PEEP', is_correct: false, explanation: 'Operator-set; constant within a breath.' },
      ],
    },
    {
      id: 'M7-P2',
      prompt: 'In VC, the pressure-time waveform typically looks like:',
      options: [
        { label: 'A square (rectangular) shape', is_correct: false, explanation: "That's PC, not VC. Opposite waveform shapes." },
        { label: 'A ramped (rising) shape peaking at end-inspiration', is_correct: true, explanation: 'In VC, flow is constant (square flow) but pressure rises through inspiration as volume accumulates. Peak at end-inspiration.' },
        { label: 'A decelerating curve from a high initial pressure', is_correct: false, explanation: "That's the flow pattern in PC." },
        { label: 'Flat line at set inspiratory pressure', is_correct: false, explanation: 'Pressure changes during the breath.' },
      ],
    },
    {
      id: 'M7-P3',
      prompt: 'High peak pressure alarm on VC. First response:',
      options: [
        { label: 'Increase Vt to overcome the resistance', is_correct: false, explanation: 'Would raise peak further. The alarm is a signal to investigate, not a target to override.' },
        { label: 'Check the patient, the tubing, and review the peak-plateau gap', is_correct: true, explanation: 'High peak can be from patient (bronchospasm, secretions, pneumothorax) or equipment (kink, water). M4 framework is the diagnostic.' },
        { label: 'Switch to pressure control', is_correct: false, explanation: "Doesn't fix the underlying problem; PC may mask falling volume." },
        { label: 'Increase PEEP', is_correct: false, explanation: 'Raises both peak and plateau without addressing the cause.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'passive_baseline_vc',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 400, respiratoryRate: 12, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 60, resistance: 10, spontaneousRate: 0 },
    },
    unlocked_controls: ['tidalVolume', 'iTime'],
    visible_readouts: ['pip', 'plat', 'vte'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: true,
    children: [
      {
        kind: 'manipulation',
        control: 'tidalVolume',
        condition: { type: 'range', min: 580, max: 620 },
        require_acknowledgment: {
          question: 'You set Vt to ~600. What changed on the pressure waveform?',
          options: [
            { label: 'Peak rose; flow shape unchanged (still square)', is_correct: true },
            { label: 'Flow shape changed', is_correct: false },
            { label: 'Nothing changed', is_correct: false },
            { label: 'Only inspiratory time changed', is_correct: false },
          ],
        },
      },
      {
        kind: 'manipulation',
        control: 'iTime',
        condition: { type: 'delta_pct', direction: 'decrease', min_pct: 30 },
        require_acknowledgment: {
          question: 'You shortened inspiratory time (i.e., raised flow). What happened?',
          options: [
            { label: 'Inspiratory time shortened and peak rose', is_correct: true },
            { label: 'Both fell', is_correct: false },
            { label: 'Inspiratory time lengthened', is_correct: false },
            { label: 'Only peak changed', is_correct: false },
          ],
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Volume control = volume is guaranteed; pressure is the price.** Flow is constant (square); pressure rises through the breath as elastic builds up. Peak occurs at end-inspiration.' },
    { kind: 'callout', tone: 'tip', markdown: 'Higher flow → shorter inspiratory time → higher peak (resistive component scales with flow). The trade-off: faster delivery but more airway pressure.' },
  ],

  hint_ladder: {
    tier1: 'Adjust the tidal volume and watch the pressure curve.',
    tier2: 'Try setting Vt to about 600 mL. Then shorten I-time (which raises flow).',
    tier3: { hint_text: 'Use "Show me".', demonstration: { control: 'tidalVolume', target_value: 600 } },
  },

  summative_quiz: [
    {
      id: 'M7-Q1',
      prompt: 'On VC, the flow-time waveform during inspiration is:',
      options: [
        { label: 'Decelerating from high initial peak', is_correct: false },
        { label: 'Constant square pattern', is_correct: true },
        { label: 'Sinusoidal', is_correct: false },
        { label: 'Variable per breath', is_correct: false },
      ],
      explanation: 'VC delivers set flow throughout inspiration. Square flow means pressure rises through inspiration. Decelerating flow is PC.',
    },
    {
      id: 'M7-Q2',
      prompt: 'Vt 500 mL, flow 60 L/min → Ti 0.5 s. Increase flow to 90 L/min:',
      options: [
        { label: '0.5 s (unchanged)', is_correct: false },
        { label: '0.33 s', is_correct: true },
        { label: '0.75 s', is_correct: false },
        { label: '1.0 s', is_correct: false },
      ],
      explanation: 'Ti = Vt / flow. 500 / 1500 = 0.33 s. Useful in obstructive disease to lengthen expiratory time.',
    },
    {
      id: 'M7-Q3',
      prompt: 'High peak alarm. Plateau unchanged. First action:',
      options: [
        { label: 'Reduce Vt', is_correct: false },
        { label: 'Suction airway, check tube position, assess bronchospasm', is_correct: true },
        { label: 'Increase PEEP', is_correct: false },
        { label: 'Switch to PC', is_correct: false },
      ],
      explanation: 'Peak rise with unchanged plateau = resistance problem. Look for cause.',
    },
    {
      id: 'M7-Q4',
      prompt: 'Increasing Vt from 400 to 600 with flow/rate constant will:',
      options: [
        { label: 'Raise peak and Ti', is_correct: true },
        { label: 'Raise peak but Ti unchanged', is_correct: false },
        { label: 'Lower peak', is_correct: false },
        { label: 'No effect', is_correct: false },
      ],
      explanation: 'More volume → more elastic pressure (peak up). Ti = Vt/flow — more volume at constant flow takes more time.',
    },
    {
      id: 'M7-Q5',
      prompt: 'Main clinical drawback of VC:',
      options: [
        { label: 'Vt is unpredictable', is_correct: false },
        { label: 'Pressure can rise dangerously high when mechanics worsen', is_correct: true },
        { label: 'Cannot be used in spontaneous patients', is_correct: false },
        { label: 'No guaranteed minute ventilation', is_correct: false },
      ],
      explanation: 'Guaranteed volume is also the risk. If compliance drops or resistance rises, pressure rises to deliver the set volume.',
    },
  ],

  explore_card: {
    patient_context: 'Passive patient with normal lung mechanics, on volume control. You\'re learning the dials of VC.',
    unlocked_controls_description: [
      { name: 'Tidal volume', description: 'the volume per breath the ventilator will deliver no matter what. Range 200–800 mL.' },
      { name: 'I-time / inspiratory flow', description: 'how fast the ventilator delivers the breath. Shorter I-time = faster flow.' },
    ],
    readouts_description: [
      { name: 'Peak pressure', description: 'the pressure the vent had to produce.' },
      { name: 'Plateau pressure', description: 'the alveolar pressure once flow stopped.' },
      { name: 'Three waveforms: pressure, flow, and volume over time', description: 'flow is flat-square in VC — that\'s the signature.' },
    ],
    suggestions: [
      'Notice the flow waveform: it\'s a flat square shape — constant flow throughout the breath. That\'s the VC signature.',
      'Watch the pressure waveform: it ramps up gradually as volume accumulates.',
      'Try increasing tidal volume by 50%. Watch peak rise. Does the flow shape stay the same?',
      'Try shortening I-time (= higher flow). The breath gets delivered faster — what does that do to peak pressure?',
    ],
  },
  user_facing_task: "You'll make two adjustments to confirm how volume control behaves. First, set the tidal volume to 600 mL and identify what changed. Then shorten the inspiratory time by about a third (raising flow) and identify what changed.",
  success_criteria_display: [
    'Set tidal volume to 600 mL (±20) and answer what happened to the pressure waveform.',
    'Then shorten I-time substantially and answer what happened to inspiratory time and peak pressure.',
    'Sim resets between the two changes.',
  ],
  task_framing_style: 'A',

  key_points: [
    'VC: volume guaranteed; pressure is dependent.',
    'Square flow waveform; ramped pressure curve.',
    'Increasing Vt raises peak (more elastic). Increasing flow shortens Ti and also raises peak (more resistive).',
    'High peak alarm in VC: investigate using the peak-plateau framework from M4.',
  ],
};

export const M8: ModuleConfig = {
  id: 'M8',
  number: 8,
  title: 'Pressure Control',
  track: 'Modes',
  estimated_minutes: 12,
  visible_learning_objectives: [
    'Identify the characteristic PC waveform pattern.',
    'Recognize that in PC, tidal volume is the dependent variable.',
  ],

  primer_questions: [
    {
      id: 'M8-P1',
      prompt: 'Patient on PC at Pinsp 18 → Vt 500. Compliance worsens. Delivered Vt will:',
      options: [
        { label: 'Stay at 500 (vent adjusts pressure)', is_correct: false, explanation: 'That\'s PRVC, not pure PC.' },
        { label: 'Decrease', is_correct: true, explanation: 'In PC, pressure is fixed; volume varies. Stiffer lungs accept less volume at the same pressure. The silent danger of PC.' },
        { label: 'Increase as lungs stiffen', is_correct: false, explanation: 'Stiffer lungs need more pressure for same volume — at fixed pressure, less volume goes in.' },
        { label: 'Unchanged unless operator changes settings', is_correct: false, explanation: 'Volume WILL change without operator action.' },
      ],
    },
    {
      id: 'M8-P2',
      prompt: 'In PC, the flow-time waveform shows:',
      options: [
        { label: 'Square pattern with constant flow', is_correct: false, explanation: "That's VC." },
        { label: 'Decelerating pattern, tapering as lungs fill', is_correct: true, explanation: 'Vent pressurizes circuit quickly → burst of high initial flow. As alveolar pressure rises and gradient narrows, flow decelerates. Visual fingerprint of PC.' },
        { label: 'Flat line at zero', is_correct: false, explanation: 'Gas has to move for a breath.' },
        { label: 'Rising flow throughout inspiration', is_correct: false, explanation: 'Not a normal pattern.' },
      ],
    },
    {
      id: 'M8-P3',
      prompt: 'PC preferable when:',
      options: [
        { label: 'Fixed MV critical (e.g., elevated ICP)', is_correct: false, explanation: 'VC is more reliable for guaranteed MV.' },
        { label: 'Limit peak alveolar pressures in heterogeneous lungs', is_correct: true, explanation: 'PC caps pressure by design. In ARDS, fixing pressure limits over-distention of open alveoli.' },
        { label: 'Fully paralyzed with stable mechanics', is_correct: false, explanation: 'Either mode works fine when mechanics are stable.' },
        { label: 'Stable post-op routine support', is_correct: false, explanation: 'VC predictability matches stable state.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'passive_baseline_pc',
    preset: {
      mode: 'PCV',
      settings: { pInsp: 15, respiratoryRate: 12, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 50, resistance: 10, spontaneousRate: 0 },
    },
    unlocked_controls: ['pInsp', 'compliance'],
    visible_readouts: ['pip', 'vte', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: true,
    children: [
      {
        kind: 'manipulation',
        control: 'pInsp',
        condition: { type: 'delta_pct', direction: 'increase', min_pct: 30 },
        require_acknowledgment: {
          question: 'You raised Pinsp 30%+. What happened to delivered Vt?',
          options: [
            { label: 'Increased', is_correct: true },
            { label: 'Decreased', is_correct: false },
            { label: 'Unchanged', is_correct: false },
          ],
        },
      },
      {
        kind: 'manipulation',
        control: 'compliance',
        condition: { type: 'delta_pct', direction: 'decrease', min_pct: 30 },
        require_acknowledgment: {
          question: 'You decreased compliance. What happened to pressure waveform and delivered Vt?',
          options: [
            { label: 'Pressure unchanged, volume dropped', is_correct: true },
            { label: 'Pressure rose, volume unchanged', is_correct: false },
            { label: 'Both fell', is_correct: false },
            { label: 'Both rose', is_correct: false },
          ],
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Pressure control = pressure is guaranteed; volume is the price.** Compare with M4 part A (compliance ↓ in VC = pressure ↑). Here it\'s the inverse: compliance ↓ in PC = volume ↓, pressure unchanged.' },
    { kind: 'callout', tone: 'warn', markdown: 'PC has no rising-pressure alarm to warn you when mechanics worsen. **Watch the delivered tidal volume** — that\'s where the change shows up.' },
    { kind: 'figure', caption: 'PC: square pressure (set), decelerating flow (dependent), variable volume.', ascii: 'Pressure: |‾‾‾‾‾‾| (square)\nFlow:    /╲       (decelerating)\nVolume:  ╱⌒       (curves up, varies)' },
  ],

  hint_ladder: {
    tier1: 'Adjust Pinsp and watch the delivered Vt.',
    tier2: 'After exploring Pinsp, drop compliance. Compare to M4 — what\'s different?',
    tier3: { hint_text: 'Use "Show me".', demonstration: { control: 'pInsp', target_value: 22 } },
  },

  summative_quiz: [
    {
      id: 'M8-Q1',
      prompt: 'On PC, flow-time waveform is:',
      options: [
        { label: 'Square constant', is_correct: false },
        { label: 'Decelerating: high initial flow tapering', is_correct: true },
        { label: 'Sinusoidal', is_correct: false },
        { label: 'Flat near zero', is_correct: false },
      ],
      explanation: 'Decelerating flow is the visual fingerprint of PC.',
    },
    {
      id: 'M8-Q2',
      prompt: 'PC: Pinsp 16, PEEP 5, Vt 480. Compliance halves. New Vt ≈',
      options: [
        { label: '480 (unchanged)', is_correct: false },
        { label: '240', is_correct: true },
        { label: '960', is_correct: false },
        { label: 'Variable', is_correct: false },
      ],
      explanation: 'Driving pressure 11 was delivering 480 mL (C ≈ 44). Halve C, Pinsp same → 240 mL. Silent danger.',
    },
    {
      id: 'M8-Q3',
      prompt: 'Switch from VC (Vt 500, peak 32, plateau 26) to PC. PEEP 5. Approximate Pinsp:',
      options: [
        { label: '11', is_correct: false },
        { label: '21', is_correct: true },
        { label: '27', is_correct: false },
        { label: '32', is_correct: false },
      ],
      explanation: 'Match the driving pressure: plateau 26 − PEEP 5 = 21 cmH2O above PEEP.',
    },
    {
      id: 'M8-Q4',
      prompt: 'Clinical advantage of PC over VC:',
      options: [
        { label: 'Guaranteed MV', is_correct: false },
        { label: 'Predictable Vt regardless of mechanics', is_correct: false },
        { label: 'Pressure limited by design', is_correct: true },
        { label: 'PC always better synchrony', is_correct: false },
      ],
      explanation: 'PC\'s appeal: pressure cannot exceed set value. Protects open alveoli in heterogeneous lungs.',
    },
    {
      id: 'M8-Q5',
      prompt: 'In PC, increase Ti from 1.0 to 1.5 s:',
      options: [
        { label: 'Modest Vt increase + raises mean airway pressure', is_correct: true },
        { label: 'No effect on Vt', is_correct: false },
        { label: 'Decreases Vt', is_correct: false },
        { label: 'Decreases mean airway pressure', is_correct: false },
      ],
      explanation: 'Longer Ti lets lungs equilibrate with set pressure → modest Vt increase. Mean Paw rises clearly. M14 lever.',
    },
  ],

  explore_card: {
    patient_context: 'Passive patient on pressure control. The vent is set to deliver each breath at a fixed inspiratory pressure of 15 above PEEP.',
    unlocked_controls_description: [
      { name: 'Inspiratory pressure (Pinsp)', description: 'the target pressure for each breath. Range 1–60 cmH2O above PEEP.' },
      { name: 'Compliance', description: 'how easily the lungs stretch. Range 15–80 mL/cmH2O. Adjustable here so you can see how PC reacts to compliance changes.' },
    ],
    readouts_description: [
      { name: 'Peak pressure', description: 'should equal Pinsp + PEEP since PC holds pressure constant.' },
      { name: 'Tidal volume delivered (Vte)', description: 'this is the dependent variable in PC. It\'s what *changes* when mechanics change.' },
      { name: 'Three waveforms: pressure, flow, volume', description: 'note the decelerating flow shape.' },
    ],
    suggestions: [
      'Look at the flow waveform — decelerating, not square. That\'s the PC signature, opposite of VC.',
      'Try raising inspiratory pressure by 5. Watch the volume rise.',
      'Now reset, then *lower* compliance by half (simulating worsening lung disease). Pressure waveform doesn\'t change much — but what does the delivered tidal volume do?',
      'This is the inverse of VC: pressure is the fixed knob, volume is what gives way.',
    ],
  },
  user_facing_task: "You'll make two adjustments that show how pressure control behaves. First, raise the inspiratory pressure and identify what happens to the delivered tidal volume. Then simulate worsening lung compliance and identify what happens to volume and pressure.",
  success_criteria_display: [
    'Increase inspiratory pressure by at least 30% and identify the effect on tidal volume.',
    'Reduce compliance by at least 30% and identify what happens to pressure and volume.',
    'Sim resets between the two.',
  ],
  task_framing_style: 'A',

  key_points: [
    'PC: pressure guaranteed; volume dependent.',
    'Square pressure, decelerating flow.',
    'Inverse of VC: same compliance change yields opposite waveform consequence.',
    'Silent failure mode: delivered Vt drops without alarm when mechanics worsen.',
  ],
};
