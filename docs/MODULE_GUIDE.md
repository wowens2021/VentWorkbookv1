# The Ventilator Workbook — Master Planning Document

A plain-English working reference for every module in the workbook. Built so you can scan it, pick where to work, and (if you wanted) replicate any module from scratch. Every section spells out the learning objectives, the simulator setup, what the learner is being asked to do, what counts as success, the hint ladder, and the assessment.

---

## Part 1 — How the workbook is put together

### The five phases of a module

Every module walks the learner through the same five phases. The shell is generic; the content varies per module. Knowing the phase model makes replication straightforward — author the content per phase and the shell handles the flow.

1. **Briefing splash** (one-time, not counted in the 5).
   A full-page intro the first time the learner enters the module. Shows the module title, the track, the estimated minutes, a 2–3 sentence overview, a numbered "what you'll do" list, and a "Begin module →" button. Acknowledged once and remembered so it doesn't repeat on resume.

2. **Phase 1 — Primer.** Three multiple-choice questions answered *before* the reading. Calibrates where the learner is starting. Each question has a correct option plus three distractors, every option has its own explanation. Counts for 30 points of the score.

3. **Phase 2 — Read.** A short prose section that explains the core idea. The simulator on the left is fully live during this phase, so the learner can poke it while reading. The reading contains three kinds of content blocks:
   - **prose** paragraphs (with bold and inline-code formatting),
   - **callouts** (info / tip / warning tones with a colored panel),
   - **predict_observe** blocks — interactive prompts that wait for a specific control change before revealing the "observe" half.
   At the end of the reading, the learner clicks "I'm ready" to advance. If the module has a **check-yourself** question, the read ends with a quick MCQ standalone page before the simulator phase.

4. **Phase 3 — Explore.** Free play. An "explore card" lists which controls are unlocked, which readouts to watch, and suggested experiments. The simulator is fully live; the tracker is *not* yet wired. The point is to build intuition before the task starts.

5. **Phase 4 — Try it.** The graded task. The user-facing task card displays a clinical framing plus a list of success criteria. Behind the scenes, the **hidden objective tracker** watches the simulator events. Trackers come in four shapes:
   - **manipulation** — fires when a specific control is moved enough in a specific direction.
   - **outcome** — fires when one or more readouts hold a condition for N consecutive breaths.
   - **recognition** — a multiple-choice or click-the-reading prompt the learner must answer.
   - **compound** — a sequence (strict order or any-order) of child trackers, optionally with the sim resetting between children.
   When the tracker fires `satisfied`, the task card flips to a green "Continue to debrief" affordance. A three-tier hint ladder surfaces help if the learner gets stuck (tier 1 around 25 s idle or 5 changes with no progress, tier 2 around 75 s or 10 changes, tier 3 with a "Show me" button at 150 s / 15 changes).

6. **Phase 5 — Debrief.** Five-question summative quiz (50 points), then a celebration screen with the score breakdown, a track progress strip, an "Up next" recommendation, the key points, and a one-click "Review your answers" page that shows every primer / check-yourself / quiz question with the learner's choice plus the correct answer.

### The six tracks

Modules are grouped by track. Color identity carries through the briefing chip, the top nav strip, the current phase-badge dot, and the Continue button on the debrief.

| Track | Color | Difficulty bucket | Modules | What it teaches |
|---|---|---|---|---|
| Foundations | Olive | Beginner | M1, M2, M3 | What ventilators are for; the vocabulary of the display; the equation of motion. |
| Physiology | Indigo | Beginner | M4, M5, M6 | Compliance vs resistance; shunt vs dead space; auto-PEEP and air trapping. |
| Modes | Sky | Intermediate | M7, M8, M9, M10, M11, M12 | Volume control, pressure control, dual-control, pressure support, dyssynchrony, hybrid modes. |
| Strategy | Amber | Advanced | M13, M14, M15, M16 | PEEP titration, oxygenation levers, lung-protective ARDS recipe, obstructive disease recipe. |
| Weaning | Rose | Advanced | M17, M18 | Spontaneous breathing trials and the RSBI; extubation decision-making. |
| Synthesis | Violet | Advanced | M19 | Bedside DOPE troubleshooting (Displacement / Obstruction / Pneumothorax / Equipment). |

### Scoring model

Each module is scored 0–100 (the raw total can reach 105 before display capping — that buffer is intentional so a strong learner can absorb a small hint/reset penalty without losing their A grade).

- **Primer** — 30 points (proportional to correct / total).
- **Knowledge check** — 50 points (proportional to correct / total).
- **Hint usage bonus** — up to 10 (10 if no hints engaged, 5 if one tier dismissed, 0 otherwise).
- **Reset usage bonus** — up to 10 (10 if no resets, 5 if one, 0 otherwise).
- **Check-yourself bonus** — up to 5 (proportional, only counts if module has formative blocks).

Grade thresholds: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F below.

### What a module config file actually contains

Every module is one TypeScript object with these fields:
- `id` (e.g. `'M1'`), `number`, `title`, `track`, `estimated_minutes`.
- `briefing`: `tagline` (~50 char one-liner shown in the top nav), `overview` (2–4 sentences), `what_youll_do` (3 short bullets).
- `visible_learning_objectives`: 2–3 bullets shown on the read page.
- `primer_questions`: array of exactly 3 quiz questions.
- `scenario`: the starting state of the simulator — `preset` (mode + settings + patient state), `unlocked_controls` (which knobs the learner can move), `visible_readouts`, `visible_waveforms`.
- `hidden_objective`: the tracker definition (the graded part of the task).
- `content_blocks`: the read-phase content.
- `hint_ladder`: three tiers of help text, tier 3 optionally with a "Show me" demonstration.
- `summative_quiz`: 5 MCQs.
- `key_points`: 4–5 plain bullets shown at the end.
- `explore_card`: explore phase content — patient context, control descriptions, readout descriptions, suggestions.
- `user_facing_task`: clinical framing shown on the try-it task card (different from the tracker definition).
- `success_criteria_display`: bullets shown to the learner during try-it.
- `task_framing_style`: A (direct / name the controls), B (clinical / name the targets), C (recognition / interrogative).

That's everything. Anything not in the config is handled by the shell.

---

## Part 2 — Module-by-module

Each module section below uses the same structure:

> **Tagline** — the one-liner shown in the top nav.
> **Why this module exists** — the briefing overview, lightly rewritten for prose.
> **What the learner walks away with** — the visible learning objectives.
> **Primer (before the read)** — the three calibration MCQs and what each one tests.
> **The reading** — the key content blocks and any predict-observe nudges.
> **Check yourself** (if present) — the standalone MCQ between read and explore.
> **Simulator setup** — starting mode, settings, what's unlocked, what readouts/waveforms are visible.
> **The task** — plain-English description of what the learner must actually *do* to satisfy the hidden tracker.
> **Success criteria (user-facing)** — what the task card shows.
> **Hint ladder** — tier 1 / tier 2 / tier 3 hint texts and any demonstration.
> **Knowledge check (after the task)** — the five summative quiz questions and correct answers.
> **Key points** — the takeaway bullets.

---

### Track 1 — Foundations

The first three modules. Every learner starts here. The track teaches them to *read* a ventilator before changing one.

---

#### M1 — Why We Ventilate
*Foundations · Beginner · 12 min*

**Tagline** — *Name the deficit before you change a setting.*

**Why this module exists.** People get put on ventilators for four reasons, and only four. Failure to oxygenate. Failure to ventilate. Failure to protect the airway. Excessive work of breathing. Everything you'll do later (the modes, the dials, the troubleshooting) gets easier if you can name which of these problems you're solving for the patient in front of you. Before you can change a ventilator, you have to read one.

**What the learner walks away with**
- Recognize the four primary indications for mechanical ventilation.
- Read the basic values from a ventilator display.

**Primer (before the read)**
1. *Unconscious overdose patient breathing adequately with normal gas. Why intubate?* — **Airway protection** (the deficit is airway, not lungs).
2. *Which gas finding most strongly suggests failure of ventilation?* — **PaCO2 75 with pH 7.18** (rising CO2 with acidosis = ventilatory failure; low PaO2 = oxygenation failure).
3. *On the display, "450" next to "Vt" most likely represents:* — **Tidal volume in mL.**

**The reading.** Four-indication framework, plus a tip that every display value answers one of three questions (was it set, was it measured, or was it calculated). Walks the learner around the screen pointing out peak pressure, tidal volume, PEEP, and set rate.

**Check yourself.** *PIP 24, Pplat 18, PEEP 5. What is the peak-plateau gap?* — **6 cmH2O** (foreshadows M4's resistance vs compliance framework).

**Simulator setup.** Stable passive patient on VCV, tidal volume 450, rate 12, PEEP 5, FiO2 40, compliance 70, resistance 10. Display-only — nothing is unlocked. Readouts: PIP, Pplat, Vte, PEEP, FiO2, actual rate. Waveforms: pressure-time + flow-time.

**The task.** A four-step compound tracker, *strict order*. For each step, the question banner asks the learner to click a specific reading or control on the simulator itself (no MCQ modal). The four steps:
1. **Click the PIP reading.** Wrong tiles (Vte, total PEEP, VE) each show their own explanation.
2. **Click the Vte reading.** Wrong tiles: VE, PIP, Pplat.
3. **Click the PEEP control** (the knob, not the readout — emphasizes set vs measured).
4. **Click the Rate control** (set, not actual).

**Success criteria.** Click the peak pressure reading, the tidal volume reading, the PEEP control, the set rate control.

**Hint ladder.** Tier 1: "Look at the Measured Values strip — peak pressure is the highest point on the airway pressure trace." Tier 2: "The strip shows PIP, Pplat, Vte, RR. Each label maps to a specific reading." Tier 3: Show me (highlights the correct tile).

**Knowledge check**
1. *Asthma exacerbation with PaCO2 68, pH 7.22, alert.* — **Failure of ventilation.**
2. *Correctly paired indication:* — **GCS 6 from TBI → airway protection.**
3. *Vt 480, MV 7.2, set 14, measured 15.* — **Patient taking one extra breath above set.**
4. *Highest absolute number on a typical adult display:* — **Peak pressure.**
5. *Intubated for oxygenation failure from pneumonia. First physiologic target:* — **FiO2 and PEEP.**

**Key points**
- The four indications: oxygenation, ventilation, airway protection, work of breathing.
- Match the indication to the deficit — don't intubate "to be safe."
- Four core readings: peak, plateau, tidal volume, PEEP.
- Set values are operator inputs; measured values are results.

---

#### M2 — Vocabulary and the Vent Display
*Foundations · Beginner · 12 min*

**Tagline** — *Read any vent display in under a minute.*

**Why this module exists.** Every ventilator says the same things in slightly different ways. Vt, Pplat, PEEP, MV, RR. Once you know what each label means and where it lives on the screen, you can walk up to any ventilator and orient yourself in under a minute. The other thing worth knowing right now: every value on the display is either something you set, or something the patient and machine are doing as a result. Confusing the two is one of the most common bedside mistakes.

**What the learner walks away with**
- Match ventilator terminology to display elements.
- Distinguish set values from measured values.

**Primer**
1. *Difference between set rate and measured rate?* — **Set is operator input; measured is what the patient is actually doing.**
2. *Plateau pressure is best understood as:* — **The pressure during a brief inspiratory hold, reflecting alveolar pressure.**
3. *Minute ventilation is calculated as:* — **RR × Vt.**

**The reading.** Set vs measured framing. A callout: a gap between set and delivered Vt usually means a leak; a gap between set and measured rate usually means patient effort. Then a list of eight core terms (Vt, VE, PEEP, FiO2, PIP, Pplat, I:E, RR — both set and measured).

**Simulator setup.** Same passive patient as M1, VCV, rate 14 (slightly different from M1 to make set-vs-measured concrete). Display-only. Readouts now include MV and I:E. Three waveforms visible.

**The task.** Eight vocabulary recognitions, *any order*. Each is an MCQ asking "which reading shows X" with four options. Two attempts each before the answer reveals. Terms covered: Vt, VE, PEEP, FiO2, PIP, Pplat, I:E, set RR.

**Success criteria.** Correctly match each term to its display element. Two attempts per term.

**Hint ladder.** Tier 1: Look at the strip. Tier 2: Vte is per-breath; VE is per-minute. Tier 3: Show me.

**Knowledge check**
1. *Pplat 22 with inspiratory hold button:* — **Pressure during end-inspiratory pause, reflecting alveolar pressure.**
2. *Set Vt 450, delivered 380, same rate:* — **Leak in circuit.**
3. *Vt 500 × RR 14:* — **MV ≈ 7 L/min.**
4. *Set rate 12, measured 22:* — **Patient taking many spontaneous breaths.**
5. *Which set-vs-measured pair is abnormal:* — **Set Vt 500, delivered 320.**

**Key points**
- Eight terms cold: Vt, VE, PEEP, FiO2, PIP, Pplat, I:E, RR.
- Set = operator input. Measured = consequence.
- Gap in Vt = leak. Gap in rate = patient drive.
- Pplat is alveolar pressure during a hold.

---

#### M3 — The Equation of Motion
*Foundations · Beginner · 18 min*

**Tagline** — *P = V/C + R·flow + PEEP. The spine of every breath.*

**Why this module exists.** The equation of motion is the one piece of physiology that ties everything together. Pressure equals (volume divided by compliance) plus (flow times resistance) plus PEEP. That's it. Stretching the lungs costs pressure. Pushing gas through airways costs pressure. PEEP is the baseline. If you understand which term is doing the work in any given breath, you can predict what every ventilator change will do before you make it.

**What the learner walks away with**
- State the equation of motion.
- Predict which waveform component changes when compliance, resistance, or flow rate changes.

**Primer**
1. *The three components of the equation:* — **Elastic component, resistive component, PEEP.**
2. *Passive VC patient develops bronchospasm. Peak vs plateau?* — **Peak rises; plateau unchanged.**
3. *Raise inspiratory flow rate in VC, everything else same. Peak?* — **Rises (resistive component scales with flow).**

**The reading.** Spells out the equation. Two predict-observe blocks driven by the live simulator:
- *About to decrease compliance — predict peak, plateau, gap.* Auto-reveals when compliance changes.
- *About to increase resistance — predict peak, plateau, gap.* Auto-reveals when resistance changes.

**Simulator setup.** Passive patient, VCV, compliance 50 (mid-range), resistance 10. Three controls unlocked: **compliance, resistance, I-time**. Readouts: peak, plateau, driving pressure. Two waveforms.

**The task.** Compound, *any order, sim resets between children*. Three manipulation children, each with an acknowledgment MCQ after:
1. **Increase resistance by ≥ 50%.** "What happened to the peak-plateau gap?" — *Widened.*
2. **Decrease compliance by ≥ 30%.** "What happened to peak and plateau?" — *Both rose together.*
3. **Decrease I-time by ≥ 30%** (= raise flow). "What happened to peak?" — *Rose, because resistive component scales with flow.*

**Success criteria.** Change resistance, identify gap effect. Change compliance, identify peak/plateau effect. Change I-time, identify peak effect. Any order. Reset between.

**Hint ladder.** Tier 1: Try one of the three controls. Tier 2: Adjust compliance and resistance separately; watch the gap. Tier 3: Show me (cuts compliance to 30).

**Knowledge check**
1. *Write the equation:* — **P = (V/C) + (F × R) + PEEP.**
2. *Raise Vt 50% in VC. Peak and gap?* — **Peak rises; gap unchanged.**
3. *Bronchospasm: peak 24 → 38. Plateau?* — **Small rise from 18 to 20 (resistance pattern).**
4. *C = 50, R = 10, Vt 500, flow 60 L/min, PEEP 5. Peak ≈:* — **25 cmH2O** (elastic 10 + resistive 10 + PEEP 5).
5. *Clinical value of the equation:* — **It tells you which waveform component will change.**

**Key points**
- P = (V/C) + (F × R) + PEEP.
- Elastic = volume/compliance → drives plateau.
- Resistive = flow × resistance → drives the peak-plateau gap.
- Pure compliance change: peak and plateau rise together (gap unchanged).
- Pure resistance change: peak rises, plateau unchanged (gap widens).

---

### Track 2 — Physiology

Three modules. Applies the equation of motion to specific bedside problems.

---

#### M4 — Compliance and Resistance
*Physiology · Beginner · 15 min*

**Tagline** — *Peak-plateau gap separates airway from lung.*

**Why this module exists.** This is the bedside skill the rest of the book builds on. When peak pressure rises, you have to know whether the lungs got stiffer or the airways got narrower, and the ventilator already tells you. The gap between peak and plateau is the answer. Small gap means the problem is in the lung itself. Big gap means the problem is in the airway. That single observation drives most of what you do for sudden pressure changes.

**What the learner walks away with**
- Distinguish compliance problems from resistance problems on the pressure waveform.
- Use the peak-plateau gap as a diagnostic tool.

**Primer**
1. *Peak 35→50, plateau 20→22 (gap widening).* — **Increased airway resistance.**
2. *Compliance is defined as:* — **ΔV / ΔP.**
3. *Two patients both peak 45. A: plateau 40. B: plateau 22.* — **A has a compliance problem; B has a resistance problem.**

**The reading.** Plateau is the most useful single number. Compliance = Vt / (Pplat − PEEP). Healthy 50–100 mL/cmH2O; ARDS pushes below 30. A small ASCII figure shows the two canonical patterns side-by-side.

**Simulator setup.** Passive VCV patient, compliance 50 (intentionally mid-range to make changes obvious). Two controls unlocked: **compliance, resistance**. Readouts: peak, plateau, driving pressure. Two waveforms.

**The task.** Compound, *strict order, reset between*. Two manipulation children each with an acknowledgment:
1. **Decrease compliance by ≥ 30%.** "What happened to the gap?" — *Unchanged.*
2. **Increase resistance by ≥ 50%.** "What happened to the gap?" — *Widened.*

**Success criteria.** Reduce compliance ≥ 30%, identify gap effect. Then raise resistance ≥ 50%, identify gap effect. Sim resets between.

**Hint ladder.** Tier 1: Adjust one of the two controls. Tier 2: Drop compliance ≥ 30% then trigger inspiratory hold. Tier 3: Show me (compliance to 30).

**Knowledge check**
1. *A: peak 28, plateau 26. B: peak 38, plateau 18.* — **A compliance; B resistance.**
2. *Peak 28→45, plateau 22→38 (parallel).* — **Developing pneumothorax.**
3. *To assess compliance you need:* — **Plateau, PEEP, tidal volume.**
4. *C = 25 mL/cmH2O, Vt 400, PEEP 5. Plateau ≈:* — **21.**
5. *PC: Vt 480 at Pinsp 18. Compliance halves. New Vt ≈:* — **240.**

**Key points**
- Peak rises with both compliance and resistance problems.
- Plateau rises only with compliance changes.
- Widening peak-plateau gap = resistance.
- Parallel rise = compliance.
- Compliance = Vt / (Pplat − PEEP).

---

#### M5 — Gas Exchange Basics
*Physiology · Beginner · 15 min*

**Tagline** — *Shunt kills oxygenation. Dead space kills ventilation.*

**Why this module exists.** Hypoxia and hypercapnia look different to the lung. Shunt is blood flowing past alveoli that aren't getting any air. It kills oxygenation and doesn't respond well to cranking up the FiO2. Dead space is air flowing into alveoli that aren't getting any blood. It kills CO2 clearance and is what's happening when the end-tidal drops out of nowhere. Knowing which one you're dealing with changes what you do.

**What the learner walks away with**
- Distinguish shunt from dead space by their characteristic gas-exchange signatures.
- Recognize that shunt affects oxygenation primarily; dead space affects ventilation primarily.

**Primer**
1. *Shunt is best defined as:* — **Alveoli that are perfused but not ventilated.**
2. *FiO2 100% substantially improves oxygenation in:* — **V/Q mismatch (not pure shunt).**
3. *Large PE → ETCO2 will:* — **Fall abruptly because of increased dead space.**

**The reading.** Shunt = perfusion without ventilation; dead space = ventilation without perfusion. Information callout: the ETCO2-PaCO2 gradient is normally < 5 mmHg; a widening gradient is the dead-space signature.

**Simulator setup.** ARDS-like patient (compliance 35, dead-space fraction 0.45), VCV. Three controls unlocked: **compliance** (used as a proxy for shunt severity), **FiO2**, **PEEP**. Readouts: peak, plateau, SpO2, PaO2, PaCO2.

**The task.** Compound, *strict, reset between*. Two manipulation children:
1. **Decrease compliance by ≥ 40%** (worsen shunt-like state). Acknowledgment: SpO2 fell — that's the oxygenation signature of shunt.
2. **Push FiO2 to ≥ 80%.** Acknowledgment: SpO2 improved substantially — V/Q mismatch is FiO2-responsive.

**Success criteria.** Push FiO2 ≥ 80%; identify whether V/Q mismatch or pure shunt.

**Hint ladder.** Tier 1: Try changing FiO2. Tier 2: V/Q mismatch responds; shunt doesn't. Tier 3: Show me.

**Knowledge check**
1. *Severe ARDS, PaO2 55 on FiO2 100%:* — **Shunt.**
2. *Suspect PE, most supportive finding:* — **Falling ETCO2 with rising arterial CO2.**
3. *FiO2-responsive:* — **V/Q mismatch from basilar atelectasis.**
4. *Dead space is a problem of:* — **Ventilation.**
5. *SpO2 89% → 98% on FiO2 0.4:* — **V/Q mismatch.**

**Key points**
- Shunt → oxygenation problem (FiO2-resistant in pure form).
- Dead space → ventilation problem (ETCO2 falls, PaCO2 rises).
- Widening ETCO2-PaCO2 gradient is the dead-space signature.
- V/Q mismatch is FiO2-responsive; pure shunt is not.

---

#### M6 — Auto-PEEP and Air Trapping
*Physiology · Beginner · 15 min*

**Tagline** — *See trapping on the flow waveform. Slow down to fix it.*

**Why this module exists.** The lungs need time to empty. If you don't give them enough, gas piles up inside, and the next breath stacks on top of the leftovers. That trapped pressure is auto-PEEP, and it causes more problems than people realize. Higher work of breathing. Worse hemodynamics. Mysterious hypotension after every rate increase. The fix is almost always the same: slow down and give exhalation more room.

**What the learner walks away with**
- Recognize auto-PEEP on the flow-time waveform.
- Resolve auto-PEEP by adjusting respiratory rate or expiratory time.

**Primer**
1. *Auto-PEEP refers to:* — **End-expiratory alveolar pressure exceeding set PEEP from incomplete exhalation.**
2. *Highest risk patient:* — **COPD on VC with rate 24.**
3. *Hallmark on flow-time waveform:* — **Expiratory flow does not return to zero before the next breath.**

**The reading.** Dynamic hyperinflation explained. Warning callout: severe auto-PEEP causes hypotension; in extremis, disconnect the patient from the vent to let lungs deflate. Predict-observe block on raising the rate (auto-reveals when rate changes).

**Simulator setup.** Obstructive baseline (resistance 25, compliance 50), VCV. Two controls unlocked: **respiratoryRate, iTime**. Readouts: peak, plateau, total PEEP, auto-PEEP. Two waveforms.

**The task.** Two-stage outcome, *strict order*:
1. **Induce trapping** — push auto-PEEP above 2 cmH2O, hold for 3 breaths.
2. **Resolve trapping** — bring auto-PEEP below 1 cmH2O, hold for 5 breaths.

**Success criteria.** First, get the patient into a trapping pattern (auto-PEEP > 2). Then bring them back to normal (auto-PEEP < 1, sustained).

**Hint ladder.** Tier 1: Try increasing the rate; watch the flow waveform. Tier 2: When you see flow not returning to zero, resolve it by lowering rate or shortening I-time. Tier 3: Show me (rate to 25).

**Knowledge check**
1. *Most reliable way to confirm auto-PEEP:* — **Flow-time: expiratory flow not returning to zero.**
2. *COPD on VC, auto-PEEP at rate 24. Most direct intervention:* — **Reduce respiratory rate.**
3. *Auto-PEEP hemodynamically dangerous because:* — **Increased intrathoracic pressure reducing venous return.**
4. *Least likely to develop auto-PEEP:* — **ARDS on lung-protective VC with high rate.**
5. *Asthma + auto-PEEP → sudden hypotension. First emergency maneuver:* — **Disconnect briefly from vent to allow full exhalation.**

**Key points**
- Auto-PEEP = trapped end-expiratory pressure from incomplete exhalation.
- Flow waveform diagnostic: expiratory flow does not reach zero before next breath.
- Primary levers: lower rate, extend expiratory time.
- Obstructive patients are highest risk.
- Severe auto-PEEP → hypotension → disconnect to relieve.

---

### Track 3 — Modes

Six modules covering the major modes plus dyssynchrony recognition. Built sequentially: VC → PC → dual-control → spontaneous → dyssynchrony → hybrid.

---

#### M7 — Volume Control
*Modes · Intermediate · 12 min*

**Tagline** — *Volume is fixed. Pressure is the message about the patient.*

**Why this module exists.** Volume control is the mode you set when you want to know exactly what the patient is getting per breath. You pick the tidal volume, you pick the flow, the machine delivers it no matter what. The trade-off is that pressure becomes the dependent variable. If the lungs get stiffer or the airways narrower, the pressure will climb to make the volume happen anyway. That's a feature, not a bug, but it's why high-pressure alarms in VC need a real look.

**What the learner walks away with**
- Identify the characteristic VC waveform pattern.
- Predict how Vt and inspiratory flow changes affect the pressure waveform.

**Primer**
1. *Dependent variable in VC:* — **Pressure.**
2. *Pressure-time waveform in VC:* — **Ramped (rising), peaking at end-inspiration.**
3. *High peak pressure alarm in VC, first response:* — **Check patient, tubing, review peak-plateau gap.**

**The reading.** VC = volume guaranteed, pressure is the price. Flow is square (constant); pressure ramps. Tip: higher flow → shorter I-time → higher peak (resistive component scales with flow).

**Simulator setup.** Passive patient, VCV, Vt 400. Unlocked: **tidalVolume, iTime**. Readouts: peak, plateau, Vte. Three waveforms.

**The task.** Compound, *strict, reset between*:
1. **Set Vt to 580–620 mL.** Acknowledgment: "What changed?" — *Peak rose; flow shape unchanged (still square).*
2. **Shorten I-time by ≥ 30%.** Acknowledgment: "What happened?" — *Inspiratory time shortened and peak rose.*

**Success criteria.** Set Vt to ~600 mL, answer. Then shorten I-time substantially, answer. Reset between.

**Hint ladder.** Tier 1: Adjust Vt; watch pressure. Tier 2: Set Vt to 600, then shorten I-time. Tier 3: Show me (Vt to 600).

**Knowledge check**
1. *VC flow-time:* — **Constant square.**
2. *Vt 500, flow 60 → Ti 0.5 s. Flow 90 →:* — **Ti 0.33 s.**
3. *High peak alarm, plateau unchanged:* — **Suction, check tube, assess bronchospasm.**
4. *Increase Vt 400→600, flow/rate constant:* — **Raise peak and Ti.**
5. *Main clinical drawback of VC:* — **Pressure can rise dangerously high when mechanics worsen.**

**Key points**
- VC: volume guaranteed; pressure dependent.
- Square flow, ramped pressure.
- Higher Vt → higher peak (more elastic). Higher flow → higher peak (more resistive).
- High peak alarm → investigate using M4's framework.

---

#### M8 — Pressure Control
*Modes · Intermediate · 12 min*

**Tagline** — *Pressure is fixed. Volume is what gives way.*

**Why this module exists.** Pressure control flips the relationship. You pick the pressure, the machine holds it, and tidal volume is whatever the lungs accept at that pressure. This is gentler on stiff or heterogeneous lungs because you can't accidentally over-inflate them. The price is that volume drifts when mechanics change, so you have to watch the delivered tidal volume the same way you'd watch peak pressure in VC.

**What the learner walks away with**
- Identify the characteristic PC waveform pattern.
- Recognize that in PC, tidal volume is the dependent variable.

**Primer**
1. *PC at Pinsp 18 → Vt 500. Compliance worsens. Delivered Vt:* — **Decreases.**
2. *PC flow-time waveform:* — **Decelerating; tapering as lungs fill.**
3. *PC preferable when:* — **You want to limit peak alveolar pressures in heterogeneous lungs.**

**The reading.** PC is the inverse of VC. Warning callout: PC has no rising-pressure alarm when mechanics worsen — watch the delivered Vt. Small ASCII figure shows the PC fingerprint (square pressure, decelerating flow, variable volume).

**Simulator setup.** Passive patient, PCV, Pinsp 15. Unlocked: **pInsp, compliance** (compliance unlocked specifically so the learner can simulate worsening lungs and see what PC does in response). Readouts: peak, Vte, MV. Three waveforms.

**The task.** Compound, *strict, reset between*:
1. **Raise Pinsp by ≥ 30%.** Acknowledgment: *Vt increased.*
2. **Decrease compliance by ≥ 30%.** Acknowledgment: *Pressure unchanged, volume dropped.*

**Success criteria.** Raise Pinsp ≥ 30% and identify volume effect. Then reduce compliance ≥ 30% and identify pressure-vs-volume effect. Reset between.

**Hint ladder.** Tier 1: Adjust Pinsp, watch Vt. Tier 2: After Pinsp, drop compliance — compare to M4. Tier 3: Show me (Pinsp to 22).

**Knowledge check**
1. *PC flow-time:* — **Decelerating high initial flow, tapering.**
2. *PC: Pinsp 16, PEEP 5, Vt 480. Compliance halves. New Vt ≈:* — **240.**
3. *Switch from VC (Vt 500, peak 32, plateau 26) to PC. PEEP 5. Pinsp ≈:* — **21** (match driving pressure).
4. *Clinical advantage of PC over VC:* — **Pressure limited by design.**
5. *Increase Ti from 1.0 to 1.5 s in PC:* — **Modest Vt increase + raises mean airway pressure.**

**Key points**
- PC: pressure guaranteed; volume dependent.
- Square pressure, decelerating flow.
- Inverse of VC for the same compliance change.
- Silent failure: delivered Vt drops without alarm when mechanics worsen.

---

#### M9 — PRVC and Dual-Control Modes
*Modes · Intermediate · 12 min*

**Tagline** — *Volume target. Pressure-limited. Mind the failure modes.*

**Why this module exists.** PRVC tries to give you the predictability of volume control with the safety of pressure control. You set a volume target, the vent picks the pressure to hit it, and adjusts breath by breath when mechanics shift. It works well in stable, passive patients. It has known failure modes in patients who are working hard or who are awake and asynchronous, because the algorithm sees their effort as the machine doing its job and quietly reduces support.

**What the learner walks away with**
- Recognize PRVC's breath-by-breath pressure adjustment behavior.
- Understand when dual-control modes are useful and how they can fail.

**Primer**
1. *PRVC is best described as:* — **Volume fixed, pressure varies breath-to-breath to hit volume target.**
2. *PRVC patient bucks against vent. Over next breaths, PRVC likely:* — **Decreases pressure because delivered volume looked adequate.**
3. *PRVC advantage over VC:* — **Pressure-limited delivery that adapts when mechanics change.**

**The reading.** Dual-control logic. Warning callout: PRVC's well-known failure mode — a patient pulling hard contributes volume → PRVC reduces support → patient works harder.

**Simulator setup.** Passive PRVC patient, target Vt 450. Only **compliance** unlocked. Readouts: peak, plateau, Vte, driving pressure. Three waveforms.

**The task.** Compound, *strict order*. Three children:
1. **Decrease compliance by ≥ 40%.**
2. **Wait** — PIP must reach ≥ 20 sustained for 4 breaths (this is the algorithm adapting on its own).
3. **Recognition MCQ**: "What did the ventilator do?" — *Increased delivered pressure to maintain volume target.*

**Success criteria.** Reduce compliance ≥ 40%. Wait several breaths and watch the pressure trend. Identify what the vent did.

**Hint ladder.** Tier 1: Lower compliance, then watch PIP over next 4–5 breaths. Tier 2: Don't change anything else; watch PIP rise as the algorithm adapts. Tier 3: Show me (compliance to 25).

**Knowledge check**
1. *PRVC differs from PC in that PRVC:* — **Adjusts its pressure breath-by-breath to hit a volume target.**
2. *PRVC target Vt 450. Compliance worsens. Over 4–5 breaths:* — **Pressure rises step-by-step; Vt converges back to 450.**
3. *Most clinically dangerous PRVC failure mode:* — **Strong patient effort → algorithm reduces support.**
4. *PRVC most useful in:* — **Fluctuating compliance with consistent volume needs.**
5. *PRVC pressure trend displays:* — **Delivered pressure breath-by-breath.**

**Key points**
- PRVC: volume target, pressure variable; adapts breath-to-breath.
- Adjustment happens over several breaths, not instantly.
- Failure mode: patient effort confuses the algorithm.

---

#### M10 — Pressure Support and Spontaneous Modes
*Modes · Intermediate · 14 min*

**Tagline** — *Patient triggers every breath. PS does the rest.*

**Why this module exists.** When the patient is breathing for themselves, pressure support is the simplest way to help. The patient triggers each breath. The vent adds a little (or a lot) of pressure during inspiration to take some of the work. There are two knobs that matter: how much support per breath, and how easy it is for the patient to trigger one. Most of what people call "patient comfort on the vent" lives in these two settings.

**What the learner walks away with**
- Adjust pressure support and observe the effect on tidal volume.
- Adjust trigger sensitivity and observe the effect on patient-initiated breaths.

**Primer**
1. *In PSV, what initiates each breath?* — **The patient's inspiratory effort.**
2. *Increase PS from 10 to 15. Immediate effect:* — **Vt per breath increases.**
3. *Trigger sensitivity set too insensitive:* — **Missed efforts — patient tries, vent doesn't deliver.**

**The reading.** PSV is a partnership. Three knobs: PS level, trigger sensitivity, cycle-off %. Tip: trigger too sensitive → auto-triggering; too insensitive → ineffective triggering.

**Simulator setup.** Spontaneously breathing patient on PSV, PS 10, patient rate 18. Unlocked: **psLevel, endInspiratoryPercent** (the cycle-off threshold). Readouts: peak, Vte, actual rate. Two waveforms.

**The task.** Compound, *strict, reset between*:
1. **Set PS to 14–16.** Acknowledgment: *Vt rose.*
2. **Change the End-Insp % control (any direction).** Acknowledgment: *Changes when each breath ends — matches breath duration to patient.*

**Success criteria.** Set PS to ~15, identify effect on Vt. Then change End-Insp %, identify effect. Reset between.

**Hint ladder.** Tier 1: Raise PS, watch Vt. Tier 2: After PS, adjust End-Insp %. Tier 3: Show me (PS to 15).

**Knowledge check**
1. *In PSV, every breath:* — **Initiated by patient, supported by vent.**
2. *Raise PS from 8 to 12. Likely:* — **Vt rises; rate may fall.**
3. *PSV trigger at -3 cmH2O. Visible efforts, few breaths:* — **Ineffective triggering.**
4. *PSV cycle-off based on:* — **Decline in inspiratory flow to a % of peak.**
5. *COPD on PSV cycle-off 25% exhaling against vent at end-breath:* — **Raise cycle-off to 40%.**

**Key points**
- PSV: patient triggers, vent supports, flow-cycled termination.
- Three knobs: PS level, trigger sensitivity, cycle-off %.
- Higher PS → more Vt → slower rate.
- Trigger too sensitive: auto-triggering. Too insensitive: ineffective triggering.
- Cycle-off too high: premature cycling (COPD). Too low: delayed cycling.

---

#### M11 — Dyssynchrony Recognition
*Modes · Intermediate · 18 min*

**Tagline** — *Five waveform patterns. Five fixes that aren't sedation.*

**Why this module exists.** Patient-ventilator dyssynchrony is the bedside skill that separates clinicians who fiddle with sedation from clinicians who fix the problem. There are five common patterns, and each one looks different on the waveform. Once you can spot them, you can start matching the ventilator to the patient instead of the other way around. The patient will tell you what they want. You just have to read the screen.

**What the learner walks away with**
- Recognize the five common patterns of patient-ventilator dyssynchrony.
- Identify the waveform features that distinguish each pattern.

**Primer**
1. *Patient-ventilator dyssynchrony refers to:* — **Mismatch between what the patient wants and what the vent delivers.**
2. *In "ineffective triggering":* — **Patient tries to trigger, vent doesn't deliver.**
3. *Flow starvation occurs when:* — **Patient's demand exceeds vent's flow.**

**The reading.** The five canonical dyssynchronies. ASCII figure showing all five waveform signatures side-by-side. Tip: trigger problems (ineffective, auto, double) vs cycle problems (premature, delayed).

**Simulator setup.** Reference patient on PSV (normal pattern). Nothing unlocked — pure recognition module. Readouts: peak, Vte, actual rate. Two waveforms.

**The task.** Compound, *strict order*. Five recognition MCQs, each describing the waveform pattern verbally:
1. *Small negative pressure deflections during expiration without delivered breaths.* — **Ineffective triggering.**
2. *Two stacked breaths from a single prolonged patient effort.* — **Double-triggering.**
3. *VC with low inspiratory flow, scooped pressure during inspiration, patient working visibly.* — **Flow starvation.**
4. *PSV cycle-off at 50%, breaths ending before patient is done inhaling.* — **Premature cycling.**
5. *COPD on PSV cycle-off 10%, exhaling against vent at end-inspiration.* — **Delayed cycling.**

Wrong answers no longer block (per the recent fix) — picking any option and clicking Continue advances the tracker.

**Success criteria.** Correctly identify each of the five patterns (two attempts each; missed ones come back at the end). Then identify all five again in a randomized final round on the first attempt.

**Hint ladder.** Tier 1: Read each pattern description carefully. Tier 2: Each pattern has a trigger-side or cycle-side problem; categorize first. Tier 3: Show me.

**Knowledge check**
1. *PSV repeated small negative deflections, no delivered breath:* — **Ineffective triggering.**
2. *VC fixed flow 40 lpm, scooped pressure, patient working hard. Best adjustment:* — **Increase inspiratory flow rate.**
3. *PSV cycling off too early. Best adjustment:* — **Lower cycle-off from 25% to 10%.**
4. *Double-triggering most commonly caused by:* — **Patient inspiratory effort outlasting vent's Ti.**
5. *COPD on PSV cycle-off 25%, exhaling against vent at end-inspiration:* — **Delayed cycling.**

**Key points**
- Five named dyssynchronies: ineffective triggering, double-triggering, flow starvation, premature cycling, delayed cycling.
- Trigger problems vs cycle problems — two timing dimensions.
- Each has a distinct waveform signature.
- Mitigation is targeted to the specific mismatch.

---

#### M12 — SIMV and Hybrid Modes
*Modes · Intermediate · 12 min*

**Tagline** — *A hybrid mode worth knowing — not reaching for first.*

**Why this module exists.** SIMV is a hybrid mode. Some breaths are guaranteed by the vent at a set rate and volume. Between those, the patient can take their own breaths, supported by PSV. It was designed as a weaning mode and was widely used for decades. Modern evidence has shifted away from it for that purpose. It's worth understanding because you'll still see it in the wild, and because the breath-mix concept underlies the way newer hybrid modes work.

**What the learner walks away with**
- Distinguish mandatory from spontaneous breaths in a SIMV waveform.
- Predict the effect of changing the SIMV mandatory rate on the breath mix.

**Primer**
1. *SIMV delivers:* — **Mandatory at set rate plus spontaneous between.**
2. *The "synchronized" in SIMV:* — **Vent syncs mandatory breaths with patient effort.**
3. *Reduce SIMV mandatory rate 12 → 6:* — **Patient takes more spontaneous breaths to maintain MV.**

**The reading.** SIMV mixes mandatory + spontaneous breaths. Warning callout: contraindicated in paralyzed patients (no patient drive to fill in).

**Simulator setup.** SIMV/PS mode, mandatory rate 12, PS 8, patient spontaneous rate 18. Only **respiratoryRate** unlocked. Readouts: actual rate, Vte, MV. Two waveforms.

**The task.** Single manipulation: **reduce the mandatory rate to 3–6 breaths/min**. Acknowledgment: *Fewer mandatory, more spontaneous (patient takes over).*

**Success criteria.** Reduce mandatory rate to ~4–6. Identify how breath mix changed.

**Hint ladder.** Tier 1: Try lowering the mandatory rate. Tier 2: Patient spontaneous rate is 18 — lower mandatory means more from the patient. Tier 3: Show me (rate to 4).

**Knowledge check**
1. *Mandatory 8, measured 18. Spontaneous rate:* — **10.**
2. *SIMV mandatory 4, MV 4.5, PaCO2 58:* — **Mandatory rate too low for patient's capacity.**
3. *SIMV waveform: one square fixed-peak breath then several variable lower-peak:* — **The square one is mandatory (PC-style).**
4. *SIMV poor choice in:* — **Neuromuscularly paralyzed patient.**
5. *As a weaning strategy, modern consensus is SIMV is:* — **Generally less effective than PSV-only or daily SBT.**

**Key points**
- SIMV mixes mandatory + spontaneous breaths.
- "Synchronized" = timing alignment with patient effort.
- Reducing mandatory rate shifts work to the patient.
- Contraindicated in paralyzed patients.
- No longer the standard weaning strategy.

---

### Track 4 — Strategy

Four modules covering the strategic decisions — PEEP titration, oxygenation levers, and the two disease-specific recipes (ARDS, obstructive).

---

#### M13 — PEEP: What It Does and How to Set It
*Strategy · Advanced · 16 min*

**Tagline** — *Titrate to peak compliance. The lungs tell you.*

**Why this module exists.** PEEP keeps alveoli open at the end of exhalation. That's how it improves oxygenation: more alveoli stay available for gas exchange. But PEEP isn't free. Too much overdistends healthy lung and impedes venous return, dropping cardiac output. The "right" PEEP for any patient sits somewhere in the middle, and the way to find it is to titrate and watch what compliance does. The lungs themselves will tell you where they're happiest.

**What the learner walks away with**
- Perform a stepwise PEEP titration and identify the PEEP at which compliance peaks.
- Distinguish appropriate from inappropriate uses of PEEP.

**Primer**
1. *PEEP primarily helps oxygenation by:* — **Keeping alveoli open at end-expiration that would otherwise collapse.**
2. *Too much PEEP can:* — **Cause overdistension and impair venous return.**
3. *A decremental PEEP trial is a method for:* — **Finding the PEEP at which lung compliance is highest.**

**The reading.** Decremental titration explained. Tip: driving pressure = Pplat − PEEP; > 15 in ARDS is associated with worse outcomes (foreshadows M15). Predict-observe block on walking PEEP 5 → 11 → 17 (auto-reveals when PEEP changes).

**Simulator setup.** ARDS-style patient (compliance 25). Only **PEEP** unlocked. Readouts: peak, plateau, driving pressure, SpO2, PaO2.

**The task.** Compound, *strict*. Three children:
1. **Raise PEEP to ≥ 8** (sustained 2 breaths).
2. **Raise PEEP to ≥ 12** (sustained 2 breaths) — the staircase forces a stepwise approach.
3. **Recognition MCQ**: "Which PEEP would you call 'best'?" — *The PEEP where compliance was highest (driving pressure lowest).*

**Success criteria.** Sample compliance at several PEEP values. Identify which PEEP produced the highest compliance (lowest driving pressure).

**Hint ladder.** Tier 1: Walk PEEP up in steps; wait several breaths between adjustments. Tier 2: Try 5, 8, 11, 14; lowest driving pressure marks the best compliance. Tier 3: Show me (PEEP to 12).

**Knowledge check**
1. *PEEP 5 → C 24, 8 → 28, 11 → 33, 14 → 30, 17 → 26. Best PEEP:* — **11.**
2. *ARDS on PEEP 14, sudden hypotension after PEEP increase from 10:* — **PEEP-induced reduction in venous return.**
3. *PEEP provides LEAST benefit in:* — **Pure shunt from intracardiac defect.**
4. *Severe COPD with hyperinflation, extrinsic PEEP can:* — **Match intrinsic PEEP and improve trigger work.**
5. *Driving pressure is:* — **Plateau − PEEP.**

**Key points**
- PEEP recruits collapsed alveoli.
- Decremental titration finds the compliance peak.
- Too much PEEP overdistends and impairs hemodynamics.
- Anatomic shunt is not PEEP-responsive.
- Driving pressure = Pplat − PEEP. < 15 in ARDS.

---

#### M14 — Oxygenation Strategies
*Strategy · Advanced · 14 min*

**Tagline** — *Mean airway pressure is the oxygenation lever.*

**Why this module exists.** The number that drives oxygenation is mean airway pressure. Not peak. Not plateau. Mean. Every move you make to oxygenate someone, whether it's raising PEEP, lengthening inspiratory time, or adding pressure support, is really a move to raise mean airway pressure. Once you see oxygenation through that lens, the ventilator stops feeling like a collection of separate knobs and starts looking like a single integrated control surface.

**What the learner walks away with**
- Recognize that mean airway pressure is the primary determinant of oxygenation.
- Identify the multiple levers (FiO2, PEEP, inspiratory time) that affect oxygenation.

**Primer**
1. *Oxygenation correlates most strongly with:* — **Mean airway pressure.**
2. *Raises mean Paw without raising peak:* — **Increasing Ti at same pressure target.**
3. *FiO2 and PEEP titrated together because:* — **Both contribute; balancing avoids prolonged toxic FiO2.**

**The reading.** Four oxygenation levers. Information callout: when FiO2 > 0.60, next step is PEEP — not pushing FiO2 to 1.0 (oxidative injury).

**Simulator setup.** Passive PC patient. Unlocked: **iTime, PEEP, FiO2**. Readouts: peak, SpO2, PaO2.

**The task.** Single manipulation: **lengthen Ti by ≥ 50%**. Acknowledgment: *Peak unchanged, mean rose.*

**Success criteria.** Increase Ti ≥ 50% from starting value. Identify what happened to peak and mean.

**Hint ladder.** Tier 1: Try changing Ti, watch the PIP value. Tier 2: Ti controls how long each breath holds its pressure — longer raises time-averaged pressure. Tier 3: Show me (Ti to 1.6).

**Knowledge check**
1. *Improve oxygenation on PC without raising peak:* — **Increase Ti.**
2. *FiO2 0.90, PEEP 8, SpO2 88%. Next step:* — **Increase PEEP before further FiO2.**
3. *Mean airway pressure depends on all EXCEPT:* — **FiO2** (it's gas composition, not pressure profile).
4. *ARDS improving: FiO2 0.5, PEEP 12, SpO2 96%. Next step:* — **Reduce FiO2 toward 0.4** (wean toxic exposure first).
5. *Very long Ti (inverse I:E) main risk:* — **Insufficient expiratory time → auto-PEEP.**

**Key points**
- Mean airway pressure drives oxygenation.
- Levers: FiO2, PEEP, Ti, peak pressure target.
- FiO2 is independent of pressure profile (no effect on mean Paw).
- Wean FiO2 before PEEP; avoid prolonged FiO2 > 0.60.
- Inverse I:E risks auto-PEEP.

---

#### M15 — ARDS-Specific Ventilation
*Strategy · Advanced · 16 min*

**Tagline** — *6 mL/kg PBW. Plateau ≤ 30. Driving pressure ≤ 15.*

**Why this module exists.** ARDS killed a lot of people before we figured out that the ventilator was part of the problem. Big tidal volumes and high pressures, applied to already-injured lungs, cause more injury. Lung-protective ventilation reverses that. Small tidal volumes by predicted body weight. Plateau pressures kept under 30. Driving pressures kept under 15. Permissive hypercapnia when CO2 rises. The numbers are simple. The discipline of holding to them, breath after breath, is what saves the patient.

**What the learner walks away with**
- Achieve a lung-protective state (Vt ≤ 6 mL/kg, plateau ≤ 30, driving pressure ≤ 15).
- Recognize trade-offs between lung-protective settings and CO2 clearance.

**Primer**
1. *In ARDSnet, low Vt was defined as:* — **6 mL/kg ideal (predicted) body weight.**
2. *Plateau pressure target in ARDS:* — **< 30 cmH2O.**
3. *Allowing PaCO2 to rise to maintain low Vt is called:* — **Permissive hypercapnia.**

**The reading.** Lung-protective ventilation recipe spelled out. Tip: lower Vt first, raise rate to preserve MV. Predict-observe on the rate-volume trade-off (auto-reveals when rate changes).

**Simulator setup.** Severe ARDS, just intubated, intentionally **on bad settings** (Vt 560, rate 18) tuned so 70 kg PBW. Compliance 32 — picked precisely so that hitting Vt 6 mL/kg = 420 mL drops driving pressure into the ≤ 15 zone (DP = 420/32 ≈ 13). Unlocked: **tidalVolume, respiratoryRate**. Readouts: peak, plateau, driving pressure, Vte, MV.

**The task.** A single outcome tracker — all three readouts hold simultaneously for 5 breaths:
- Vte ≤ 430 mL (~6 mL/kg PBW for 70 kg).
- Plateau ≤ 30.
- Driving pressure ≤ 15.

**Success criteria.** Vt at or below 6 mL/kg PBW. Plateau ≤ 30. Driving pressure ≤ 15. Sustained for several breaths.

**Hint ladder.** Tier 1: Vt should be ≤ 6 mL/kg PBW — lower it. Tier 2: Lower Vt and raise rate to preserve MV. Tier 3: Show me (Vt to 420).

**Knowledge check**
1. *Patient 175 cm tall (PBW ~70 kg). Target Vt:* — **~420 mL.**
2. *After reducing Vt, plateau 32, DP 18:* — **Lower Vt further toward 5 mL/kg.**
3. *Permissive hypercapnia contraindicated in:* — **Elevated ICP.**
4. *Driving pressure conceptually:* — **Pressure required to deliver Vt across compliance.**
5. *Strongest evidence for prone positioning in ARDS:* — **Severe (P/F < 150 or < 100).**

**Key points**
- 6 mL/kg PBW starting Vt.
- Plateau ≤ 30. Driving pressure ≤ 15.
- Permissive hypercapnia is the trade-off.
- Severity-specific rescue: prone positioning, NMBA, ECMO.
- PBW from height, not weight.

---

#### M16 — Obstructive Disease Ventilation
*Strategy · Advanced · 14 min*

**Tagline** — *Slow the rate. Let the CO2 rise. Save the patient.*

**Why this module exists.** Severe asthma and COPD are the inverse of ARDS. The compliance is usually fine. The problem is getting air out. Every ventilator decision in obstructive disease is built around giving exhalation more time. Lower rates. Shorter inspiratory times. Smaller tidal volumes when needed. The CO2 will rise. You let it. Trying to keep the CO2 normal in these patients is what causes the deaths from breath-stacking and hemodynamic collapse.

**What the learner walks away with**
- Recognize and resolve auto-PEEP in an obstructive patient by adjusting rate and I:E.
- Understand the rationale for permissive hypercapnia in obstructive disease.

**Primer**
1. *Fundamental problem in severe asthma/COPD:* — **High airway resistance limiting expiratory flow.**
2. *To minimize auto-PEEP, most important strategy:* — **Allow adequate expiratory time (low rate, short Ti).**
3. *Permissive hypercapnia in obstructive disease because:* — **Aggressive ventilation worsens hyperinflation, risks barotrauma.**

**The reading.** Obstruction = resistance + long time constants. Warning callout: in persistent auto-PEEP, consider deep sedation ± paralysis to reduce patient drive.

**Simulator setup.** Severe asthma (resistance 28), intentionally **on bad settings** (rate 22, Ti 1.0). Unlocked: **respiratoryRate, iTime, tidalVolume**. Readouts: peak, plateau, auto-PEEP, total PEEP, MV.

**The task.** Single outcome: auto-PEEP < 2 cmH2O for 5 consecutive breaths.

**Success criteria.** Expiratory flow returns to zero between breaths. Auto-PEEP < 2. Hold for several breaths.

**Hint ladder.** Tier 1: Look at the flow waveform — is expiration completing? Tier 2: Lower the rate or extend expiratory time; possibly reduce Vt. Tier 3: Show me (rate to 12).

**Knowledge check**
1. *Severe asthma on VC, rate 24, I:E 1:2, auto-PEEP. Best first:* — **Lower rate to ~12.**
2. *Paralyzed asthma on VC: peak 60, plateau 25, trapping:* — **Predominant resistance.**
3. *Extrinsic PEEP 0 → 5 helps when:* — **Spontaneous with auto-PEEP, ineffective triggering.**
4. *Permissive hypercapnia generally acceptable up to:* — **PaCO2 60–80, pH 7.20–7.25.**
5. *Severe COPD, persistent auto-PEEP despite optimal settings:* — **Add sedation + NMBA to reduce drive.**

**Key points**
- Obstruction = resistance + long Te.
- Auto-PEEP is the hallmark complication.
- Low rate, long Te primary levers.
- Permissive hypercapnia expected.
- Sedation/paralysis is escalation for persistent auto-PEEP.

---

### Track 5 — Weaning

Two modules covering the daily judgment of when (and whether) to extubate.

---

#### M17 — Weaning Concepts
*Weaning · Advanced · 14 min*

**Tagline** — *SBT and RSBI — the daily question.*

**Why this module exists.** Getting people on the ventilator is the easy part. Getting them off requires a different set of judgments. Are they medically ready? Is the original reason for intubation resolving? Can they breathe with minimal support without falling apart? The bedside test for the last question is the spontaneous breathing trial, and the number that tells you whether to extubate or wait is the rapid shallow breathing index.

**What the learner walks away with**
- Switch a patient from full support to a spontaneous breathing trial and read the RSBI.
- Recognize the criteria for weaning readiness.

**Primer**
1. *RSBI is calculated as:* — **RR ÷ Vt(L).**
2. *RSBI < 105 generally predicts:* — **Good chance of successful extubation.**
3. *An SBT typically involves:* — **Minimal support (PSV 5–8 or CPAP) for 30–120 min.**

**The reading.** Weaning readiness is multifactorial. RSBI is one number. Tip: passed SBT is necessary but not sufficient — always ask if the original reason for intubation has resolved.

**Simulator setup.** Post-op weaning candidate (compliance 55, spontaneous rate 16), currently on VCV. Unlocked: **mode, psLevel**. Readouts: actual rate, Vte, **RSBI**, SpO2, MV. (RSBI is computed only when patient is breathing spontaneously.)

**The task.** Compound, *strict*. Four steps:
1. **Switch the mode to PSV.**
2. **Drop PS to ≤ 8** (this defines a standard SBT — minimal support).
3. **Wait** — RSBI must hold < 105 for 5 breaths.
4. **Recognition MCQ**: "RSBI stabilized below 105 — what does this predict?" — *Likely successful extubation.*

**Success criteria.** Switch to PSV with PS ≤ 8. Wait for RSBI to stabilize. Identify what the stabilized RSBI predicts.

**Hint ladder.** Tier 1: Switch mode to PSV, lower PS. Tier 2: On PSV with low support, watch RSBI; threshold is < 105. Tier 3: Show me.

**Knowledge check**
1. *SBT: RR 28, Vt 280 mL. RSBI ≈:* — **100** (borderline).
2. *NOT a standard weaning readiness criterion:* — **Daily CXR completely clear.**
3. *Passes SBT but weak cough + bad secretions:* — **Reconsider; high failure risk.**
4. *CPAP trial vs PSV-low support:* — **CPAP provides no inspiratory assistance, only PEEP.**
5. *Post-extubation stridor at 1 hour. First action:* — **Nebulized epinephrine + consider steroids.**

**Key points**
- RSBI < 105 favors weaning success.
- SBTs are 30–120 min on minimal support.
- Readiness is multifactorial: mental status, secretions, cough, hemodynamics.
- Passed SBT is necessary but not sufficient.

---

#### M18 — Extubation Criteria and Failure
*Weaning · Advanced · 14 min*

**Tagline** — *A passed SBT is necessary — not sufficient.*

**Why this module exists.** Extubating a patient who isn't ready is worse than waiting a day. Reintubation carries real mortality. So extubation is a decision, not a reflex when the numbers look good. The numbers are part of it. Cough strength is part of it. Mental status is part of it. The cuff leak test is part of it. And the most important question is the one protocols sometimes forget to ask: is the reason this patient got intubated actually fixed?

**What the learner walks away with**
- Integrate multiple data points into a single extubation decision.
- Recognize predictors of extubation failure.

**Primer**
1. *A cuff leak test assesses:* — **Risk of post-extubation upper airway obstruction.**
2. *Increases risk of extubation failure:* — **Inability to follow simple commands.**
3. *Patient passes SBT, team debating extubation. Most important question:* — **Is the underlying reason for intubation resolved?**

**The reading.** Extubation is multifactorial. Warning callout: reintubation carries significantly increased mortality. ASCII figure shows a nine-item readiness panel for the actual task patient.

**Simulator setup.** Day-6 patient with pneumonia improving, on PSV 6. Nothing unlocked — this is a decision-panel module, not a sim manipulation. Readouts: RSBI, actual rate, Vte, MV, SpO2.

**The task.** A single recognition MCQ presenting the full clinical picture:
*"RSBI 88, cuff leak 240 mL, weak cough, moderate secretions, follows commands, P/F 280, off pressors 24 h, pneumonia improving but not resolved, day 6. Best decision?"*
- ✗ Extubate now.
- ✓ **Delay extubation, address weak cough + secretions.**
- ✗ Continue full support indefinitely.
- ✗ Tracheostomy now.

**Success criteria.** Recognize the favorable and unfavorable factors. Recommend the appropriate next step.

**Hint ladder.** Tier 1: Read each panel item. Tier 2: Weak cough + moderate secretions are red flags. Tier 3: Show me.

**Knowledge check**
1. *Cuff leak < 110 mL most likely indicates:* — **Laryngeal edema or narrowing.**
2. *Reintubation after failed extubation:* — **Significantly increased mortality and longer ICU stay.**
3. *Most strongly predicts extubation success:* — **Strong cough, minimal secretions, alert, RSBI 70.**
4. *Protocol-driven daily SBT and readiness assessment:* — **Shorter ventilator days.**
5. *Failed 2 extubations, vent-dependent day 14:* — **Discussion of tracheostomy.**

**Key points**
- Extubation is multifactorial.
- RSBI, cuff leak, cough, secretions, mental status, hemodynamics all contribute.
- Reintubation is harmful — delaying a day is better than failing.
- Protocolized assessments shorten ventilator days.
- Tracheostomy enters the conversation for prolonged ventilation.

---

### Track 6 — Synthesis

One final module pulling everything together as a bedside rapid-response framework.

---

#### M19 — Troubleshooting the Vent (DOPE)
*Synthesis · Advanced · 18 min*

**Tagline** — *DOPE: Displacement, Obstruction, Pneumothorax, Equipment.*

**Why this module exists.** A ventilated patient who acutely deteriorates needs you to think fast and in a structured way. The mnemonic is DOPE. Displacement. Obstruction. Pneumothorax. Equipment. Four categories, each with a recognizable signature on the ventilator's alarms and waveforms. The classic first move, before any imaging or labs, is to disconnect the patient from the vent and hand-ventilate. The bag tells you in seconds whether the problem is in the patient or in the circuit.

**What the learner walks away with**
- Recognize and diagnose each of the four DOPE fault categories.
- Build a systematic mental model for rapid bedside troubleshooting.

**Primer**
1. *DOPE stands for:* — **Displacement, Obstruction, Pneumothorax, Equipment.**
2. *VC patient: peak 28 → 50; plateau 22 → 24:* — **Mucus plug or other airway obstruction** (wide gap = resistance).
3. *Sudden low-pressure / low-volume alarm. First action:* — **Trace the circuit from patient back to vent.**

**The reading.** DOPE framework. Tip: universal first step is disconnect and bag-ventilate — easy bagging with poor return suggests displacement; hard bagging suggests obstruction or pneumothorax. ASCII figure shows the four signatures side-by-side.

**Simulator setup.** Stable baseline patient on VCV (peak ~28, plateau ~22, gap small). Nothing unlocked — pure recognition module. Readouts: peak, plateau, Vte, MV. Three waveforms.

**The task.** Compound, *strict*. Four recognition MCQ scenarios:
1. *Sudden loss of returned Vt. Low pressure alarm. No ETCO2.* — **Displacement (esophageal intubation).**
2. *Peak rises 28 → 55. Plateau barely changes (24 → 26). High peak alarm.* — **Obstruction (mucus plug).**
3. *Peak 28 → 48, plateau 22 → 42. BP dropping.* — **Tension pneumothorax** (parallel rise = compliance pattern + hemodynamic collapse).
4. *Delivered Vt 450, returned Vt 200. Pressure waveform shows early drop.* — **Equipment leak.**

**Success criteria.** Correctly identify each DOPE pattern (two attempts each). Then identify all four again in a final round on the first attempt.

**Hint ladder.** Tier 1: Categorize each — peak-only (resistance/displacement/equipment) vs peak-and-plateau (compliance/pneumothorax). Tier 2: Use M4: parallel rise = compliance (pneumothorax); widening gap = resistance (obstruction); no ETCO2 = displacement; volume mismatch = equipment. Tier 3: Show me.

**Knowledge check**
1. *Peak 60, plateau 50, falling BP, diminished breath sounds right:* — **Tension pneumothorax.**
2. *Returned Vt consistently 200 mL less than delivered. Early pressure drop:* — **Circuit leak.**
3. *Patient fighting vent and biting tube:* — **Obstruction pattern.**
4. *Esophageal intubation on vent shows:* — **Normal pressures, low/absent ETCO2, low returned Vt.**
5. *Deteriorating ventilated patient. First step:* — **Disconnect from vent and bag-ventilate while assessing.**

**Key points**
- DOPE = Displacement, Obstruction, Pneumothorax, Equipment.
- Each has a distinct waveform/alarm signature.
- Bag-and-go-look is the universal first step.
- Capnography distinguishes esophageal intubation rapidly.
- The peak-plateau framework from M4 is the central bedside diagnostic move.

---

## Part 3 — How to pick what to work on

If you're using this as a workbench map, here are the natural angles.

### By difficulty / time

- **Quickest wins (12 min, Beginner)**: M1, M2, M7 — pure orientation. Good for confirming the shell still works after big refactors.
- **Mid-weight (12–16 min, Beginner–Intermediate)**: M4, M5, M6, M8, M9, M10, M12, M14, M16 — most of the curriculum lives here.
- **Long-form (16–18 min)**: M3 (foundational, three children), M11 (5-scenario recognition), M13 (PEEP titration), M15 (lung-protective recipe), M19 (DOPE synthesis).

### By tracker shape

- **Pure click-target recognition** (no sim manipulation): M1, M2, M11, M18, M19. Easiest to verify because the failure modes are isolated to the recognition flow.
- **Single manipulation + acknowledgment**: M12, M14.
- **Compound manipulation + acknowledgment, sim resets between**: M3, M4, M5, M7, M8, M10.
- **Outcome-based (sustained breath counts)**: M6 (auto-PEEP up then down), M15 (lung-protective triple), M16 (resolve auto-PEEP).
- **Mixed compound (manipulation + outcome + recognition)**: M9 (PRVC adaptation), M13 (PEEP staircase), M17 (SBT flow).

### By the simulator behavior under test

- **Compliance / resistance physics**: M3, M4, M8 (compliance response in PC).
- **Auto-PEEP detection and resolution**: M6, M16 (and tangentially M13's hyperinflation question).
- **PRVC adaptive algorithm**: M9 (the only place this is exercised — the PIP escalation step).
- **PEEP titration with driving-pressure tracking**: M13, M15.
- **Spontaneous-mode RSBI**: M17 (the only RSBI consumer).
- **DOPE pattern recognition**: M19.

### Modules where the simulator setup is most "tuned" (don't break the patient parameters)

- **M15** — compliance set to 32 specifically so Vt 6 mL/kg PBW = 420 mL → driving pressure 13. Any change to compliance changes whether the task is achievable.
- **M9** — relies on the PRVC adaptive PI logic in PlaygroundSim. Patient compliance changes drive the algorithm.
- **M6, M16** — the resistance values are chosen so the rate-change actually trips auto-PEEP above 2.

### Authoring patterns to copy when adding a 20th module

- For a **conceptual / vocabulary** module: clone M2 structure (any-order compound recognition + display-only scenario).
- For a **bedside skill** module: clone M4 structure (strict compound with two manipulation children + acknowledgment after each + sim resets between).
- For a **target-state** module: clone M15 structure (single outcome tracker watching multiple readouts together, sim deliberately starting on bad settings).
- For a **rapid-response synthesis** module: clone M19 structure (compound recognition with scenario descriptions + a final randomized round).

The shell does the rest. Every module you author gets the briefing splash, the phase animation, the check-yourself page (if you include a formative block), the warm/cold readout flash during try-it, the live progress chip on outcome trackers, the celebration debrief with track progress strip, and the detailed evaluations sub-page — for free.
