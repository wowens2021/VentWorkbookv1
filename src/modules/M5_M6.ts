import type { ModuleConfig } from '../shell/types';

/**
 * MODULE M5 — Gas Exchange Basics
 *
 * Track: Physiology · Archetype: concept demo (compound strict, reset_between) · 16 min
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
/**
 * MODULE M5 — Shunt, ARDS, and PEEP (rewritten)
 *
 * Tagline: Shunt floods alveoli. PEEP opens them.
 *
 * The lesson is one-sentence: in ARDS-pattern hypoxemia, more FiO2
 * doesn't help; PEEP does — because the problem is collapsed/flooded
 * alveoli, not low inspired O2. The tracker walks the learner through
 * exactly that failure-then-fix sequence, then closes with a
 * recognition step that distinguishes physiologic shunt (PEEP works)
 * from anatomic shunt (PEEP doesn't, because the blood is bypassing
 * the lung entirely).
 *
 * Task framing style is per-step:
 *   Step 1: A (direct — push FiO2 ≥ 90)
 *   Step 2: B (clinical — recruit until SpO2 ≥ 92)
 *   Step 3: C (recognition — identify ASD as anatomic shunt)
 * The single `task_framing_style` field is set to 'B' as the dominant
 * tone; the per-step variation is reflected in the prose of each step.
 *
 * Physics anchors (verified against PlaygroundSim ABG memo):
 *   At PEEP 5 / FiO2 100% / shuntFraction 0.44:
 *     peepRecruitment = 0, Qs_Qt = 0.44, base_PF ≈ 60, PaO2 ≈ 60, SpO2 ≈ 86%
 *   At PEEP 12 / FiO2 100% / shuntFraction 0.44:
 *     peepRecruitment = 7, Qs_Qt ≈ 0.314, base_PF ≈ 186, PaO2 ≈ 186, SpO2 ≈ 99%
 *   So Step 2 (PEEP ≥ 12 AND SpO2 ≥ 92, sustain 4) is comfortably
 *   reachable from the starting state. Step 1 (FiO2 ≥ 90) starts the
 *   learner at FiO2 = 100 so the manipulation is just acknowledging
 *   that maxing out FiO2 didn't work.
 */
export const M5: ModuleConfig = {
  id: 'M5',
  number: 5,
  title: 'Shunt, ARDS, and PEEP',
  track: 'Physiology',
  estimated_minutes: 18,
  briefing: {
    tagline: 'Shunt floods alveoli. PEEP opens them.',
    overview:
      "ARDS, pneumonia, pulmonary edema — they all do the same thing to the lung: they fill alveoli with fluid, pus, or blood, and they collapse the rest. Blood still flows past those drowned units, picking up no oxygen on its way out. That's shunt. The defining feature is that cranking the FiO2 doesn't fix it. The fix is to re-open the alveoli so the gas and the blood can finally meet again. That's what PEEP does.",
    what_youll_do: [
      "Meet a patient with refractory hypoxemia who's already on 100% FiO2 and still saturating at 86%.",
      "Watch FiO2 fail — then watch PEEP work — and feel the difference recruitment makes in real time.",
      "Tell the difference between an alveolar (physiologic) shunt that PEEP fixes and an anatomic shunt that it can't.",
    ],
  },

  visible_learning_objectives: [
    "Define shunt as perfusion without ventilation, and state the bedside test (100% FiO2).",
    "Explain why FiO2 alone doesn't correct shunt-driven hypoxemia.",
    "Describe how PEEP recruits collapsed alveoli and improves V/Q matching.",
    "Distinguish physiologic shunt (ARDS — fixable with PEEP) from anatomic shunt (ASD/VSD/AVM — not fixable with PEEP).",
  ],

  primer_questions: [
    {
      id: 'M5-P1',
      prompt: "A patient with bilateral infiltrates on chest X-ray has SpO2 of 86% on 100% FiO2. The most likely physiologic explanation is:",
      options: [
        { label: "Shunt — blood is flowing past alveoli that have no air in them.", is_correct: true, explanation: "Refractory hypoxemia on 100% FiO2 is the bedside fingerprint of shunt. The blood passing collapsed or flooded alveoli never sees oxygen no matter how much you give the open ones." },
        { label: "Hypoventilation — minute ventilation is too low.", is_correct: false, explanation: "Pure hypoventilation gives high PaCO2 with a NORMAL A-a gradient. On 100% FiO2 the expected PaO2 is ~600 — finding 50–60 means a huge gradient, which is shunt or severe V/Q mismatch." },
        { label: "Low FiO2 — needs more oxygen.", is_correct: false, explanation: "He's already on 100%. There is no more O2 to give." },
        { label: "Anemia.", is_correct: false, explanation: "Anemia changes content (CaO2) but not saturation (SpO2). SpO2 86% is a hypoxemia problem, not a hemoglobin problem." },
      ],
    },
    {
      id: 'M5-P2',
      prompt: "What does PEEP actually do at the alveolar level in an ARDS patient?",
      options: [
        { label: "It pushes oxygen across the alveolar membrane faster.", is_correct: false, explanation: "Diffusion isn't usually the rate-limiting step in ARDS. PEEP isn't a diffusion enhancer — it's a recruitment lever." },
        { label: "It holds collapsed alveoli open at end-expiration so the blood passing them finally sees air.", is_correct: true, explanation: "PEEP keeps alveoli from collapsing each expiration. Recruited alveoli participate in gas exchange. Shunt fraction falls. SpO2 climbs." },
        { label: "It thins out pulmonary edema fluid.", is_correct: false, explanation: "PEEP can redistribute edema but it doesn't pull it out of the lung. Diuretics do that." },
        { label: "It increases cardiac output.", is_correct: false, explanation: "PEEP typically *reduces* cardiac output by raising intrathoracic pressure and lowering venous return. The reason it helps hypoxemia is recruitment, not hemodynamics." },
      ],
    },
    {
      id: 'M5-P3',
      prompt: "An anatomic shunt — like a large ASD with right-to-left flow — differs from an ARDS shunt in that:",
      options: [
        { label: "Both respond identically to PEEP.", is_correct: false, explanation: "They don't. The anatomic shunt's blood never enters the lung — PEEP can't recruit a hole in the atrial septum." },
        { label: "The anatomic shunt also responds to 100% FiO2.", is_correct: false, explanation: "Neither responds well to FiO2 — that's the shared shunt fingerprint." },
        { label: "PEEP recruits flooded alveoli; PEEP can't fix blood that's bypassing the lung entirely.", is_correct: true, explanation: "Physiologic shunt is blood flowing past collapsed lung — PEEP opens the alveolus and fixes it. Anatomic shunt is blood structurally bypassing the lung (intracardiac hole, AVM) — no amount of PEEP changes that." },
        { label: "The anatomic shunt resolves with diuresis.", is_correct: false, explanation: "Diuresis treats hydrostatic edema, not a structural shunt." },
      ],
    },
  ],

  scenario: {
    preset_id: 'M5_ards_shunt',
    preset: {
      mode: 'VCV',
      // ARDS shunt patient starting on a sub-maximal FiO2 of 60% so
      // Step 1 (raise FiO2 to 100%) is a real action — and the lesson
      // lands that maxing FiO2 still leaves the SpO2 stuck. SpO2 ~86%.
      settings: { tidalVolume: 420, respiratoryRate: 18, peep: 5, fiO2: 60, iTime: 1.0 },
      patient: {
        compliance: 30,           // moderate-severe ARDS Crs
        resistance: 12,
        spontaneousRate: 0,
        shuntFraction: 0.44,      // scripted ARDS shunt — yields SpO2 ~86% at PEEP 5
        deadSpaceFraction: 0.40,
        gender: 'M',
        heightInches: 70,
      },
    },
    unlocked_controls: ['fiO2', 'peep'],
    visible_readouts: ['pip', 'plat', 'drivingPressure', 'spo2', 'pao2', 'paco2', 'fio2', 'peep'],
    visible_waveforms: ['pressure_time', 'flow_time'],
    // Recruiting the lung at high PEEP can push Pplat past 30 here; the
    // general safety alarm is just noise in this recruitment lesson.
    suppress_pplat_alarm: true,
  },

  // Flat four-step strict compound, reset_between false.
  //   1: manipulation — raise FiO2 to ≥ 90% + ack ("why didn't SpO2 move?").
  //   2: outcome — PEEP ≥ 12 AND SpO2 ≥ 92, sustained 4 breaths.
  //   3: recognition — what PEEP did in the alveoli (M5-recruit-ack).
  //   4: recognition — anatomic vs physiologic shunt (M5-asd-shunt).
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
          question: "FiO2 is now at 100%. SpO2 is still 86%. What does this tell you?",
          options: [
            {
              label: "Shunt — the blood is passing alveoli with no air in them. More FiO2 to the open alveoli doesn't reach the closed ones.",
              is_correct: true,
              explanation: "When maximizing FiO2 fails to correct hypoxemia, it confirms shunt physiology. Shunted blood bypasses ventilated alveoli entirely, so enriching the gas in those alveoli has no effect on the desaturated blood.",
            },
            {
              label: "Hypoventilation — increase the rate.",
              is_correct: false,
              explanation: "Hypoventilation would cause CO2 to rise and both PaO2 and ETCO2 to change together. The problem here is shunt, not inadequate ventilation.",
            },
            {
              label: "Sensor error — the SpO2 probe is wrong.",
              is_correct: false,
              explanation: "In a patient with bilateral infiltrates and known ARDS, refractory hypoxemia on FiO2 1.0 is the expected finding — this is shunt physiology, not artifact.",
            },
            {
              label: "Anemia — needs blood.",
              is_correct: false,
              explanation: "Anemia lowers oxygen content but not saturation. SpO2 86% reflects a gas-exchange problem, not a hemoglobin quantity problem.",
            },
          ],
        },
      },
      {
        kind: 'outcome',
        readouts: {
          peep: { operator: '>=', value: 12 },
          spo2: { operator: '>=', value: 92 },
        },
        sustain_breaths: 4,
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M5-recruit-ack',
          trigger: { kind: 'on_load' },
          question: "What just happened in the alveoli to make SpO2 climb from 86% to >92%?",
          options: [
            {
              label: "PEEP recruited collapsed alveoli — they now participate in gas exchange, so the shunt fraction fell.",
              is_correct: true,
              explanation: "Exactly. PEEP at end-expiration holds alveoli open that would otherwise collapse. Recruited alveoli see the high FiO2 the rest of the lung is breathing, and the blood passing them finally oxygenates. The shunt fraction drops. The SpO2 climbs. This is the ARDS recruitment lesson in one sentence.",
            },
            {
              label: "PEEP pushed more oxygen across the alveolar membrane.",
              is_correct: false,
              explanation: "Diffusion isn't usually the bottleneck in ARDS — collapsed alveoli are. PEEP isn't a diffusion enhancer; it's a recruitment lever. The mechanism is opening, not pushing.",
            },
            {
              label: "PEEP improved cardiac output.",
              is_correct: false,
              explanation: "Backwards — PEEP usually *lowers* cardiac output by reducing venous return. The SpO2 climb here is alveolar recruitment, not a hemodynamic effect.",
            },
            {
              label: "PEEP cleared edema fluid from the alveoli.",
              is_correct: false,
              explanation: "PEEP redistributes fluid (less in the air spaces, more in the interstitium) but doesn't remove it from the lung. The acute gain on the SpO2 is recruitment, not fluid clearance — diuretics do that, over hours.",
            },
          ],
          max_attempts: 2,
        },
      },
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M5-asd-shunt',
          trigger: { kind: 'on_load' },
          question: "A different patient has SpO2 86% on 100% FiO2 — same number as the patient you just fixed. CT chest is clean. Echo shows a large atrial septal defect with right-to-left flow. Will PEEP fix this hypoxemia?",
          options: [
            {
              label: "No — this is an anatomic shunt. The blood is bypassing the lung through a hole between the atria. PEEP can't recruit a hole.",
              is_correct: true,
              explanation: "Right. An anatomic right-to-left shunt — ASD, VSD, PFO with reversal, AVM — sends desaturated blood directly into the arterial side, bypassing the lung entirely. PEEP only helps when the blood is going *through* the lung but past unventilated alveoli. Here the blood never enters the lung. The fix is closure of the defect, not ventilator settings.",
            },
            {
              label: "Yes — same hypoxemia, same fix.",
              is_correct: false,
              explanation: "The number is the same; the mechanism isn't. PEEP only recruits alveoli — it can't reroute blood that's bypassing the lung through a structural defect. This is the central distinction between physiologic and anatomic shunt.",
            },
            {
              label: "Yes — eventually. It just needs more PEEP than the ARDS patient.",
              is_correct: false,
              explanation: "More PEEP won't fix a structural shunt. You can push PEEP to 25 and the blood still goes through the ASD. The only fix is closing the defect.",
            },
            {
              label: "No — but raising FiO2 will fix it.",
              is_correct: false,
              explanation: "FiO2 doesn't fix it either. The right-to-left blood bypasses the lung and never sees alveolar gas at any FiO2. That's the diagnostic feature of any shunt — anatomic or physiologic — and the reason both fail the 100% FiO2 challenge.",
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
        "Your patient has ARDS. He's on FiO2 100%, PEEP 5, and his SpO2 is 86%. The respiratory therapist is asking what you want to do. The reflex answer — *more FiO2* — won't work, because he's already on as much as exists. The right answer is **PEEP**, and the reason is worth understanding before you reach for the knob.",
    },
    {
      kind: 'prose',
      markdown:
        "**Shunt** is blood flowing past alveoli that aren't ventilated. The alveoli are collapsed (atelectasis), filled with fluid (pulmonary edema), filled with pus (pneumonia), or filled with blood (hemorrhage). The blood passing them never touches air. It exits the lung still desaturated, mixes with the well-oxygenated blood from the rest of the lung, and the resulting mixture is what reaches the systemic circulation. The more alveoli are shut down, the larger the shunt fraction, and the lower the arterial saturation.",
    },
    {
      kind: 'callout',
      tone: 'info',
      markdown:
        "**The bedside test for shunt:** put the patient on 100% FiO2. If the SpO2 doesn't climb to near-normal, it's shunt. Shunted blood bypasses ventilated alveoli entirely and returns to the systemic circulation still desaturated — adding more oxygen to the gas the other alveoli breathe has no effect on the portion that never reached them.",
    },
    {
      kind: 'prose',
      markdown:
        "**PEEP** is the lever that pulls those alveoli back into the gas-exchange pool. At end-expiration, when alveolar pressure normally drops to zero, PEEP holds a residual pressure in the airway that stents collapsed alveoli open. Some of them re-recruit immediately. Some take several breaths. Some take a sustained recruitment maneuver. The end result, when PEEP is enough, is that the closed alveoli reopen — they finally see the high FiO2 the rest of the lung is breathing — and the blood passing them is finally oxygenated. The shunt fraction falls. The SpO2 climbs.",
    },
    {
      kind: 'callout',
      tone: 'tip',
      markdown:
        "**Open the lungs and keep them open.** PEEP first, FiO2 second. White on the chest X-ray means alveoli to recruit, not oxygen to add.",
    },
    {
      kind: 'prose',
      markdown:
        "The amount of PEEP that recruits varies by patient. The ARDSNet PEEP-FiO2 ladder is a reasonable starting point — at FiO2 1.0, set PEEP to 18–24 cmH2O for severe ARDS, 14–18 for moderate. You're titrating against two endpoints: SpO2 climbing into the 88–95% range, and driving pressure (Pplat − PEEP) staying under 15 cmH2O. If PEEP recruits without over-distending, both endpoints move the right way at once.",
    },
    {
      kind: 'prose',
      markdown:
        "**Not all shunts are alveolar.** A patient can have refractory hypoxemia from blood flowing *around* the lung entirely — through an atrial septal defect with right-to-left flow, through a patent foramen ovale opened up by rising right-heart pressures, through a pulmonary AVM. The fingerprint at the bedside is identical: FiO2 doesn't help. But the mechanism is different, and so is the fix. **PEEP only works when the blood is going through the lung — past unventilated alveoli that PEEP can re-recruit.** If the blood is bypassing the lung structurally, PEEP can't change that.",
    },
    {
      kind: 'callout',
      tone: 'warn',
      markdown:
        "**Anatomic shunt warning:** in a patient with refractory hypoxemia and a clean chest X-ray, think about right-to-left intracardiac flow before you push PEEP higher. Bubble-study echo answers the question in minutes. Closing an ASD is a cardiology problem, not a ventilator problem.",
    },
  ],

  hint_ladder: {
    intervals_seconds: [25, 75, 150],
    tier1: "Step 1: raise the FiO2 knob to 100% and watch — the SpO2 won't budge. Then answer the prompt about why maxing the oxygen didn't help.",
    tier2: "Step 2: don't be timid with PEEP. From 5, try 12. Then watch SpO2 climb past 92% and hold for four breaths. Step 3 is a single recognition question about anatomic vs physiologic shunt.",
    tier3: {
      hint_text: 'Use "Show me" to push PEEP toward 12 — then let the SpO2 climb on its own.',
      demonstration: { control: 'peep', target_value: 12 },
    },
  },

  summative_quiz: [
    {
      id: 'M5-Q1',
      prompt: "A patient on 100% FiO2 has a PaO2 of 60 mmHg. The most likely cause is:",
      options: [
        { label: "Hypoventilation.", is_correct: false, explanation: "Hypoventilation gives high PaCO2 with a NORMAL A-a gradient. On 100% FiO2 the expected PaO2 is ~600, so 60 means a gradient of ~540 — that's not a ventilation problem." },
        { label: "Shunt.", is_correct: true, explanation: "Refractory hypoxemia despite 100% FiO2 is the textbook bedside definition of shunt. The shunted blood never sees the alveolar gas, so changing the gas doesn't change the blood." },
        { label: "Low FiO2.", is_correct: false, explanation: "He's already on the maximum. There is no more FiO2 to give." },
        { label: "Carbon monoxide poisoning.", is_correct: false, explanation: "CO poisoning causes a falsely *high* SpO2 because COHb absorbs the same wavelength as oxyhemoglobin. The arterial PaO2 would actually be normal — the problem is content, not gas exchange." },
      ],
    },
    {
      id: 'M5-Q2',
      prompt: "The primary mechanism by which PEEP improves oxygenation in ARDS is:",
      options: [
        { label: "It enhances diffusion across the alveolar membrane.", is_correct: false, explanation: "Diffusion is rarely the rate-limiting step in ARDS. PEEP is not a diffusion enhancer." },
        { label: "It recruits collapsed alveoli and keeps them open across the respiratory cycle.", is_correct: true, explanation: "PEEP at end-expiration prevents alveolar collapse and re-opens previously closed units. Recruited alveoli participate in gas exchange, the shunt fraction falls, and SpO2 climbs." },
        { label: "It reduces minute ventilation.", is_correct: false, explanation: "PEEP doesn't change minute ventilation — that's set by rate and tidal volume. PEEP affects end-expiratory lung volume, not minute ventilation." },
        { label: "It increases cardiac output.", is_correct: false, explanation: "PEEP usually *lowers* cardiac output by reducing venous return. Its benefit in ARDS is recruitment, not hemodynamics." },
      ],
    },
    {
      id: 'M5-Q3',
      prompt: "A patient with severe ARDS has SpO2 86% on FiO2 1.0 and PEEP 5. You raise PEEP to 14 and SpO2 climbs to 95%. The most likely explanation is:",
      options: [
        { label: "More oxygen molecules are reaching the alveoli.", is_correct: false, explanation: "FiO2 didn't change. The same oxygen is reaching the open alveoli as before — the difference is that more alveoli are now open." },
        { label: "Diffusion across the alveolar membrane sped up.", is_correct: false, explanation: "Diffusion isn't the bottleneck here. The bottleneck was access — blood passing closed alveoli. PEEP opened the alveoli." },
        { label: "Previously collapsed alveoli were recruited, lowering the shunt fraction.", is_correct: true, explanation: "Recruitment is the mechanism. With more alveoli open, less blood bypasses the gas-exchange pool, the shunt fraction drops, and arterial saturation rises." },
        { label: "Pulmonary edema was diuresed.", is_correct: false, explanation: "PEEP doesn't remove edema — it redistributes it. The acute SpO2 gain on a PEEP titration is recruitment, not diuresis." },
      ],
    },
    {
      id: 'M5-Q4',
      prompt: "Which of the following is an example of an anatomic shunt, where PEEP will NOT improve oxygenation?",
      options: [
        { label: "ARDS with bilateral alveolar consolidation.", is_correct: false, explanation: "ARDS is the classic physiologic shunt — PEEP is exactly the fix." },
        { label: "Lobar pneumonia with consolidation in the right lower lobe.", is_correct: false, explanation: "Lobar pneumonia is a physiologic shunt within that lobe — PEEP can recruit some of the surrounding atelectasis even if it doesn't fix the consolidation itself." },
        { label: "A large atrial septal defect with right-to-left flow.", is_correct: true, explanation: "An ASD with right-to-left shunt sends desaturated blood directly into the systemic arteries, bypassing the lung. PEEP can't reroute blood that isn't going through the lung in the first place. The fix is structural — closure of the defect." },
        { label: "Cardiogenic pulmonary edema.", is_correct: false, explanation: "Cardiogenic edema is also a physiologic shunt — PEEP/CPAP famously help both by recruiting and by unloading the failing left ventricle." },
      ],
    },
    {
      id: 'M5-Q5',
      prompt: "You raise PEEP from 5 to 18 in a severe ARDS patient and SpO2 climbs from 86% to 96%. Driving pressure (Pplat − PEEP) is now 16 cmH2O. The MAP has dropped from 75 to 58. The best next step is:",
      options: [
        { label: "Continue raising PEEP until SpO2 is 100%.", is_correct: false, explanation: "SpO2 96% is a fine target — pushing higher trades zero oxygenation benefit for more hemodynamic cost and more risk of over-distension. Don't chase 100%." },
        { label: "Drop PEEP back to 5 because the BP fell.", is_correct: false, explanation: "Dropping PEEP back would re-derecruit and the hypoxemia would return. The BP drop is real but addressable with fluid and pressor while keeping the lung open." },
        { label: "Pull back to a PEEP that holds SpO2 ≥ 92% with driving pressure ≤ 15 — then support the MAP with fluid and norepinephrine.", is_correct: true, explanation: "The right ARDS bedside heuristic: titrate PEEP for adequate SpO2 with driving pressure ≤ 15, then treat the hemodynamic consequences separately. PEEP recruitment is real; so is venous-return reduction. You manage both — you don't sacrifice the lung for the BP." },
        { label: "Switch to PCV.", is_correct: false, explanation: "Mode doesn't change physiology. The patient's lung mechanics and shunt are the same problem regardless of how the vent delivers the breath." },
      ],
    },
  ],

  explore_card: {
    patient_context:
      "62-year-old with severe ARDS on day 2 — FiO2 100%, PEEP 5, SpO2 stuck at 86%. Compliance is 30 (moderate-severe). You have two knobs: FiO2 and PEEP. Try the wrong fix first, then the right one.",
    unlocked_controls_description: [
      { name: 'FiO2 · 21–100%', description: "the obvious lever. Test it — confirm that even at 100% the SpO2 doesn't move appreciably. That's the shunt fingerprint." },
      { name: 'PEEP · 0–20', description: "the real lever for shunt. Try 8, then 12, then 14. Watch SpO2 climb as alveoli re-recruit. Notice that driving pressure (Pplat − PEEP) stays manageable as PEEP rises here because the lung was collapsed, not over-distended." },
    ],
    readouts_description: [
      { name: 'SpO2', description: "the one you're titrating against." },
      { name: 'PaO2', description: "the underlying PaO2 climbs as the shunt fraction falls — watch both." },
      { name: 'Pplat and Driving Pressure', description: "keep driving pressure (Pplat − PEEP) below 15. If PEEP raises both Pplat and DP without raising SpO2, you've over-distended rather than recruited." },
    ],
    suggestions: [
      "Push FiO2 to 100% (it's already there) — confirm SpO2 doesn't move. That's shunt.",
      "Now raise PEEP from 5 to 12. Watch SpO2 climb past 92% within a few breaths.",
      "Push further to PEEP 16. Notice SpO2 keeps climbing but driving pressure rises too — at some point you're over-distending instead of recruiting.",
      "Drop PEEP back to 5 and watch SpO2 collapse again. The recruitment is real-time and reversible.",
    ],
  },

  user_facing_task:
    "Your patient has ARDS and is on FiO2 60%. Step 1: raise FiO2 to 100% and confirm that SpO2 does not correct — then answer why. Step 2: raise PEEP to at least 12 and hold SpO2 ≥ 92% for 4 breaths. Step 3: answer two recognition questions about what just happened and when PEEP cannot help.",
  success_criteria_display: [
    "Raise FiO2 to ≥ 90% and identify why SpO2 didn't respond.",
    "Raise PEEP to ≥ 12 and hold SpO2 ≥ 92% for 4 consecutive breaths.",
    "Answer the two recognition questions about shunt physiology and anatomic shunt.",
  ],
  task_framing_style: 'B',

  key_points: [
    "Shunt = blood flowing past alveoli that aren't ventilated. Its fingerprint at the bedside is refractory hypoxemia on 100% FiO2.",
    "PEEP recruits collapsed alveoli back into the gas-exchange pool — that's how it fixes shunt-driven hypoxemia.",
    "In ARDS, PEEP first, FiO2 second. White on the chest X-ray means alveoli to recruit, not oxygen to add.",
    "Titrate PEEP to SpO2 88–95% with driving pressure (Pplat − PEEP) ≤ 15 cmH2O. Don't chase SpO2 100%.",
    "Anatomic shunt (ASD, VSD, AVM) has the same FiO2-resistant fingerprint but PEEP can't fix it — the blood is bypassing the lung structurally, not just passing closed alveoli.",
  ],
};

/**
 * MODULE M6 — Auto-PEEP and Air Trapping
 *
 * Track: Physiology · Archetype: target state, two-stage · 15 min
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
        { label: "End-expiratory alveolar pressure that is higher than the set PEEP — air trapped because the patient can't exhale completely.", is_correct: true, explanation: "When each breath starts before the lung has fully emptied, gas stacks up and the alveolar pressure at end-expiration sits above the PEEP you set. That extra trapped pressure is auto-PEEP (intrinsic PEEP)." },
        { label: 'PEEP that increases on inspiration.', is_correct: false, explanation: 'PEEP is by definition end-*expiratory*.' },
        { label: 'PEEP measured during noninvasive ventilation.', is_correct: false, explanation: 'Not the definition.' },
      ],
    },
    {
      id: 'M6-P2',
      prompt: 'The flow-waveform sign of auto-PEEP is:',
      options: [
        { label: 'The inspiratory flow has a square shape.', is_correct: false, explanation: "That's just constant flow in VCV." },
        { label: "The expiratory flow doesn't return to zero before the next breath starts.", is_correct: true, explanation: 'The patient is mid-exhale when the next vent breath fires.' },
        { label: 'The PIP waveform is double-humped.', is_correct: false, explanation: "That's double triggering." },
        { label: 'There is no flow waveform visible.', is_correct: false, explanation: 'Equipment failure.' },
      ],
    },
    {
      id: 'M6-P3',
      prompt: 'The single most effective ventilator change to relieve dynamic hyperinflation is:',
      options: [
        { label: 'Increase PEEP.', is_correct: false, explanation: "In *asthma*, applied PEEP worsens trapping. In COPD, extrinsic PEEP helps only the narrow case of auto-PEEP-driven ineffective triggering — it does not relieve the trapping itself. Lowering the rate does." },
        { label: 'Lower the respiratory rate.', is_correct: true, explanation: 'Slower rate = longer expiratory time = air drains.' },
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

  // Bug fix: the original two steps gated on the auto-PEEP READOUT
  // (≥4, then ≤1.5). But the sim only updated that readout after an
  // expiratory hold, and M6 doesn't unlock the expiratory-pause button
  // — so auto-PEEP read 0 forever and the task could never advance.
  // Two changes fix it: (1) PlaygroundSim now surfaces a LIVE auto-PEEP
  // estimate (see autoPeepValue), and (2) the two steps below gate on
  // the RATE manipulation the learner actually performs — raise the
  // rate to trap, then lower it to untrap — which is guaranteed
  // achievable. The live auto-PEEP readout climbs and falls as they do
  // it, so the lesson still lands visually.
  // Step 3 (novice-pass §6.3): recognition prompt — the disconnect
  // maneuver is the most important novice-life-saving teaching.
  hidden_objective: {
    kind: 'compound',
    sequence: 'strict',
    reset_between: false,
    children: [
      // Step 1 — raise the rate to induce trapping. Watch the
      // expiratory flow fail to return to zero and the auto-PEEP
      // readout climb.
      {
        kind: 'manipulation',
        control: 'respiratoryRate',
        condition: { type: 'absolute', operator: '>=', value: 26 },
      },
      // Step 2 — lower the rate to give expiration time. Auto-PEEP
      // falls back toward zero.
      {
        kind: 'manipulation',
        control: 'respiratoryRate',
        condition: { type: 'absolute', operator: '<=', value: 12 },
      },
      // Novice-pass §6.3 — disconnect-the-vent practice.
      {
        kind: 'recognition',
        prompt: {
          prompt_id: 'M6-disconnect',
          trigger: { kind: 'on_load' },
          question:
            "Imagine you'd been a little slower. The patient's auto-PEEP had climbed to 16 cmH2O and his BP dropped from 110/70 to 60/35. What's the FIRST action?",
          options: [
            {
              label: 'Disconnect from the vent for 10–15 seconds and let his chest fall.',
              is_correct: true,
              explanation:
                "Trapped gas is mechanically compressing his venous return — the chest is full and the right atrium can't fill. Disconnecting lets him exhale fully to atmosphere; BP returns in seconds. Then you fix the rate. This is the single most life-saving move in obstructive vent emergencies.",
            },
            {
              label: 'Push a 1 L fluid bolus.',
              is_correct: false,
              explanation: 'Fluids treat hypovolemic hypotension. This is mechanical compression — the air in his chest is the problem.',
            },
            {
              label: 'Start norepinephrine.',
              is_correct: false,
              explanation: "Pressors won't unsqueeze the right atrium. The trapped air is still there compressing it.",
            },
            {
              label: 'Raise the PEEP to splint his airways.',
              is_correct: false,
              explanation: "In a trapping patient, applied PEEP usually worsens the trapping. And the bedside problem is that he's about to arrest — that's not the time to titrate.",
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
        "Auto-PEEP is the airway problem that won't show up on the peak pressure. It hides in the end-expiratory part of the cycle — the part nobody looks at unless they know to. **Watch the flow waveform.** If it doesn't get back to zero before the next breath fires, you have trapped air.",
    },
    // Novice-pass §6.1 — expanded asthma-vs-COPD PEEP teaching with two
    // concrete bedside scenarios.
    {
      kind: 'prose',
      markdown:
        "**Asthma:** the obstruction is *inflammatory* — swollen, inflamed airways that don't reopen with pressure. Imagine a 28-year-old in status asthmaticus, intubated, with auto-PEEP of 14. You raise applied PEEP from 0 to 8 hoping to help. **What happens?** Total PEEP just adds — now it's 22. Venous return drops further. BP falls. The airways are still inflamed. *Takeaway: in asthma, PEEP is harmful — don't reflex into it.*",
    },
    {
      kind: 'prose',
      markdown:
        "**COPD:** the obstruction is *floppy-airway* disease — small airways collapse during expiration like a wet straw closing on itself. Extrinsic PEEP is sometimes useful here, but only in one specific situation: when the patient has **both significant auto-PEEP AND ineffective triggering** — visible inspiratory efforts that fail to deliver a breath because the trigger threshold sits below the trapped auto-PEEP level. In that case, setting extrinsic PEEP at roughly **75–85% of the measured auto-PEEP** raises the baseline the patient triggers from, so it reduces the work of triggering without worsening hyperinflation — and you never exceed the auto-PEEP number. **In most COPD patients there is no triggering problem, and the first priority is to reduce the auto-PEEP itself by lowering the rate — not to add extrinsic PEEP.**",
    },
    {
      kind: 'callout',
      tone: 'warn',
      markdown:
        "**One sentence to memorize:** asthma → no PEEP. COPD → lower the rate first to relieve trapping; reach for extrinsic PEEP only when auto-PEEP is causing ineffective triggering. Don't reflexively add PEEP in either one.",
    },
    // Novice-pass §6.2 — promote the counter-intuitive "raising the rate
    // makes CO2 worse" insight from buried summative explanation to a
    // dedicated read block + predict_mcq before the auto-PEEP demo.
    {
      kind: 'prose',
      markdown:
        "**The counter-intuitive part.** In a trapping patient, what most clinicians try when CO2 starts climbing is to *raise the respiratory rate* — give more breaths per minute, clear more CO2. The mechanism: higher rate → less expiratory time per breath → less air leaving each cycle → more trapping → more dead space → and crucially, **less actually-alveolar volume per breath**. The patient is hyperventilating air through his own dead space without exchanging more CO2. PaCO2 goes UP.",
    },
    {
      kind: 'predict_mcq',
      predict:
        "A trapping COPD patient has PaCO2 of 60. You raise the rate from 14 to 24. After 10 minutes, the next ABG shows PaCO2 of:",
      options: [
        { label: 'Lower — more breaths cleared more CO2.', is_correct: false, explanation: 'The reflex answer. Wrong in a trapping patient because most of the added MVe is dead-space ventilation, not alveolar.' },
        { label: 'About the same.', is_correct: false, explanation: 'It worsened. The added trapping shrinks alveolar volume per breath even as total MVe rose.' },
        { label: 'Higher.', is_correct: true },
        { label: 'Cannot predict without knowing the FiO2.', is_correct: false, explanation: 'CO2 clearance is a ventilation question, not an oxygenation question.' },
      ],
      observe:
        "PaCO2 rises in a trapping patient when rate goes up. The fix is the opposite direction: slow the rate, lengthen expiration, accept the hypercapnia.",
    },
    {
      kind: 'predict_mcq',
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
        'Trapped air is compressing his venous return. Disconnect from the vent, let him fully exhale, then resume with a lower rate. Fluids treat the symptom, not the cause. Raising PEEP or rate worsens trapping.',
    },
  ],

  hint_ladder: {
    tier1: 'Two steps, both on the rate knob. First push the patient into trapping, then relieve it.',
    tier2: 'Step 1: raise the rate to 26 or higher — watch auto-PEEP climb and the expiratory flow stop returning to zero. Step 2: drop the rate to 12 or lower to give expiration room — auto-PEEP falls.',
    tier3: { hint_text: 'Use "Show me" to set the rate to 26 (Step 1). Then lower it to 12 or below to finish Step 2.', demonstration: { control: 'respiratoryRate', target_value: 26 } },
  },

  summative_quiz: [
    {
      id: 'M6-Q1',
      prompt: 'Auto-PEEP is most reliably measured by:',
      options: [
        { label: 'Looking at the PIP trend.', is_correct: false, explanation: "PIP doesn't reveal end-expiratory pressure." },
        { label: 'An expiratory hold — the measured end-expiratory pressure minus set PEEP.', is_correct: true, explanation: 'Closing the expiratory valve at end-expiration lets the pressure in the circuit equilibrate with the trapped alveolar gas. The number you read is total PEEP; subtract the set PEEP and the remainder is the auto-PEEP. It is the only direct measurement at the bedside.' },
        { label: 'The PaCO2.', is_correct: false, explanation: "CO2 may rise but isn't the measurement." },
        { label: 'The set PEEP minus 1.', is_correct: false, explanation: 'No relationship.' },
      ],
    },
    {
      id: 'M6-Q2',
      prompt: 'In a patient with severe asthma and dynamic hyperinflation, the application of PEEP usually:',
      options: [
        { label: 'Helps — splints airways.', is_correct: false, explanation: "That's COPD." },
        { label: 'Worsens trapping — the obstruction in asthma is fixed, so adding PEEP just adds pressure.', is_correct: true, explanation: 'The COPD "waterfall" benefit depends on collapsible airways: external PEEP props them open so trapped gas can escape. Asthmatic obstruction is intraluminal and largely fixed, so there is no collapse to splint — added PEEP simply stacks on top of the trapped pressure and worsens hyperinflation. The fix in asthma is a longer expiratory time, not PEEP.' },
        { label: 'Has no effect.', is_correct: false, explanation: 'Wrong.' },
        { label: 'Lowers the PaCO2.', is_correct: false, explanation: 'Wrong.' },
      ],
    },
    {
      id: 'M6-Q3',
      prompt: 'A vent rate increase that raises PaCO2 instead of lowering it should make you suspect:',
      options: [
        { label: 'Dead space', is_correct: false, explanation: 'Possible but not specific to vent-rate effect.' },
        { label: 'Auto-PEEP — the higher rate compressed expiratory time, more trapping, less effective alveolar ventilation', is_correct: true, explanation: 'The rule for obstruction: when PaCO2 climbs as you raise the rate, suspect dynamic hyperinflation — the alveolar minute ventilation actually fell.' },
        { label: 'Hypoventilation', is_correct: false, explanation: 'Opposite — you raised MVe.' },
        { label: 'Sensor error', is_correct: false, explanation: 'Diagnosis of exclusion.' },
      ],
    },
    {
      id: 'M6-Q4',
      prompt: 'In a hypotensive vented COPD patient with measured auto-PEEP of 14 cmH2O, the most important *first* action is:',
      options: [
        { label: 'Norepinephrine', is_correct: false, explanation: 'Treats the BP, not the cause.' },
        { label: 'Disconnect from the vent, let the patient exhale for 10–15 seconds, then resume with a slower rate', is_correct: true, explanation: 'Trapped air compresses venous return.' },
        { label: 'Lower the PEEP setting from 5 to 0', is_correct: false, explanation: "Wrong-ish. Modest applied PEEP doesn't drive the trapping in COPD; the rate does. Disconnect first." },
        { label: 'Increase FiO2 to 1.0', is_correct: false, explanation: "Doesn't address mechanics." },
      ],
    },
    {
      id: 'M6-Q5',
      prompt: 'Of the four levers to relieve dynamic hyperinflation, the most effective is:',
      options: [
        { label: 'Higher PEEP', is_correct: false, explanation: 'Counterintuitive — not the most effective, and harmful in asthma.' },
        { label: 'Lower rate', is_correct: true, explanation: 'Longer Te is the dominant fix.' },
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
      { name: 'PEEP · 0–18', description: 'only helps in COPD when auto-PEEP is causing ineffective triggering; in asthma it just worsens trapping. Lower the rate first.' },
    ],
    readouts_description: [
      { name: 'Auto-PEEP, Total PEEP', description: 'the auto-PEEP readout is what the tracker watches.' },
      { name: 'Flow waveform (end-expiration)', description: 'does it return to zero before the next breath?' },
    ],
    suggestions: [
      "Push rate to 28. Watch auto-PEEP climb. The flow waveform won't return to zero.",
      'Now drop rate to 10. Auto-PEEP falls. Te is now ~5 seconds — plenty of time to exhale.',
      'Try shortening I-time from 1.0 to 0.5 instead of lowering rate. The I:E changes but the auto-PEEP relief is smaller. Rate is the bigger lever.',
      "Raise PEEP from 5 to 12 (don't change rate) and watch total PEEP just stack higher. Adding extrinsic PEEP only helps the narrow case of auto-PEEP-driven ineffective triggering — it is not a routine fix for trapping. Lowering the rate is.",
    ],
  },

  user_facing_task:
    "Trap him, then untrap him. This 60-year-old man with COPD is being ventilated. Step 1: raise the respiratory rate to 26+ and watch the trapping build — the expiratory flow stops returning to zero and the auto-PEEP readout climbs. Step 2: bring the rate down to 12 or below to give each breath time to exhale, and watch auto-PEEP fall back toward zero.",
  success_criteria_display: [
    'Raise the respiratory rate to ≥ 26 — watch auto-PEEP climb and the expiratory flow stop returning to zero.',
    'Lower the respiratory rate to ≤ 12 — watch auto-PEEP fall as expiratory time lengthens.',
  ],
  task_framing_style: 'B',

  key_points: [
    'Auto-PEEP = end-expiratory alveolar pressure > set PEEP. Measure with an expiratory hold.',
    "Flow-waveform sign: expiratory flow doesn't return to zero before next breath.",
    'Rate is the strongest lever — lower it. I-time is the second lever — shorten it.',
    'In asthma, applied PEEP worsens trapping. In COPD, lower the rate first; add extrinsic PEEP only when auto-PEEP is causing ineffective triggering.',
    "Severe auto-PEEP + hypotension → disconnect from the vent. Don't waste time on pressors first.",
  ],
};
