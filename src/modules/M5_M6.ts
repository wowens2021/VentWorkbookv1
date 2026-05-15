import type { ModuleConfig } from '../shell/types';

/**
 * MODULE M5 — Gas Exchange Basics
 *
 * Track: Physiology · Archetype: concept demo (compound strict, reset_between) · 16 min
 * Anchor chapters: VB Ch. 4, Ch. 5, Ch. 7
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance-as-shunt-proxy mapping in PlaygroundSim:
 *       compliance 50 → SpO2 ~96%
 *       compliance 25 → SpO2 ~88%
 *       compliance 18 → SpO2 ~82%
 *   - shuntFraction baseline (if used directly) — teaching abstraction, not exact physiology.
 *
 * Specced verbatim against docs/MODULE_SPECS_v3.md §M5 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §2. See MODULE_SPECS_v3.md Appendix A.
 */
export const M5: ModuleConfig = {
  id: 'M5',
  number: 5,
  title: 'Gas Exchange Basics',
  track: 'Physiology',
  estimated_minutes: 16,
  briefing: {
    tagline: 'Shunt kills oxygenation. Dead space kills ventilation.',
    overview:
      "Hypoxia and hypercapnia look different to the lung. Shunt is blood flowing past alveoli that aren't getting any air. It kills oxygenation and doesn't respond well to cranking up the FiO2. Dead space is air flowing into alveoli that aren't getting any blood. It kills CO2 clearance and is what's happening when the end-tidal drops out of nowhere. Knowing which one you're dealing with changes what you do.",
    what_youll_do: [
      'Shunt is a perfusion-without-ventilation problem. Dead space is a ventilation-without-perfusion problem.',
      "Pure shunt doesn't respond to FiO2. PEEP and recruitment are the tools that work.",
      'A sudden drop in end-tidal CO2 in a sick patient is dead space until proven otherwise.',
    ],
  },

  visible_learning_objectives: [
    'Distinguish the four bedside causes of hypoxemia: shunt, V/Q mismatch, dead space, hypoventilation.',
    'State the bedside test that distinguishes shunt from V/Q mismatch (response to 100% FiO2).',
    'Explain the dead-space signature: PaCO2 up, ETCO2 down, the gradient widens.',
    'Relate the oxygen content equation conceptually: SaO2 is what matters, not PaO2.',
  ],

  primer_questions: [
    {
      id: 'M5-P1',
      prompt: 'Shunt and V/Q mismatch differ most usefully at the bedside in:',
      options: [
        { label: 'Their response to inhaled bronchodilators.', is_correct: false, explanation: "Bronchodilators don't distinguish the two." },
        { label: "Their response to 100% FiO2 — V/Q corrects, shunt doesn't.", is_correct: true, explanation: 'Book Ch. 4. The bedside test.' },
        { label: 'Their effect on PaCO2.', is_correct: false, explanation: 'Both can affect PaCO2 if severe; not the discriminator.' },
        { label: 'Whether the patient is in shock.', is_correct: false, explanation: 'Both can occur with or without shock.' },
      ],
    },
    {
      id: 'M5-P2',
      prompt: 'Dead-space ventilation refers to:',
      options: [
        { label: 'Alveoli that are perfused but not ventilated.', is_correct: false, explanation: "That's shunt." },
        { label: 'Alveoli that are ventilated but not perfused.', is_correct: true, explanation: 'Book Ch. 4. PE, low cardiac output, hyperinflation.' },
        { label: 'Air in the endotracheal tube.', is_correct: false, explanation: 'Partially right (anatomic dead space), but the *clinical* concept refers to alveolar dead space.' },
        { label: 'Air in the gut.', is_correct: false, explanation: 'Not gas exchange.' },
      ],
    },
    {
      id: 'M5-P3',
      prompt: "Owens's first rule of oxygen is:",
      options: [
        { label: 'The PaO2 is what matters.', is_correct: false, explanation: "That's textbook chemistry. Bedside, SaO2 matters." },
        { label: 'The SaO2 is what matters, not the PaO2.', is_correct: true, explanation: 'Book Ch. 5. Hemoglobin carries 97%+ of arterial O2; PaO2 contributes <2%.' },
        { label: 'Always target PaO2 above 100.', is_correct: false, explanation: "That's hyperoxia; not a target." },
        { label: "Hemoglobin doesn't affect oxygen delivery.", is_correct: false, explanation: "It's the dominant term in DO2." },
      ],
    },
  ],

  // v3.2 §1: re-authored. The patient has a SCRIPTED 30% shunt (not a
  // compliance-driven proxy), so we don't teach contradictory mental
  // models across M4/M5. Compliance stays at 50 (locked); the learner
  // manipulates only FiO2 and PEEP and watches FiO2 fail / PEEP succeed.
  scenario: {
    preset_id: 'M5_shunt_baseline',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 450, respiratoryRate: 14, peep: 5, fiO2: 40, iTime: 1.0 },
      patient: {
        compliance: 50,         // PINNED — normal lung mechanics
        resistance: 10,
        spontaneousRate: 0,
        shuntFraction: 0.30,    // PINNED — scripted ARDS-pattern shunt
        gender: 'M',
        heightInches: 70,
      },
    },
    // compliance is LOCKED in v3.2 — the learner doesn't manipulate physiology here.
    unlocked_controls: ['fiO2', 'peep', 'respiratoryRate'],
    visible_readouts: ['pip', 'plat', 'spo2', 'pao2', 'paco2', 'fio2', 'peep'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  // Per v3.2 §1.5 — two strict-ordered children. Step 1: push FiO2 high,
  // see it fail. Step 2: raise PEEP, see SpO2 climb back. No
  // reset_between — Step 2 builds on Step 1's escalation.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    children: [
      {
        kind: 'manipulation',
        control: 'fiO2',
        condition: { type: 'absolute', operator: '>=', value: 90 },
        require_acknowledgment: {
          question: "FiO2 is now at 90%. SpO2 barely moved from baseline. Best explanation?",
          options: [
            { label: "Shunt — blood passes alveoli with no air in them. Adding O2 to the rest doesn't fix that blood.", is_correct: true, explanation: "The FiO2-resistance is the bedside test for shunt. The fix is to open the closed alveoli, which means PEEP, not more O2." },
            { label: 'V/Q mismatch — needs more FiO2 still.', is_correct: false, explanation: 'V/Q mismatch RESPONDS to FiO2. Failure to respond is the diagnostic finding for shunt.' },
            { label: 'Dead space — needs a higher rate.', is_correct: false, explanation: "Dead space causes hypercapnia, not refractory hypoxemia. Look at the PaCO2 — it's fine." },
          ],
        },
      },
      // Step 2 is an outcome, not a manipulation — because the learning
      // point is "PEEP works," not "click the PEEP knob." A learner who
      // raises PEEP but SpO2 doesn't climb sees the chip count their
      // breaths-in-range and self-corrects upward.
      {
        kind: 'outcome',
        readouts: {
          peep: { operator: '>=', value: 12 },
          spo2: { operator: '>=', value: 92 },
        },
        sustain_breaths: 5,
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        "Patients get hypoxemic for four reasons that matter. Three are airway problems (**shunt, V/Q mismatch, hypoventilation**); one is a perfusion problem (**dead space**). The bedside tests for each are different. The fix for each is different. You can't reach for FiO2 as a hammer for everything — it only works on V/Q.",
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown:
        "The clean test for shunt: if 100% oxygen doesn't fix the hypoxemia, it's shunt. The fix is to **open the alveoli** — PEEP, recruitment, prone.",
    },
    // v3.2 §1.6 — M5 is re-authored. The compliance-drop block becomes
    // an FiO2-response prediction (consistent with the scripted shunt
    // model in §1.3).
    {
      kind: 'predict_mcq',
      predict:
        "This patient has a 30% shunt — about a third of his pulmonary blood flow is passing alveoli that have no air in them. He's on FiO2 0.6 and his PaO2 is 65. If you bump FiO2 from 0.6 → 1.0 the SpO2 will move:",
      options: [
        { label: 'Up sharply — more O2 always helps.', is_correct: false, explanation: 'For the shunted blood, more alveolar O2 changes nothing — the blood never sees the alveoli.' },
        { label: 'Up a little, mostly from V/Q-improvement.', is_correct: false, explanation: "There's no V/Q mismatch here, only fixed shunt; the modest gain you might see is from the non-shunted blood already being near-saturated." },
        { label: 'Barely.', is_correct: true },
        { label: 'Down — high FiO2 worsens shunt.', is_correct: false, explanation: "FiO2 doesn't worsen shunt mechanically; it just doesn't improve it." },
      ],
      observe:
        "Shunted blood doesn't touch alveolar gas. Adding more oxygen to the alveoli the patient is already ventilating doesn't help the blood bypassing them. This is the FiO2-resistance fingerprint of shunt and why the four-lever escalation ladder (FiO2 → PEEP → mean Paw → prone) puts FiO2 first only because it's easy, not because it's effective.",
    },
    {
      kind: 'predict_mcq',
      awaits_control: 'respiratoryRate',
      predict:
        'You raise the rate from 14 to 30 in this patient. MVe goes up. What happens to PaCO2?',
      options: [
        { label: 'Falls — more minute ventilation clears more CO2.', is_correct: false, explanation: 'MVe rose, but most of the added volume is dead-space ventilation, not alveolar. Total CO2 clearance went down.' },
        { label: 'Stays the same.', is_correct: false, explanation: 'Total alveolar ventilation actually drops because the proportion of dead space climbs.' },
        { label: 'Rises.', is_correct: true },
        { label: 'Depends on the PaO2.', is_correct: false, explanation: 'CO2 and O2 are decoupled in this context.' },
      ],
      observe:
        'Anatomic dead space is ~150 mL per breath. At rate 30 with Vt 450, that\'s 4.5 L/min of dead-space ventilation — most of his MVe. The patient is hyperventilating air through his own dead space without moving much alveolar volume. The fix is bigger breaths, slower rate.',
    },
    {
      kind: 'callout',
      tone: 'warn',
      markdown:
        "A tachypneic patient with a normal PaCO2 isn't safe — he's spending a lot of work to stay normal, and a little fatigue will tip him into respiratory failure.",
    },
    {
      kind: 'formative',
      question: 'PaCO2 50, ETCO2 25. Gradient: 25. Most likely:',
      options: [
        { label: 'Sensor error.', is_correct: false },
        { label: 'Dead space — PE, low cardiac output, or auto-PEEP. The widening gradient is the signature.', is_correct: true },
        { label: 'Hypoventilation.', is_correct: false },
        { label: 'Shunt.', is_correct: false },
      ],
      answer:
        'A normal PaCO2-to-ETCO2 gradient is 3–5 mmHg. 25 is a huge gap and the signature is dead space. Differential: pulmonary embolism, falling cardiac output, severe auto-PEEP. Book Ch. 7. Hypoventilation raises *both* numbers in parallel. Shunt affects oxygenation, not CO2 clearance.',
    },
  ],

  hint_ladder: {
    tier1: "Step 1: induce a shunt — what knob simulates that here? Then try to fix it with the wrong tool.",
    tier2: 'Step 1: compliance ≤ 25, then FiO2 ≥ 90%. Step 2 (after reset): rate ≥ 30. Each step has an acknowledgment after.',
    tier3: { hint_text: 'Use "Show me" to run the active step\'s manipulations in order.', demonstration: { control: 'compliance', target_value: 22 } },
  },

  summative_quiz: [
    {
      id: 'M5-Q1',
      prompt: 'A patient on FiO2 1.0 has a PaO2 of 65. The A-a gradient is:',
      options: [
        { label: "Normal — he's just on a lot of oxygen.", is_correct: false, explanation: 'On 100%, expected PaO2 is ~600. A gradient of 50+ is enormous.' },
        { label: "Widened — and that's diagnostic of either shunt or severe V/Q mismatch.", is_correct: true, explanation: 'Book Ch. 4. FiO2 1.0 failing to correct hypoxemia = shunt.' },
        { label: 'Lowered — PEEP must be working.', is_correct: false, explanation: "PEEP doesn't lower the A-a gradient *directly*." },
        { label: 'Cannot be calculated without ABG.', is_correct: false, explanation: 'You have a PaO2 — calculation works.' },
      ],
    },
    {
      id: 'M5-Q2',
      prompt: 'Anatomic dead space in a normal 70-inch-tall adult is approximately:',
      options: [
        { label: '25 mL', is_correct: false, explanation: "That's nothing — too low for a healthy airway." },
        { label: '75 mL', is_correct: false, explanation: 'Underestimates.' },
        { label: '150–180 mL — about 1 mL per cm of height', is_correct: true, explanation: 'Book Ch. 4.' },
        { label: '300 mL', is_correct: false, explanation: "That's tidal-volume territory in a small adult." },
      ],
    },
    {
      id: 'M5-Q3',
      prompt: 'VD/VT ratio > 0.6 most strongly suggests:',
      options: [
        { label: 'Hypoventilation', is_correct: false, explanation: 'Different problem.' },
        { label: 'Shunt', is_correct: false, explanation: 'Shunt is the opposite (perfused, not ventilated).' },
        { label: 'Large dead-space fraction — think PE, low CO, severe hyperinflation', is_correct: true, explanation: 'Normal VD/VT ≤ 0.3 (book Ch. 4).' },
        { label: 'Normal physiology', is_correct: false, explanation: 'Normal is ≤ 0.3.' },
      ],
    },
    {
      id: 'M5-Q4',
      prompt: 'A widening ETCO2-PaCO2 gradient (e.g., from 5 to 18) most useful interpretation is:',
      options: [
        { label: 'Better gas exchange', is_correct: false, explanation: "It's worse." },
        { label: 'Worsening dead space — PE, falling cardiac output, auto-PEEP', is_correct: true, explanation: 'Book Ch. 7. Trend matters as much as the value.' },
        { label: 'Better cardiac output', is_correct: false, explanation: 'Falling CO widens the gradient.' },
        { label: 'ETCO2 sensor failure', is_correct: false, explanation: 'Diagnosis of exclusion.' },
      ],
    },
    {
      id: 'M5-Q5',
      prompt: 'The strongest single tool to address pure shunt physiology in a ventilated patient is:',
      options: [
        { label: 'Higher FiO2', is_correct: false, explanation: 'Shunt is FiO2-resistant by definition.' },
        { label: 'Higher PEEP and lung-recruitment maneuvers', is_correct: true, explanation: 'Book Ch. 12. Open the closed alveoli.' },
        { label: 'Switching from VCV to PCV', is_correct: false, explanation: "Mode doesn't change physiology." },
        { label: 'Higher set rate', is_correct: false, explanation: 'Affects ventilation, not shunt-driven oxygenation.' },
      ],
    },
  ],

  explore_card: {
    patient_context:
      "Stable patient at baseline. You're going to induce two distinct gas-exchange problems and watch how the vent reading and the SpO2/CO2 numbers respond. Note: the sim uses compliance as a stand-in for \"shunt severity\" — a teaching abstraction, not exact physiology.",
    unlocked_controls_description: [
      { name: 'Compliance · 18–80', description: 'proxy for shunt severity in this sim. Low compliance ≈ flooded alveoli ≈ refractory hypoxemia.' },
      { name: 'Rate · 8–35', description: 'pushes the dead-space ratio when held high.' },
      { name: 'FiO2 · 21–100%', description: 'the FiO2 lever. Test which problem it fixes.' },
      { name: 'PEEP · 0–18', description: 'the shunt lever.' },
    ],
    readouts_description: [
      { name: 'SpO2, PaCO2, ETCO2, the gradient', description: 'the four gas-exchange numbers you\'ll watch react.' },
    ],
    suggestions: [
      'Drop compliance to 22. Watch SpO2 fall. Now push FiO2 to 100%. Watch how little it helps.',
      'Reset. Drop compliance to 22 *and* raise PEEP to 15. Now SpO2 climbs — that\'s the right fix.',
      'Reset. Push rate to 30 with everything else normal. Watch PaCO2 rise, not fall. Counter-intuitive but predictable.',
      'Try the worst combo: low compliance + high rate. Both problems at once — the fixes don\'t interact, you need both.',
    ],
  },

  // v3.2 §1.7 — re-authored to describe the scripted shunt directly.
  user_facing_task:
    "This patient has a 30% shunt — a third of his pulmonary blood flow is passing unventilated alveoli. He's on FiO2 0.40 and PaO2 is in the 60s. Step 1: try fixing the SpO2 with FiO2 alone — push it to 90%+ and watch what happens. Step 2: now recruit by raising PEEP to ≥ 12 and hold SpO2 ≥ 92% for five breaths.",
  success_criteria_display: [
    'Push FiO2 to ≥ 90% — answer the prompt about why SpO2 didn\'t respond.',
    'Raise PEEP to ≥ 12, hold SpO2 ≥ 92% for 5 breaths.',
  ],
  task_framing_style: 'A',

  key_points: [
    'Four bedside causes of hypoxemia: shunt, V/Q mismatch, dead space, hypoventilation.',
    "Shunt = perfused but not ventilated. Doesn't fix with O2. Fixes with PEEP.",
    'V/Q mismatch is the most common cause of hypoxemic respiratory failure. Fixes with O2.',
    'Dead space = ventilated but not perfused. PaCO2 rises, ETCO2 falls (or rises less). Gradient widens.',
    'SaO2 is what matters. Cardiac output and hemoglobin are bigger levers than PaO2.',
  ],
};

/**
 * MODULE M6 — Auto-PEEP and Air Trapping
 *
 * Track: Physiology · Archetype: target state, two-stage · 15 min
 * Anchor chapters: VB Ch. 2, Ch. 3, Ch. 13, Ch. 15
 *
 * PINNED PARAMETERS (do not change without re-tuning tracker thresholds):
 *   - compliance: 60 — preserved (obstructive disease pattern)
 *   - resistance: 22 — tuned to make Step 1 induction trip at rate ~26
 *   - iTime: 1.0 (baseline) — baseline must equal 1.0 for the manipulation
 *                            to have room
 *
 * Change any one of these and Step 1 induction may not trigger.
 *
 * Specced against docs/MODULE_SPECS_v3.md §M6 and
 * docs/MODULE_SPEC_UPDATE_v3.1.md §3. See MODULE_SPECS_v3.md Appendix A.
 */
export const M6: ModuleConfig = {
  id: 'M6',
  number: 6,
  title: 'Auto-PEEP and Air Trapping',
  track: 'Physiology',
  estimated_minutes: 15,
  briefing: {
    tagline: 'See trapping on the flow waveform. Slow down to fix it.',
    overview:
      "The lungs need time to empty. If you don't give them enough, gas piles up inside, and the next breath stacks on top of the leftovers. That trapped pressure is auto-PEEP, and it causes more problems than people realize. Higher work of breathing. Worse hemodynamics. Mysterious hypotension after every rate increase. The fix is almost always the same: slow down and give exhalation more room.",
    what_youll_do: [
      'Auto-PEEP is end-expiratory pressure the patient generates on their own, not pressure you set.',
      "The flow waveform tells you instantly. If expiration doesn't reach zero before the next breath, you're trapping.",
      'Obstructive disease is the classic setting, but any patient on a fast rate with normal-shaped lungs can do it.',
    ],
  },

  visible_learning_objectives: [
    'Define auto-PEEP: end-expiratory alveolar pressure higher than the set PEEP.',
    "Recognize it on the flow waveform (expiratory flow doesn't return to zero).",
    'Name the three levers for fixing it: lower rate, shorter I-time, treat the obstruction.',
    'State the worst-case consequence: hypotension, PEA arrest — and the disconnect maneuver.',
  ],

  primer_questions: [
    {
      id: 'M6-P1',
      prompt: 'Auto-PEEP is best defined as:',
      options: [
        { label: 'The PEEP setting you ordered.', is_correct: false, explanation: "That's set PEEP." },
        { label: "End-expiratory alveolar pressure that is higher than the set PEEP — air trapped because the patient can't exhale completely.", is_correct: true, explanation: 'Book Ch. 17.' },
        { label: 'PEEP that increases on inspiration.', is_correct: false, explanation: 'PEEP is by definition end-*expiratory*.' },
        { label: 'PEEP measured during noninvasive ventilation.', is_correct: false, explanation: 'Not the definition.' },
      ],
    },
    {
      id: 'M6-P2',
      prompt: 'The flow-waveform sign of auto-PEEP is:',
      options: [
        { label: 'The inspiratory flow has a square shape.', is_correct: false, explanation: "That's just constant flow in VCV." },
        { label: "The expiratory flow doesn't return to zero before the next breath starts.", is_correct: true, explanation: 'Book Ch. 2. The patient is mid-exhale when the next vent breath fires.' },
        { label: 'The PIP waveform is double-humped.', is_correct: false, explanation: "That's double triggering." },
        { label: 'There is no flow waveform visible.', is_correct: false, explanation: 'Equipment failure.' },
      ],
    },
    {
      id: 'M6-P3',
      prompt: 'The single most effective ventilator change to relieve dynamic hyperinflation is:',
      options: [
        { label: 'Increase PEEP.', is_correct: false, explanation: "In *asthma*, applied PEEP worsens trapping. In COPD, modest applied PEEP can splint airways open — but it's not the *most effective* lever." },
        { label: 'Lower the respiratory rate.', is_correct: true, explanation: 'Book Ch. 2. Slower rate = longer expiratory time = air drains.' },
        { label: 'Increase the FiO2.', is_correct: false, explanation: "Doesn't change mechanics." },
        { label: 'Switch to PCV.', is_correct: false, explanation: 'Risky in severe bronchospasm — Pplat can fall silently.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'M6_obstructive_baseline',
    preset: {
      // Compliance preserved (60 — obstructive disease doesn't make stiff
      // lungs), resistance elevated (22 — mucus + mild bronchospasm).
      // Rate 18 + Ti 1.0 + resistance 22 → baseline Te is barely sufficient.
      // PIN: compliance 60, resistance 22, iTime 1.0 — DO NOT CHANGE.
      // These three together set the auto-PEEP susceptibility. Change any
      // and Step 1 induction may not trigger.
      mode: 'VCV',
      settings: { tidalVolume: 480, respiratoryRate: 18, peep: 5, fiO2: 50, iTime: 1.0 },
      patient: { compliance: 60, resistance: 22, spontaneousRate: 0, gender: 'M', heightInches: 70 },
    },
    unlocked_controls: ['respiratoryRate', 'iTime', 'tidalVolume', 'peep'],
    visible_readouts: ['pip', 'plat', 'autoPeep', 'totalPeep', 'mve'],
    visible_waveforms: ['pressure_time', 'flow_time'],
  },

  // Step 1: induce auto-PEEP ≥ 4. Step 2: resolve auto-PEEP ≤ 1.5 for
  // 5 breaths. NO reset_between — the two steps form a single narrative.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    children: [
      {
        kind: 'outcome',
        readouts: { autoPeep: { operator: '>=', value: 4 } },
        sustain_breaths: 3,
      },
      {
        kind: 'outcome',
        readouts: { autoPeep: { operator: '<=', value: 1.5 } },
        sustain_breaths: 5,
      },
    ],
  },

  content_blocks: [
    {
      kind: 'prose',
      markdown:
        "Auto-PEEP is the airway problem that won't show up on the peak pressure. It hides in the end-expiratory part of the cycle — the part nobody looks at unless they know to. **Watch the flow waveform.** If it doesn't get back to zero before the next breath fires, you have trapped air.",
    },
    {
      kind: 'callout',
      tone: 'warn',
      markdown:
        "In **severe asthma**, applied PEEP makes hyperinflation *worse*. In **COPD**, modest applied PEEP (75–85% of measured auto-PEEP) helps. Don't reflex into PEEP without knowing which one you have.",
    },
    {
      kind: 'predict_mcq',
      awaits_control: 'respiratoryRate',
      predict:
        'This patient is on rate 18 with mild resistance. You raise rate to 28. What happens to auto-PEEP?',
      options: [
        { label: 'Climbs — less expiratory time per breath.', is_correct: true },
        { label: "Falls — the vent has more chances to push trapped air out.", is_correct: false, explanation: 'Backwards. Higher rate compresses expiratory time. The lungs have LESS time to empty, not more.' },
        { label: 'Unchanged — auto-PEEP only depends on resistance.', is_correct: false, explanation: 'Resistance × expiratory-time-constant sets the rate of emptying; rate sets the expiratory time available. Both matter.' },
        { label: 'Auto-PEEP turns negative.', is_correct: false, explanation: 'Auto-PEEP is end-expiratory positive pressure that exceeds set PEEP. It can\'t go negative.' },
      ],
      observe:
        'It climbs. Less time between breaths → less time to exhale. The flow trace tells the story before the number does.',
    },
    {
      kind: 'predict_mcq',
      awaits_control: 'iTime',
      predict:
        'Now shorten I-time from 1.0 to 0.6 at the same rate. Auto-PEEP:',
      options: [
        { label: 'Falls — slightly. Longer expiratory time helps, but rate is the bigger lever.', is_correct: true },
        { label: 'Falls — dramatically. Shorter Ti dominates.', is_correct: false, explanation: 'It helps a little. The dominant relief lever for auto-PEEP is RATE, not Ti.' },
        { label: 'Rises — shorter Ti means faster flow, which traps more.', is_correct: false, explanation: 'Faster flow raises peak pressure, not trapped end-expiratory pressure.' },
        { label: 'Unchanged — Ti is independent of trapping.', is_correct: false, explanation: 'Ti and Te split the breath cycle; shortening Ti lengthens Te.' },
      ],
      observe:
        'It falls — but only slightly. Longer expiratory time helps, but the dominant lever is *rate*.',
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown:
        'The bedside test for auto-PEEP: perform an **expiratory hold**. The measured end-expiratory pressure will be higher than set PEEP. The difference is your auto-PEEP.',
    },
    {
      kind: 'formative',
      question: 'A COPD patient on the vent develops hypotension. Auto-PEEP is 12 cmH2O. Your next move is:',
      options: [
        { label: 'Give a fluid bolus.', is_correct: false },
        { label: 'Disconnect the patient from the vent and let him exhale for 10–15 seconds.', is_correct: true },
        { label: 'Raise the PEEP.', is_correct: false },
        { label: 'Increase the rate.', is_correct: false },
      ],
      answer:
        'Book Ch. 15. Trapped air is compressing his venous return. Disconnect from the vent, let him fully exhale, then resume with a lower rate. Fluids treat the symptom, not the cause. Raising PEEP or rate worsens trapping.',
    },
  ],

  hint_ladder: {
    tier1: 'Two steps. First, push the patient into clinically significant trapping. Second, fix it.',
    tier2: 'Step 1: raise rate to 26+ and watch auto-PEEP climb past 4. Step 2: drop rate to 10–12 to give expiration room, sustained for 5 breaths.',
    tier3: { hint_text: 'Use "Show me" to run Step 1 (raise rate to 26), then prompt you to drop it back.', demonstration: { control: 'respiratoryRate', target_value: 26 } },
  },

  summative_quiz: [
    {
      id: 'M6-Q1',
      prompt: 'Auto-PEEP is most reliably measured by:',
      options: [
        { label: 'Looking at the PIP trend.', is_correct: false, explanation: "PIP doesn't reveal end-expiratory pressure." },
        { label: 'An expiratory hold — the measured end-expiratory pressure minus set PEEP.', is_correct: true, explanation: 'Book Ch. 15.' },
        { label: 'The PaCO2.', is_correct: false, explanation: "CO2 may rise but isn't the measurement." },
        { label: 'The set PEEP minus 1.', is_correct: false, explanation: 'No relationship.' },
      ],
    },
    {
      id: 'M6-Q2',
      prompt: 'In a patient with severe asthma and dynamic hyperinflation, the application of PEEP usually:',
      options: [
        { label: 'Helps — splints airways.', is_correct: false, explanation: "That's COPD." },
        { label: 'Worsens trapping — the obstruction in asthma is fixed, so adding PEEP just adds pressure.', is_correct: true, explanation: 'Book Ch. 1, Ch. 15.' },
        { label: 'Has no effect.', is_correct: false, explanation: 'Wrong.' },
        { label: 'Lowers the PaCO2.', is_correct: false, explanation: 'Wrong.' },
      ],
    },
    {
      id: 'M6-Q3',
      prompt: 'A vent rate increase that raises PaCO2 instead of lowering it should make you suspect:',
      options: [
        { label: 'Dead space', is_correct: false, explanation: 'Possible but not specific to vent-rate effect.' },
        { label: 'Auto-PEEP — the higher rate compressed expiratory time, more trapping, less effective alveolar ventilation', is_correct: true, explanation: 'Owens\'s rule for obstruction: when PaCO2 climbs as you raise the rate, suspect dynamic hyperinflation — the alveolar minute ventilation actually fell.' },
        { label: 'Hypoventilation', is_correct: false, explanation: 'Opposite — you raised MVe.' },
        { label: 'Sensor error', is_correct: false, explanation: 'Diagnosis of exclusion.' },
      ],
    },
    {
      id: 'M6-Q4',
      prompt: 'In a hypotensive vented COPD patient with measured auto-PEEP of 14 cmH2O, the most important *first* action is:',
      options: [
        { label: 'Norepinephrine', is_correct: false, explanation: 'Treats the BP, not the cause.' },
        { label: 'Disconnect from the vent, let the patient exhale for 10–15 seconds, then resume with a slower rate', is_correct: true, explanation: 'Book Ch. 15. Trapped air compresses venous return.' },
        { label: 'Lower the PEEP setting from 5 to 0', is_correct: false, explanation: "Wrong-ish. Modest applied PEEP doesn't drive the trapping in COPD; the rate does. Disconnect first." },
        { label: 'Increase FiO2 to 1.0', is_correct: false, explanation: "Doesn't address mechanics." },
      ],
    },
    {
      id: 'M6-Q5',
      prompt: 'Of the four levers to relieve dynamic hyperinflation, the most effective is:',
      options: [
        { label: 'Higher PEEP', is_correct: false, explanation: 'Counterintuitive — not the most effective, and harmful in asthma.' },
        { label: 'Lower rate', is_correct: true, explanation: 'Book Ch. 2. Longer Te is the dominant fix.' },
        { label: 'Higher Vt', is_correct: false, explanation: 'Higher Vt extends Ti and worsens trapping.' },
        { label: 'Higher FiO2', is_correct: false, explanation: "Doesn't change mechanics." },
      ],
    },
  ],

  explore_card: {
    patient_context:
      "60-year-old COPD on his second day in the ICU. He's mildly air-trapped at baseline. You're going to make it worse, then fix it. In real life, this is the most common preventable bad-outcome in vented obstructive patients.",
    unlocked_controls_description: [
      { name: 'Rate · 8–28', description: 'the most powerful lever. Lower rate = longer Te.' },
      { name: 'I-time · 0.5–1.5', description: 'shorter Ti gives more time for Te.' },
      { name: 'Vt · 350–600', description: 'higher Vt at the same rate also extends Ti.' },
      { name: 'PEEP · 0–18', description: 'for COPD can splint airways; for asthma makes it worse.' },
    ],
    readouts_description: [
      { name: 'Auto-PEEP, Total PEEP', description: 'the auto-PEEP readout is what the tracker watches.' },
      { name: 'Flow waveform (end-expiration)', description: 'does it return to zero before the next breath?' },
    ],
    suggestions: [
      "Push rate to 28. Watch auto-PEEP climb. The flow waveform won't return to zero.",
      'Now drop rate to 10. Auto-PEEP falls. Te is now ~5 seconds — plenty of time to exhale.',
      'Try shortening I-time from 1.0 to 0.5 instead of lowering rate. The I:E changes but the auto-PEEP relief is smaller. Rate is the bigger lever.',
      "Raise PEEP from 5 to 12 (don't change rate). In real COPD this might splint airways open; in *asthma* it would worsen trapping.",
    ],
  },

  user_facing_task:
    "Trap him, then untrap him. This 60-year-old man with COPD is being ventilated. Right now he's borderline. Step 1: push him into clinically significant auto-PEEP (≥ 4 cmH2O) — your options are rate, Vt, and I-time. Step 2: now fix it. Bring auto-PEEP back to ≤ 1.5 and hold it for five breaths.",
  success_criteria_display: [
    'Induce auto-PEEP ≥ 4 cmH2O, hold for 3 breaths.',
    'Resolve auto-PEEP ≤ 1.5 cmH2O, hold for 5 breaths.',
  ],
  task_framing_style: 'B',

  key_points: [
    'Auto-PEEP = end-expiratory alveolar pressure > set PEEP. Measure with an expiratory hold.',
    "Flow-waveform sign: expiratory flow doesn't return to zero before next breath.",
    'Rate is the strongest lever — lower it. I-time is the second lever — shorten it.',
    'In asthma, applied PEEP worsens trapping. In COPD, modest applied PEEP can help splint.',
    "Severe auto-PEEP + hypotension → disconnect from the vent. Don't waste time on pressors first.",
  ],
};
