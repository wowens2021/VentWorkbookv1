import type { ModuleConfig } from '../shell/types';

export const M4: ModuleConfig = {
  id: 'M4',
  number: 4,
  title: 'Compliance and Resistance',
  track: 'Physiology',
  estimated_minutes: 15,
  visible_learning_objectives: [
    'Distinguish compliance problems from resistance problems on the pressure waveform.',
    'Use the peak-plateau gap as a diagnostic tool.',
  ],

  primer_questions: [
    {
      id: 'M4-P1',
      prompt: 'Patient: peak 35, plateau 20 (gap 15). One hour later: peak 50, plateau 22 (gap 28). The most likely cause is:',
      options: [
        { label: 'Worsening lung compliance', is_correct: false, explanation: 'A compliance problem would raise both peak and plateau roughly in parallel — the gap would stay similar.' },
        { label: 'Increased airway resistance (bronchospasm, mucus plug)', is_correct: true, explanation: 'The peak-plateau gap is the resistive component. Widening gap with barely-changed plateau = resistance problem.' },
        { label: 'A pneumothorax', is_correct: false, explanation: 'Pneumothorax acutely reduces compliance — both peak and plateau would rise together.' },
        { label: 'Right mainstem migration', is_correct: false, explanation: 'Right mainstem also presents as reduced compliance (ventilating one lung\'s worth of alveoli) — peak and plateau rise together.' },
      ],
    },
    {
      id: 'M4-P2',
      prompt: 'Compliance is defined as:',
      options: [
        { label: 'The pressure required to overcome airway resistance', is_correct: false, explanation: 'That describes resistive pressure, not compliance.' },
        { label: 'The change in volume per unit change in pressure', is_correct: true, explanation: 'C = ΔV / ΔP. A high-compliance lung distends easily; a low-compliance ("stiff") lung distends poorly. Low in ARDS, edema, fibrosis, pneumothorax.' },
        { label: 'The peak inspiratory pressure during a breath', is_correct: false, explanation: 'PIP is an observed value influenced by both compliance and resistance.' },
        { label: 'The ratio of inspiratory to expiratory time', is_correct: false, explanation: "That's I:E." },
      ],
    },
    {
      id: 'M4-P3',
      prompt: 'Two patients on VC have peak 45. Patient A: plateau 40 (gap 5). Patient B: plateau 22 (gap 23). True statement?',
      options: [
        { label: 'Both have the same underlying problem', is_correct: false, explanation: 'Same peak can come from very different mechanics. Plateau distinguishes them.' },
        { label: 'A has a resistance problem; B has a compliance problem', is_correct: false, explanation: 'Reversed. Narrow gap = compliance; wide gap = resistance.' },
        { label: 'A has a compliance problem; B has a resistance problem', is_correct: true, explanation: 'A\'s narrow gap (5) means most of the peak is alveolar — compliance. B\'s wide gap (23) means most of the peak is resistive — resistance.' },
        { label: 'Plateau pressures cannot differ at the same tidal volume', is_correct: false, explanation: 'They can — that\'s precisely what compliance means.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'passive_baseline_vc',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 12, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 50, resistance: 10, spontaneousRate: 0 },
    },
    unlocked_controls: ['compliance', 'resistance'],
    visible_readouts: ['pip', 'plat', 'drivingPressure'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: true,
    children: [
      {
        kind: 'manipulation',
        control: 'compliance',
        condition: { type: 'delta_pct', direction: 'decrease', min_pct: 30 },
        require_acknowledgment: {
          question: 'You just decreased compliance. What happened to the peak-to-plateau gap?',
          options: [
            { label: 'Unchanged', is_correct: true },
            { label: 'Widened', is_correct: false },
            { label: 'Narrowed', is_correct: false },
          ],
        },
      },
      {
        kind: 'manipulation',
        control: 'resistance',
        condition: { type: 'delta_pct', direction: 'increase', min_pct: 50 },
        require_acknowledgment: {
          question: 'You just increased resistance. What happened to the peak-to-plateau gap?',
          options: [
            { label: 'Widened', is_correct: true },
            { label: 'Unchanged', is_correct: false },
            { label: 'Narrowed', is_correct: false },
          ],
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**The peak-plateau gap is the most useful single number in basic vent troubleshooting.** A wide gap points at the airways (resistance). A narrow gap with high pressure points at the lung (compliance). Two different problems, two different bedside interventions.' },
    { kind: 'callout', tone: 'tip', markdown: 'Static compliance = Vt / (Pplat − PEEP). You can calculate it in your head every breath. A typical value in a healthy lung is 50–100 mL/cmH2O. ARDS pushes this below 30.' },
    { kind: 'figure', caption: 'Canonical pattern: parallel rise = compliance; widening gap = resistance.', ascii: 'Compliance problem:    Resistance problem:\n|‾‾‾| → |‾‾‾|         |‾‾‾| → |‾‾‾‾‾|\nPeak ↑↑               Peak ↑↑\nPlat ↑↑               Plat ─\nGap = same           Gap widens' },
  ],

  hint_ladder: {
    tier1: 'Adjust one of the unlocked controls and watch the peak-plateau pressure relationship.',
    tier2: 'Start with compliance. Lower it by 30% or more. Then trigger an inspiratory hold to measure plateau.',
    tier3: { hint_text: 'Use "Show me" to demonstrate.', demonstration: { control: 'compliance', target_value: 30 } },
  },

  summative_quiz: [
    {
      id: 'M4-Q1',
      prompt: 'Patient A: peak 28, plateau 26 (gap 2). Patient B: peak 38, plateau 18 (gap 20). True statement?',
      options: [
        { label: 'Both have resistance problems', is_correct: false },
        { label: 'Both have compliance problems', is_correct: false },
        { label: 'A has a compliance problem; B has a resistance problem', is_correct: true },
        { label: 'A has a resistance problem; B has a compliance problem', is_correct: false },
      ],
      explanation: 'Small gap (A) means peak is mostly alveolar — compliance. Large gap (B) means peak is mostly resistive — resistance.',
    },
    {
      id: 'M4-Q2',
      prompt: 'Peak rises from 28 to 45. Plateau rises from 22 to 38. The most likely cause is:',
      options: [
        { label: 'Bronchospasm', is_correct: false },
        { label: 'Mucus plug', is_correct: false },
        { label: 'Developing pneumothorax', is_correct: true },
        { label: 'Kinked ETT', is_correct: false },
      ],
      explanation: 'Peak and plateau rose roughly in parallel — compliance pattern. Pneumothorax acutely reduces compliance. The other three options are resistance patterns.',
    },
    {
      id: 'M4-Q3',
      prompt: "To assess compliance, you need:",
      options: [
        { label: 'Peak pressure and PEEP', is_correct: false },
        { label: 'Plateau pressure, PEEP, and tidal volume', is_correct: true },
        { label: 'Peak pressure and tidal volume', is_correct: false },
        { label: 'Mean airway pressure and respiratory rate', is_correct: false },
      ],
      explanation: 'Compliance = Vt / (Pplat − PEEP). Plateau (not peak) gives alveolar pressure.',
    },
    {
      id: 'M4-Q4',
      prompt: 'C = 25 mL/cmH2O. Vt 400 mL, PEEP 5. Plateau ≈',
      options: [
        { label: '15', is_correct: false },
        { label: '21', is_correct: true },
        { label: '30', is_correct: false },
        { label: '50', is_correct: false },
      ],
      explanation: 'Driving pressure = 400/25 = 16. Plateau = 16 + 5 = 21. ARDS-range compliance.',
    },
    {
      id: 'M4-Q5',
      prompt: 'A patient on PC has Vt 480 at Pinsp 18. Compliance halves. New Vt ≈',
      options: [
        { label: '480 (unchanged)', is_correct: false },
        { label: '240', is_correct: true },
        { label: '960', is_correct: false },
        { label: 'Cannot predict', is_correct: false },
      ],
      explanation: 'In PC, volume is dependent. If compliance halves and pressure is unchanged, volume halves.',
    },
  ],

  key_points: [
    'Peak rises with both compliance and resistance problems.',
    'Plateau rises only with compliance changes.',
    'Widening peak-plateau gap = resistance.',
    'Parallel rise of peak and plateau = compliance.',
    'Compliance = Vt / (Pplat − PEEP).',
  ],
};
