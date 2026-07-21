import type { ModuleConfig } from '../shell/types';

/**
 * MODULE M7 — Volume Control Ventilation (VCV A/C)
 *
 * Track: Modes · Archetype: outcome (Style B, target-state) · 18 min
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 40 — at Vt 500 baseline this yields plat ~17.5
 *   - heightInches: 70, gender: male — PBW = 73 kg; 6 mL/kg = 438 mL
 *
 * Task target Vt is 410-470 (6 mL/kg PBW ±5%).
 *
 * Specced against docs/MODULE_SPECS_v3.md §M7 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §4. See MODULE_SPECS_v3.md Appendix A.
 */
export const M7: ModuleConfig = {
  id: 'M7',
  number: 7,
  title: 'Volume Control Ventilation',
  track: 'Modes',
  estimated_minutes: 18,
  briefing: {
    tagline: 'Volume is fixed. Pressure is the message about the patient.',
    overview:
      "Volume control is the mode you set when you want to know exactly what the patient is getting per breath. You pick the tidal volume, you pick the flow, the machine delivers it no matter what. The trade-off is that pressure becomes the dependent variable. If the lungs get stiffer or the airways narrower, the pressure will climb to make the volume happen anyway. That's a feature, not a bug, but it's why high-pressure alarms in VC need a real look.",
    what_youll_do: [
      'In VC, you control volume and flow. The vent controls pressure to make it work.',
      'The flow waveform is square. The pressure waveform ramps up.',
      'A high-pressure alarm in VC is a message about the patient, not a setting to override.',
    ],
  },

  visible_learning_objectives: [
    'Distinguish what VCV guarantees (Vt, MVe) from what it does not (PIP, Pplat).',
    'Predict the direction of change in PIP when compliance falls at a fixed Vt.',
    'Set lung-protective VCV from scratch: Vt 6 mL/kg PBW, plat ≤30, driving pressure ≤15.',
    'State why VCV is the default mode for the shocked or unreliable-drive patient.',
  ],

  primer_questions: [
    {
      id: 'M7-P1',
      prompt: 'On VCV, what does the ventilator guarantee?',
      options: [
        { label: 'The peak airway pressure.', is_correct: false, explanation: 'PIP is determined by flow, resistance, compliance, and Vt; the vent makes whatever pressure it needs.' },
        { label: 'The plateau pressure.', is_correct: false, explanation: "Plat is determined by Vt/compliance + PEEP; the vent doesn't set it." },
        { label: 'The tidal volume.', is_correct: true, explanation: 'The vent opens its valve at a set flow until the set Vt has been delivered. The pressure is whatever it takes.' },
        { label: 'The respiratory rate, but not the volume.', is_correct: false, explanation: "It guarantees both rate and Vt; that's the whole point of A/C." },
      ],
    },
    {
      id: 'M7-P2',
      prompt: 'A VCV patient has compliance fall from 40 to 25 overnight at a fixed Vt of 500. The most likely change in plateau pressure is:',
      options: [
        { label: 'Plat falls — the lungs got softer.', is_correct: false, explanation: 'Lower compliance is stiffer, not softer.' },
        { label: 'Plat rises — to deliver the same Vt into stiffer lungs takes more alveolar pressure.', is_correct: true, explanation: 'Plat = Vt/C + PEEP, so plat goes from 17.5 to 25. The warning sign of evolving ARDS in a VCV patient.' },
        { label: 'Plat is unchanged — only PIP rises.', is_correct: false, explanation: 'That would be true only if the resistance changed. Compliance change directly drives plat.' },
        { label: 'The vent will reduce Vt to compensate.', is_correct: false, explanation: 'VCV does no such thing — dual-control modes do.' },
      ],
    },
    // Novice-pass §7.2 — original Q3 was a multi-option mode-selection
    // case the novice hasn't been taught. Replaced with a vocabulary
    // check that builds directly on M2.
    {
      id: 'M7-P3',
      prompt: 'In VCV (volume A/C), which two things does the *clinician* set on each breath?',
      options: [
        { label: 'Tidal volume and respiratory rate.', is_correct: true, explanation: 'In VCV you order the breath size (Vt) and the minimum rate. The vent delivers exactly that Vt and lets the airway pressure end up wherever it ends up.' },
        { label: 'Peak pressure and respiratory rate.', is_correct: false, explanation: 'Peak pressure is *measured* in VCV — it floats with compliance and resistance. The clinician sets volume.' },
        { label: 'Tidal volume and peak pressure.', is_correct: false, explanation: "In VCV you can't set both — one drives the other. Volume is the order; pressure is the consequence." },
        { label: 'Peak pressure and plateau pressure.', is_correct: false, explanation: 'Both of those are measured. Plateau requires an inspiratory hold to even see.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'M7_simv_to_ac',
    preset: {
      // "Bad" starting state: SIMV with no pressure support. Mandatory
      // rate 8, but the patient is pulling 18 spontaneous breaths a
      // minute — all unsupported, so they come in tiny. Measured rate
      // ~26. The fix is to switch to VCV (A/C) so every breath gets the
      // full set Vt, then set a lung-protective tidal volume.
      mode: 'SIMV/PS',
      settings: { tidalVolume: 450, respiratoryRate: 8, psLevel: 0, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: { compliance: 55, resistance: 10, spontaneousRate: 18, gender: 'M', heightInches: 70 },
    },
    unlocked_controls: ['mode', 'tidalVolume', 'respiratoryRate', 'peep', 'fiO2'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'vte', 'mve', 'actualRate'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  // Two-step task: (1) switch the mode to VCV (A/C) and acknowledge
  // why that changes every breath, then (2) hold a lung-protective
  // delivered Vt (6 mL/kg PBW, ±5%) for 5 breaths.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    children: [
      {
        kind: 'manipulation',
        control: 'mode',
        condition: { type: 'equals', value: 'VCV' },
        require_acknowledgment: {
          question: "You've switched to VCV (A/C). What happens to every breath the patient takes now — including triggered breaths above the set rate?",
          options: [
            {
              label: "Every breath — mandatory and patient-triggered — now receives the full set tidal volume.",
              is_correct: true,
              explanation: "In A/C, any breath the patient triggers gets the full set Vt delivered. This is the defining difference from SIMV without PS, where spontaneous breaths between mandatory ones are unsupported.",
            },
            {
              label: "Only the mandatory breaths get the set tidal volume; triggered breaths remain unsupported.",
              is_correct: false,
              explanation: "That describes SIMV without pressure support. In A/C, all breaths — whether delivered at the mandatory rate or triggered by the patient — receive the full set tidal volume.",
            },
            {
              label: "The patient's spontaneous rate will drop to zero because the ventilator takes over.",
              is_correct: false,
              explanation: "A/C does not eliminate spontaneous effort. The patient can still trigger additional breaths above the set rate, and each one will receive the full guaranteed volume.",
            },
            {
              label: "The tidal volume will decrease because pressure is now limited.",
              is_correct: false,
              explanation: "VCV guarantees volume regardless of patient effort. Pressure is the dependent variable and may change, but the delivered volume is fixed by the set Vt.",
            },
          ],
        },
      },
      {
        kind: 'outcome',
        readouts: {
          vte: [
            { operator: '>=', value: 410 },
            { operator: '<=', value: 470 },
          ],
        },
        sustain_breaths: 5,
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        "**A/C is the workhorse.** The vent delivers a preset number of breaths per minute; if the patient triggers above the set rate, he gets a *full* breath, not a partial one. That's what \"assist-control\" means — the patient can assist, but the control is the floor. VCV is the simpler flavor: you set rate and Vt, the vent gives the Vt at a constant flow until it's delivered, and then exhalation begins.",
    },
    {
      kind: 'callout',
      tone: 'tip',
      markdown:
        "**Contrast with SIMV.** In SIMV, only the *mandatory* breaths are guaranteed — spontaneous breaths between them get no support unless you add pressure support. A patient breathing fast over a low mandatory rate ends up pulling many tiny, ineffective breaths. Switch that patient to A/C and the problem disappears: every breath, triggered or mandatory, receives the full set volume. That's the move you'll make in the task.",
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown: "In VCV, the tidal volume is your variable. The pressure is whatever it needs to be. That's the deal.",
    },
    // Novice-pass §7.1 — interactive PBW worked example. Lets the
    // novice see the Devine formula step-by-step and the 4/6/8 mL/kg
    // target table for any height/sex.
    {
      kind: 'prose',
      markdown:
        "**Tidal volume scales to *predicted* body weight (PBW)**, not actual weight. Two patients of identical height — one obese, one cachectic — have the same target Vt because they have the same lung size.",
    },
    {
      kind: 'pbw_widget',
      label: 'PBW worked example',
      default_height_inches: 70,
      default_sex: 'M',
    },
    {
      kind: 'callout',
      tone: 'tip',
      markdown: "For this scenario's patient (70 inches, male), PBW = 73 kg, so the lung-protective target is **438 mL** (6 mL/kg). The task chip's 410–470 range bakes in ±5%.",
    },
    {
      kind: 'predict_mcq',
      predict:
        "Once you're in A/C at Vt 450, you trim it to 430 (6 mL/kg PBW for this patient). What happens to plat and driving pressure?",
      options: [
        { label: 'Both fall by the same amount.', is_correct: true },
        { label: 'Plat falls, but driving pressure stays the same.', is_correct: false, explanation: 'Driving pressure = Pplat − PEEP. PEEP didn\'t change, so DP moves by the same amount as Pplat.' },
        { label: 'PIP falls but Pplat is unchanged.', is_correct: false, explanation: 'Pplat is the alveolar pressure that responds directly to Vt at fixed compliance.' },
        { label: 'Both rise — smaller breaths need more pressure.', is_correct: false, explanation: 'Backwards — smaller volume through the same compliance generates less pressure.' },
      ],
      observe:
        "Plat falls slightly (by ΔVt ÷ compliance); driving pressure falls by the same amount. Vt is the lever — for this patient's compliance, the lung-protective range comes free once you lower the order.",
    },
    {
      kind: 'callout',
      tone: 'tip',
      markdown:
        'Keeping **driving pressure below 15** seems to be a good idea. Lung-protective volumes (6 mL/kg PBW) are well supported, and driving-pressure analyses suggest survival tracks with DP independently of Vt and PEEP.',
    },
  ],

  hint_ladder: {
    tier1: "The patient is in SIMV with no PS — spontaneous breaths are getting tiny, unsupported volumes. The fix is to change the mode.",
    tier2: "Switch to VCV (the A/C button). Then set Vt to around 440 mL for this patient (6 mL/kg PBW).",
    tier3: { hint_text: "Switch the mode selector to A/C (the leftmost mode button in the controls row). Then bring Vt down to approximately 440 mL." },
  },

  summative_quiz: [
    {
      id: 'M7-Q1',
      prompt: 'In volume-control A/C ventilation, what does the ventilator guarantee with every breath?',
      options: [
        { label: 'The tidal volume.', is_correct: true, explanation: 'In VCV, the ventilator delivers the set tidal volume on every breath — mandatory or triggered — regardless of lung mechanics. Pressure is the dependent variable and will rise or fall as needed.' },
        { label: 'The peak airway pressure.', is_correct: false, explanation: 'Pressure is the dependent variable in VCV. It rises when compliance falls or resistance increases, and you cannot set it directly.' },
        { label: 'The plateau pressure.', is_correct: false, explanation: 'Plateau pressure is determined by tidal volume and compliance. It can be measured with an inspiratory hold, but it is not something you set in VCV.' },
        { label: 'The minute ventilation.', is_correct: false, explanation: 'Minute ventilation equals Vt times rate. Both are set by the operator, but the ventilator guarantees them as separate inputs, not as a combined target.' },
      ],
    },
    {
      id: 'M7-Q2',
      prompt: 'On VCV, peak pressure (PIP) rises sharply while plateau pressure is unchanged. The most likely cause is:',
      options: [
        { label: 'Worsening ARDS', is_correct: false, explanation: 'That raises plat too.' },
        { label: 'Increased airway resistance — mucus plug, kinked tube, bronchospasm', is_correct: true, explanation: 'The PIP-plat gap *is* the resistance signal.' },
        { label: 'A pneumothorax', is_correct: false, explanation: 'Pneumo raises both.' },
        { label: 'Pulmonary edema', is_correct: false, explanation: 'Raises both.' },
      ],
    },
    {
      id: 'M7-Q3',
      prompt: 'A patient on VCV with Vt 500 mL has a plateau pressure of 34 and a driving pressure of 22. The single most important next move is:',
      options: [
        { label: 'Sedate more deeply', is_correct: false, explanation: "Doesn't address the lung problem." },
        { label: 'Increase PEEP', is_correct: false, explanation: 'That can raise plat further.' },
        { label: 'Reduce the tidal volume', is_correct: true, explanation: 'DP >15 is the survival-relevant lever.' },
        { label: 'Switch to PCV', is_correct: false, explanation: 'Tempting but does nothing physiologic — same lungs, same compliance.' },
      ],
    },
    {
      id: 'M7-Q4',
      prompt: 'The advantage of VCV over PCV is:',
      options: [
        { label: 'Lower peak airway pressures', is_correct: false, explanation: 'PCV typically has lower PIP.' },
        { label: 'Guaranteed minute ventilation, regardless of changes in compliance', is_correct: true, explanation: 'The shocked patient with evolving lung injury needs a guaranteed Vt.' },
        { label: 'Greater patient comfort with constant flow', is_correct: false, explanation: "Constant flow is generally less comfortable; that's a PCV advantage." },
        { label: 'No volutrauma risk', is_correct: false, explanation: 'VCV can absolutely cause volutrauma if Vt is set too high.' },
      ],
    },
    {
      id: 'M7-Q5',
      prompt: "For the shocked patient, the preferred mode choice is:",
      options: [
        { label: 'PSV — least work for the patient', is_correct: false, explanation: 'PSV is a recovery mode. The shocked patient cannot afford to do the breathing work.' },
        { label: 'SIMV — best of both worlds', is_correct: false, explanation: 'SIMV in the shocked patient risks high work of breathing on the spontaneous breaths.' },
        { label: 'A/C — the shocked patient should not fatigue', is_correct: true, explanation: "Don't let the shocked patient do the work of breathing while you're resuscitating him. A/C guarantees the minute ventilation; the patient's energy goes to the rest of the body." },
        { label: 'APRV — best oxygenation', is_correct: false, explanation: 'Not the first-line mode for shock.' },
      ],
    },
  ],

  explore_card: {
    patient_context: '70-inch male, compliance 55. He starts in SIMV with no pressure support: mandatory rate 8, but he is triggering ~18 breaths a minute — so the measured rate sits around 26 and the spontaneous breaths between mandatory ones come in tiny. Your move is to switch him to A/C so every breath is supported.',
    unlocked_controls_description: [
      { name: 'Mode', description: 'the mode selector. Switch from SIMV to A/C (the leftmost button) so triggered breaths get the full set volume.' },
      { name: 'Vt · 350–600', description: 'the volume you order each breath (in A/C, every breath gets it).' },
      { name: 'Rate · 8–30', description: 'the mandatory (minimum) rate. The patient can trigger above it.' },
      { name: 'PEEP · 0–15', description: 'end-expiratory floor.' },
      { name: 'FiO2 · 30–80%', description: 'inspired oxygen.' },
    ],
    readouts_description: [
      { name: 'Vte', description: 'delivered volume each breath. In SIMV it swings between full mandatory breaths and tiny spontaneous ones; in A/C it settles at the set Vt.' },
      { name: 'Measured rate (RR)', description: 'mandatory + triggered breaths. Starts ~26 because the patient is breathing over the rate-8 floor.' },
      { name: 'MVe', description: 'minute ventilation — total air per minute.' },
    ],
    suggestions: [
      'In SIMV, watch the Vte readout jump between the full mandatory breath and the tiny spontaneous ones.',
      'Switch the mode to A/C and watch every breath settle to the full set Vt.',
      'In A/C, trim Vt toward 6 mL/kg PBW (~440 mL) and watch the delivered Vte follow.',
      'Raise the rate from 8 to 14 and watch MVe climb.',
    ],
  },

  user_facing_task:
    "Your patient is in SIMV with no pressure support. The mandatory rate is 8, but the patient is pulling 18 spontaneous breaths per minute — all of them unsupported and tiny. Switch the mode to VCV (A/C) and set the tidal volume to 6 mL/kg PBW. Every breath should now receive the full guaranteed volume.",
  success_criteria_display: [
    'Switch mode to VCV (A/C).',
    'Set tidal volume to 410–470 mL (6 mL/kg PBW for this patient).',
    'Hold delivered Vt in that range for 5 consecutive breaths.',
  ],
  task_framing_style: 'B',

  key_points: [
    'VCV guarantees Vt; the pressure is whatever it has to be. Watch plat and driving pressure.',
    'Lung-protective VCV: 6 mL/kg PBW, plat ≤30, driving pressure ≤15.',
    'A rising plat at a fixed Vt means compliance is falling — assume worsening lung injury until proven otherwise.',
    'A rising PIP with unchanged plat means resistance is rising — think mucus, kink, or bronchospasm.',
    'The shocked patient and the unreliable-drive patient belong on A/C.',
  ],
};

/**
 * MODULE M8 — Pressure Control Ventilation (PCV)
 *
 * Track: Modes · Archetype: outcome (Style B with predict-observe) · 18 min
 *
 * Novice-pass §8.3 — the "Vt halves when compliance halves" predict_mcq
 * (M8-PM2 in this file) is the highest-quality teaching beat in the
 * curriculum. CANDIDATES for adopting the same predict → manipulate →
 * observe pattern in a later pass:
 *   - M3 step 1 (raise Vt → predict PIP behavior)
 *   - M4 compliance step (drop compliance → predict gap behavior)
 *   - M7 lung-protective step (move Vt to target → predict plat behavior)
 *   - M13 PEEP step (raise PEEP → predict PaO2 + SBP behavior)
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 35 — at PINSP 18 this yields Vt ~430 mL (≈6 mL/kg PBW)
 *
 * The Try-It locks compliance, but the Read-phase predict-observe block
 * temporarily unlocks it for demonstration of the PCV failure mode (Vt
 * collapses when compliance falls at fixed PINSP).
 *
 * Specced against docs/MODULE_SPECS_v3.md §M8 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §5. See MODULE_SPECS_v3.md Appendix A.
 */
export const M8: ModuleConfig = {
  id: 'M8',
  number: 8,
  title: 'Pressure Control Ventilation',
  track: 'Modes',
  estimated_minutes: 18,
  briefing: {
    tagline: 'Pressure is fixed. Volume is what gives way.',
    overview:
      "Pressure control flips the relationship. You pick the pressure, the machine holds it, and tidal volume is whatever the lungs accept at that pressure. This is gentler on stiff or heterogeneous lungs because you can't accidentally over-inflate them. The price is that volume drifts when mechanics change, so you have to watch the delivered tidal volume the same way you'd watch peak pressure in VC.",
    what_youll_do: [
      'In PC, you control pressure. Volume is what gives way.',
      'The flow waveform decelerates as the lungs fill. That shape is the PC fingerprint.',
      'A sudden drop in delivered tidal volume on PC is the signal that compliance got worse.',
    ],
  },

  visible_learning_objectives: [
    'Distinguish what PCV guarantees (PINSP, I-time) from what it does not (Vt, MVe).',
    'Predict the direction of change in Vt when compliance changes at a fixed PINSP.',
    "Distinguish PINSP from driving pressure (PINSP includes resistance; DP = plat − PEEP).",
    'Set lung-protective PCV: PINSP titrated to Vt 6 mL/kg PBW, total peak ≤30–35.',
  ],

  primer_questions: [
    {
      id: 'M8-P1',
      prompt: 'On PCV, what does the ventilator guarantee?',
      options: [
        { label: 'The tidal volume.', is_correct: false, explanation: 'Vt is the dependent variable, set by compliance and resistance.' },
        { label: 'The inspiratory pressure and the I-time.', is_correct: true, explanation: 'The vent rises to PINSP, holds for I-time, drops back to PEEP.' },
        { label: 'The plateau pressure.', is_correct: false, explanation: "Plat depends on whether inspiratory flow reaches zero; in most PCV settings it doesn't." },
        { label: 'The driving pressure.', is_correct: false, explanation: 'DP requires a measured plat, which is not what you set in PCV.' },
      ],
    },
    {
      id: 'M8-P2',
      prompt: "A PCV patient's compliance improves overnight from 25 to 50 at a fixed PINSP. The most likely change is:",
      options: [
        { label: 'Vt is unchanged; only PIP rises.', is_correct: false, explanation: "PIP doesn't rise in PCV — it's *fixed*." },
        { label: 'Vt approximately doubles.', is_correct: true, explanation: 'Vt ≈ (PINSP − PEEP) × C. This is why PCV needs daily attention — improving lungs lead to higher Vt unless you titrate down.' },
        { label: 'Vt halves.', is_correct: false, explanation: 'Direction is reversed.' },
        { label: 'The ventilator reduces PINSP to compensate.', is_correct: false, explanation: 'Dual-control modes do this. PCV does not.' },
      ],
    },
    // Novice-pass §8.2 — the PINSP-vs-driving-pressure question requires
    // knowing Pplat is measurable in PCV, which the read teaches. Move
    // to summative. Replace primer slot with a simpler vocabulary
    // check: which variable does the clinician set in PCV?
    {
      id: 'M8-P3',
      prompt: 'In PCV, the clinician sets rate, PEEP, and FiO2 (as in every A/C mode). What ADDITIONAL two settings define a PCV breath that VCV does not use?',
      options: [
        { label: 'Tidal volume and inspiratory flow.', is_correct: false, explanation: 'Tidal volume is *measured* in PCV — it floats with the patient\'s compliance. Inspiratory flow is auto-shaped by the vent, not set.' },
        { label: 'Inspiratory pressure (PINSP) and inspiratory time (I-time).', is_correct: true, explanation: 'On top of rate, PEEP, and FiO2, PCV needs you to set the pressure target each breath should reach and how long the breath should last. Tidal volume is whatever the patient\'s lung delivers at that pressure for that time — it is the dependent variable.' },
        { label: 'Tidal volume and plateau pressure.', is_correct: false, explanation: 'PCV sets pressure, not volume. Plateau pressure is *measured* (with an inspiratory hold), not set.' },
        { label: 'Peak pressure and driving pressure.', is_correct: false, explanation: 'Driving pressure is a derived value (Pplat − PEEP). PCV sets PINSP and I-time directly.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'M8_vcv_to_pcv',
    preset: {
      // Patient starts in VCV; the task is to switch to PCV and compare
      // the waveforms (square vs decelerating flow). pInsp is carried in
      // the preset so it's ready when the learner switches modes.
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 14, peep: 5, fiO2: 40, iTime: 1.0, pInsp: 18 },
      patient: { compliance: 55, resistance: 10, spontaneousRate: 0, gender: 'M', heightInches: 70 },
    },
    // pInsp stays unlocked regardless of the active mode so the learner
    // can adjust the inspiratory pressure after switching to PCV. mode
    // is unlocked for the switch itself.
    unlocked_controls: ['mode', 'pInsp', 'tidalVolume', 'peep', 'fiO2', 'iTime'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'vte', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
    // The waveform-comparison lesson doesn't need the Pplat>30 safety
    // alarm; suppress it so it doesn't distract.
    suppress_pplat_alarm: true,
    // M8 contrasts volume control with pressure control, so label the
    // volume-A/C button "VCV" here (not the default "A/C") to make the
    // VCV-vs-PCV comparison explicit. This override is scoped to M8 only.
    mode_labels: { VCV: 'VCV' },
  },

  // Two-step task: (1) switch VCV → PCV and acknowledge the flow-
  // waveform change (square → decelerating), then (2) recognize that
  // in PCV the tidal volume is the dependent variable, set by
  // compliance and the pressure gradient.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    children: [
      {
        kind: 'manipulation',
        control: 'mode',
        condition: { type: 'equals', value: 'PCV' },
        require_acknowledgment: {
          question: "You've switched from VCV to PCV. Look at the flow waveform. What changed?",
          options: [
            {
              label: "The flow waveform changed from square (constant) to decelerating — high at the start, tapering as the lungs fill.",
              is_correct: true,
              explanation: "In VCV, flow is constant and square because the ventilator delivers gas at a fixed rate until the volume target is met. In PCV, the ventilator holds a set pressure and flow starts high then decelerates as the pressure gradient between the circuit and the alveolus narrows.",
            },
            {
              label: "The flow waveform did not change — both modes deliver the same flow pattern.",
              is_correct: false,
              explanation: "Flow pattern is one of the most visible differences between modes. VCV produces square (constant) flow; PCV produces decelerating flow.",
            },
            {
              label: "The flow became square in PCV because pressure is fixed.",
              is_correct: false,
              explanation: "Fixed pressure produces decelerating flow as the lung fills and the driving gradient narrows. Square flow is the VCV pattern, not the PCV pattern.",
            },
            {
              label: "The pressure waveform changed from square to ramped.",
              is_correct: false,
              explanation: "The pressure waveform goes the other direction: VCV produces a ramping pressure trace; PCV produces a square (held) pressure. The question is about the flow waveform.",
            },
          ],
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M8-vt-response',
          trigger: { kind: 'on_load' },
          question: "Now look at the Vte readout. In PCV, what determines how much volume is delivered each breath?",
          options: [
            {
              label: "The patient's compliance and the pressure gradient above PEEP — stiffer lungs receive less volume at the same pressure.",
              is_correct: true,
              explanation: "In PCV, tidal volume is the dependent variable. It equals approximately (Pinsp − PEEP) × compliance. If compliance falls, Vt drops silently without triggering a high-pressure alarm — the opposite of what happens in VCV.",
            },
            {
              label: "The set tidal volume control, just as in VCV.",
              is_correct: false,
              explanation: "There is no set tidal volume in pure PCV. You set the inspiratory pressure, and the lung accepts whatever volume the mechanics allow at that pressure.",
            },
            {
              label: "The inspiratory flow rate, which you set separately in PCV.",
              is_correct: false,
              explanation: "PCV does not have a separate flow-rate control. Flow is determined automatically by the pressure gradient and the patient's lung mechanics.",
            },
            {
              label: "The I:E ratio, which directly sets the tidal volume in PCV.",
              is_correct: false,
              explanation: "I-time affects how long the inspiratory pressure is held, which can influence Vt slightly, but compliance and pressure gradient are the primary determinants.",
            },
          ],
          max_attempts: 2,
        },
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        "**PCV reverses VCV's deal.** You set the *pressure* you want; the vent goes up to it, holds it, then releases. The tidal volume is whatever the patient's lungs and airway resistance permit. In the task you'll switch this patient from VCV to PCV and watch the change: the flow waveform goes from square (constant) to decelerating — high at the start and tapering off as the lungs fill, which most patients find more comfortable than VCV's square top.",
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown:
        'PINSP is the **total inspiratory pressure** the vent holds at the airway opening — not the rise above PEEP. The **driving pressure** is what actually inflates the lung: `DP = Pplat − PEEP`. In PCV, once inspiratory flow decelerates to zero the plateau equals PINSP, so `DP ≈ PINSP − PEEP` and `Vt ≈ (PINSP − PEEP) × compliance`. (Some vendors label the knob "Pcontrol" or "P above PEEP" instead — read your vent before you turn it.)',
    },
    {
      kind: 'predict_mcq',
      predict: "Suppose this patient's compliance worsens (say it roughly halves) while you hold PINSP constant in PCV. What happens to the delivered Vt?",
      options: [
        { label: 'Vt falls roughly in proportion to the compliance drop.', is_correct: true },
        { label: 'Vt is unchanged — PCV guarantees the volume.', is_correct: false, explanation: 'PCV guarantees PRESSURE. Vt is the dependent variable. As compliance falls, the same pressure delivers less volume.' },
        { label: 'Vt rises — stiffer lungs accept more volume per pressure.', is_correct: false, explanation: 'Backwards. Stiffer lungs need MORE pressure per unit volume.' },
        { label: 'PIP rises to compensate — the vent adapts.', is_correct: false, explanation: "That's PRVC, not PCV. PCV holds PINSP fixed; Vt drifts silently downward.",
        },
      ],
      observe:
        "Vt falls roughly in proportion. This is the failure mode of PCV in worsening ARDS — the patient gets less and less ventilation as he gets sicker, and you won't see a PIP alarm fire.",
    },
    {
      kind: 'callout',
      tone: 'warn',
      markdown:
        "In PCV, the **low-Vt alarm is your friend**. If the patient's compliance falls, Vt collapses silently. The PIP alarm will never fire — you set the pressure, the vent obeys.",
    },
    {
      kind: 'formative',
      question: 'In PCV, you cannot measure plateau pressure. True or false?',
      options: [
        { label: 'True — PCV has no plateau', is_correct: false },
        { label: 'False — an inspiratory hold gives you Pplat in PCV just as in VCV', is_correct: true },
        { label: 'True — only PIP is meaningful in PCV', is_correct: false },
        { label: 'False — but only if compliance is normal', is_correct: false },
      ],
      answer:
        'An inspiratory hold equilibrates pressures throughout the airway tree, just as in VCV. You absolutely can — and should — measure plat in PCV. Common myth.',
    },
    // Dual-control variants (PRVC, VC+, CMV-Autoflow) used to live
    // here as a 5-minute addendum but were pulled out per user
    // feedback — they belong in their own module. The standalone M9
    // (PRVC and Dual-Control Ventilation) is re-registered in
    // src/modules/index.ts and takes over that teaching slot.
  ],

  hint_ladder: {
    tier1: "Switch the mode selector from A/C to PCV. Then look at the flow-time waveform — does the shape change?",
    tier2: "In VCV, flow is square (constant). In PCV, flow is decelerating — it starts high and tapers as the lung fills. After you see the difference, answer the question about what controls tidal volume.",
    tier3: { hint_text: "Switch to PCV and compare the flow waveform to what it looked like in VCV. Key differences: flow shape (square in VCV vs decelerating in PCV), and tidal volume is now determined by compliance rather than a set target. Once you see it, answer both recognition questions." },
  },

  summative_quiz: [
    {
      id: 'M8-Q1',
      prompt: 'A patient is on PCV. The vent is set to hold an inspiratory pressure of 20 cmH2O at the airway opening, with PEEP 10 and I-time 1.0. Compliance is 25 mL/cmH2O. The expected Vt is approximately:',
      options: [
        { label: '250 mL', is_correct: true, explanation: 'Vt ≈ driving pressure × compliance. Driving pressure = PINSP − PEEP = 20 − 10 = 10 cmH2O. Vt ≈ 10 × 25 = 250 mL.' },
        { label: '500 mL', is_correct: false, explanation: 'That would use PINSP directly instead of the driving pressure (PINSP − PEEP). The lung only "feels" the pressure above PEEP.' },
        { label: '800 mL', is_correct: false, explanation: 'Math error.' },
        { label: 'Cannot be calculated without knowing flow', is_correct: false, explanation: 'In PCV the delivered Vt at end-inspiration is determined by driving pressure and compliance, not flow.' },
      ],
    },
    {
      id: 'M8-Q2',
      prompt: "A PCV patient's PIP alarm has never fired, but his Vt has dropped from 480 to 270 over six hours. The most likely cause is:",
      options: [
        { label: 'The vent is broken', is_correct: false, explanation: "Unlikely — PIP alarm wouldn't fire in PCV anyway." },
        { label: 'Worsening compliance, increased resistance, or both', is_correct: true, explanation: 'In PCV the PIP is fixed; Vt collapse is the only warning of worsening mechanics.' },
        { label: 'The patient is over-sedated', is_correct: false, explanation: "Sedation doesn't change Vt at a fixed PINSP." },
        { label: 'Migrated endotracheal tube into the right mainstem', is_correct: false, explanation: 'Possible but would also raise plat dramatically; first instinct is mechanics.' },
      ],
    },
    {
      id: 'M8-Q3',
      prompt: 'Inverse-ratio ventilation (I:E ≥ 1:1) in PCV is:',
      options: [
        { label: 'Always required in severe ARDS', is_correct: false, explanation: 'A niche maneuver.' },
        { label: 'Used occasionally for severe hypoxemia, but requires heavy sedation', is_correct: true, explanation: 'Try breathing in for two seconds and out for one — this is uncomfortable.' },
        { label: 'Standard for all PCV settings', is_correct: false, explanation: 'Normal I:E is 1:2 to 1:4.' },
        { label: 'Used to reduce peak pressures', is_correct: false, explanation: 'It actually raises mean airway pressure.' },
      ],
    },
    {
      id: 'M8-Q4',
      prompt: 'Which is the WORST patient for PCV?',
      options: [
        { label: 'A stable ARDS patient on chronic vent', is_correct: false, explanation: 'PCV is fine here.' },
        { label: 'A status asthmaticus patient with rising resistance', is_correct: true, explanation: 'In severe bronchospasm, rising resistance silently drops Vt in PCV; VCV is the mode of choice.' },
        { label: 'A post-op patient with normal lungs', is_correct: false, explanation: 'PCV is fine.' },
        { label: 'A weaning candidate', is_correct: false, explanation: "PSV is the answer for a weaning candidate; PCV isn't *worse* than other A/C modes." },
      ],
    },
    {
      id: 'M8-Q5',
      prompt: 'Driving pressure in a PCV patient is measured by:',
      options: [
        { label: 'Reading the PINSP directly', is_correct: false, explanation: 'PINSP includes resistance.' },
        { label: 'Performing an inspiratory hold to obtain plat, then subtracting PEEP', is_correct: true, explanation: 'The hold equilibrates airway pressures; plat − PEEP is the DP regardless of mode.' },
        { label: 'Looking at the peak inspiratory flow', is_correct: false, explanation: 'Unrelated.' },
        { label: 'It cannot be measured in PCV', is_correct: false, explanation: 'Common myth.' },
      ],
    },
  ],

  explore_card: {
    patient_context:
      "70-inch male, compliance 55. He starts in VCV at a set tidal volume of 450 mL. Your job is to switch him to PCV and compare the two modes side by side — the same patient, the same lungs, a different way of delivering the breath.",
    unlocked_controls_description: [
      { name: 'Mode', description: 'switch between VCV (A/C) and PCV. The whole point of the task — flip it and watch the flow waveform change.' },
      { name: 'Vt · 350–600', description: 'the set tidal volume — shown in VCV. In VCV you set this and pressure follows.' },
      { name: 'PINSP · 8–30', description: 'the inspiratory pressure target — shown in PCV. In PCV you set this and tidal volume follows (Vt ≈ (PINSP − PEEP) × compliance).' },
      { name: 'PEEP · 0–18', description: 'end-expiratory floor.' },
      { name: 'FiO2 · 30–80%', description: 'inspired oxygen.' },
      { name: 'I-time · 0.6–1.5', description: 'how long each inspiration lasts (in PCV, how long the pressure is held).' },
    ],
    readouts_description: [
      { name: 'Flow waveform', description: 'square (constant) in VCV; decelerating (high then tapering) in PCV. This is the headline difference.' },
      { name: 'Vte', description: 'delivered volume. In VCV it tracks your set Vt; in PCV it becomes the dependent variable, set by compliance and the pressure gradient.' },
      { name: 'PIP, plat (after hold)', description: 'in VCV pressure follows your volume; in PCV peak is fixed at PINSP and Vt floats.' },
    ],
    suggestions: [
      'Switch from VCV to PCV and watch the flow-time waveform flip from square to decelerating.',
      'In PCV, raise PINSP and watch Vte climb; lower it and watch Vte fall. Pressure is the order, volume is the response.',
      'Perform an inspiratory hold in PCV — you can still read a plateau, just like in VCV.',
      'Switch back to VCV and confirm the flow goes square again. Same lungs, different delivery.',
    ],
  },

  user_facing_task:
    'This patient is on VCV. Switch to PCV and watch how the waveforms change — then answer two questions about what you see. Pay attention to the flow waveform and the Vte readout.',
  success_criteria_display: [
    'Switch the mode from VCV to PCV.',
    'Identify what changed about the flow waveform.',
    'Identify what determines tidal volume in PCV.',
  ],
  task_framing_style: 'C',

  key_points: [
    'PCV guarantees PINSP and I-time. Vt is the dependent variable.',
    'Vt ≈ (PINSP − PEEP) × Compliance. As compliance changes, Vt swings.',
    'The PIP alarm does not warn you in PCV — the low-Vt alarm does.',
    'PINSP is the rise above PEEP. Driving pressure is plat minus PEEP. Not the same.',
    'In severe bronchospasm, choose VCV — PCV will silently underventilate as resistance rises.',
  ],
};
