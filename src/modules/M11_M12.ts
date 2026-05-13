import type { ModuleConfig } from '../shell/types';

// M11 cycling-scenario adaptation: our harness doesn't natively iterate
// sub-presets. We approximate with a series of recognition prompts that
// describe each pattern verbally. A future enhancement: drive the sim through
// each preset in turn via the harness.
export const M11: ModuleConfig = {
  id: 'M11',
  number: 11,
  title: 'Dyssynchrony Recognition',
  track: 'Modes',
  estimated_minutes: 18,
  briefing: {
    tagline: 'Five waveform patterns. Five fixes that aren\'t sedation.',
    overview: "Patient-ventilator dyssynchrony is the bedside skill that separates clinicians who fiddle with sedation from clinicians who fix the problem. There are five common patterns, and each one looks different on the waveform. Once you can spot them, you can start matching the ventilator to the patient instead of the other way around. The patient will tell you what they want. You just have to read the screen.",
    what_youll_do: [
      'The five patterns: ineffective triggering, double-triggering, flow starvation, premature cycling, delayed cycling.',
      'Each one has a specific waveform signature and a specific fix.',
      'Sedation buries the problem. Synchrony solves it.',
    ],
  },
  visible_learning_objectives: [
    'Recognize the five common patterns of patient-ventilator dyssynchrony.',
    'Identify the waveform features that distinguish each pattern.',
  ],

  primer_questions: [
    {
      id: 'M11-P1',
      prompt: 'Patient-ventilator dyssynchrony refers to:',
      options: [
        { label: 'Mode switch without operator input', is_correct: false, explanation: 'Modes don\'t switch automatically.' },
        { label: 'Mismatch between what the patient wants and what the vent delivers', is_correct: true, explanation: 'Settings don\'t match the patient.' },
        { label: 'Internal calibration failure', is_correct: false, explanation: 'Not a clinical issue.' },
        { label: 'Drop in oxygen saturation', is_correct: false, explanation: 'Can contribute to desat but isn\'t defined by it.' },
      ],
    },
    {
      id: 'M11-P2',
      prompt: "In 'ineffective triggering', what's happening?",
      options: [
        { label: 'Vent triggers when patient isn\'t trying', is_correct: false, explanation: "That's auto-triggering." },
        { label: 'Patient tries to trigger, vent doesn\'t deliver', is_correct: true, explanation: 'Patient effort too weak or trigger too insensitive. Small negative deflections on pressure during expiration with no breath.' },
        { label: 'Two breaths in rapid succession', is_correct: false, explanation: "That's double-triggering." },
        { label: 'Breath cycles off too early', is_correct: false, explanation: "That's premature cycling." },
      ],
    },
    {
      id: 'M11-P3',
      prompt: 'Flow starvation occurs when:',
      options: [
        { label: "Patient's demand exceeds vent's flow", is_correct: true, explanation: 'VC-specific pattern. Concave/scooped pressure waveform — patient sucking against insufficient supply.' },
        { label: 'Vent delivers too much flow', is_correct: false, explanation: 'Doesn\'t produce flow starvation.' },
        { label: 'Expiratory obstruction', is_correct: false, explanation: 'That\'s auto-PEEP.' },
        { label: 'Circuit leak', is_correct: false, explanation: 'Produces volume mismatch, not concave pressure.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'dyssynchrony_baseline',
    preset: {
      mode: 'PSV',
      settings: { psLevel: 10, peep: 5, fiO2: 40 },
      patient: { compliance: 50, resistance: 10, spontaneousRate: 18 },
    },
    unlocked_controls: [],
    visible_readouts: ['pip', 'vte', 'actualRate'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    children: [
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M11-1',
          trigger: { kind: 'on_load' },
          question: 'Pattern 1/5: Small negative pressure deflections during expiration without delivered breaths. What is this?',
          options: [
            { label: 'Ineffective triggering', is_correct: true },
            { label: 'Double-triggering', is_correct: false },
            { label: 'Flow starvation', is_correct: false },
            { label: 'Premature cycling', is_correct: false },
            { label: 'Delayed cycling', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M11-2',
          trigger: { kind: 'on_load' },
          question: 'Pattern 2/5: Two stacked breaths from a single prolonged patient effort. What is this?',
          options: [
            { label: 'Double-triggering', is_correct: true },
            { label: 'Auto-triggering', is_correct: false },
            { label: 'Premature cycling', is_correct: false },
            { label: 'Ineffective triggering', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M11-3',
          trigger: { kind: 'on_load' },
          question: 'Pattern 3/5: VC with low inspiratory flow, concave/scooped pressure during inspiration, patient working visibly. What is this?',
          options: [
            { label: 'Flow starvation', is_correct: true },
            { label: 'Premature cycling', is_correct: false },
            { label: 'Auto-triggering', is_correct: false },
            { label: 'Delayed cycling', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M11-4',
          trigger: { kind: 'on_load' },
          question: 'Pattern 4/5: PSV with cycle-off at 50%, breaths ending before patient is done inhaling. What is this?',
          options: [
            { label: 'Premature cycling', is_correct: true },
            { label: 'Delayed cycling', is_correct: false },
            { label: 'Double-triggering', is_correct: false },
            { label: 'Flow starvation', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M11-5',
          trigger: { kind: 'on_load' },
          question: 'Pattern 5/5: COPD patient on PSV cycle-off 10%, exhaling against vent at end-inspiration. What is this?',
          options: [
            { label: 'Delayed cycling', is_correct: true },
            { label: 'Premature cycling', is_correct: false },
            { label: 'Auto-triggering', is_correct: false },
            { label: 'Ineffective triggering', is_correct: false },
          ],
          max_attempts: 2,
        },
      },
    ],
  },

  content_blocks: [
    { kind: 'prose', markdown: '**The five canonical dyssynchronies.** Each has a distinct waveform signature. Recognizing them is the bedside diagnostic move; fixing them is mode/settings/sedation.' },
    { kind: 'figure', caption: 'Five patterns side-by-side.', ascii: '1) Ineffective: ↘deflection but no breath\n2) Double:     |‾|‾|  (stacked)\n3) Flow Starv: scooped pressure ∪\n4) Premature:  breath ends early\n5) Delayed:    breath drags past patient\'s end' },
    { kind: 'callout', tone: 'tip', markdown: 'Trigger problems (ineffective, auto, double) vs cycle problems (premature, delayed). Two timing dimensions; each has its own fix.' },
  ],

  hint_ladder: {
    tier1: 'Read each pattern description carefully. Look at the listed options.',
    tier2: 'Each pattern has a trigger-side or cycle-side problem. Categorize first, then pick.',
    tier3: { hint_text: 'Use "Show me" to highlight the diagnostic feature.' },
  },

  summative_quiz: [
    {
      id: 'M11-Q1',
      prompt: 'PSV. Repeated small negative deflections during expiration, no delivered breath. Most likely:',
      options: [
        { label: 'Auto-triggering', is_correct: false },
        { label: 'Ineffective triggering', is_correct: true },
        { label: 'Double-triggering', is_correct: false },
        { label: 'Flow starvation', is_correct: false },
      ],
      explanation: 'Patient attempting to trigger but not crossing threshold. Make trigger more sensitive.',
    },
    {
      id: 'M11-Q2',
      prompt: 'VC, fixed flow 40 lpm, scooped pressure, patient working hard. Best adjustment:',
      options: [
        { label: 'Increase Vt', is_correct: false },
        { label: 'Increase inspiratory flow rate', is_correct: true },
        { label: 'Decrease PEEP', is_correct: false },
        { label: 'Switch to SIMV', is_correct: false },
      ],
      explanation: 'Flow starvation — patient wants more flow than 40 lpm. Raise flow (or switch to flow-variable mode).',
    },
    {
      id: 'M11-Q3',
      prompt: 'PSV cycling off too early. Best adjustment:',
      options: [
        { label: 'Raise cycle-off from 25% to 50%', is_correct: false },
        { label: 'Lower cycle-off from 25% to 10%', is_correct: true },
        { label: 'Increase trigger sensitivity', is_correct: false },
        { label: 'Increase PS', is_correct: false },
      ],
      explanation: 'Lower threshold extends the breath, matching patient\'s longer Ti.',
    },
    {
      id: 'M11-Q4',
      prompt: 'Double-triggering is most commonly caused by:',
      options: [
        { label: 'Overly sensitive trigger', is_correct: false },
        { label: 'Patient inspiratory effort outlasting vent\'s Ti', is_correct: true },
        { label: 'Circuit leak', is_correct: false },
        { label: 'Auto-PEEP', is_correct: false },
      ],
      explanation: 'Patient\'s neural inspiration longer than vent Ti. Breath ends, patient still inhaling, triggers second stacked breath. Fix: match Ti to patient.',
    },
    {
      id: 'M11-Q5',
      prompt: 'COPD on PSV cycle-off 25%, exhaling against vent at end-inspiration. Pattern:',
      options: [
        { label: 'Premature cycling', is_correct: false },
        { label: 'Delayed cycling', is_correct: true },
        { label: 'Auto-triggering', is_correct: false },
        { label: 'Ineffective triggering', is_correct: false },
      ],
      explanation: 'COPD prolonged time constants. Flow decays slowly. At 25%, breath drags past patient\'s end. Raise cycle-off to end earlier.',
    },
  ],

  explore_card: {
    patient_context: 'This module is **recognition-based** — you won\'t be adjusting controls. The simulator will cycle through five different dyssynchrony patterns, and your job is to name them. The sim is currently showing a normal patient on PSV as a reference.',
    unlocked_controls_description: [],
    readouts_description: [
      { name: 'Pressure and flow waveforms (the normal pattern)', description: 'smooth triggering, decelerating inspiratory flow, expiratory flow returning to zero, each breath matching the next.' },
    ],
    suggestions: [
      'Pay attention to the *normal* pattern so you have something to compare against.',
      'When the task starts, the patterns will look "off" in different ways — your reading covers all five.',
    ],
  },
  user_facing_task: "You'll see five short clips of a ventilated patient, each with a different patient-ventilator interaction problem. After each clip, name what you're seeing. Then there's a final round: the same five in random order, no labels — try to nail each one on the first guess.",
  success_criteria_display: [
    'Correctly identify each of the five dyssynchrony patterns (two attempts each; missed ones come back at the end).',
    'Then identify all five again in the randomized final round on the first attempt.',
  ],
  task_framing_style: 'C',

  key_points: [
    'Five named dyssynchronies: ineffective triggering, double-triggering, flow starvation, premature cycling, delayed cycling.',
    'Trigger problems vs cycle problems — two timing dimensions.',
    'Each has a distinct waveform signature.',
    'Mitigation is targeted to the specific mismatch.',
  ],
};

export const M12: ModuleConfig = {
  id: 'M12',
  number: 12,
  title: 'SIMV and Hybrid Modes',
  track: 'Modes',
  estimated_minutes: 12,
  briefing: {
    tagline: 'A hybrid mode worth knowing — not reaching for first.',
    overview: "SIMV is a hybrid mode. Some breaths are guaranteed by the vent at a set rate and volume. Between those, the patient can take their own breaths, supported by PSV. It was designed as a weaning mode and was widely used for decades. Modern evidence has shifted away from it for that purpose. It's worth understanding because you'll still see it in the wild, and because the breath-mix concept underlies the way newer hybrid modes work.",
    what_youll_do: [
      'SIMV mixes mandatory and spontaneous breaths in the same minute.',
      'Lowering the mandatory rate shifts work from the vent to the patient.',
      "Daily SBTs have largely replaced gradual SIMV weaning. Know the mode, but don't reach for it first.",
    ],
  },
  visible_learning_objectives: [
    'Distinguish mandatory from spontaneous breaths in a SIMV waveform.',
    'Predict the effect of changing the SIMV mandatory rate on the breath mix.',
  ],

  primer_questions: [
    {
      id: 'M12-P1',
      prompt: 'In SIMV, what types of breaths are delivered?',
      options: [
        { label: 'Only mandatory at set rate', is_correct: false, explanation: 'That\'s pure mandatory mode.' },
        { label: 'Only spontaneous', is_correct: false, explanation: 'That\'s PSV.' },
        { label: 'Mandatory at set rate plus spontaneous between', is_correct: true, explanation: 'Mandatory breaths at the set rate, with patient-triggered spontaneous breaths in between (usually with PSV assistance). Hybrid mode for weaning or partial support.' },
        { label: 'PC only', is_correct: false, explanation: 'Mandatory breaths can be VC or PC.' },
      ],
    },
    {
      id: 'M12-P2',
      prompt: 'The "synchronized" in SIMV refers to:',
      options: [
        { label: 'Vent syncing mandatory breaths with patient effort', is_correct: true, explanation: 'When a mandatory breath is due, vent waits briefly for patient effort, delivers in sync. Prevents breath stacking.' },
        { label: 'Syncing with heart rate', is_correct: false, explanation: 'Not a vent function.' },
        { label: 'Syncing inspiratory and expiratory time', is_correct: false, explanation: 'That\'s I:E.' },
        { label: 'Syncing FiO2 to demand', is_correct: false, explanation: 'FiO2 is operator-set.' },
      ],
    },
    {
      id: 'M12-P3',
      prompt: 'Reduce SIMV mandatory rate from 12 to 6. Most likely:',
      options: [
        { label: 'Patient receives fewer total breaths', is_correct: false, explanation: 'Total breaths usually stay similar — patient drive fills in.' },
        { label: 'Patient takes more spontaneous breaths to maintain MV', is_correct: true, explanation: 'Classic SIMV weaning approach. Mandatory rate drops, patient takes over.' },
        { label: 'Vent delivers larger mandatory breaths', is_correct: false, explanation: 'Mandatory Vt is set, vent doesn\'t enlarge to compensate.' },
        { label: 'Nothing because patient is paralyzed', is_correct: false, explanation: 'Paralyzed patients can\'t spontaneously breathe — MV drops with mandatory rate. SIMV contraindicated in paralyzed without backup.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'simv_baseline',
    preset: {
      mode: 'SIMV/PS',
      settings: { tidalVolume: 450, respiratoryRate: 12, psLevel: 8, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 50, resistance: 10, spontaneousRate: 18 },
    },
    unlocked_controls: ['respiratoryRate'],
    visible_readouts: ['actualRate', 'vte', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  hidden_objective: {
    kind: 'manipulation',
    control: 'respiratoryRate',
    condition: { type: 'range', min: 3, max: 6 },
    require_acknowledgment: {
      question: 'You reduced the mandatory rate. What happened to the breath mix?',
      options: [
        { label: 'Fewer mandatory, more spontaneous (patient takes over)', is_correct: true },
        { label: 'Fewer spontaneous breaths', is_correct: false },
        { label: 'Total MV collapsed (patient cannot compensate)', is_correct: false },
        { label: 'No change', is_correct: false },
      ],
    },
  },

  content_blocks: [
    { kind: 'prose', markdown: '**SIMV mixes mandatory and spontaneous breaths.** Used historically for weaning by progressive mandatory-rate reduction. Modern consensus favors daily SBT over gradual SIMV weaning.' },
    { kind: 'callout', tone: 'warn', markdown: 'SIMV is contraindicated in paralyzed patients (no patient drive to fill in spontaneous breaths). Pure mandatory modes (VC, PC) are safer when there\'s no effort.' },
  ],

  hint_ladder: {
    tier1: 'Try lowering the mandatory rate.',
    tier2: 'The patient\'s spontaneous rate is 18. Lower mandatory means more breaths come from the patient.',
    tier3: { hint_text: 'Use "Show me".', demonstration: { control: 'respiratoryRate', target_value: 4 } },
  },

  summative_quiz: [
    {
      id: 'M12-Q1',
      prompt: 'SIMV mandatory rate 8, measured rate 18. Spontaneous rate:',
      options: [
        { label: '8', is_correct: false },
        { label: '10', is_correct: true },
        { label: '18', is_correct: false },
        { label: '26', is_correct: false },
      ],
      explanation: '18 − 8 = 10 spontaneous breaths/min.',
    },
    {
      id: 'M12-Q2',
      prompt: 'SIMV mandatory rate 4, MV 4.5 L, PaCO2 58. Most likely problem:',
      options: [
        { label: 'Mandatory rate too high', is_correct: false },
        { label: 'Mandatory rate too low for patient\'s capacity', is_correct: true },
        { label: 'PEEP too low', is_correct: false },
        { label: 'FiO2 too high', is_correct: false },
      ],
      explanation: 'MV inadequate, CO2 rising. Patient can\'t make up the difference.',
    },
    {
      id: 'M12-Q3',
      prompt: 'SIMV waveform: one square fixed-peak breath then several variable lower-peak breaths. The square breath is:',
      options: [
        { label: 'Spontaneous', is_correct: false },
        { label: 'Mandatory (PC-style)', is_correct: true },
        { label: 'Trigger artifact', is_correct: false },
        { label: 'Auto-triggered', is_correct: false },
      ],
      explanation: 'Square fixed-peak = mandatory PC-style. Variable smaller = spontaneous PS.',
    },
    {
      id: 'M12-Q4',
      prompt: 'SIMV is generally a poor choice in:',
      options: [
        { label: 'Weaning post-op patient', is_correct: false },
        { label: 'Neuromuscularly paralyzed patient', is_correct: true },
        { label: 'Stable COPD on partial support', is_correct: false },
        { label: 'Mild ARDS', is_correct: false },
      ],
      explanation: 'Paralyzed patient can\'t take spontaneous breaths. Without drive, only mandatory rate × Vt — may be inadequate.',
    },
    {
      id: 'M12-Q5',
      prompt: 'As a weaning strategy, modern consensus is SIMV is:',
      options: [
        { label: 'Fastest path to extubation', is_correct: false },
        { label: 'Generally less effective than PSV-only weaning or daily SBT', is_correct: true },
        { label: 'Only validated method', is_correct: false },
        { label: 'Equivalent to T-piece for all patients', is_correct: false },
      ],
      explanation: 'Daily SBTs > gradual SIMV weaning in trials. SIMV one tool, not the default.',
    },
  ],

  explore_card: {
    patient_context: 'Spontaneously breathing patient on SIMV with a mandatory rate of 12 and pressure support of 8 on the spontaneous breaths. The patient also takes their own breaths between the mandatory ones.',
    unlocked_controls_description: [
      { name: 'Respiratory rate (mandatory rate)', description: 'how many guaranteed breaths the vent delivers per minute. Range 4–40.' },
    ],
    readouts_description: [
      { name: 'Set rate vs measured rate', description: 'the gap is how many spontaneous breaths the patient is taking on their own.' },
      { name: 'Vte (mandatory vs spontaneous)', description: 'mandatory breaths are fixed-volume; spontaneous breaths vary with patient effort.' },
      { name: 'Minute ventilation (VE)', description: 'total air-per-minute. Does this stay stable when the mandatory rate falls?' },
    ],
    suggestions: [
      'Look at the pressure waveform — mandatory breaths look one way (larger), spontaneous breaths look different (smaller, with the trigger dip visible).',
      'Lower mandatory rate from 12 to 8. Watch what the measured rate does. Does the patient compensate?',
      'Drop it further to 4. Does minute ventilation hold up, or does it fall? What does that tell you about the patient\'s spontaneous drive?',
    ],
  },
  user_facing_task: "You're going to do a small weaning maneuver. Lower the mandatory rate to allow the patient to take over more of the work. After you make the change, you'll identify what happened.",
  success_criteria_display: [
    'Reduce the mandatory rate to about 4–6 breaths per minute.',
    'Identify how the breath mix changed.',
  ],
  task_framing_style: 'A',

  key_points: [
    'SIMV mixes mandatory + spontaneous breaths.',
    '"Synchronized" = timing alignment with patient effort.',
    'Reducing mandatory rate shifts work to the patient.',
    'Contraindicated in paralyzed patients.',
    'No longer the standard weaning strategy.',
  ],
};
