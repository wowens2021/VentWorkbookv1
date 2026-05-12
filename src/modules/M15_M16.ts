import type { ModuleConfig } from '../shell/types';

export const M15: ModuleConfig = {
  id: 'M15',
  number: 15,
  title: 'ARDS-Specific Ventilation',
  track: 'Strategy',
  estimated_minutes: 16,
  visible_learning_objectives: [
    'Achieve a lung-protective state (Vt ≤ 6 mL/kg, plateau ≤ 30, driving pressure ≤ 15).',
    'Recognize trade-offs between lung-protective settings and CO2 clearance.',
  ],

  primer_questions: [
    {
      id: 'M15-P1',
      prompt: 'In the ARDSnet trial, low Vt was defined as:',
      options: [
        { label: '4 mL/kg ideal BW', is_correct: false, explanation: 'Too low for routine use without ECCO2R.' },
        { label: '6 mL/kg ideal (predicted) body weight', is_correct: true, explanation: 'ARDSnet uses 6 mL/kg of PBW — calculated from height — not actual weight. Critical distinction; obese patients would otherwise get dangerous volumes.' },
        { label: '8 mL/kg PBW', is_correct: false, explanation: 'The comparator arm; worse outcomes.' },
        { label: '10 mL/kg actual BW', is_correct: false, explanation: 'Actual BW overestimates lung capacity.' },
      ],
    },
    {
      id: 'M15-P2',
      prompt: 'Plateau pressure target in ARDS:',
      options: [
        { label: '< 30 cmH2O', is_correct: true, explanation: 'Standard target. Above this, alveolar overdistension injury rises sharply.' },
        { label: '< 50 cmH2O', is_correct: false, explanation: 'Well into injurious territory.' },
        { label: '< 20 always', is_correct: false, explanation: 'Overly restrictive.' },
        { label: 'Doesn\'t matter as long as peak controlled', is_correct: false, explanation: 'Plateau matters more for lung injury — it\'s the alveolar pressure.' },
      ],
    },
    {
      id: 'M15-P3',
      prompt: 'Allowing PaCO2 to rise to maintain low Vt is called:',
      options: [
        { label: 'Hypercapnic shock', is_correct: false, explanation: 'Not a standard term.' },
        { label: 'Permissive hypercapnia', is_correct: true, explanation: 'Deliberate acceptance of elevated PaCO2 (60s–70s) as trade-off for protective volumes. Renal compensation over time.' },
        { label: 'Decompensated acidosis', is_correct: false, explanation: 'Strategy expects compensation, not failure.' },
        { label: 'Compensatory hyperventilation', is_correct: false, explanation: 'Opposite direction.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'ards_baseline_vc',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 560, respiratoryRate: 18, peep: 10, fiO2: 60, iTime: 1.0 },
      patient: { compliance: 25, resistance: 12, spontaneousRate: 0, gender: 'M', heightInches: 70 },
    },
    unlocked_controls: ['tidalVolume', 'respiratoryRate'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'vte', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  hidden_objective: {
    kind: 'outcome',
    readouts: {
      vte: { operator: '<=', value: 430 }, // ~6 mL/kg PBW for 70 kg
      plat: { operator: '<=', value: 30 },
      drivingPressure: { operator: '<=', value: 15 },
    },
    sustain_breaths: 5,
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Lung-protective ventilation = 6 mL/kg PBW, plateau ≤ 30, driving pressure ≤ 15.** All three simultaneously. PBW is calculated from height, not weight.' },
    { kind: 'callout', tone: 'tip', markdown: 'Lower the Vt first. To preserve minute ventilation, raise the rate (often into the 20s-30s). Permissive hypercapnia is expected.' },
    { kind: 'predict_observe', predict: 'Patient is 70 kg PBW. Target Vt = 6 × 70 = 420 mL. Current Vt 560 = 8 mL/kg. What rate do you need to maintain MV around 9 L/min?', observe: '0.42 L × rate = 9 → rate ≈ 22. The trade-off in lung protection: smaller breaths, more breaths.' },
  ],

  hint_ladder: {
    tier1: 'Tidal volume should be ≤ 6 mL/kg PBW. Lower it.',
    tier2: 'Lower the Vt and raise the rate to preserve MV. Watch plateau and driving pressure drop below 30 and 15.',
    tier3: { hint_text: 'Use "Show me".', demonstration: { control: 'tidalVolume', target_value: 420 } },
  },

  summative_quiz: [
    {
      id: 'M15-Q1',
      prompt: 'Patient 175 cm tall (PBW ~70 kg). Target Vt:',
      options: [
        { label: 'About 420 mL', is_correct: true },
        { label: 'About 560 mL', is_correct: false },
        { label: 'About 700 mL', is_correct: false },
        { label: 'Don\'t calculate; target pressure instead', is_correct: false },
      ],
      explanation: '6 × 70 = 420 mL. Driving pressure can be an additional target.',
    },
    {
      id: 'M15-Q2',
      prompt: 'After reducing Vt, plateau 32, driving P 18. Next step:',
      options: [
        { label: 'Increase Vt back', is_correct: false },
        { label: 'Lower Vt further toward 5 mL/kg', is_correct: true },
        { label: 'Lower PEEP', is_correct: false },
        { label: 'Switch to PC', is_correct: false },
      ],
      explanation: 'If targets not met at 6 mL/kg, go to 5 or even 4. Mode switching doesn\'t fix stiff lung. Lowering PEEP risks de-recruitment.',
    },
    {
      id: 'M15-Q3',
      prompt: 'Permissive hypercapnia contraindicated in:',
      options: [
        { label: 'Mild renal impairment', is_correct: false },
        { label: 'Elevated ICP', is_correct: true },
        { label: 'Stable hemodynamics', is_correct: false },
        { label: 'Chronic respiratory acidosis baseline', is_correct: false },
      ],
      explanation: 'Hypercapnia → cerebral vasodilation → ICP rise. TBI patients can\'t afford it.',
    },
    {
      id: 'M15-Q4',
      prompt: 'Driving pressure conceptually:',
      options: [
        { label: 'Pressure overcoming airway resistance', is_correct: false },
        { label: 'Pressure required to deliver Vt across compliance', is_correct: true },
        { label: 'Same as PEEP', is_correct: false },
        { label: 'Same as peak', is_correct: false },
      ],
      explanation: 'Plateau − PEEP. Equals Vt/C. High DP = low C challenged by high V.',
    },
    {
      id: 'M15-Q5',
      prompt: 'Strongest evidence for prone positioning in ARDS:',
      options: [
        { label: 'Mild (P/F 200–300)', is_correct: false },
        { label: 'Moderate (P/F 100–200)', is_correct: false },
        { label: 'Severe (P/F < 150 or < 100)', is_correct: true },
        { label: 'Any severity', is_correct: false },
      ],
      explanation: 'PROSEVA showed mortality benefit primarily in severe ARDS.',
    },
  ],

  key_points: [
    '6 mL/kg PBW starting Vt.',
    'Plateau ≤ 30. Driving pressure ≤ 15.',
    'Permissive hypercapnia is the trade-off.',
    'Severity-specific rescue: prone positioning, NMBA, ECMO.',
    'PBW from height, not weight.',
  ],
};

export const M16: ModuleConfig = {
  id: 'M16',
  number: 16,
  title: 'Obstructive Disease Ventilation',
  track: 'Strategy',
  estimated_minutes: 14,
  visible_learning_objectives: [
    'Recognize and resolve auto-PEEP in an obstructive patient by adjusting rate and I:E.',
    'Understand the rationale for permissive hypercapnia in obstructive disease.',
  ],

  primer_questions: [
    {
      id: 'M16-P1',
      prompt: 'Fundamental ventilatory problem in severe asthma/COPD:',
      options: [
        { label: 'Low compliance limiting Vt', is_correct: false, explanation: 'That\'s ARDS, not obstruction.' },
        { label: 'High airway resistance limiting expiratory flow', is_correct: true, explanation: 'Air goes in OK, struggles to come out → dynamic hyperinflation, auto-PEEP. The whole strategy is built around this.' },
        { label: 'Failure of central drive', is_correct: false, explanation: 'Drive usually intact or elevated.' },
        { label: 'Reduced FiO2 delivery', is_correct: false, explanation: 'Oxygenation issues come from V/Q, not delivery.' },
      ],
    },
    {
      id: 'M16-P2',
      prompt: 'To minimize auto-PEEP in obstructive patient, most important strategy:',
      options: [
        { label: 'Maximize rate', is_correct: false, explanation: 'High rate shortens expiratory time → worsens trapping.' },
        { label: 'Allow adequate expiratory time (low rate, short Ti)', is_correct: true, explanation: 'Whole point: give lungs time to empty. Often accept hypercapnia.' },
        { label: 'Use highest Vt', is_correct: false, explanation: 'Larger Vt → more gas to exhale → worse trapping.' },
        { label: 'Minimize PEEP to zero', is_correct: false, explanation: 'Can worsen trigger work in spontaneously breathing.' },
      ],
    },
    {
      id: 'M16-P3',
      prompt: 'Permissive hypercapnia in obstructive disease because:',
      options: [
        { label: 'Lungs are stiffer than normal', is_correct: false, explanation: 'Stiffness is ARDS.' },
        { label: 'Aggressive ventilation worsens hyperinflation, risks barotrauma', is_correct: true, explanation: 'Normalizing CO2 requires short Te → worse trapping → rising airway pressures → barotrauma. Accept higher CO2.' },
        { label: 'COPD baseline is always elevated', is_correct: false, explanation: 'Not the reason for the strategy.' },
        { label: 'CO2 isn\'t a concern', is_correct: false, explanation: 'Strategy is about tolerating elevation.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'obstructive_severe',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 400, respiratoryRate: 22, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 50, resistance: 28, spontaneousRate: 0 },
    },
    unlocked_controls: ['respiratoryRate', 'iTime', 'tidalVolume'],
    visible_readouts: ['pip', 'plat', 'autoPeep', 'totalPeep', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'outcome',
    readouts: { autoPeep: { operator: '<', value: 2 } },
    sustain_breaths: 5,
  },

  content_blocks: [
    { kind: 'prose', markdown: '**Obstruction = resistance + long time constants.** Strategy: low rate, short Ti, long Te. Permissive hypercapnia is expected. Renal compensation buffers over time.' },
    { kind: 'callout', tone: 'warn', markdown: 'In persistent auto-PEEP, consider deep sedation ± paralysis to reduce patient drive. Fewer triggered breaths = more expiratory time per cycle.' },
  ],

  hint_ladder: {
    tier1: 'Look at the flow waveform. Is expiration completing before the next breath?',
    tier2: 'Lower the rate or extend expiratory time. Possibly reduce Vt.',
    tier3: { hint_text: 'Use "Show me".', demonstration: { control: 'respiratoryRate', target_value: 12 } },
  },

  summative_quiz: [
    {
      id: 'M16-Q1',
      prompt: 'Severe asthma on VC, rate 24, I:E 1:2, auto-PEEP. Best first adjustment:',
      options: [
        { label: 'Increase Vt to push past obstruction', is_correct: false },
        { label: 'Lower rate to ~12', is_correct: true },
        { label: 'Increase PEEP to 10', is_correct: false },
        { label: 'Inhaled corticosteroids', is_correct: false },
      ],
      explanation: 'Halving rate doubles expiratory time. Highest-yield ventilator-side intervention.',
    },
    {
      id: 'M16-Q2',
      prompt: 'Paralyzed asthma on VC: peak 60, plateau 25, trapping. Pattern:',
      options: [
        { label: 'Predominant compliance', is_correct: false },
        { label: 'Predominant resistance', is_correct: true },
        { label: 'Equipment', is_correct: false },
        { label: 'Adequate', is_correct: false },
      ],
      explanation: 'Gap 35 = massive resistance. Plateau 25 = alveoli OK. Burden is airway.',
    },
    {
      id: 'M16-Q3',
      prompt: 'Obstructive patient, raise extrinsic PEEP 0 → 5 helps when:',
      options: [
        { label: 'Paralyzed, not triggering', is_correct: false },
        { label: 'Spontaneous with auto-PEEP, ineffective triggering', is_correct: true },
        { label: 'Plateau already 35', is_correct: false },
        { label: 'Never helps', is_correct: false },
      ],
      explanation: 'Patient must drop alveolar pressure below set PEEP to trigger. Matching ~60–80% of auto-PEEP reduces trigger work.',
    },
    {
      id: 'M16-Q4',
      prompt: 'Permissive hypercapnia generally acceptable up to:',
      options: [
        { label: 'PaCO2 50, pH 7.30', is_correct: false },
        { label: 'PaCO2 60–80, pH 7.20–7.25', is_correct: true },
        { label: 'PaCO2 100 regardless of pH', is_correct: false },
        { label: 'No upper limit', is_correct: false },
      ],
      explanation: 'Common range. Below pH 7.20: buffer or ECCO2R. Above 7.25: most teams continue.',
    },
    {
      id: 'M16-Q5',
      prompt: 'Severe COPD, persistent auto-PEEP despite optimal settings. Next escalation:',
      options: [
        { label: 'Add sedation + NMBA to reduce drive', is_correct: true },
        { label: 'Increase Vt to "blow off" CO2', is_correct: false },
        { label: 'Switch to SIMV', is_correct: false },
        { label: 'Reduce FiO2', is_correct: false },
      ],
      explanation: 'Reduce patient drive and asynchrony. Fewer attempted breaths = more Te per cycle.',
    },
  ],

  key_points: [
    'Obstruction = resistance + long Te.',
    'Auto-PEEP is the hallmark complication.',
    'Low rate, long Te primary levers.',
    'Permissive hypercapnia expected.',
    'Sedation/paralysis is escalation for persistent auto-PEEP.',
  ],
};
