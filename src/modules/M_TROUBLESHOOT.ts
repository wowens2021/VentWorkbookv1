import type { ModuleConfig, TrackerConfig } from '../shell/types';

/**
 * Troubleshooting: The 2 AM Call
 * Per docs/Troubleshooting_2AM_v3.pdf (v3 — UX + flow revised).
 *
 * Track: Clinical Skills · Phases: Primer → Read → Explore → Try It → Debrief.
 * Hard prereq: Compliance, Resistance. Soft prereq: M1 (the combined Foundations module).
 *
 * v3 features implemented in this build (previously deferred):
 *   - predict_prompt and reference_table content blocks render
 *     natively (blue italic side-bar and 4-column HTML table).
 *   - Multi-scenario sim swap: each case's first recognition prompt
 *     carries a `perturbation` that the shell applies before the
 *     prompt presents (existing PerturbationSpec channel).
 *   - Auscultate / Examine-patient action buttons surface the
 *     active step's `findings.auscultation` and `findings.exam`
 *     strings.
 *   - 30-second soft reminder for Case 1's inspiratory-pause step.
 *   - soft_prompt header chip ("Have you examined the patient?")
 *     on Case 1 step 1.
 *   - Per-step Tier-3 demonstrations: Case 1 demos the inspiratory
 *     pause; Cases 2 and 3 carry their own Show-Me overrides.
 *   - Randomized Case 1: the first Case-1 step picks Scenario A
 *     (resistance / mucus plug) or Scenario B (left tension
 *     pneumothorax) at module-load time. The picked variant carries
 *     its own perturbation, auscultation/exam findings, and the
 *     downstream diagnostic/treatment prompts swap to match.
 */

// ─── Case 1 A-or-B randomization ─────────────────────────────────
// The spec wants Case 1 to randomly run either Scenario A (mucus
// plug, resistance fault) or Scenario B (left tension pneumothorax,
// compliance fault). The pick happens at module-evaluation time;
// reloading the page rerolls. Both variants share Step-1 (perform
// the inspiratory pause) — the divergence starts at Step-2's
// diagnostic question.
const useScenarioA = Math.random() < 0.5;

// Findings persist across every step within a case so the learner
// can re-click Auscultate / Examine at any point and re-read what
// they're working with.
const case1AFindings = {
  auscultation: 'Left: clear. Right: markedly diminished at base.',
  exam: 'Patient is uncomfortable. No accessory muscle use. No JVD.',
};
const case1BFindings = {
  auscultation: 'Left: absent. Right: present and clear.',
  exam: 'Patient unresponsive to verbal stimulus. No tracheal deviation visible. No JVD visible. Hemodynamics declining.',
};

const case1Steps: TrackerConfig[] = useScenarioA
  ? [
      // Scenario A — resistance / mucus plug. Equalized to 4 steps so
      // the "Step X of Y" counter is consistent across the A and B
      // variants (pause → identify type → name cause → treat).
      {
        kind: 'manipulation',
        control: 'inspiratory_pause',
        condition: { type: 'any_change' },
        perturbation: {
          id: 't2am-case1-A',
          patient: { resistance: 34, compliance: 32 },
        },
        findings: case1AFindings,
        soft_prompt: 'Have you examined the patient? Click Auscultate or Examine above.',
        idle_reminder: {
          delay_ms: 30_000,
          text: 'The book says the first step for high pressure is the inspiratory pause.',
        },
        tier3_demonstration: { control: 'inspiratory_pause', target_value: 1, hint_text: "Show me — fires the inspiratory pause (the first step for high-pressure alarms)." },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'T2AM-c1A-type',
          trigger: { kind: 'on_load' },
          question: 'Ppeak 54, Pplat 24, gap 30. SpO2 dropping. Equal-ish breath sounds, slightly worse on the right. What type of problem?',
          max_attempts: 2,
          options: [
            { label: 'Resistance', is_correct: true, explanation: 'Wide gap (>10–15) with a normal Pplat = airway resistance. Differential: mucus plug, bronchospasm, kinked tube, too-narrow tube.' },
            { label: 'Compliance / alveolar', is_correct: false, explanation: 'Pplat would rise with a compliance problem. 24 is well below the 30 cmH2O safety limit — alveoli are fine.' },
            { label: 'Tension pneumothorax', is_correct: false, explanation: 'Tension raises Pplat and drops BP. Wide gap with normal Pplat does not fit.' },
            { label: 'Auto-PEEP', is_correct: false, explanation: 'Auto-PEEP is confirmed via the expiratory pause and presents with non-returning expiratory flow.' },
          ],
        },
        findings: case1AFindings,
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'T2AM-c1A-cause',
          trigger: { kind: 'on_load' },
          question: 'Resistance pattern with right-side diminished breath sounds. What is the single most likely cause first?',
          max_attempts: 2,
          options: [
            { label: 'Mucus plug', is_correct: true, explanation: 'In the ICU, secretions / mucus plug is the most common acute wide-gap cause. Auscultation showing one side worse than the other (here, right) is classic for a plug obstructing a mainstem.' },
            { label: 'Bronchospasm', is_correct: false, explanation: 'Bronchospasm is usually bilateral with diffuse wheeze, not focally worse on one side.' },
            { label: 'Right mainstem intubation', is_correct: false, explanation: 'Mainstem intubation gives the OPPOSITE-side absent sounds (here you would expect the LEFT to be absent if the tube were in the right mainstem).' },
            { label: 'Kinked ETT', is_correct: false, explanation: 'A kinked tube usually causes globally diminished breath sounds, not focal.' },
          ],
        },
        findings: case1AFindings,
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'T2AM-c1A-act',
          trigger: { kind: 'on_load' },
          question: 'Wide-gap resistance — likely plug. What do you do first?',
          max_attempts: 2,
          options: [
            { label: 'Pass a suction catheter', is_correct: true, explanation: 'Suction first; if you meet resistance against the catheter, the tube itself may be obstructed. Bronchoscopy if suction fails to clear.' },
            { label: 'Increase PEEP', is_correct: false, explanation: 'PEEP addresses alveolar recruitment, not airway resistance.' },
            { label: 'Reduce tidal volume', is_correct: false, explanation: 'Pplat is safe — Vt reduction targets alveolar overdistension.' },
            { label: 'Needle decompression', is_correct: false, explanation: 'No clinical signs of pneumothorax in this scenario; Pplat is normal.' },
          ],
        },
        findings: case1AFindings,
      },
    ]
  : [
      // Scenario B — left tension pneumothorax (compliance fault).
      // 4 steps: pause → type → diagnose → treat.
      {
        kind: 'manipulation',
        control: 'inspiratory_pause',
        condition: { type: 'any_change' },
        perturbation: {
          id: 't2am-case1-B',
          patient: { compliance: 18, bpSys: 86 },
        },
        findings: case1BFindings,
        soft_prompt: 'Have you examined the patient? Click Auscultate or Examine above.',
        idle_reminder: {
          delay_ms: 30_000,
          text: 'The book says the first step for high pressure is the inspiratory pause.',
        },
        tier3_demonstration: { control: 'inspiratory_pause', target_value: 1, hint_text: "Show me — fires the inspiratory pause (the first step for high-pressure alarms)." },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'T2AM-c1B-type',
          trigger: { kind: 'on_load' },
          question: 'Ppeak 46, Pplat 40, gap 6. BP 86/50 and falling. What type of problem?',
          max_attempts: 2,
          options: [
            { label: 'Compliance / alveolar', is_correct: true, explanation: 'Pplat 40 is dangerous (above the 30 cmH2O limit) with a near-normal gap = the lung is the problem, not the airway.' },
            { label: 'Resistance', is_correct: false, explanation: 'Resistance widens the peak-plateau gap. Here the gap is small.' },
            { label: 'Auto-PEEP', is_correct: false, explanation: 'Confirmed with the expiratory pause; presents with non-returning expiratory flow.' },
            { label: 'Circuit leak', is_correct: false, explanation: 'A leak drops delivered Vt and triggers a low-MV alarm, not a high-pressure alarm.' },
          ],
        },
        findings: case1BFindings,
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'T2AM-c1B-diag',
          trigger: { kind: 'on_load' },
          question: 'Pplat 40, SpO2 84, BP falling, LEFT breath sounds absent. Most likely diagnosis?',
          max_attempts: 2,
          options: [
            { label: 'Left tension pneumothorax', is_correct: true, explanation: 'Absent unilateral breath sounds + rising Pplat + hemodynamic collapse = tension pneumothorax. Tracheal deviation and JVD are supportive but not always seen — do not wait for them.' },
            { label: 'Mucus plug on the left', is_correct: false, explanation: 'A plug would widen the peak–plateau gap; Pplat would not be 40.' },
            { label: 'ARDS exacerbation', is_correct: false, explanation: 'Bilateral disease; would not give absent unilateral breath sounds acutely.' },
            { label: 'Pulmonary edema', is_correct: false, explanation: 'Edema is bilateral and presents with crackles, not absent breath sounds on one side.' },
          ],
        },
        findings: case1BFindings,
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'T2AM-c1B-treat',
          trigger: { kind: 'on_load' },
          question: 'Immediate treatment?',
          max_attempts: 2,
          options: [
            { label: 'Needle decompression of the left chest, then chest tube', is_correct: true, explanation: 'Needle decompression is temporizing — chest tube is definitive and must follow without delay. Needle the affected side regardless of which side it is; technique is identical left vs right.' },
            { label: 'Increase FiO2 and PEEP', is_correct: false, explanation: 'Adding PEEP to a tension pneumothorax accelerates hemodynamic collapse.' },
            { label: 'Suction', is_correct: false, explanation: 'Suction is for wide-gap resistance patterns. This is a compliance problem.' },
            { label: 'Reduce tidal volume', is_correct: false, explanation: 'Does not address the underlying air-leak / mass-effect physiology.' },
          ],
        },
        findings: case1BFindings,
      },
    ];

export const M_TROUBLESHOOT: ModuleConfig = {
  id: 'M_TROUBLESHOOT',
  number: 18,
  title: 'Troubleshooting: The 2 AM Call',
  track: 'Clinical Skills',
  estimated_minutes: 28,
  briefing: {
    tagline: "It's 2:45 AM. Pick the right framework.",
    overview:
      "The systematic approach to acute ventilator problems. Each problem type has its own first step — high pressure starts with an inspiratory pause; sudden SpO2 drop starts with disconnect-and-bag; fighting the vent starts with TSS and finding the mechanism; general acute deterioration runs through DOPES. Get the framework right and the rest follows. **Prerequisite: the Compliance and Resistance modules.** The plateau pressure maneuver and peak-plateau gap logic are used here without re-teaching. Soft prerequisite: M1 (the eight key readouts).",
    what_youll_do: [
      'Use the four problem-specific first steps — inspiratory pause, disconnect-and-bag, TSS, DOPES — and learn which framework matches which call.',
      'Interpret an ABG and adjust the ventilator in the right order across all four modes (VC, PC, APRV, HFOV).',
      'Split every high-pressure alarm into resistance (wide gap) or alveolar/compliance (high Pplat) using a single inspiratory pause.',
      'Recognize dynamic hyperinflation on the expiratory flow waveform, confirm with an expiratory pause, and apply all six book treatments.',
      'Recognize the three ETCO2 change patterns and the three causes of an absent ETCO2 waveform.',
      'Identify the three mechanistic categories of patient-ventilator dyssynchrony and find the cause before escalating sedation.',
    ],
  },

  visible_learning_objectives: [
    "Use the problem-specific first steps: inspiratory pause for high-pressure alarms; disconnect-and-bag for sudden SpO2 drop; TSS for fighting-the-vent; DOPES for general acute deterioration and dyssynchrony.",
    'Interpret the ABG and adjust the ventilator in the correct order across all four modes (VC, PC, APRV, HFOV).',
    'Distinguish high-peak / low-plateau (resistance) from high-peak / high-plateau (compliance / alveolar) using a single inspiratory pause.',
    'Recognize dynamic hyperinflation on the expiratory flow waveform, confirm with an expiratory pause, and apply all six treatments.',
    'Recognize the three ETCO2 change patterns and manage each; correctly identify the three causes of an absent ETCO2 waveform.',
    'Identify the three mechanistic categories of patient-ventilator dyssynchrony and find the cause before escalating sedation.',
  ],

  primer_questions: [
    {
      id: 'T2AM-P1',
      prompt: 'A patient on the ventilator acutely deteriorates overnight — new hypotension, SpO2 falling, nurse is alarmed. Before touching the ventilator, you run through:',
      options: [
        { label: 'The ARDSNet protocol', is_correct: false, explanation: 'ARDSNet governs tidal volume and PEEP settings in ARDS. It is not a diagnostic framework for acute deterioration.' },
        { label: 'DOPES: Displacement, Obstruction, Pneumothorax, Equipment malfunction, Stacking', is_correct: true, explanation: "DOPES is the framework for any acute deterioration in a ventilated patient. It forces you to examine the five most dangerous causes in order before touching the vent. Each letter has a specific clinical sign: D = loss of ETCO2 waveform; O = high resistance or absent ETCO2; P = absent unilateral breath sounds; E = diagnosis of exclusion; S = expiratory flow that does not return to zero." },
        { label: 'TSS: Tube, Sounds, Sats', is_correct: false, explanation: "TSS is a rapid check for 'fighting the ventilator' — it covers D, O, and part of P but it was never meant as the framework for all acute problems." },
        { label: 'DOPE: Displacement, Obstruction, Pneumothorax, Equipment', is_correct: false, explanation: 'This is missing the S. Stacking (auto-PEEP / dynamic hyperinflation) is a distinct and important cause of acute deterioration that can cause PEA arrest if missed. The S belongs.' },
      ],
    },
    {
      id: 'T2AM-P2',
      prompt: 'SpO2 drops from 96% to 78% over 2 minutes on a ventilated patient. The very first thing you should do is:',
      options: [
        { label: 'Order a STAT portable CXR', is_correct: false, explanation: "Correct diagnosis but wrong timing. The book's order for sudden SpO2 drop starts with immediate bedside action, not imaging." },
        { label: 'Increase FiO2 to 1.0 and raise PEEP', is_correct: false, explanation: 'Increasing PEEP blindly before establishing the cause is dangerous. If the cause is tension pneumothorax, more PEEP accelerates hemodynamic collapse.' },
        { label: 'Disconnect the patient from the ventilator and bag manually', is_correct: true, explanation: "The book's first step for sudden SpO2 drop is to disconnect and bag. If oxygenation improves immediately, the problem is with the vent settings or circuit. If it does not improve, the problem is with the patient's lungs or airway." },
        { label: 'Perform an inspiratory pause to check plateau pressure', is_correct: false, explanation: "Inspiratory pause is the first step for HIGH-PRESSURE alarms — when Ppeak is elevated and you need to know whether it is a resistance or alveolar problem." },
      ],
    },
    {
      id: 'T2AM-P3',
      prompt: 'After disconnecting and bagging, you find absent breath sounds on the left. BP is 72/38. Trachea is midline. No JVD visible. Most appropriate action:',
      options: [
        { label: 'Portable CXR STAT', is_correct: false, explanation: 'This patient is in extremis. Tension pneumothorax is a clinical diagnosis treated immediately at the bedside.' },
        { label: 'Increase FiO2 to 1.0 and PEEP to 15', is_correct: false, explanation: 'Adding PEEP to a tension pneumothorax raises intrathoracic pressure, worsens venous return obstruction, and accelerates cardiovascular collapse.' },
        { label: 'Needle decompression of the left chest (2nd intercostal space, midclavicular line), then chest tube immediately', is_correct: true, explanation: "Absent unilateral breath sounds + hypotension = tension pneumothorax until proven otherwise. Tracheal deviation and JVD are 'supportive but not always seen' (book). Needle decompression is temporizing — chest tube is definitive. Needle the affected side regardless of which side; technique is identical." },
        { label: 'Give a 1 L fluid bolus for hypotension', is_correct: false, explanation: 'The hypotension is from obstructed venous return. Fluids do not relieve the obstruction. Decompress first.' },
      ],
    },
  ],

  scenario: {
    preset_id: 'troubleshooting_2am_baseline',
    preset: {
      mode: 'VCV',
      settings: { tidalVolume: 480, respiratoryRate: 14, peep: 5, fiO2: 50, iTime: 1.0 },
      patient: { compliance: 32, resistance: 12, spontaneousRate: 0, gender: 'M', heightInches: 67 },
    },
    unlocked_controls: [
      'inspiratory_pause', 'expiratory_pause',
      'auscultate', 'examine_patient',
      'peep', 'fiO2', 'tidalVolume', 'respiratoryRate', 'iTime',
    ],
    visible_readouts: [
      'pip', 'plat', 'drivingPressure', 'totalPeep', 'autoPeep',
      'vte', 'mve', 'actualRate', 'ieRatio',
      'fio2', 'spo2', 'sbp', 'etco2',
      'meanAirwayPressure', 'staticCompliance',
    ],
    visible_waveforms: ['pressure_time', 'flow_time', 'volume_time'],
  },

  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    present_one_at_a_time: true,
    observations: [
      // ── Case 1 ── Both variants now run 4 steps so the global "Step
      // X of Y" counter is consistent (total = 4 + 3 + 3 = 10).
      "**Case 1 of 3 — High peak pressure alarm.** You performed an inspiratory pause. Read Pplat — that one number splits every high-pressure alarm into the right category.",
      useScenarioA
        ? "Wide PIP–Pplat gap with normal Pplat = airway-resistance problem. The alveoli are safe. The airway is obstructed."
        : "Pplat above 30 with a near-normal gap = alveolar / compliance problem. The lung itself is in trouble.",
      useScenarioA
        ? "One side worse than the other on auscultation points to a focal obstruction. Plug is more common than bronchospasm or kinking when one side is acutely diminished."
        : "Absent left breath sounds + falling BP + high Pplat = left tension pneumothorax until proven otherwise. Tracheal deviation and JVD are not required — treat clinically.",
      useScenarioA
        ? "Suction first. Mucus plug is the most common acute wide-gap cause in the ICU. If suction doesn't fix it, escalate to bronchoscopy or replace the tube."
        : "Needle decompress the left chest (2nd intercostal space, midclavicular line). Chest tube must follow immediately — needling is temporizing.",
      // ── Case 2 ──
      "**Case 2 of 3 — Sudden SpO2 drop.** Sim has reset to a fresh baseline. Disconnect and bag takes the vent out of the equation. Now auscultate before deciding anything.",
      "Left absent, right present + stable hemodynamics + present ETCO2 waveform = tube migrated into the right mainstem. Pull it back.",
      "Pulling the tube back 3 cm typically equalizes breath sounds and SpO2 recovers over the next several breaths. Order a CXR to confirm position once stable.",
      // ── Case 3 ──
      "**Case 3 of 3 — Falling ETCO2.** Sim has reset to a fresh baseline. Widened PaCO2-ETCO2 gradient (30) with unchanged MV = CO2 is in the blood but is not reaching the exhaled gas. Pulmonary perfusion has dropped.",
      "Sudden dead-space increase + hypotension + tachycardia + hypoxemia in a bedridden ICU patient is pulmonary embolism until proven otherwise.",
      "Push FiO2 up to treat the hypoxemia while the team arranges definitive workup. Don't chase PEEP or change modes.",
    ],
    children: [
      // ── Case 1 — A or B picked at module-load ──
      ...case1Steps,
      // ── Case 2 — sudden SpO2 drop (right mainstem) ──
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'T2AM-c2-first',
          trigger: { kind: 'on_load' },
          question: "SpO2 dropped to 80% over 3 minutes. No pressure alarm. The book's first step for sudden SpO2 drop is to:",
          max_attempts: 2,
          options: [
            { label: 'Disconnect from the ventilator and bag manually', is_correct: true, explanation: 'Disconnect and bag takes the vent out of the equation. If oxygenation improves immediately, the problem is the vent or circuit. If not, the problem is the patient.' },
            { label: 'Increase FiO2 to 1.0', is_correct: false, explanation: 'You can do this in parallel, but the diagnostic move is disconnect-and-bag.' },
            { label: 'Inspiratory pause', is_correct: false, explanation: 'Inspiratory pause is for high-pressure alarms. There is no pressure alarm here.' },
            { label: 'Order a STAT CXR', is_correct: false, explanation: 'Imaging takes time the patient may not have.' },
          ],
        },
        perturbation: {
          id: 't2am-case2-mainstem',
          patient: { compliance: 22, resistance: 14 },
        },
        // Sim resets to baseline before Case 2's perturbation applies
        // so the Case-1 numbers don't bleed into this case.
        reset_sim: true,
        findings: {
          auscultation: 'Left: absent. Right: present and clear.',
          exam: 'Patient appears comfortable. No distress. ETT at 23 cm at lip.',
        },
        tier3_demonstration: { control: 'fiO2', target_value: 80, hint_text: 'Show me — the auscultation finding (left absent / right present) plus stable hemodynamics points to right mainstem. Pull the tube back.' },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'T2AM-c2-diag',
          trigger: { kind: 'on_load' },
          question: "After bagging you auscultate: left absent, right present. Ppeak 44, Pplat 36, gap 8. BP stable. Most likely cause?",
          max_attempts: 2,
          options: [
            { label: 'Right mainstem intubation', is_correct: true, explanation: 'Unilateral absent left sound with stable hemodynamics and a present ETCO2 waveform points to right mainstem intubation. The tube has migrated past the carina.' },
            { label: 'Left tension pneumothorax', is_correct: false, explanation: 'Tension causes hemodynamic collapse — BP would not be stable.' },
            { label: 'Mucus plug on the left', is_correct: false, explanation: 'Possible but less common than tube migration as the explanation for sudden unilateral asymmetry.' },
            { label: 'Pulmonary edema', is_correct: false, explanation: 'Edema is bilateral; gives crackles, not absent unilateral breath sounds.' },
          ],
        },
        findings: {
          auscultation: 'Left: absent. Right: present and clear.',
          exam: 'Patient appears comfortable. No distress. ETT at 23 cm at lip.',
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'T2AM-c2-treat',
          trigger: { kind: 'on_load' },
          question: 'Right mainstem. What do you do?',
          max_attempts: 2,
          options: [
            { label: 'Pull the tube back 3 cm and reassess', is_correct: true, explanation: 'Pull back to roughly 21–23 cm at the lip. Confirm equalized breath sounds. Order CXR once stable.' },
            { label: 'Needle decompression of the left chest', is_correct: false, explanation: 'No tension pneumothorax — BP is stable, breath sounds explained by tube position.' },
            { label: 'Increase PEEP', is_correct: false, explanation: 'PEEP does not fix mainstem intubation; the left lung is mechanically excluded.' },
            { label: 'Suction', is_correct: false, explanation: 'Suction would not explain the right-sided sounds being intact while the left is silent.' },
          ],
        },
        findings: {
          auscultation: 'Left: absent. Right: present and clear.',
          exam: 'Patient appears comfortable. No distress. ETT at 23 cm at lip.',
        },
      },
      // ── Case 3 — ETCO2 change (PE) ──
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'T2AM-c3-gradient',
          trigger: { kind: 'on_load' },
          question: 'ETCO2 dropped from 38 to 22 over 5 minutes. MV unchanged. PaCO2 is 52. What does the widened PaCO2–ETCO2 gradient mean?',
          max_attempts: 2,
          options: [
            { label: 'Increased dead space — perfusion to alveoli has decreased', is_correct: true, explanation: 'A widened gradient with stable MV means CO2 is reaching the blood but not the exhaled gas. Alveoli ventilated but not perfused = dead space.' },
            { label: 'Alveolar hyperventilation', is_correct: false, explanation: 'Hyperventilation drops PaCO2; here PaCO2 is rising.' },
            { label: 'Alveolar hypoventilation', is_correct: false, explanation: 'Hypoventilation raises BOTH ETCO2 and PaCO2 in parallel. ETCO2 fell here.' },
            { label: 'Circuit leak', is_correct: false, explanation: 'A leak typically drops Vte and triggers a low-MV alarm. MV is unchanged.' },
          ],
        },
        perturbation: {
          id: 't2am-case3-pe',
          patient: { etco2_loss_fraction: 0.55, bpSys: 86 },
        },
        // Sim resets to baseline before Case 3's perturbation applies.
        reset_sim: true,
        findings: {
          auscultation: 'Bilateral clear. No wheeze. No crackles.',
          exam: 'Patient appears acutely ill. Tachycardic. BP declining. No focal respiratory findings.',
        },
        tier3_demonstration: { control: 'fiO2', target_value: 80, hint_text: 'Show me — a falling ETCO2 with unchanged MV means perfusion has dropped; in a bedridden ICU patient that is PE until proven otherwise.' },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'T2AM-c3-diag',
          trigger: { kind: 'on_load' },
          question: 'Sudden dead-space increase + hypotension + tachycardia + hypoxemia in a bedridden ICU patient. Most likely diagnosis?',
          max_attempts: 2,
          options: [
            { label: 'Pulmonary embolism', is_correct: true, explanation: 'The bedridden ICU patient with a sudden dead-space jump + hemodynamic collapse is PE until proven otherwise. Order CT-PE or echo for RV strain.' },
            { label: 'Tension pneumothorax', is_correct: false, explanation: 'Tension causes unilateral absent breath sounds and rising Pplat.' },
            { label: 'Mucus plug', is_correct: false, explanation: 'A plug raises Ppeak and widens the peak–plateau gap. ETCO2 changes are not the dominant signal.' },
            { label: 'Dynamic hyperinflation', is_correct: false, explanation: 'Dynamic hyperinflation shows non-returning expiratory flow and a COPD-pattern history.' },
          ],
        },
        findings: {
          auscultation: 'Bilateral clear. No wheeze. No crackles.',
          exam: 'Patient appears acutely ill. Tachycardic. BP declining. No focal respiratory findings.',
        },
      },
      {
        kind: 'manipulation',
        control: 'fiO2',
        // Lowered from 90 → 80 so the learner reaches the threshold in
        // ~6 button taps (step 5) instead of 10. The clinical point
        // (push FiO2 up to treat hypoxemia) lands either way.
        condition: { type: 'absolute', operator: '>=', value: 80 },
        require_acknowledgment: {
          question: 'What ventilator change is appropriate now while you arrange workup?',
          options: [
            { label: 'Increase FiO2 (toward 1.0)', is_correct: true, explanation: 'Treat the hypoxemia while definitive workup proceeds. PE is the diagnostic problem; FiO2 is the temporizing move.' },
            { label: 'Increase PEEP to 15', is_correct: false, explanation: 'High PEEP in suspected PE can worsen RV afterload.' },
            { label: 'Switch to APRV', is_correct: false, explanation: 'Mode switch does not address PE-driven hypoxemia.' },
            { label: 'Lower tidal volume', is_correct: false, explanation: 'Vt is not the problem; perfusion is.' },
          ],
        },
        findings: {
          auscultation: 'Bilateral clear. No wheeze. No crackles.',
          exam: 'Patient appears acutely ill. Tachycardic. BP declining. No focal respiratory findings.',
        },
      },
    ],
  },

  content_blocks: [
    // Block 1 — DOPES rule (TSS moved to Block 7 per UX-2).
    {
      kind: 'prose',
      markdown:
        "**One rule before anything else.** As always, the first thing you should do is **examine the patient**. Every ventilator problem starts there.\n\nFor general acute deterioration, the framework is **DOPES**:\n\n- **D — Displacement of the ETT.** Sign: loss of ETCO2 waveform. Immediately life-threatening.\n- **O — Obstruction.** Complete obstruction also loses the ETCO2 waveform. Partial obstruction: wide peak–plateau gap, possible wheezing, shark-fin ETCO2 pattern.\n- **P — Pneumothorax.** Sign: absent unilateral breath sounds, possible hypotension. Tension physiology: treat before imaging.\n- **E — Equipment malfunction.** Diagnosis of exclusion after D, O, P are cleared.\n- **S — Stacking (auto-PEEP).** Sign: expiratory flow does not return to zero. Confirm with an expiratory pause. Can cause PEA arrest if untreated.\n\nOnce DOPES is clear, the vent gives you specific information depending on the problem type. Each section below gives you the first-step instruction and the decision tree that follows.",
    },
    // Block 2 — ABG adjustments as a real reference_table (UX-11).
    {
      kind: 'reference_table',
      caption: "The patient's clinical condition always takes precedence over a target number. Adjust in the order listed.",
      headers: ['Mode', 'PaO2 too low', 'PaCO2 too high', 'PaCO2 too low'],
      rows: [
        ['Volume A/C or SIMV', '↑ PEEP, then ↑ FiO2', '↑ Rate, then ↑ Vt', '↓ Rate, then ↓ Vt'],
        ['Pressure A/C or SIMV', '↑ PEEP, then ↑ FiO2', '↑ Rate, then ↑ driving P', '↓ Rate, then ↓ driving P'],
        ['APRV', '↑ P_high, ↑ T_high, ↑ FiO2', '↑ P_high–P_low gradient, ↓ T_high, ↑ T_low', '↑ T_high, ↓ P_high, ↓ T_low'],
        ['HFOV', '↑ mean airway P, ↑ FiO2', '↓ frequency, ↑ amplitude, ↑ Ti%', '↑ frequency, ↓ amplitude, ↓ Ti%'],
      ],
    },
    // Block 3 — high peak pressure (inspiratory pause first).
    {
      kind: 'prose',
      markdown:
        "**Block 3 — High peak pressure: inspiratory pause first.** The first step for high peak pressure: *perform an inspiratory pause and measure the plateau pressure.*\n\nOne number — Pplat — splits every high-pressure problem into two categories:\n\n**High Ppeak, low Pplat (wide gap > 10–15 cmH2O): resistance problem.**\n- Airways between vent and alveoli are obstructed. Alveoli are safe.\n- Differential: kinked ETT, mucus plug, bronchospasm, too-narrow tube.\n- Actions: unkink tube, suction, inhaled bronchodilators, accept higher PAW if tube is appropriately sized.\n- Do NOT lower tidal volume — Pplat is safe.\n\n**High Ppeak, high Pplat (Pplat > 30 cmH2O): alveolar / compliance problem.**\n- Alveoli are under dangerous pressure.\n- Differential: mainstem intubation, atelectasis, pulmonary edema, ARDS, pneumothorax.\n- Actions: pull tube back for mainstem, chest tube for pneumothorax, diuretics/inotropes for edema, lower Vt for ARDS.\n- Do NOT ignore Pplat above 30 — alveolar injury is occurring.",
    },
    // Block 4 — dynamic hyperinflation (auto-PEEP) + predict_prompt.
    {
      kind: 'prose',
      markdown:
        "**Block 4 — Dynamic hyperinflation (auto-PEEP).** Auto-PEEP is gas trapped in the alveoli at end-expiration. If unchecked: hemodynamic compromise, ineffective triggering, hypercapnia, PEA arrest.\n\n**Physical exam:** abdominal muscles contracting forcefully during exhalation; neck veins may be distended; loud wheezing throughout the expiratory phase.\n\n**Recognize on the vent:**\n- Expiratory flow waveform does not return to zero before the next breath. The most reliable real-time sign.\n- Expiratory pause: equilibrated pressure exceeds set PEEP = auto-PEEP confirmed.\n- Pearl: PaCO2 keeps rising as you increase the rate = hyperinflation is the culprit. More rate means less exhalation time.\n\n**Treat:**\n1. Lower rate to 10–14 — most effective. More time per cycle = more time to exhale.\n2. Shorten I-time to keep I:E at 1:3 to 1:5.\n3. Keep Vt at 6–8 mL/kg — higher Vt slows the patient's spontaneous rate.\n4. Increase inspiratory flow to 60–80 L/min if patient is air-hungry.\n5. Adequate sedation with narcotics to blunt tachypneic response.\n6. Bronchodilators and systemic steroids for underlying bronchospasm.\n\nCOPD: extrinsic PEEP at ~75–85% of measured auto-PEEP prevents dynamic airway collapse without worsening hyperinflation (the waterfall effect).",
    },
    {
      kind: 'predict_prompt',
      markdown: 'If you lower the rate from 22 to 12, what will happen to the expiratory flow waveform? What will happen to BP?',
    },
    // Block 5 — sudden SpO2 drop + predict_prompt.
    {
      kind: 'prose',
      markdown:
        "**Block 5 — Sudden SpO2 drop.** The book's first step: disconnect the patient from the ventilator and bag. If oxygenation improves immediately, the problem is with the vent settings or circuit. If not, the problem is in the patient.\n\n1. Disconnect and bag.\n2. Confirm ETT position and auscultate. Use waveform capnography — absent ETCO2 with the tube in the mouth = esophageal intubation. Auscultate for equal breath sounds: unilateral absence = mainstem intubation (pull back) or pneumothorax.\n3. Tension pneumothorax check: absent unilateral sounds + hypotension = tension until proven otherwise. Tracheal deviation and JVD are 'supportive but not always seen' (book). Treat clinically — needle decompress before CXR. The technique is the same regardless of which side: needle the affected side.\n4. ABG and portable CXR. Look for: worsening infiltrates, pneumothorax, pulmonary edema, atelectasis, new effusions.\n5. Always consider PE for unexplained hypoxemia in an ICU patient. A sudden drop in ETCO2 with rising PaCO2 is the PE waveform signature.",
    },
    {
      kind: 'predict_prompt',
      markdown: 'If ETCO2 drops suddenly but MV is unchanged, what has happened to pulmonary perfusion? What would confirm PE?',
    },
    // Block 6 — ETCO2 changes: three patterns.
    {
      kind: 'prose',
      markdown:
        "**Block 6 — ETCO2 changes: three patterns.** Start with the waveform. An absent ETCO2 waveform means one of three things: **tube not in trachea, tube completely occluded, or sensor faulty**. The first two are immediately life-threatening. Rule them out before assuming equipment failure.\n\nIf the waveform is present, compare ETCO2 to a recent PaCO2. Normal gradient: 3–5 mmHg.\n\n- **Pattern 1 — Rising ETCO2 and rising PaCO2:** alveolar hypoventilation. CO2 accumulating. Causes: oversedation, neuromuscular weakness, insufficient backup rate, increased CO2 production (fever, malignant hyperthermia, thyrotoxicosis, ROSC after arrest). Check sedation and MV settings.\n- **Pattern 2 — Falling ETCO2 with stable or rising PaCO2 (widening gradient):** increased dead space. CO2 not reaching the sensor because pulmonary perfusion has decreased. Causes: PE, falling cardiac output, dynamic hyperinflation, overdistension. This pattern is urgent — treat the underlying cause.\n- **Pattern 3 — Falling ETCO2 and falling PaCO2 (stable gradient):** increased alveolar ventilation. CO2 being blown off faster. Causes: pain, agitation, fever, sepsis. Treat the driver.",
    },
    // Block 7 — fighting the vent.
    {
      kind: 'prose',
      markdown:
        "**Block 7 — Fighting the vent: find the mechanism first.** A patient 'fighting the ventilator' is usually a vent problem, not a sedation problem. The book is explicit: the patient gets the blame when the vent settings are the actual cause.\n\nStart with **TSS — Tube** (in place, unobstructed), **Sounds** (present and equal), **Sats** (not hypoxemic). Then look for the mechanism:\n\n- **Category 1 — Ineffective triggering.** The patient is making respiratory efforts but the vent isn't responding. Key sign: negative pressure deflections on the waveform not followed by a delivered breath. Most common cause: auto-PEEP raising the effective trigger threshold — treat with lower rate.\n- **Category 2 — Flow starvation.** The vent can't deliver gas fast enough. Key sign: a scooped-out (concave) pressure waveform during inspiration — the patient is pulling pressure below what the vent is trying to hold. Fix: increase inspiratory flow or shorten I-time.\n- **Category 3 — Inappropriate breath termination.** The vent ends the breath too early or too late relative to the patient's own neural Ti. Key sign: upward pressure deflection at end-inspiration (patient trying to exhale while vent is still delivering). Fix: adjust I-time.\n\n**Other causes to check before reaching for sedation:** untreated pain (especially trauma and surgical patients); inadequate rate or Vt (switch to assist-control if the patient is fatiguing); dynamic hyperinflation (see Block 4); non-respiratory causes (cardiac ischemia, fever, abdominal distension, urinary retention, delirium, neurologic deterioration).",
    },
  ],

  hint_ladder: {
    tier1: "Each case starts with a specific first step. Case 1: inspiratory pause. Case 2: disconnect and bag (then auscultate). Case 3: interpret the ETCO2–PaCO2 gradient.",
    tier2: 'Case 1: wide gap (>10–15) = resistance; high Pplat (>30) = alveolar. Case 2: unilateral absent sounds + stable BP + present ETCO2 → right mainstem; unilateral absent + falling BP → tension pneumothorax. Case 3: widened gradient with unchanged MV → dead space → PE in a bedridden patient.',
    tier3: { hint_text: 'Show me — fires the inspiratory pause for Case 1 (the first step for high-pressure alarms). Case 2 and Case 3 carry their own Show-Me overrides.', demonstration: { control: 'inspiratory_pause', target_value: 1 } },
  },

  summative_quiz: [
    {
      id: 'T2AM-Q1',
      prompt: 'Patient on VC: Ppeak 58, Pplat 26 (after inspiratory pause), PEEP 5. Equal bilateral breath sounds. SpO2 92% and falling. Most appropriate action:',
      options: [
        { label: 'Reduce tidal volume to lower Ppeak', is_correct: false, explanation: 'Pplat is 26 — well within the 30 cmH2O safety limit. The alveoli are fine. Reducing Vt addresses nothing.' },
        { label: 'Suction and assess for bronchospasm', is_correct: true, explanation: 'Gap is 32 (58 − 26) — a resistance problem. Equal breath sounds make mainstem intubation less likely. Differential for wide gap: mucus plug, bronchospasm, kinked tube.' },
        { label: 'Needle decompression right chest', is_correct: false, explanation: 'Pneumothorax raises Pplat. Wide gap + normal Pplat = airways, not alveoli.' },
        { label: 'Increase PEEP to 12', is_correct: false, explanation: 'PEEP is the alveolar recruitment lever. It has no effect on airway resistance.' },
      ],
    },
    {
      id: 'T2AM-Q2',
      prompt: "A 55-year-old with COPD is 'fighting the ventilator.' Propofol has been increased twice. SpO2 91%, BP stable. The expiratory flow waveform shows persistent flow at the start of each new breath. Which letter of DOPES best describes this finding, and what is the treatment?",
      options: [
        { label: 'D — displacement: re-confirm tube position', is_correct: false, explanation: 'Displacement causes loss of ETCO2 waveform. This is an expiratory stacking pattern.' },
        { label: 'S — stacking: lower rate to 10–14, shorten I-time, treat bronchospasm', is_correct: true, explanation: 'Non-return of expiratory flow to zero is the auto-PEEP signature. Lower rate first.' },
        { label: 'O — obstruction: pass suction catheter', is_correct: false, explanation: 'Obstruction causes a wide peak–plateau gap and in complete obstruction, loss of ETCO2 waveform.' },
        { label: 'P — pneumothorax: get a CXR', is_correct: false, explanation: 'Pneumothorax causes hemodynamic collapse and absent unilateral breath sounds. Stable vitals do not suggest pneumothorax.' },
      ],
    },
    {
      id: 'T2AM-Q3',
      prompt: "A ventilated patient's ETCO2 monitor shows a flat line — no waveform. The book says an absent waveform means one of three things. Which answer lists all three correctly?",
      options: [
        { label: 'Tube displaced from trachea, or sensor faulty', is_correct: false, explanation: 'Omits complete tube occlusion, which is a separate immediately life-threatening emergency.' },
        { label: 'Tube not in trachea, tube completely occluded, or sensor faulty', is_correct: true, explanation: 'The first two are immediately life-threatening. Sensor fault is a diagnosis of exclusion only after the first two are ruled out.' },
        { label: 'Auto-PEEP, tube displaced, or bronchospasm', is_correct: false, explanation: 'Neither auto-PEEP nor bronchospasm eliminates the ETCO2 waveform.' },
        { label: 'Cardiac arrest, tube displaced, or sensor faulty', is_correct: false, explanation: 'Even cardiac arrest does not immediately eliminate the waveform — CO2 must first be washed out.' },
      ],
    },
    {
      id: 'T2AM-Q4',
      prompt: "Patient's ETCO2 drops suddenly from 40 to 18. MV unchanged at 7.2 L/min. ABG: PaCO2 56. HR 128, BP 74/42. Most likely cause:",
      options: [
        { label: 'Oversedation with hypoventilation', is_correct: false, explanation: 'Oversedation causes both ETCO2 and PaCO2 to rise. Here ETCO2 fell and PaCO2 rose — a widening gradient.' },
        { label: 'Pulmonary embolism causing acute dead-space increase', is_correct: true, explanation: 'Widened PaCO2-ETCO2 gradient (38) with unchanged MV and hemodynamic collapse. CO2 is in the blood but pulmonary blood flow has dropped.' },
        { label: 'Kinked ETT', is_correct: false, explanation: 'Kinked tube = obstruction: wide peak–plateau gap, resistance pattern.' },
        { label: 'Bronchospasm', is_correct: false, explanation: 'Bronchospasm produces a shark-fin ETCO2 waveform from incomplete emptying — not a drop in amplitude.' },
      ],
    },
    {
      id: 'T2AM-Q5',
      prompt: 'A patient on volume assist-control meets Berlin criteria for moderate ARDS (P/F 140, bilateral infiltrates). ABG: PaO2 52, PaCO2 62, pH 7.18. Settings: Vt 440 mL (6.3 mL/kg PBW), rate 14, PEEP 8, FiO2 0.60. Which single adjustment first?',
      options: [
        { label: 'Increase FiO2 to 1.0', is_correct: false, explanation: 'FiO2 is already 0.60. The urgent problem is pH 7.18 from CO2 retention. For high PaCO2 in VC, the table says: rate first.' },
        { label: 'Increase rate to 18', is_correct: true, explanation: 'pH 7.18 from CO2 retention is the acute threat. Quick adjustments order for high PaCO2 in VC: rate first, Vt second. Vt is already appropriate at 6.3 mL/kg for ARDS.' },
        { label: 'Reduce Vt to 4 mL/kg PBW', is_correct: false, explanation: 'Further reduces minute ventilation. Worsens CO2 retention in an already critically acidemic patient.' },
        { label: 'Switch to pressure control', is_correct: false, explanation: 'Mode switch does not address inadequate minute ventilation.' },
      ],
    },
    {
      id: 'T2AM-Q6',
      prompt: 'Ppeak has risen from 32 to 50 over 20 minutes. Inspiratory pause: Pplat 44. SpO2 82%. BP 92/58 and falling. Breath sounds slightly worse on the left. What is the first thing you do?',
      options: [
        { label: 'Suction the airway', is_correct: false, explanation: 'Gap is 6 (50 − 44) — normal. This is a compliance / alveolar problem.' },
        { label: 'Run DOPES — specifically P and O: disconnect and bag, auscultate carefully, prepare for needle decompression if tension physiology is confirmed', is_correct: true, explanation: "High Pplat (44) + falling BP + asymmetric breath sounds = compliance/alveolar problem with possible left-sided pathology. DOPES-P is the right framework here: pneumothorax until proven otherwise." },
        { label: 'Increase PEEP to 18', is_correct: false, explanation: 'Pplat is already 44. Adding PEEP raises alveolar pressure further and worsens barotrauma.' },
        { label: 'Administer neuromuscular blockade', is_correct: false, explanation: 'Paralysis removes spontaneous breathing while doing nothing to address the underlying structural problem.' },
      ],
    },
  ],

  explore_card: {
    patient_context:
      "It is 2:45 AM. You are covering a busy ICU. The Explore phase is a quiet warmup — get familiar with the buttons and readouts you will use during the three calls. The actual case perturbations (resistance fault, mainstem migration, PE-pattern dead-space) fire in Try-It; this preset is the calm before. Nothing counts yet.",
    unlocked_controls_description: [
      { name: 'Inspiratory pause (INSP HOLD)', description: '1-second hold; surfaces live Pplat. This is the first step for any high-pressure alarm — you\'ll use it in Case 1.' },
      { name: 'Expiratory pause (EXP HOLD)', description: '1-second hold; shows measured auto-PEEP vs set PEEP. The confirmation step for dynamic hyperinflation if you ever suspect it.' },
      { name: 'Auscultate / Examine', description: 'Action buttons that report the active case\'s clinical findings. They live next to the hold buttons and become useful in Try-It; pressing them now will just say "no new findings at this step."' },
      { name: 'Rate, I-time, PEEP, FiO2, Vt', description: 'Standard ventilator knobs. Move them and watch which readouts respond — same mental model you built in M3 and M4.' },
    ],
    readouts_description: [
      { name: 'Ppeak, Pplat, Driving pressure', description: 'Read these in every high-pressure alarm. The gap = resistance; the Pplat = alveolar load.' },
      { name: 'Auto-PEEP', description: 'Updates after an expiratory pause. Set PEEP + auto-PEEP = total end-expiratory pressure.' },
      { name: 'ETCO2', description: 'The earliest readout to change in PE and in tube displacement. Watch its shape, not just its value.' },
      { name: 'SpO2, SBP', description: 'The two clinical signals you trend during a sudden deterioration.' },
    ],
    suggestions: [
      'Tap INSP HOLD and watch Pplat lock in for ~1 second. That is the manoeuvre Case 1 opens with.',
      'Tap EXP HOLD on this calm preset — auto-PEEP reads 0 because the expiratory flow already returns to zero. You\'ll know what a NORMAL expiratory pause looks like before you see a pathologic one.',
      'Move FiO2 up and down a few times. The pressure waveform stays still — FiO2 is a parallel lever (recap from M3).',
      'Open and dismiss the Auscultate and Examine modals so you know where they live. The buttons get loud findings to report once Case 1 starts.',
    ],
  },

  user_facing_task:
    "It is 2:45 AM. You are covering the ICU. Three calls in a row. Work each one through the right framework — there is a specific first step for each type of problem.",
  success_criteria_display: [
    'Case 1 (high peak pressure): perform an inspiratory pause, identify the problem type from Ppeak / Pplat, and choose the correct first action.',
    'Case 2 (sudden SpO2 drop): disconnect and bag, interpret the unilateral breath-sound finding, and pick the right treatment.',
    'Case 3 (ETCO2 change): interpret the widened PaCO2–ETCO2 gradient, name the diagnosis, and choose the appropriate ventilator response.',
  ],
  task_framing_style: 'B',

  key_points: [
    'DOPES first for acute deterioration: Displacement, Obstruction, Pneumothorax, Equipment, Stacking.',
    'Each problem type has its own first step: high pressure = inspiratory pause; sudden SpO2 drop = disconnect and bag; fighting the vent = TSS then find the mechanism; ETCO2 change = look at the waveform first.',
    'One maneuver splits high-pressure alarms: inspiratory pause. Wide gap = resistance (mucus plug, bronchospasm, kinked tube). High Pplat = alveolar / compliance (mainstem, pneumothorax, edema, ARDS).',
    'ABG adjustment order: low PaO2 → PEEP first, FiO2 second (all modes). High PaCO2 → rate first, then Vt or driving pressure.',
    'Auto-PEEP signs: expiratory flow does not return to zero; abdominal contraction on exhalation; neck-vein distension; expiratory wheezing. Commandment IX: PaCO2 rises as rate is increased = auto-PEEP.',
    'Auto-PEEP treatment (six items): lower rate 10–14, shorten I-time, Vt 6–8 mL/kg, inspiratory flow 60–80 L/min if air hungry, narcotics, bronchodilators and steroids.',
    'Sudden SpO2 drop: disconnect and bag first. Then auscultate. Absent unilateral sounds + hypotension = tension pneumothorax. Needle the affected side (same technique regardless of side), then chest tube immediately.',
    'Absent ETCO2 waveform: tube not in trachea, tube completely occluded, or sensor faulty. Rule out the first two before assuming the third.',
    'ETCO2 patterns: both rise = hypoventilation. ETCO2 falls / PaCO2 stable or rising = dead space (PE, low cardiac output). Both fall = hyperventilation.',
    'Dyssynchrony: find the mechanism before sedating. Three categories: ineffective triggering (auto-PEEP; key sign: waveform efforts without breaths), flow starvation (key sign: scooped-out pressure waveform), inappropriate termination (key sign: upward pressure spike at end-inspiration).',
  ],
};
