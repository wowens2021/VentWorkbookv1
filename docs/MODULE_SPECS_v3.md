# THE VENTILATOR WORKBOOK — MODULE SPECS v3

*Canonical content reference for every module. Companion to MASTER_SHELL_v3.md.*

> **Purpose.** MASTER_SHELL_v3 defines *how* the modules work. This document defines *what's in them*. Every primer question, every tracker threshold, every preset value, every line of microcopy is locked here. When the code LLM and this document disagree, **this document wins**.
>
> **Source of truth.** Every module is anchored to specific chapters of *The Ventilator Book* (Owens, 3rd ed., 2021). Page-like references to the book are noted as `[VB Ch. N]`. The voice and the maxims are Owens's, not the assistant's.
>
> **Pinning.** Several modules contain a "Pin list" — simulator parameters that must not be changed because the tracker math depends on the exact tuning. These are flagged with **DO NOT CHANGE**. If you find a strong reason to change them, you must also re-tune the tracker thresholds and document the change.

---

## How to read each spec

Every module has the same fourteen sections, in this order:

1. **Header** — id, title, track, archetype, estimated minutes, anchor chapters
2. **Learning objectives** — what the learner should be able to do at the end
3. **Book anchor** — the specific Owens chapters and maxims tested
4. **Patient preset** — exact starting state for the sim, with rationale per parameter
5. **Unlocked controls** — which controls the learner can move, and why
6. **Pin list** — parameters that must not change
7. **Hidden objective** — the full tracker tree, with thresholds and rationale
8. **User-facing task** — exact Task Card wording (Style A/B/C) and success criteria
9. **Primer (3 MCQs)** — all options, correctness, and per-option explanations
10. **Read phase content** — opening prose, callouts, predict-observe blocks, optional formative
11. **Explore card** — patient context, controls, readouts, suggestions
12. **Hint ladder** — three tiers
13. **Summative quiz (5 MCQs)** — all options, correctness, and per-option explanations
14. **Key points** — 4–6 bullets for the debrief

Word target per module: 700–900. Total document target: 14–17k words.

---

## Cross-cutting conventions

- **PBW default.** Unless otherwise specified, presets use a male patient, 70 inches tall → PBW ~73 kg, so a 6 mL/kg Vt is ~430 mL. Female 64 inches → PBW ~55 kg, so a 6 mL/kg Vt is ~325 mL.
- **Compliance scale.** Normal respiratory system compliance ~70–80 mL/cmH2O on the vent (book Ch. 3). The sim's `compliance` knob is the static respiratory-system compliance. Healthy preset = 50–60. ARDS preset = 28–35. Obstructive (asthma/COPD) preset = 60–80 (compliance is preserved; problem is resistance).
- **Resistance scale.** Normal endotracheal-circuit resistance ~5–10. Mucus plug / bronchospasm = 18–28. Severe asthma = 30+.
- **Driving pressure.** `drivingPressure = plat − totalPeep`. Lung-protective ceiling is 15 cmH2O (Amato 2015; book Ch. 8).
- **Voice.** Owens. Dry, direct, expert. No emoji. No "awesome." When something is a maxim, state it flatly: *"Plateau under 30 keeps the lungs safe."*

---

## Track 1 — Foundations

The Foundations track teaches three things and only three things: **why patients get a vent, how to read the display, and the single equation that explains everything else** (P = V/C + R·flow + PEEP). Modules in this track are deliberately short — 12 to 14 minutes. They earn their keep because the next 16 modules assume display literacy.

---

### M1 — Why We Ventilate

**Track:** Foundations · **Archetype:** vocabulary (click-target) · **Est. minutes:** 12 · **Anchor chapters:** [VB Ch. 1, Ch. 4, Ch. 7]

#### Learning objectives

By the end of M1, the learner can:
- Name the four bedside indications for mechanical ventilation (hypoxemia, hypercapnia with acidemia, jeopardized airway, shock).
- Distinguish *set* settings (the clinician's order) from *measured* readouts (what the patient is actually doing).
- Identify on the live display: PIP, Vte, set PEEP, and set rate.
- State that the ventilator does not cure — it supports.

#### Book anchor

Owens, Ch. 1 ("Initial Settings"): the four reasons a patient is on the vent. Ch. 3 Commandment III: "Thy mechanical ventilator is merely a means of SUPPORT and offers no curative properties in itself." Ch. 4 ("Acute Respiratory Failure"): Type I (PaO2 <60) and Type II (PaCO2 >50 with pH <7.30). Ch. 7 (capnography): set vs measured distinction in monitoring.

**Maxims tested:**
1. The four indications.
2. The vent supports; it does not cure.
3. PIP is measured (the patient generates it); set pressure is the order.
4. The display you see is information *about* the patient — read it.

#### Patient preset

```
mode: VCV
heightInches: 70
gender: male                  # PBW ~73 kg
tidalVolume: 450              # ~6 mL/kg PBW — lung-protective baseline
respiratoryRate: 14           # ARDSnet starter (book Ch. 1)
peep: 5                       # standard atelectasis prevention
fiO2: 0.40
iTime: 1.0
compliance: 55                # near-normal — this is NOT a sick patient
resistance: 10                # near-normal
spontaneousRate: 0            # passive — no patient effort
```

**Rationale.** Healthy-ish patient on safe defaults. The learner is here to read the display, not fix anything yet.

#### Unlocked controls

`tidalVolume`, `respiratoryRate`, `peep`, `fiO2`. **Why these:** they're the four settings on every ICU vent order. Locking compliance/resistance keeps the physiology unchanged so the readings stay readable. Locking I-time keeps the I:E ratio off the table (M3+ owns that).

#### Pin list

None. M1 doesn't depend on precise tuning — only on the patient being healthy enough that the display reads cleanly.

#### Hidden objective

```ts
{
  kind: 'compound',
  sequence: 'any_order',
  reset_between: false,
  children: [
    // Child 1 — find PIP
    {
      kind: 'recognition',
      prompt: {
        prompt_id: 'M1-pip',
        trigger: { kind: 'on_load' },
        question: 'Click the reading that shows peak airway pressure.',
        click_targets: [
          { element: { kind: 'readout', name: 'pip' }, label: 'PIP', is_correct: true,
            explanation: 'Right. PIP is the highest pressure during inspiration — the vent reports it every breath.' },
          { element: { kind: 'readout', name: 'plat' }, label: 'Pplat', is_correct: false,
            explanation: 'Pplat is alveolar pressure at end-inspiration — only visible during an inspiratory hold. It is not peak.' },
          { element: { kind: 'readout', name: 'vte' }, label: 'Vte', is_correct: false,
            explanation: 'Vte is the exhaled tidal volume, in mL. Not pressure.' },
          { element: { kind: 'readout', name: 'totalPeep' }, label: 'Total PEEP', is_correct: false,
            explanation: 'Total PEEP is end-expiratory pressure, the floor — not the ceiling.' },
        ],
      },
    },
    // Child 2 — find Vte
    {
      kind: 'recognition',
      prompt: {
        prompt_id: 'M1-vte',
        trigger: { kind: 'on_load' },
        question: 'Click the reading that shows what the patient actually exhaled this breath.',
        click_targets: [
          { element: { kind: 'readout', name: 'vte' }, label: 'Vte', is_correct: true,
            explanation: 'Vte = expired tidal volume. The order says "set Vt 450"; Vte tells you what came back out.' },
          { element: { kind: 'control', name: 'tidalVolume' }, label: 'Set Vt', is_correct: false,
            explanation: 'That is the *set* tidal volume — what you ordered. Vte is what the patient delivered.' },
          { element: { kind: 'readout', name: 'mve' }, label: 'MVe', is_correct: false,
            explanation: 'MVe is minute ventilation in L/min — Vte × rate. Not a single breath.' },
          { element: { kind: 'readout', name: 'actualRate' }, label: 'Actual rate', is_correct: false,
            explanation: 'Actual rate is breaths/min, not volume.' },
        ],
      },
    },
    // Child 3 — find set PEEP
    {
      kind: 'recognition',
      prompt: {
        prompt_id: 'M1-setpeep',
        trigger: { kind: 'on_load' },
        question: 'Click the control where you set the PEEP order.',
        click_targets: [
          { element: { kind: 'control', name: 'peep' }, label: 'PEEP (control)', is_correct: true,
            explanation: 'The PEEP knob is the order. The Total PEEP readout reports what the patient is actually generating, which can be higher if there is auto-PEEP.' },
          { element: { kind: 'readout', name: 'totalPeep' }, label: 'Total PEEP (readout)', is_correct: false,
            explanation: 'Total PEEP is the measurement, not the setting. You set the floor; the patient can add to it.' },
          { element: { kind: 'readout', name: 'autoPeep' }, label: 'Auto-PEEP', is_correct: false,
            explanation: 'Auto-PEEP is the difference between Total PEEP and your set PEEP. It is a problem to find, not a setting.' },
          { element: { kind: 'control', name: 'fiO2' }, label: 'FiO2', is_correct: false,
            explanation: 'FiO2 is oxygen, not pressure.' },
        ],
      },
    },
    // Child 4 — find set rate
    {
      kind: 'recognition',
      prompt: {
        prompt_id: 'M1-setrate',
        trigger: { kind: 'on_load' },
        question: 'Click the control where you set the respiratory rate.',
        click_targets: [
          { element: { kind: 'control', name: 'respiratoryRate' }, label: 'Rate (control)', is_correct: true,
            explanation: 'Set rate is the order — the floor. The patient can trigger above it in A/C; he cannot go below it.' },
          { element: { kind: 'readout', name: 'actualRate' }, label: 'Actual rate (readout)', is_correct: false,
            explanation: 'Actual rate is what the patient is doing — set + triggered. Not the setting.' },
          { element: { kind: 'readout', name: 'mve' }, label: 'MVe', is_correct: false,
            explanation: 'MVe is minute ventilation, not rate. Calculated as Vte × actual rate.' },
          { element: { kind: 'readout', name: 'ieRatio' }, label: 'I:E', is_correct: false,
            explanation: 'I:E is the ratio of inspiration to expiration time. Not the rate.' },
        ],
      },
    },
  ],
}
```

**Why any-order:** the four prompts are independent — there's no pedagogical reason to enforce an order. **Why click-target:** the entire learning objective *is* "read the display." MCQ with "A. PIP B. Pplat C. Vte D. PEEP" defeats the point.

#### User-facing task

**Style C — recognition.** Card text:

> *"Find four readings on this display."*
>
> Each prompt names a clinical concept. Click the reading or control that matches. Wrong clicks don't penalize you — they explain what you just clicked.

`success_criteria_display`:
- Find peak airway pressure
- Find this breath's exhaled tidal volume
- Find the PEEP order
- Find the rate order

#### Primer (3 questions)

**Q1.** *Why does a patient get put on a mechanical ventilator?*

- **A.** Because the ventilator cures pneumonia, ARDS, and most respiratory illness. — *Wrong.* The vent supports gas exchange while the patient (and the treatment) does the actual healing. Owens, Commandment III.
- **B.** Because the patient cannot meet the body's oxygenation, ventilation, or work-of-breathing demands without help. — **Correct.** Parrillo's definition of acute respiratory failure, restated in clinical terms (book Ch. 4).
- **C.** Because the blood gas is abnormal. — *Wrong.* A patient with a "bad" gas may not need a tube, and a patient with a "good" gas sometimes does. The history and exam come first.
- **D.** Because the patient has a respiratory rate above 24. — *Wrong.* Tachypnea is a sign, not an indication. Many patients are tachypneic and improving.

**Q2.** *Which of these is a measured value, not a set value?*

- **A.** Set rate. — *Wrong.* You ordered it. The patient may breathe over it; that's a different number.
- **B.** PEEP knob. — *Wrong.* That's the order — the floor of expiratory pressure.
- **C.** Peak inspiratory pressure (PIP). — **Correct.** PIP is what the system actually generates every breath. It depends on the patient's compliance, resistance, and the volume you ordered.
- **D.** FiO2. — *Wrong.* You set FiO2; the patient receives it.

**Q3.** *A medical student says, "The ventilator is treating his ARDS." What's the cleanest correction?*

- **A.** The vent reduces shunt and provides oxygen and rest. It doesn't reverse the disease — that's the antibiotic, the proning, the resolution of inflammation. — **Correct.** Owens, Commandment III: three benefits, none of them curative.
- **B.** The vent treats ARDS through PEEP and high tidal volumes. — *Wrong.* High Vt is harmful in ARDS; that's the whole point of ARMA.
- **C.** The vent has no benefit at all. — *Wrong.* The three real benefits are O2 delivery, shunt reduction, and taking over WoB.
- **D.** Once you're on a vent, you stay on a vent. — *Wrong.* Liberation is the goal of every vented patient (book Ch. 22).

#### Read phase content

1. **Prose** — *"There are exactly four reasons a patient gets a tube. Hypoxemia you can't fix with a mask. Hypercapnia that's dropping the pH. An airway you can't trust. A patient in shock who can't afford to spend 40% of his energy on breathing. Everything else — the agitation, the bad gas, the bad chest X-ray — is a sign, not a reason."*

2. **Callout (info)** — *"The vent is support, not cure. It buys time. The illness is treated by everything else you're doing — antibiotics, fluids, source control, time."*

3. **Predict-observe** — `awaits_control: tidalVolume`. *Predict:* if you raise the set tidal volume from 450 to 600, will the *PIP* go up or down, and how do you know it'll change at all? *Observe (auto-reveals on Vt change):* PIP rose because the system has to push more air through a finite compliance every breath. The Vte readout now reads ~600, too — that's how you check the order got delivered.

4. **Formative (check yourself)** — *"You see set PEEP = 5 and Total PEEP = 9 on the display. What does that tell you?"*
   - A. The vent is malfunctioning. (Wrong — the readings disagree on purpose.)
   - B. There is 4 cmH2O of auto-PEEP. The patient isn't fully exhaling. **Correct.** (Total − set = auto.)
   - C. The patient is over-sedated. (Wrong — opposite, if anything.)
   - D. PEEP needs to be lowered. (Wrong — might be true, but the *finding* is just the gap.)

#### Explore card

**Patient context.** 58-year-old man, intubated for pneumonia an hour ago. He's stable now: SpO2 96%, BP fine, no agitation. The vent is doing exactly what was ordered. Your job for the next two minutes is just to read the display.

**Unlocked controls.**
- **Tidal volume (set Vt) · 350–600 mL** — the volume of air you're ordering per breath. Lung-protective range is 6–8 mL/kg PBW.
- **Rate · 8–24 breaths/min** — the minimum rate. The patient can trigger above this.
- **PEEP · 0–18 cmH2O** — the end-expiratory floor.
- **FiO2 · 0.21–1.00** — fraction of inspired oxygen.

**Readouts to watch.**
- **PIP** — the peak pressure each breath. Rises with higher Vt, lower compliance, or higher resistance.
- **Vte** — exhaled volume, in mL. Should be close to your set Vt in volume modes.
- **Total PEEP** — what the patient is actually generating at end-expiration. Equals set PEEP unless auto-PEEP is present.

**Try these.**
- Set Vt up to 600. Watch PIP rise. Watch Vte rise to match.
- Drop FiO2 to 0.30. Nothing about the *display* changes — FiO2 is its own number. (That's the point.)
- Raise PEEP from 5 to 10. Watch PIP rise too — they're additive.
- Look at MVe (the minute ventilation readout). Compare it to (set Vt × set rate) ÷ 1000. They should match.

#### Hint ladder

- **Tier 1** — *"You're looking for four readings. Each one matches a clinical phrase. Try clicking what feels right — wrong clicks just explain."*
- **Tier 2** — *"Peak airway pressure is a measurement. Vte ends in 'e' for *exhaled*. The set knobs and the readouts live in different rows on the display."*
- **Tier 3** — `demonstration: { control: null, target_value: null }` — Show Me auto-fills each remaining correct answer with an explanation popup.

#### Summative (5 questions)

**Q1.** *Type I respiratory failure is defined as:*
- A. PaO2 <60 mm Hg. — **Correct.** (Book Ch. 4.)
- B. PaCO2 >50 with pH <7.30. — *Wrong.* That's Type II.
- C. SpO2 <88%. — *Wrong.* SpO2 is the bedside surrogate; the definition uses PaO2.
- D. Respiratory rate >30. — *Wrong.* Sign, not definition.

**Q2.** *Owens lists three therapeutic benefits a ventilator can provide. Which one is NOT on the list?*
- A. Guaranteed delivery of high levels of oxygen. — *Wrong.* It is on the list.
- B. Positive pressure to reduce intrapulmonary shunt. — *Wrong.* It is on the list.
- C. Providing the work of breathing until the patient can do it himself. — *Wrong.* It is on the list.
- D. Reversal of the underlying pulmonary disease. — **Correct.** The vent does none of this. It buys time.

**Q3.** *You see "set Vt: 450, Vte: 360" on a volume-control vent. The most useful first thought is:*
- A. There's a leak in the circuit — that's where 90 mL went. — **Correct.** In VCV the vent guarantees the inspiratory volume; if exhaled is short, the difference is leak (or a cuff problem or a bronchopleural fistula).
- B. The patient is improving. — *Wrong.* You can't conclude improvement from one breath's Vte gap.
- C. The compliance is getting better. — *Wrong.* That changes PIP, not Vte.
- D. The vent is broken. — *Wrong.* Equipment failure is a diagnosis of exclusion (book Ch. 7).

**Q4.** *A normal PaCO2-to-ETCO2 gradient is about:*
- A. 3–5 mm Hg. — **Correct.** (Book Ch. 7.) A widening gradient suggests dead space.
- B. 0 mm Hg. — *Wrong.* ETCO2 is always slightly below PaCO2 (mixing of alveolar with dead-space gas).
- C. 15 mm Hg. — *Wrong.* That's a wide gradient — pathologic in most cases.
- D. ETCO2 always exceeds PaCO2. — *Wrong.* It never does. *That's the rule.* (Book Ch. 7.)

**Q5.** *Which is the strongest argument for putting a hypotensive septic patient on the vent, even if his SpO2 is acceptable?*
- A. To improve the SpO2 to 100%. — *Wrong.* SpO2 is already fine; that's not the reason.
- B. To take over the work of breathing so he isn't spending 40% of his cardiac output on his diaphragm. — **Correct.** (Owens, Commandment VIII.)
- C. To prevent aspiration. — *Wrong.* Sometimes true, but the bigger reason here is energy balance.
- D. To allow administration of bronchodilators. — *Wrong.* Doesn't require intubation.

#### Key points

- Four indications: refractory hypoxemia, hypercapnia with acidosis, jeopardized airway, shock.
- The vent supports. It does not cure.
- Set values are orders. Measured values (PIP, Vte, Total PEEP) are what the patient is generating.
- The three real benefits are O2 delivery, shunt reduction, and taking over WoB.
- Read the display every time you change a setting. The numbers tell you whether the order got delivered.

---

### M2 — Vocabulary and the Vent Display

**Track:** Foundations · **Archetype:** vocabulary (click-target) · **Est. minutes:** 13 · **Anchor chapters:** [VB Ch. 1, Ch. 3, Ch. 7]

#### Learning objectives

By the end of M2, the learner can:
- Define eight bedside terms: Vt, MVe, PEEP, FiO2, PIP, Pplat, I:E, set rate.
- For each term, point to it on a live display.
- State which terms are set vs measured.
- Predict which readouts change when each control moves.

#### Book anchor

Owens, Ch. 1 (initial settings — every term used). Ch. 3 Commandment I (compliance and the relationship between Vt, pressure, and PEEP). Ch. 7 (interpreting the measured display).

**Maxims tested:**
1. Each term has exactly one operational meaning.
2. Vte ≠ set Vt unless the system is leak-free and the patient isn't fighting.
3. MVe = Vte × actual rate (not set rate).
4. Pplat is alveolar; PIP is "alveolar + flow resistance."
5. I:E is a ratio derived from rate and I-time, not a number you set directly on most vents.

#### Patient preset

Same as M1 — healthy, stable, on safe defaults. Vocabulary doesn't require sickness.

```
mode: VCV
heightInches: 70, gender: male
tidalVolume: 450, respiratoryRate: 14, peep: 5, fiO2: 0.40
iTime: 1.0, compliance: 55, resistance: 10, spontaneousRate: 0
```

#### Unlocked controls

`tidalVolume`, `respiratoryRate`, `peep`, `fiO2`, `iTime`. **Why these:** the five settings every bedside vent has. Unlocking iTime lets the learner see I:E change live (last term in the vocabulary).

#### Pin list

None.

#### Hidden objective

Eight click-target recognitions, any-order, no reset_between. Each prompt names the term clinically; the learner clicks the matching tile or control. Wrong clicks explain why; right clicks fire on Continue.

Prompts (abbreviated — same shape as M1):
1. `M2-vt` — *"Click the set tidal volume control."* (Correct: control `tidalVolume`.)
2. `M2-vte` — *"Click the exhaled tidal volume readout."* (Correct: readout `vte`.)
3. `M2-mve` — *"Click the minute ventilation readout — how much air this patient moves per minute."* (Correct: readout `mve`. Wrong-click explanation for Vte: "Vte is one breath; MVe is per minute.")
4. `M2-peep` — *"Click the PEEP control — the end-expiratory floor you're ordering."* (Correct: control `peep`. Wrong-click explanation for totalPeep: "Total PEEP is what's *measured* — it can be higher than set if auto-PEEP is present.")
5. `M2-fio2` — *"Click the FiO2 control."* (Correct: control `fiO2`.)
6. `M2-pip` — *"Click the peak airway pressure readout."* (Correct: readout `pip`.)
7. `M2-plat` — *"Click the alveolar (plateau) pressure readout."* (Correct: readout `plat`. Wrong-click explanation for PIP: "PIP includes airway resistance; Pplat is alveolar pressure with flow stopped.")
8. `M2-ie` — *"Click the I:E ratio readout."* (Correct: readout `ieRatio`. Wrong-click explanation for iTime control: "I-time sets it; I:E is the derived ratio.")

**Why all eight in one module:** these terms collectively define the rest of the curriculum. A learner who confuses Vt with Vte at M3 will be lost by M7.

#### User-facing task

**Style C — recognition.** Card text:

> *"Eight terms. Eight clicks. Click the reading or control that matches each clinical phrase."*

`success_criteria_display`:
- Find each term as it's named (8 prompts total)
- Wrong clicks explain — they don't penalize

#### Primer (3 questions)

**Q1.** *Compliance, in the simplest form, is:*
- A. Change in volume divided by change in pressure. — **Correct.** (Owens, Commandment I.) Normal RS compliance ~100 mL/cmH2O off the vent; 70–80 on it.
- B. Change in pressure divided by change in volume. — *Wrong.* That's elastance — the reciprocal.
- C. The same as airway resistance. — *Wrong.* Compliance is a property of the lung-and-chest-wall system; resistance is a property of the airways.
- D. A reading on the vent display labeled "C". — *Wrong.* Most vents don't display compliance directly. You compute it: Vt / (Pplat − PEEP).

**Q2.** *In VCV, Vte and set Vt should be nearly equal. If Vte is consistently 90 mL less than set Vt, the most common reason is:*
- A. A leak — cuff, circuit, or bronchopleural fistula. — **Correct.** Volume in ≠ volume out → something escaped.
- B. The patient's lungs absorbed it. — *Wrong.* Lungs don't absorb air; gas exchange is at the alveolar level and is a tiny fraction of Vt.
- C. PEEP is too low. — *Wrong.* PEEP doesn't change Vte directly in VCV.
- D. The flow trigger is too sensitive. — *Wrong.* Affects triggering, not delivered volume.

**Q3.** *I:E ratio of 1:2 on the display means:*
- A. Inspiration takes twice as long as expiration. — *Wrong.* That's 2:1 (inverse ratio).
- B. Expiration takes twice as long as inspiration. — **Correct.** Normal-ish for adults at rest. (Book Ch. 9.)
- C. The set rate is 1, and the actual is 2. — *Wrong.* I:E isn't about rate.
- D. There's two seconds for inspiration and one for expiration. — *Wrong.* That's the inverse ratio; obstructive patients will hate it.

#### Read phase content

1. **Prose** — *"Eight terms, and that's most of the bedside language. Four are set by you: Vt, rate, PEEP, FiO2. Three are measured: PIP, Vte, Pplat. One is derived: I:E. Confuse Vt with Vte, or PIP with Pplat, and the next 17 modules won't make sense."*

2. **Callout (info)** — *"Set values are orders. Measured values are reports. The vent doesn't decide; it executes. If the report doesn't match the order — leak, fight, or broken sensor."*

3. **Predict-observe** — `awaits_control: iTime`. *Predict:* if you shorten the I-time from 1.0 s to 0.6 s at a rate of 14, what happens to the I:E ratio readout? *Observe (auto-reveals):* I:E lengthens — from about 1:3 to about 1:6. Less time inhaling, more time exhaling per breath.

4. **Figure (ASCII)** — small side-by-side: a pressure waveform labeled with PIP and Pplat (showing the brief drop after the inspiratory hold). One sentence: *"PIP is the peak; Pplat is the alveolar reading you only see when flow stops."*

5. **Formative (check yourself)** — *"Which of these is **not** a derived value?"*
   - A. I:E. (Derived from rate and I-time.)
   - B. Compliance. (Derived from Vt, Pplat, PEEP.)
   - C. MVe. (Derived from Vte and actual rate.)
   - D. **Vte.** (Measured — what the flow sensor saw on exhalation.) **Correct.**

#### Explore card

**Patient context.** Same patient as M1 — stable, post-intubation hour 1. You're here to map your eight terms onto the live display.

**Unlocked controls.**
- **Tidal volume · 350–600 mL.**
- **Rate · 8–24 / min.**
- **PEEP · 0–18.**
- **FiO2 · 0.21–1.00.**
- **I-time · 0.5–1.5 s** — newly unlocked. Affects I:E ratio.

**Readouts to watch.** PIP, Pplat, Vte, MVe, Total PEEP, I:E ratio.

**Try these.**
- Raise Vt from 450 to 550. Watch PIP and Pplat both rise.
- Raise rate from 14 to 20. Watch MVe climb. The I:E ratio also tightens (less expiratory time per breath).
- Drop I-time from 1.0 to 0.6. Watch I:E lengthen. Imagine the patient with COPD breathing on this — better.
- Raise PEEP from 5 to 10. Watch PIP and Pplat both rise by ~5. Total PEEP follows.

#### Hint ladder

- **Tier 1** — *"Eight prompts, in any order. Wrong clicks just explain — don't worry about getting one wrong."*
- **Tier 2** — *"Set values live in the controls column (left side of the sim). Measured values live in the readouts strip (top of the sim)."*
- **Tier 3** — Show Me auto-fills each remaining prompt with its correct click and explanation.

#### Summative (5 questions)

**Q1.** *Static compliance of the respiratory system is calculated at the bedside as:*
- A. Vt ÷ (PIP − PEEP). — *Wrong.* That's *dynamic* compliance — uses PIP and includes resistance.
- B. Vt ÷ (Pplat − PEEP). — **Correct.** Uses Pplat — flow has stopped, so resistance is out of the equation.
- C. PIP × rate. — *Wrong.* Means nothing physiologically.
- D. Pplat × Vte. — *Wrong.* Wrong shape.

**Q2.** *Normal respiratory system compliance for a ventilated adult is around:*
- A. 25 mL/cmH2O. — *Wrong.* That's moderate-severe ARDS.
- B. 70–80 mL/cmH2O. — **Correct.** (Owens, Commandment I.) Healthy people off the vent are closer to 100.
- C. 200 mL/cmH2O. — *Wrong.* That's lung-alone or chest-wall-alone in normals — the two in parallel give ~100.
- D. There is no normal — it depends entirely on body weight. — *Wrong.* PBW matters, but the ballpark is well-known.

**Q3.** *Set rate vs actual rate. The vent shows set 14, actual 22. Most likely:*
- A. The vent is auto-cycling on a circuit leak. — *Possible* but less common as a first thought; the simpler reading is that the patient is triggering.
- B. The patient is triggering 8 breaths above the set rate. — **Correct.** In A/C, anything above the set rate is the patient.
- C. The vent is broken. — *Wrong.* Diagnosis of exclusion.
- D. The PEEP is too high. — *Wrong.* PEEP doesn't directly drive triggering rate.

**Q4.** *MVe is best understood as:*
- A. Set Vt × set rate. — *Wrong.* That's "set minute ventilation." MVe is the *measured* version.
- B. Vte × actual rate. — **Correct.** What the patient is actually moving per minute.
- C. PIP × rate. — *Wrong.* Pressure, not volume.
- D. Set Vt only. — *Wrong.* Per-breath, not per-minute.

**Q5.** *I:E ratio 1:5 on a patient with COPD means:*
- A. The expiratory time is very long — good for letting trapped air escape. — **Correct.** Long Te is the whole point of obstructive-disease ventilation (book Ch. 1, Ch. 15).
- B. The patient is hyperventilating. — *Wrong.* I:E ratio isn't about minute ventilation.
- C. The PEEP needs to be raised. — *Wrong.* Doesn't follow from the ratio.
- D. The inspiratory time is dangerously short. — *Wrong.* Short Ti is intentional here — gives exhalation room.

#### Key points

- Eight terms. Four set, three measured, one derived.
- Vte ≈ set Vt in VCV unless something is leaking.
- MVe = Vte × *actual* rate, not set rate.
- Pplat tells you about the alveoli; PIP tells you about the airways and the alveoli together.
- I:E shrinks when you raise rate; lengthens when you shorten I-time.

---

### M3 — The Equation of Motion

**Track:** Foundations · **Archetype:** concept demo (compound, reset_between, 3 manipulations) · **Est. minutes:** 15 · **Anchor chapters:** [VB Ch. 3 (Commandments I, V, VI), Ch. 8, Ch. 13]

#### Learning objectives

By the end of M3, the learner can:
- State the equation of motion in the bedside form: **P = V/C + R·flow + PEEP**.
- Predict the effect of each term in isolation: compliance ↓ → both PIP and Pplat rise together (gap unchanged). Resistance ↑ → PIP rises *more than* Pplat (gap widens). Flow ↑ (shorter Ti) → PIP rises, Pplat unchanged.
- Use the peak-plateau gap as the bedside test for "is this resistance or compliance?"

#### Book anchor

Owens, Ch. 3, Commandment I: compliance is ΔV/ΔP; dynamic vs static; a wide gap between them points to resistance. Ch. 8 (Safety Limits): the equation underlies every lung-protective decision — driving pressure = Pplat − PEEP, which removes the PEEP term from the equation. Ch. 13 (Trigger and Flow): the flow term — square vs decelerating, the difference between PIP and Pplat.

**Maxims tested:**
1. Three independent terms generate the airway pressure.
2. Pure compliance change → parallel rise.
3. Pure resistance change → gap widens (peak rises, plateau holds).
4. Pure flow change (shorter Ti, higher flow) → peak rises, plateau holds.
5. The peak-plateau gap is the bedside resistance signature.

#### Patient preset

```
mode: VCV
heightInches: 70, gender: male
tidalVolume: 500, respiratoryRate: 14, peep: 5, fiO2: 0.40
iTime: 1.0, compliance: 50, resistance: 10
spontaneousRate: 0
```

**Rationale.** Slightly higher Vt (500) than M1/M2 so that the baseline PIP/Pplat numbers are big enough to make changes obvious. Compliance 50 (mildly reduced), resistance 10 (normal) so the baseline gap is small.

#### Unlocked controls

`compliance`, `resistance`, `iTime`. The three terms of the equation, exactly. Mode, Vt, rate, PEEP, FiO2 are locked — we're isolating physiology, not titrating settings.

#### Pin list

- `tidalVolume: 500` — **DO NOT CHANGE.** A smaller Vt makes the parallel rise too subtle.
- `iTime: 1.0` (baseline) — the iTime *manipulation* is part of the task; the *baseline* must be 1.0 so the flow-term step has room to move.

#### Hidden objective

```ts
{
  kind: 'compound',
  sequence: 'any_order',
  reset_between: true,                   // each manipulation runs against the baseline
  children: [
    // Step 1 — compliance ↓ → parallel rise
    {
      kind: 'manipulation',
      control: 'compliance',
      condition: { type: 'delta_pct', direction: 'decrease', min_pct: 30 },
      require_acknowledgment: {
        question: 'You decreased compliance. What happened to the peak-to-plateau gap?',
        options: [
          { label: 'Unchanged — both PIP and Pplat rose by roughly the same amount', is_correct: true,
            explanation: 'Right. Compliance is in the V/C term — it raises *alveolar* pressure. Resistance didn\'t change, so the gap (which reflects resistance) didn\'t change.' },
          { label: 'Widened — PIP rose more than Pplat', is_correct: false,
            explanation: 'That\'s the resistance signature. Compliance changes affect both pressures equally.' },
          { label: 'Narrowed — Pplat rose more than PIP', is_correct: false,
            explanation: 'Physically impossible — Pplat is always ≤ PIP (since PIP = Pplat + resistance term).' },
        ],
      },
    },
    // Step 2 — resistance ↑ → gap widens
    {
      kind: 'manipulation',
      control: 'resistance',
      condition: { type: 'delta_pct', direction: 'increase', min_pct: 80 },
      require_acknowledgment: {
        question: 'You raised resistance. Which pressure moved more?',
        options: [
          { label: 'PIP rose more than Pplat — the gap widened', is_correct: true,
            explanation: 'Right. Resistance lives only in the R·flow term. That adds to PIP but disappears when flow stops, so Pplat barely moves.' },
          { label: 'Both rose equally', is_correct: false,
            explanation: 'That\'s what compliance does. Resistance is asymmetric.' },
          { label: 'Pplat rose more than PIP', is_correct: false,
            explanation: 'Cannot happen. Pplat is always ≤ PIP.' },
        ],
      },
    },
    // Step 3 — shorter Ti → higher flow → peak rises only
    {
      kind: 'manipulation',
      control: 'iTime',
      condition: { type: 'absolute', operator: '<=', value: 0.7 },
      require_acknowledgment: {
        question: 'You shortened I-time. Same Vt is now delivered faster (higher flow). What happens to PIP vs Pplat?',
        options: [
          { label: 'PIP rises; Pplat doesn\'t change much', is_correct: true,
            explanation: 'Right. Flow only shows up in the R·flow term. Squeeze the same volume through the same airways faster, and the airway resistance contribution is larger. Pplat is the alveolar pressure after flow stops — same Vt, same compliance → same Pplat.' },
          { label: 'Both rise', is_correct: false,
            explanation: 'Pplat depends on compliance and Vt, neither of which changed.' },
          { label: 'Both fall', is_correct: false,
            explanation: 'Faster flow raises peak pressure, not lowers it.' },
        ],
      },
    },
  ],
}
```

**Why any-order:** the three terms are independent. There's no physiological reason to do compliance before resistance.
**Why reset_between:** without it, step 2's baseline is step 1's endpoint, and "did the gap widen?" becomes ambiguous.
**Why `delta_pct: 80` for resistance:** baseline resistance 10; need ≥18 to make the gap obvious on the waveform (book Ch. 15: gap > 5 = resistance is elevated).
**Why `delta_pct: 30` for compliance:** baseline 50; need ≤35 to push Pplat up enough to be visibly distinct from the resistance pattern.
**Why `iTime ≤ 0.7`:** at baseline iTime 1.0 and rate 14, the flow is ~30 L/min. At iTime 0.7, flow rises to ~43 L/min — the peak-plateau gap should grow by ~3 cmH2O, visible on the readout.

#### User-facing task

**Style A — direct.** Card text:

> *"Make three changes to this patient — one to compliance, one to resistance, one to I-time. After each, you'll be asked what happened to the peak-plateau gap. The sim resets between changes so each is a clean experiment."*

`success_criteria_display`:
- Drop compliance by 30% — explain the effect on the gap
- Raise resistance by 80% — explain the effect on the gap
- Shorten I-time to ≤ 0.7 s — explain the effect on the gap

#### Primer (3 questions)

**Q1.** *The equation of motion in its bedside form is:*
- A. P = V/C + R·flow + PEEP. — **Correct.** The three independent contributions to airway pressure.
- B. P = V·C + R/flow + PEEP. — *Wrong.* Compliance is in the denominator; you'd never see this combination.
- C. PIP = Pplat = R·flow. — *Wrong.* PIP and Pplat are not the same except under zero flow.
- D. PIP = Pplat + PEEP. — *Wrong.* PIP − Pplat is the resistance contribution, not PEEP.

**Q2.** *You see PIP 38, Pplat 22, PEEP 5. The driving pressure is:*
- A. 16. — *Wrong.* That's PIP − Pplat — the resistance contribution, not the driving pressure.
- B. 17. — **Correct.** Driving pressure = Pplat − PEEP = 22 − 5. (Book Ch. 8.)
- C. 22. — *Wrong.* That's Pplat alone.
- D. 38. — *Wrong.* That's PIP alone.

**Q3.** *A high PIP with a normal Pplat tells you:*
- A. Compliance is low — the lungs are stiff. — *Wrong.* That raises both pressures together.
- B. Resistance is high — something in the airways is the problem. — **Correct.** (Book Ch. 2: kinked tube, mucus, bronchospasm.) Look upstream — kink, plug, spasm.
- C. PEEP is too high. — *Wrong.* PEEP raises both pressures.
- D. The vent is broken. — *Wrong.* You haven't ruled out the patient yet.

#### Read phase content

1. **Prose** — *"Three numbers shape every peak airway pressure on every ventilator in the world. Volume divided by compliance — what the alveoli demand. Resistance times flow — what the airways extract. PEEP — what you started above zero. The vent doesn't care which one moved. The peak-plateau gap is how you tell them apart."*

2. **Callout (warn)** — *"If you don't perform inspiratory holds, you don't have Pplat. Without Pplat, you can't tell compliance from resistance — and you don't know what you're fixing."*

3. **Predict-observe #1** — `awaits_control: compliance`. *Predict:* if you halve the compliance (50 → 25), what happens to PIP, Pplat, and the gap between them? *Observe:* both PIP and Pplat rise by roughly the same amount. The gap stays the same — because the resistance term didn't change.

4. **Predict-observe #2** — `awaits_control: resistance`. *Predict:* if you double the resistance (10 → 20), what happens to PIP, Pplat, and the gap? *Observe:* PIP rises; Pplat barely moves. The gap widens.

5. **Figure (ASCII)** — two pressure-time waveforms side by side, one labeled "compliance ↓" (both peaks tall, brief drop after the hold), one labeled "resistance ↑" (peak tall, but the plateau is much lower — the drop after the hold is dramatic).

6. **Formative (check yourself)** — *"PIP 42, Pplat 28, PEEP 5. The peak-plateau gap is 14 cmH2O. Most likely:*
   - A. Severe ARDS. (Wrong — high Pplat, but the gap is the abnormal finding here.)
   - B. **High airway resistance — kinked tube, mucus plug, bronchospasm. The gap is the giveaway.** **Correct.**
   - C. Auto-PEEP. (Wrong — that shows on the end-expiratory pressure, not the gap.)
   - D. Normal physiology. (Wrong — gap >5 is high.)

#### Explore card

**Patient context.** Same stable patient. You're going to perturb him three ways and watch the equation work. None of these are dangerous in the sim; the point is the *shape* of the response.

**Unlocked controls.**
- **Compliance · 20–80** — how stiff or compliant the respiratory system is.
- **Resistance · 5–35** — how much the airways and tube oppose flow.
- **I-time · 0.5–1.5** — how long inspiration takes. Shorter Ti = higher peak flow.

**Readouts to watch.** PIP, Pplat, the gap (PIP − Pplat).

**Try these.**
- Drop compliance from 50 to 25. PIP and Pplat both rise about the same amount. Gap unchanged.
- Raise resistance from 10 to 25. PIP shoots up; Pplat barely moves. Gap widens.
- Shorten I-time from 1.0 to 0.5. PIP rises, Pplat unchanged. Gap widens — because faster flow means more resistance contribution.
- Combine: drop compliance AND raise resistance. Both pressures rise, AND the gap widens. The bedside finding now has two stories — and you treat them differently.

#### Hint ladder

- **Tier 1** — *"Three independent experiments. Move one knob at a time and then answer the question about the gap."*
- **Tier 2** — *"Compliance moves both pressures equally. Resistance moves only the peak. Flow (I-time) moves only the peak."*
- **Tier 3** — *demonstration:* runs the current step's manipulation in the right direction, then resets.

#### Summative (5 questions)

**Q1.** *PIP 35, Pplat 32, PEEP 5. The bedside problem most likely is:*
- A. High airway resistance. — *Wrong.* Gap is only 3 — normal.
- B. Low compliance (high alveolar pressure, narrow gap). — **Correct.** The plateau is high; the gap is normal. The alveoli are stiff.
- C. Auto-PEEP. — *Wrong.* Doesn't show on the PIP-Pplat gap.
- D. Volume undershoot. — *Wrong.* That's a Vte finding, not a pressure finding.

**Q2.** *You raise the inspiratory flow rate (or shorten I-time, same thing). Which pressure changes the most?*
- A. PIP. — **Correct.** Flow lives in the resistance term — peak only.
- B. Pplat. — *Wrong.* Pplat is set by Vt and compliance, neither of which changed.
- C. PEEP. — *Wrong.* PEEP is your setting.
- D. None — flow doesn't affect any pressure. — *Wrong.* Flow is half of the resistance term.

**Q3.** *The driving pressure (Pplat − PEEP) is most directly an index of:*
- A. Resistance. — *Wrong.* Resistance is PIP − Pplat.
- B. Compliance — specifically, the cost of getting your Vt into the patient's lungs. — **Correct.** (Amato 2015; book Ch. 8.) It "indexes" Vt to the patient's actual compliance.
- C. The set rate. — *Wrong.* Rate doesn't appear.
- D. FiO2. — *Wrong.*

**Q4.** *Static compliance for a patient on Vt 500, Pplat 25, PEEP 5 is:*
- A. 20 mL/cmH2O. — *Wrong.* That's 500/25 — used PIP, not (Pplat − PEEP).
- B. 25 mL/cmH2O. — **Correct.** Vt / (Pplat − PEEP) = 500/20 = 25.
- C. 100 mL/cmH2O. — *Wrong.* Normal off the vent, not this patient.
- D. Cannot calculate without PIP. — *Wrong.* Static compliance uses Pplat by design — PIP is for *dynamic* compliance.

**Q5.** *Owens's bedside test for "is this a resistance problem or a lung problem?" is:*
- A. Get an arterial blood gas. — *Wrong.* Doesn't distinguish these.
- B. Perform an inspiratory hold and look at the peak-plateau gap. — **Correct.** (Book Ch. 2.) Gap > 5 → resistance. Gap normal → lung.
- C. Disconnect the patient from the vent. — *Wrong.* That's a different test (DOPE).
- D. Raise the PEEP. — *Wrong.* Doesn't help diagnostically.

#### Key points

- P = V/C + R·flow + PEEP. Three independent terms.
- Compliance ↓ → PIP and Pplat both rise. Gap unchanged.
- Resistance ↑ → PIP rises *more than* Pplat. Gap widens.
- Flow ↑ (shorter Ti) → PIP rises; Pplat doesn't. Gap widens.
- Driving pressure = Pplat − PEEP. The lung-protective ceiling is 15.

---

## Track 2 — Physiology

Three modules. The first cements the equation of motion as a *clinical* tool (what does each pattern *mean* on real patients?). The second teaches the physiology of why patients are hypoxemic — shunt, V/Q mismatch, dead space. The third teaches the most insidious bedside complication of mechanical ventilation — auto-PEEP.

By the end of Track 2, the learner can look at a vent screen and a chest X-ray and form a differential without anyone helping.

---

### M4 — Compliance and Resistance

**Track:** Physiology · **Archetype:** concept demo (compound strict, reset_between, 2 manipulations) · **Est. minutes:** 14 · **Anchor chapters:** [VB Ch. 1 (restrictive vs obstructive), Ch. 2 (peak-pressure response), Ch. 8 (baby lung), Ch. 15 (PIP-PPLAT gradient)]

#### Learning objectives

By the end of M4, the learner can:
- Compute static compliance at the bedside: Vt / (Pplat − PEEP).
- Recognize the parallel-rise pattern (both pressures up, gap unchanged) as a restrictive/compliance problem.
- Recognize the wide-gap pattern (PIP up, Pplat near-normal) as a resistance problem.
- Name one differential cause for each pattern (book Ch. 2: kinked tube, mucus, bronchospasm vs mainstem, atelectasis, pulmonary edema, ARDS, pneumothorax).

#### Book anchor

Owens, Ch. 2 (Quick Adjustments), the table that's effectively this module: *High PAW, Low PPLAT — airway resistance problem. High PAW, High PPLAT — lung problem.* Ch. 3 (Commandment I): compliance daily; normal 100, vented 70–80; falling = bad. Ch. 8 (baby lung): normal lung compliance is 200, chest wall 200, in parallel = 100. ARDS patient with PBW 70 and measured compliance 30 has the lungs of a 30 kg child.

**Maxims tested:**
1. Static compliance: Vt / (Pplat − PEEP).
2. Parallel rise → lung. Widened gap → airway.
3. Falling compliance is bad. Rising compliance is good.
4. The "baby lung" concept — in ARDS, the lungs aren't stiff, they're *small*.

#### Patient preset

```
mode: VCV
heightInches: 70, gender: male
tidalVolume: 480, respiratoryRate: 14, peep: 5, fiO2: 0.40
iTime: 1.0, compliance: 45, resistance: 12
spontaneousRate: 0
```

**Rationale.** A slightly sicker baseline than M3 — mildly reduced compliance (45) and just-above-normal resistance (12) — so the *changes* the learner produces land in clinically realistic ranges. At baseline PIP ~22, Pplat ~16, gap ~6 (subtly elevated already — sets up the resistance discussion).

#### Unlocked controls

`compliance`, `resistance`, plus `peep` (so the learner can confirm that PEEP raises both pressures by the same amount — a "third term" demonstration outside the tracker).

#### Pin list

- `tidalVolume: 480` — DO NOT CHANGE. Tracker math assumes baseline PIP ~22 / Pplat ~16. Smaller Vt blurs the gap.

#### Hidden objective

```ts
{
  kind: 'compound',
  sequence: 'strict',                      // compliance FIRST, then resistance
  reset_between: true,
  children: [
    // Step 1 — compliance crash → parallel rise
    {
      kind: 'manipulation',
      control: 'compliance',
      condition: { type: 'absolute', operator: '<=', value: 28 },  // ARDS-range
      require_acknowledgment: {
        question: 'You just dropped this patient\'s compliance to the ARDS range. The pressures rose. The gap between PIP and Pplat:',
        options: [
          { label: 'Stayed about the same — the gap is set by resistance, not compliance', is_correct: true,
            explanation: 'Right. The gap is the R·flow term in the equation of motion. Resistance didn\'t change, so the gap didn\'t change.' },
          { label: 'Widened — because both pressures rose', is_correct: false,
            explanation: 'The gap is PIP − Pplat, not their sum. Both rose by similar amounts.' },
          { label: 'Closed completely', is_correct: false,
            explanation: 'A closed gap means zero airway resistance — very rare even in healthy people on the vent.' },
        ],
      },
    },
    // Step 2 — resistance spike → wide gap
    {
      kind: 'manipulation',
      control: 'resistance',
      condition: { type: 'absolute', operator: '>=', value: 25 },  // mucus-plug range
      require_acknowledgment: {
        question: 'You just spiked resistance — think mucus plug or bronchospasm. Which pressure moved more?',
        options: [
          { label: 'PIP moved much more than Pplat — the gap is now wide', is_correct: true,
            explanation: 'Right. Mucus, bronchospasm, kinked tube — all raise resistance, which lives only in the R·flow term. PIP gets the whole hit; Pplat doesn\'t.' },
          { label: 'Both rose equally', is_correct: false,
            explanation: 'That\'s the compliance signature. Resistance is asymmetric.' },
          { label: 'Pplat rose, PIP didn\'t', is_correct: false,
            explanation: 'Physically impossible. PIP ≥ Pplat always.' },
        ],
      },
    },
  ],
}
```

**Why strict (not any-order):** the *clinical reasoning* M4 teaches requires anchoring to an unchanged baseline. The learner has to see "compliance → parallel rise" first, with resistance still normal, *then* "resistance → gap" with compliance back to baseline. The strict order builds the contrast.
**Why absolute thresholds (≤28, ≥25):** these are clinically meaningful values, not arbitrary deltas. Compliance ≤ 28 puts the patient in the ARDS range; resistance ≥ 25 is squarely in mucus-plug/bronchospasm territory.

#### User-facing task

**Style A — direct.** Card text:

> *"This patient just got sicker. First, his compliance is going to crash — drop the slider into the ARDS range (≤ 28) and explain what the gap does. Then his airway is going to plug up — push resistance into the mucus-plug range (≥ 25) and explain what the gap does."*

`success_criteria_display`:
- Drop compliance to ≤ 28 — explain the gap
- Raise resistance to ≥ 25 — explain the gap

#### Primer (3 questions)

**Q1.** *A patient's PIP suddenly jumps from 25 to 42, but the Pplat goes from 18 to 22. The most useful first move is:*
- A. Increase PEEP. — *Wrong.* Doesn't address the airway resistance problem.
- B. Suction the patient and check the tube. — **Correct.** (Book Ch. 2.) Wide gap = airway problem; mucus plug or kinked tube is the most common cause.
- C. Lower the tidal volume. — *Wrong.* That treats Pplat — and Pplat barely moved.
- D. Switch to pressure control. — *Wrong.* In severe airway resistance, PCV is *risky* — Pplat can crash silently (book Ch. 15).

**Q2.** *Falling compliance over hours-to-days usually means:*
- A. The patient is getting better. — *Wrong.* That's *rising* compliance.
- B. Worsening fluid overload, evolving pneumonia, or new pneumothorax. — **Correct.** (Owens, Commandment I.)
- C. The PEEP is too high. — *Wrong.* Excess PEEP can overdistend, but compliance is a longer-timescale signal.
- D. The ventilator is in the wrong mode. — *Wrong.* Mode doesn't change compliance.

**Q3.** *Owens's "baby lung" concept means:*
- A. Children's lungs handle the vent differently than adults'. — *Wrong.* Pediatric mechanics aside; the term is about *adults*.
- B. In ARDS, the lungs aren't uniformly stiff — there are fewer healthy alveoli doing all the work, like a child's lungs in an adult's chest. — **Correct.** (Book Ch. 8.) This is why Vt scales to *healthy* volume, not total.
- C. ARDS patients always need a smaller tube. — *Wrong.* Not what the concept means.
- D. Compliance in ARDS is calculated differently. — *Wrong.* Same equation, just a much smaller number.

#### Read phase content

1. **Prose** — *"There are two reasons the peak pressure on a vent gets ugly. Either the lung is the problem, or the airway is the problem. The bedside test is one button — the inspiratory hold. It tells you which conversation to have."*

2. **Callout (tip)** — *"Compute compliance at the bedside every shift: Vt / (Pplat − PEEP). Watch the trend. A patient whose compliance falls from 35 to 25 over a day is heading toward more PEEP, more sedation, and prone positioning."*

3. **Predict-observe #1** — `awaits_control: compliance`. *Predict:* you'll drop this man's compliance from 45 to 25 (the kind of crash you'd see if he aspirated). What rises more — PIP or Pplat? *Observe:* both rose by ~7. The gap (PIP − Pplat) didn't budge, because the airways didn't change.

4. **Predict-observe #2** — `awaits_control: resistance`. *Predict:* now you'll spike his resistance from 12 to 28 (a mucus plug). What's different this time? *Observe:* PIP shot up. Pplat barely moved. The gap blew open. This is the bedside resistance signature.

5. **Figure (ASCII)** — Same as M3 but with clinical labels: "ARDS / pneumonia / edema" on the parallel-rise side; "kinked tube / mucus / bronchospasm" on the wide-gap side.

6. **Formative (check yourself)** — *"You have a patient with Vt 500, PIP 38, Pplat 30, PEEP 8. His static compliance is:*
   - A. 13. (Wrong — that's 500/38, used PIP.)
   - B. **23. Correct.** (500 / (30 − 8) = 500/22 ≈ 23.) ARDS range.
   - C. 16. (Wrong — that's 500/30, ignored PEEP.)
   - D. Cannot calculate. (Wrong — you have all three numbers.)

#### Explore card

**Patient context.** 65-year-old woman, intubated for pneumonia. Right now her lungs are mildly involved. The next two minutes simulate what happens when she gets worse — either lung-wise or airway-wise.

**Unlocked controls.**
- **Compliance · 20–80** — the system's overall stiffness.
- **Resistance · 5–35** — airway opposition to flow.
- **PEEP · 0–18** — useful to confirm PEEP raises both pressures additively.

**Readouts to watch.** PIP, Pplat, the gap, MVe.

**Try these.**
- Drop compliance to 25. Both pressures jump. Read your new gap — same as before.
- Reset, then raise resistance to 28. PIP jumps; Pplat almost steady. The gap is now the resistance signature.
- Try both at once: compliance 25 AND resistance 25. Both pressures up AND a wide gap. That's a patient with both ARDS and a mucus plug — and you treat them in different ways.
- Raise PEEP from 5 to 12 (no other changes). Watch PIP and Pplat both rise by 7. PEEP is additive — the third term in the equation.

#### Hint ladder

- **Tier 1** — *"Two steps. First, drop the compliance into the ARDS range. The tracker shows you when you're there."*
- **Tier 2** — *"Step 1: compliance ≤ 28. Step 2 (after the reset): resistance ≥ 25. Then answer the acknowledgment correctly."*
- **Tier 3** — *demonstration:* runs the active step's manipulation to the target value, then resets.

#### Summative (5 questions)

**Q1.** *Normal compliance of the respiratory system in a ventilated adult is:*
- A. 40–50 mL/cmH2O. — *Wrong.* That's mildly reduced.
- B. 70–80 mL/cmH2O. — **Correct.** (Book Ch. 3, Commandment I.)
- C. 100 mL/cmH2O. — *Wrong.* That's normal *off* the vent.
- D. 200 mL/cmH2O. — *Wrong.* That's lung-alone in a healthy person.

**Q2.** *A patient with measured compliance of 20 mL/cmH2O and a PBW of 70 kg can be said to have, in Owens's framework:*
- A. The lungs of a healthy adult, just with a stiff chest wall. — *Wrong.* In ARDS the chest wall is usually OK; the lungs are *smaller*, not stiffer.
- B. The functional lung volume of a 20 kg child — the baby lung. — **Correct.** (Book Ch. 8.) Vt scales to the baby lung, not the adult body.
- C. Pulmonary fibrosis. — *Wrong.* Possible cause but the prompt is about what the *number* means.
- D. Bronchospasm. — *Wrong.* That's resistance, not compliance.

**Q3.** *A 70 kg PBW patient is on Vt 420 (6 mL/kg), Pplat 30, PEEP 10. The driving pressure is 20. The next move is:*
- A. Leave it — Pplat is 30, that's the safe limit. — *Wrong.* DP of 20 is over the lung-protective ceiling (15) even when Pplat is at the limit. (Amato 2015.)
- B. Lower Vt to bring driving pressure down to ≤ 15. — **Correct.** Vt is the lever; the lungs are small. (Book Ch. 8.)
- C. Raise PEEP — that lowers driving pressure. — *Wrong.* DP = Pplat − PEEP; raising PEEP without also lowering Pplat just raises Pplat too.
- D. Add a paralytic. — *Wrong.* Doesn't change mechanics directly.

**Q4.** *You're called for a sudden PIP alarm. PIP went from 22 to 45. Pplat is 23. Your first move is:*
- A. Increase PEEP. — *Wrong.* Doesn't address airway resistance.
- B. Disconnect, bag, suction. The gap is wide — airway problem. — **Correct.** (Book Ch. 2.)
- C. Get an arterial blood gas. — *Wrong.* Will come later — first fix the airway.
- D. Lower Vt. — *Wrong.* Pplat is fine; Vt isn't the issue.

**Q5.** *Pure compliance change vs pure resistance change. The bedside reading that distinguishes them is:*
- A. The PEEP setting. — *Wrong.* Not affected by either in isolation.
- B. The peak-to-plateau gap on an inspiratory hold. — **Correct.** Wide gap → resistance. Unchanged gap → compliance.
- C. The Vte. — *Wrong.* Unchanged in VCV regardless of which mechanic moved.
- D. The FiO2. — *Wrong.* Not a mechanical reading.

#### Key points

- Static compliance = Vt / (Pplat − PEEP). Compute it every shift.
- Parallel rise (both pressures up, gap unchanged) → lung problem. Differential: ARDS, pneumonia, edema, pneumothorax, mainstem.
- Wide gap (PIP up, Pplat near-normal) → airway problem. Differential: kink, plug, bronchospasm.
- In ARDS, the lungs aren't stiff — they're small. Vt scales to the baby lung.
- Falling compliance over time is one of the most reliable bad-news signals in the ICU.

---

### M5 — Gas Exchange Basics

**Track:** Physiology · **Archetype:** concept demo (compound strict, reset_between, 2 manipulations) · **Est. minutes:** 16 · **Anchor chapters:** [VB Ch. 4 (Acute Respiratory Failure), Ch. 5 (Oxygen Delivery), Ch. 7 (capnography)]

#### Learning objectives

By the end of M5, the learner can:
- Distinguish the four bedside causes of hypoxemia: shunt, V/Q mismatch, dead space, hypoventilation.
- State the test that distinguishes shunt from V/Q mismatch (response to 100% FiO2 — shunt doesn't fix, V/Q does).
- Explain the dead-space signature: PaCO2 up, ETCO2 down, the gradient widens.
- Relate the oxygen content equation conceptually: SaO2 is what matters, not PaO2 (Owens's Rule 1 of Oxygen).

#### Book anchor

Owens, Ch. 4: the seven causes of hypoxemia (only four matter at the bedside — shunt, V/Q, dead space, hypoventilation). The Alveolar Gas Equation. A-a gradient. Shunt = perfused but not ventilated, FiO2-resistant. Dead space = ventilated but not perfused (PE, low CO, hyperinflation). Anatomic dead space ~150 mL, ~1 mL/cm height. Ch. 5: Six Rules of Oxygen — SaO2 matters not PaO2; cardiac output offsets hypoxemia; ratios are information, not goals; give the patient just enough oxygen.

**Maxims tested:**
1. Shunt = perfused but not ventilated. Doesn't respond to 100% O2.
2. V/Q mismatch = mismatch of ventilation and perfusion. Responds to O2.
3. Dead space = ventilated but not perfused. PaCO2 rises, ETCO2 falls relative to PaCO2.
4. SaO2 is the bedside number. PaO2 is for the textbook.
5. PEEP is the strongest tool for shunt; FiO2 is the strongest tool for V/Q mismatch.

#### Patient preset

```
mode: VCV
heightInches: 70, gender: male
tidalVolume: 450, respiratoryRate: 14, peep: 5, fiO2: 0.40
iTime: 1.0, compliance: 50, resistance: 10
spontaneousRate: 0
```

Healthy-ish baseline. The teaching is the *change* (we'll induce shunt and dead-space in turn), not the resting state.

#### Unlocked controls

`compliance` (proxy for shunt severity — see note below), `respiratoryRate` (drives dead-space ratio when held tachypneic with same Vt), `fiO2`, `peep`.

**Sim limitation noted in M5's explore card:** the PlaygroundSim doesn't model real shunt fraction; it uses compliance as a proxy (lower compliance → lower SpO2 readout, mimicking shunt physiology). This is acknowledged in the read content — it's a teaching abstraction, not a physiology model.

#### Pin list

- The compliance-as-shunt-proxy mapping in PlaygroundSim — DO NOT CHANGE without retuning M5's tracker thresholds. The relationship is: compliance 50 → SpO2 ~96%, compliance 25 → SpO2 ~88%, compliance 18 → SpO2 ~82%.

#### Hidden objective

```ts
{
  kind: 'compound',
  sequence: 'strict',
  reset_between: true,
  children: [
    // Step 1 — induce "shunt" — drop SpO2 by dropping compliance, then attempt to fix with FiO2
    {
      kind: 'compound',
      sequence: 'strict',
      reset_between: false,
      children: [
        {
          kind: 'manipulation',
          control: 'compliance',
          condition: { type: 'absolute', operator: '<=', value: 25 },
        },
        {
          kind: 'manipulation',
          control: 'fiO2',
          condition: { type: 'absolute', operator: '>=', value: 0.90 },
          require_acknowledgment: {
            question: 'You cranked FiO2 to 90%. The SpO2 barely moved. Best explanation?',
            options: [
              { label: 'Shunt — the blood goes past alveoli that have no air in them. Adding more oxygen to the rest doesn\'t fix that blood.', is_correct: true,
                explanation: 'Right. Shunt is the FiO2-resistant cause of hypoxemia. The fix is to *open* the closed alveoli — that\'s PEEP, not FiO2.' },
              { label: 'V/Q mismatch — needs more FiO2', is_correct: false,
                explanation: 'V/Q mismatch *responds* to FiO2 — you\'d have seen the SpO2 climb. Failure to respond is the bedside test for shunt.' },
              { label: 'Dead space — needs higher rate', is_correct: false,
                explanation: 'Dead space causes hypercapnia, not refractory hypoxemia.' },
            ],
          },
        },
      ],
    },
    // Step 2 — induce dead-space — high rate, watch the dead-space ratio rise; recognize PaCO2 vs ETCO2
    {
      kind: 'compound',
      sequence: 'strict',
      reset_between: false,
      children: [
        {
          kind: 'manipulation',
          control: 'respiratoryRate',
          condition: { type: 'absolute', operator: '>=', value: 30 },
          require_acknowledgment: {
            question: 'You cranked rate to 30. MVe went up. PaCO2 went *up* too, not down. Best explanation?',
            options: [
              { label: 'Dead-space ventilation rose proportionally — same minute volume, less of it is alveolar', is_correct: true,
                explanation: 'Right. Anatomic dead space is ~150 mL per breath. At rate 30, you\'re wasting 4.5 L/min of dead-space ventilation. The patient is hyperventilating air past his own dead space.' },
              { label: 'The vent is malfunctioning', is_correct: false,
                explanation: 'No — this is exactly what the physiology predicts.' },
              { label: 'PEEP needs to come up', is_correct: false,
                explanation: 'PEEP doesn\'t change dead-space ratio. The fix is *bigger* breaths, slower rate.' },
            ],
          },
        },
      ],
    },
  ],
}
```

**Why strict:** the two physiologic concepts are independent at the bedside but the *teaching order* matters: shunt first (FiO2 doesn't fix), dead space second (high rate doesn't fix). This is the order Owens uses.

#### User-facing task

**Style A — direct.** Card text:

> *"Two short experiments. First, induce shunt (drop the compliance) and try to fix the SpO2 with FiO2 alone — and see why it doesn't work. Then induce dead-space (high rate) and see why the PaCO2 paradoxically rises."*

`success_criteria_display`:
- Crash compliance to ≤ 25, then push FiO2 to ≥ 90% — explain why SpO2 didn't fix
- Push rate to ≥ 30 — explain why PaCO2 went up despite the bigger minute ventilation

#### Primer (3 questions)

**Q1.** *Shunt and V/Q mismatch differ most usefully at the bedside in:*
- A. Their response to inhaled bronchodilators. — *Wrong.* Bronchodilators don't distinguish the two.
- B. Their response to 100% FiO2 — V/Q corrects, shunt doesn't. — **Correct.** (Book Ch. 4.) The bedside test.
- C. Their effect on PaCO2. — *Wrong.* Both can affect PaCO2 if severe; not the discriminator.
- D. Whether the patient is in shock. — *Wrong.* Both can occur with or without shock.

**Q2.** *Dead-space ventilation refers to:*
- A. Alveoli that are perfused but not ventilated. — *Wrong.* That's shunt.
- B. Alveoli that are ventilated but not perfused. — **Correct.** (Book Ch. 4.) PE, low cardiac output, hyperinflation.
- C. Air in the endotracheal tube. — *Partially right* (anatomic dead space), but the *clinical* concept refers to alveolar dead space.
- D. Air in the gut. — *Wrong.*

**Q3.** *Owens's first rule of oxygen is:*
- A. The PaO2 is what matters. — *Wrong.* That's textbook chemistry. Bedside, SaO2 matters.
- B. The SaO2 is what matters, not the PaO2. — **Correct.** (Book Ch. 5.) Hemoglobin carries 97%+ of arterial O2; PaO2 contributes <2%.
- C. Always target PaO2 above 100. — *Wrong.* That's hyperoxia; not a target.
- D. Hemoglobin doesn't affect oxygen delivery. — *Wrong.* It's the dominant term in DO2.

#### Read phase content

1. **Prose** — *"Patients get hypoxemic for four reasons that matter. Three are airway problems (shunt, V/Q mismatch, hypoventilation); one is a perfusion problem (dead space). The bedside tests for each are different. The fix for each is different. You can't reach for FiO2 as a hammer for everything — it only works on V/Q."*

2. **Callout (info)** — *"The clean test for shunt: if 100% oxygen doesn't fix the hypoxemia, it's shunt. The fix is to **open the alveoli** — PEEP, recruitment, prone."*

3. **Predict-observe #1** — `awaits_control: compliance`. *Predict:* you'll drop compliance into the ARDS range to simulate flooded alveoli. SpO2 will fall. If you now crank FiO2 to 100%, will it come back? *Observe (after both moves):* SpO2 barely budged. Shunt is FiO2-resistant. PEEP would help; FiO2 won't.

4. **Predict-observe #2** — `awaits_control: respiratoryRate`. *Predict:* this patient is breathing at rate 14, Vt 450, MVe ~6.3 L/min. You'll bump the rate to 30. Predict the PaCO2 direction. *Observe:* PaCO2 went *up*. At rate 30, anatomic dead-space ventilation is 30 × 150 = 4.5 L/min — most of the minute volume is wasted. *Slow the rate; bigger breaths.*

5. **Callout (warn)** — *"A tachypneic patient with a normal PaCO2 isn't safe — he's spending a lot of work to stay normal, and a little fatigue will tip him into respiratory failure."*

6. **Formative (check yourself)** — *"PaCO2 50, ETCO2 25. Gradient: 25. Most likely:*
   - A. Sensor error.
   - B. **Dead space — PE, low cardiac output, or auto-PEEP. The widening gradient is the signature.** **Correct.** (Book Ch. 7.)
   - C. Hypoventilation.
   - D. Shunt.

#### Explore card

**Patient context.** Stable patient at baseline. You're going to induce two distinct gas-exchange problems and watch how the vent reading and the SpO2/CO2 numbers respond. Note: the sim uses compliance as a stand-in for "shunt severity" — it's a teaching abstraction, not exact physiology.

**Unlocked controls.**
- **Compliance · 18–80** — proxy for shunt severity in this sim. Low compliance ≈ flooded alveoli ≈ refractory hypoxemia.
- **Rate · 8–35** — pushes the dead-space ratio when held high.
- **FiO2 · 0.21–1.00** — the FiO2 lever. Test which problem it fixes.
- **PEEP · 0–18** — the shunt lever.

**Readouts to watch.** SpO2, PaCO2 (simulated), ETCO2 (simulated), the gradient.

**Try these.**
- Drop compliance to 22. Watch SpO2 fall. Now push FiO2 to 1.00. Watch how little it helps.
- Reset. Drop compliance to 22 *and* raise PEEP to 15. Now SpO2 climbs — that's the right fix.
- Reset. Push rate to 30 with everything else normal. Watch PaCO2 rise, not fall. Counter-intuitive but predictable.
- Try the worst combo: low compliance + high rate. Both problems at once. The fixes don't interact — you need both.

#### Hint ladder

- **Tier 1** — *"Step 1: induce a shunt — what knob simulates that here? Then try to fix it with the wrong tool."*
- **Tier 2** — *"Step 1: compliance ≤ 25, then FiO2 ≥ 90%. Step 2 (after reset): rate ≥ 30. Each step has an acknowledgment after."*
- **Tier 3** — *demonstration:* runs the active step's manipulations in order.

#### Summative (5 questions)

**Q1.** *A patient on FiO2 1.0 has a PaO2 of 65. The A-a gradient is:*
- A. Normal — he's just on a lot of oxygen. — *Wrong.* On 100%, expected PaO2 is ~600. A gradient of 50+ is enormous.
- B. Widened — and that's diagnostic of either shunt or severe V/Q mismatch. — **Correct.** (Book Ch. 4.) FiO2 1.0 failing to correct hypoxemia = shunt.
- C. Lowered — PEEP must be working. — *Wrong.* PEEP doesn't lower the A-a gradient *directly*.
- D. Cannot be calculated without ABG. — *Wrong.* You have a PaO2 — calculation works.

**Q2.** *Anatomic dead space in a normal 70-inch-tall adult is approximately:*
- A. 25 mL. — *Wrong.* That's nothing — too low for a healthy airway.
- B. 75 mL. — *Wrong.* Underestimates.
- C. 150–180 mL — about 1 mL per cm of height. — **Correct.** (Book Ch. 4.)
- D. 300 mL. — *Wrong.* That's tidal-volume territory in a small adult.

**Q3.** *VD/VT ratio > 0.6 most strongly suggests:*
- A. Hypoventilation. — *Wrong.* Different problem.
- B. Shunt. — *Wrong.* Shunt is the opposite (perfused, not ventilated).
- C. Large dead-space fraction — think PE, low CO, severe hyperinflation. — **Correct.** Normal VD/VT ≤ 0.3 (book Ch. 4).
- D. Normal physiology. — *Wrong.* Normal is ≤ 0.3.

**Q4.** *A widening ETCO2-PaCO2 gradient (e.g., from 5 to 18) most useful interpretation is:*
- A. Better gas exchange. — *Wrong.* It's worse.
- B. Worsening dead space — PE, falling cardiac output, auto-PEEP. — **Correct.** (Book Ch. 7.) Trend matters as much as the value.
- C. Better cardiac output. — *Wrong.* Falling CO widens the gradient.
- D. ETCO2 sensor failure. — *Wrong.* Diagnosis of exclusion.

**Q5.** *The strongest single tool to address pure shunt physiology in a ventilated patient is:*
- A. Higher FiO2. — *Wrong.* Shunt is FiO2-resistant by definition.
- B. Higher PEEP and lung-recruitment maneuvers. — **Correct.** (Book Ch. 12.) Open the closed alveoli.
- C. Switching from VCV to PCV. — *Wrong.* Mode doesn't change physiology.
- D. Higher set rate. — *Wrong.* Affects ventilation, not shunt-driven oxygenation.

#### Key points

- Four bedside causes of hypoxemia: shunt, V/Q mismatch, dead space, hypoventilation.
- Shunt = perfused but not ventilated. Doesn't fix with O2. Fixes with PEEP.
- V/Q mismatch is the most common cause of hypoxemic respiratory failure. Fixes with O2.
- Dead space = ventilated but not perfused. PaCO2 rises, ETCO2 falls (or rises less). Gradient widens.
- SaO2 is what matters. Cardiac output and hemoglobin are bigger levers than PaO2.

---

### M6 — Auto-PEEP and Air Trapping

**Track:** Physiology · **Archetype:** target state, two-stage (compound strict: induce, then resolve) · **Est. minutes:** 15 · **Anchor chapters:** [VB Ch. 2 (Dynamic Hyperinflation), Ch. 3 (Commandment IX), Ch. 13 (Trigger), Ch. 15 (Severe Bronchospasm)]

#### Learning objectives

By the end of M6, the learner can:
- Define auto-PEEP: end-expiratory alveolar pressure higher than the set PEEP.
- Recognize it on the flow waveform (expiratory flow doesn't return to zero before the next breath).
- Name the three levers for fixing it: lower rate, shorter I-time, treat the obstruction.
- State the worst-case consequence: hypotension, PEA arrest. The disconnect maneuver.

#### Book anchor

Owens, Ch. 2: *"Lower the ventilator rate (10–14). Shorten the I-time. Keep Vt in 6–8 mL/kg. Treat bronchospasm. Adequate sedation."* Ch. 3, Commandment IX: *"Seek out dynamic hyperinflation wherever it may be found — 'tis an insidious beast."* Ch. 13: ineffective triggering is a sequela of auto-PEEP (the patient has to overcome the trapped pressure before he can drop airway pressure to trigger).

**Maxims tested:**
1. Auto-PEEP is end-expiratory pressure above set PEEP — measured by the expiratory hold.
2. The flow-waveform sign: expiratory flow doesn't return to zero.
3. Lower rate is the most effective fix. Shorter I-time is second.
4. Severe auto-PEEP → hypotension → disconnect from the vent.

#### Patient preset

```
mode: VCV
heightInches: 70, gender: male
tidalVolume: 480, respiratoryRate: 18, peep: 5, fiO2: 0.50
iTime: 1.0, compliance: 60, resistance: 22       # mild obstructive — set up for trapping
spontaneousRate: 0
```

**Rationale.** Compliance preserved (60 — obstructive disease doesn't make stiff lungs), resistance elevated (22 — mucus + mild bronchospasm). Rate 18 + Ti 1.0 + resistance 22 → baseline expiratory time is barely sufficient. The learner pushes it over the edge in Step 1.

#### Unlocked controls

`respiratoryRate`, `iTime`, `tidalVolume`, `peep`. (Compliance and resistance locked — this is about *settings*, not physiology.)

#### Pin list

- `compliance: 60`, `resistance: 22`, `iTime: 1.0` (baseline) — **DO NOT CHANGE.** These three together set the auto-PEEP susceptibility. Change any one and the Step 1 induction may not trigger.

#### Hidden objective

```ts
{
  kind: 'compound',
  sequence: 'strict',
  reset_between: false,                  // Step 2 builds on Step 1's state
  children: [
    // Step 1 — induce auto-PEEP by pushing rate and shortening Te
    {
      kind: 'outcome',
      readouts: {
        autoPeep: { operator: '>=', value: 4 },     // moderate auto-PEEP
      },
      sustain_breaths: 3,
      // The learner gets here by raising rate (and/or Vt) — flow can't drain in time
    },
    // Step 2 — resolve auto-PEEP back below 1.5
    {
      kind: 'outcome',
      readouts: {
        autoPeep: { operator: '<=', value: 1.5 },
      },
      sustain_breaths: 5,
      // The learner must lower rate or shorten I-time to give expiration room
    },
  ],
}
```

**Why no reset_between:** the two steps form a single clinical narrative — *make it worse, then fix what you made worse*. Resetting between steps would erase the trapped-air state Step 1 just produced.
**Why `autoPeep >= 4` then `<= 1.5`:** baseline is 0.5–1.0; the learner must produce a clinically meaningful trap (≥ 4) and then bring it back below the "essentially zero" line (≤ 1.5). The thresholds are tight enough that drifting in either direction loses progress, which forces deliberate adjustment.
**Why sustain 3/5:** Step 1 is transitional (induction); Step 2 is "hold the state" — needs 5 to confirm.

#### User-facing task

**Style B — clinical.** Card text:

> *"This 60-year-old man with COPD is being ventilated. Right now he's borderline. Step 1: push him into clinically significant auto-PEEP (≥ 4 cmH2O) — your options are rate, Vt, and I-time. Step 2: now fix it. Bring auto-PEEP back to ≤ 1.5 and hold it for five breaths."*

`success_criteria_display`:
- Induce auto-PEEP ≥ 4 cmH2O, hold for 3 breaths
- Resolve auto-PEEP ≤ 1.5 cmH2O, hold for 5 breaths

#### Primer (3 questions)

**Q1.** *Auto-PEEP is best defined as:*
- A. The PEEP setting you ordered. — *Wrong.* That's set PEEP.
- B. End-expiratory alveolar pressure that is higher than the set PEEP — air trapped because the patient can't exhale completely. — **Correct.** (Book Ch. 17.)
- C. PEEP that increases on inspiration. — *Wrong.* PEEP is by definition end-*expiratory*.
- D. PEEP measured during noninvasive ventilation. — *Wrong.*

**Q2.** *The flow-waveform sign of auto-PEEP is:*
- A. The inspiratory flow has a square shape. — *Wrong.* That's just constant flow in VCV.
- B. The expiratory flow doesn't return to zero before the next breath starts. — **Correct.** (Book Ch. 2.) The patient is mid-exhale when the next vent breath fires.
- C. The PIP waveform is double-humped. — *Wrong.* That's double triggering.
- D. There is no flow waveform visible. — *Wrong.* Equipment failure.

**Q3.** *The single most effective ventilator change to relieve dynamic hyperinflation is:*
- A. Increase PEEP. — *Wrong.* In *asthma*, applied PEEP worsens trapping. In COPD, modest applied PEEP can splint airways open — but it's not the *most effective* lever.
- B. Lower the respiratory rate. — **Correct.** (Book Ch. 2.) Slower rate = longer expiratory time = air drains.
- C. Increase the FiO2. — *Wrong.* Doesn't change mechanics.
- D. Switch to PCV. — *Wrong.* Risky in severe bronchospasm — Pplat can fall silently.

#### Read phase content

1. **Prose** — *"Auto-PEEP is the airway problem that won't show up on the peak pressure. It hides in the end-expiratory part of the cycle — the part nobody looks at unless they know to. Watch the flow waveform. If it doesn't get back to zero before the next breath fires, you have trapped air."*

2. **Callout (warn)** — *"In severe asthma, applied PEEP makes hyperinflation *worse*. In COPD, modest applied PEEP (75–85% of measured auto-PEEP) helps. Don't reflex into PEEP without knowing which one you have."*

3. **Predict-observe #1** — `awaits_control: respiratoryRate`. *Predict:* this patient is on rate 18 with mild resistance. If you raise rate to 28, what happens to auto-PEEP? *Observe:* it climbs. Less time between breaths → less time to exhale.

4. **Predict-observe #2** — `awaits_control: iTime`. *Predict:* now you'll shorten I-time from 1.0 to 0.6 at the same rate. Predict the auto-PEEP direction. *Observe:* it falls — but only slightly. Longer expiratory time helps, but the dominant lever is *rate*.

5. **Callout (info)** — *"The bedside test for auto-PEEP: perform an expiratory hold. The measured end-expiratory pressure will be higher than set PEEP. The difference is your auto-PEEP."*

6. **Formative (check yourself)** — *"A COPD patient on the vent develops hypotension. Auto-PEEP is 12 cmH2O. Your next move is:*
   - A. Give a fluid bolus. (Maybe — but treats the symptom, not the cause.)
   - B. **Disconnect the patient from the vent and let him exhale for 10–15 seconds.** **Correct.** (Book Ch. 15.) Trapped air is compressing his venous return.
   - C. Raise the PEEP. (Wrong — worsens trapping.)
   - D. Increase the rate. (Wrong — worsens trapping.)

#### Explore card

**Patient context.** 60-year-old COPD on his second day in the ICU. He's mildly air-trapped at baseline. You're going to make it worse, then fix it. In real life, this is the most common preventable bad-outcome in vented obstructive patients.

**Unlocked controls.**
- **Rate · 8–28** — the most powerful lever. Lower rate = longer Te.
- **I-time · 0.5–1.5** — shorter Ti gives more time for Te.
- **Vt · 350–600** — higher Vt at the same rate also extends Ti.
- **PEEP · 0–18** — for COPD, can splint airways open; for asthma, makes it worse.

**Readouts to watch.** Auto-PEEP, Total PEEP, the flow waveform (look at end-expiration).

**Try these.**
- Push rate to 28. Watch auto-PEEP climb. The flow waveform won't return to zero.
- Now drop rate to 10. Auto-PEEP falls. Te is now ~5 seconds — plenty of time to exhale.
- Try shortening I-time from 1.0 to 0.5 instead of lowering rate. The I:E ratio changes but the auto-PEEP relief is smaller. Rate is the bigger lever.
- Raise PEEP from 5 to 12 (don't change rate). In real COPD this might splint airways open; in *asthma*, it would worsen trapping.

#### Hint ladder

- **Tier 1** — *"Two steps. First, push the patient into clinically significant trapping. Second, fix it."*
- **Tier 2** — *"Step 1: raise rate to 26+ and watch auto-PEEP climb past 4. Step 2: drop rate to 10–12 to give expiration room, sustained for 5 breaths."*
- **Tier 3** — *demonstration:* runs Step 1 (raise rate to 26), pauses, then prompts the learner to drop it back.

#### Summative (5 questions)

**Q1.** *Auto-PEEP is most reliably measured by:*
- A. Looking at the PIP trend. — *Wrong.* PIP doesn't reveal end-expiratory pressure.
- B. An expiratory hold — the measured end-expiratory pressure minus set PEEP. — **Correct.** (Book Ch. 15.)
- C. The PaCO2. — *Wrong.* CO2 may rise but isn't the measurement.
- D. The set PEEP minus 1. — *Wrong.* No relationship.

**Q2.** *In a patient with severe asthma and dynamic hyperinflation, the application of PEEP usually:*
- A. Helps — splints airways. — *Wrong.* That's COPD.
- B. Worsens trapping — the obstruction in asthma is fixed, so adding PEEP just adds pressure. — **Correct.** (Book Ch. 1, Ch. 15.)
- C. Has no effect. — *Wrong.*
- D. Lowers the PaCO2. — *Wrong.*

**Q3.** *A vent rate increase that raises PaCO2 instead of lowering it should make you suspect:*
- A. Dead space. — *Possible* but not specific to vent-rate effect.
- B. Auto-PEEP — the higher rate compressed expiratory time, more trapping, less effective alveolar ventilation. — **Correct.** (Owens, Commandment IX.)
- C. Hypoventilation. — *Wrong.* Opposite — you raised MVe.
- D. Sensor error. — *Wrong.*

**Q4.** *In a hypotensive vented COPD patient with measured auto-PEEP of 14 cmH2O, the most important *first* action is:*
- A. Norepinephrine. — *Wrong.* Treats the BP, not the cause.
- B. Disconnect from the vent, let the patient exhale for 10–15 seconds, then resume with a slower rate. — **Correct.** (Book Ch. 15.) Trapped air compresses venous return.
- C. Lower the PEEP setting from 5 to 0. — *Wrong-ish.* Modest applied PEEP doesn't drive the trapping in COPD; the rate does. Disconnect first.
- D. Increase FiO2 to 1.0. — *Wrong.*

**Q5.** *Of the four levers to relieve dynamic hyperinflation, the most effective is:*
- A. Higher PEEP. — *Wrong.* Counterintuitive — not the most effective, and harmful in asthma.
- B. Lower rate. — **Correct.** (Book Ch. 2.) Longer Te is the dominant fix.
- C. Higher Vt. — *Wrong.* Higher Vt extends Ti and worsens trapping.
- D. Higher FiO2. — *Wrong.* Doesn't change mechanics.

#### Key points

- Auto-PEEP = end-expiratory alveolar pressure > set PEEP. Measure with an expiratory hold.
- Flow-waveform sign: expiratory flow doesn't return to zero before next breath.
- Rate is the strongest lever — lower it. I-time is the second lever — shorten it.
- In asthma, applied PEEP worsens trapping. In COPD, modest applied PEEP can help splint.
- Severe auto-PEEP + hypotension → disconnect from the vent. Don't waste time on pressors first.

---


## Track 3 — Modes

The Modes track teaches the six ventilation modes a resident or therapist will see in any American ICU: VCV, PCV, PRVC, PSV, SIMV, and the dyssynchrony patterns each of them produces. Each module forces the learner to *manipulate* the mode, not just read about it. The pattern across the whole track is consistent: a starting state, a perturbation (a compliance change, a resistance change, a patient effort change), and a target the learner must reach. Owens's voice from Chapter 9 (A/C), Chapter 10 (SIMV), Chapter 11 (PSV), and Chapter 13 (Trigger and Flow) carries through.

---

### M7 — Volume Control Ventilation

**Track:** Modes · **Archetype:** outcome (Style B, target-state) · **Est. minutes:** 18 · **Anchor chapters:** [VB Ch. 9, Ch. 8]

#### Learning objectives

By the end of M7, the learner can:
- Distinguish what VCV guarantees (tidal volume, minute ventilation) from what it does not (peak pressure, plateau pressure).
- Predict the direction of change in peak pressure when compliance falls at a fixed Vt.
- Set lung-protective VCV from scratch: Vt 6 mL/kg PBW, plat ≤30, driving pressure ≤15.
- State why VCV is the default mode for shocked or unreliable-drive patients ("don't let the shocked patient fatigue").

#### Book anchor

Owens, Ch. 9 ("Assist-Control Ventilation"): VCV requires rate and Vt; product is minute ventilation, which controls PaCO2; constant-flow ("square top") inspiratory waveform; COPD/asthma patients often prefer the rapid delivery; ARDS patients tolerate it well in lung-protective ranges. Ch. 8 (Safety Limits): Vt 4-8 mL/kg PBW, plat ≤30, driving pressure 10-15. Ch. 3 Commandment VIII: A/C is the right mode for the shocked patient. Ch. 3 Commandment V: "Thou shalt mind the tidal volume."

**Maxims tested:**
1. VCV guarantees the tidal volume; the *pressure* is whatever it has to be.
2. If compliance worsens at a fixed Vt, plateau pressure rises — that's the warning sign.
3. Lung-protective VCV: 6 mL/kg PBW, plat <30, driving pressure ≤15.
4. The shocked patient belongs on A/C.

#### Patient preset

```
mode: VCV
heightInches: 70
gender: male                  # PBW ~73 kg
tidalVolume: 500              # ~7 mL/kg — DELIBERATELY a touch high to invite a fix
respiratoryRate: 14
peep: 5
fiO2: 0.40
iTime: 1.0
compliance: 40                # moderately reduced — sepsis pattern
resistance: 12
spontaneousRate: 0
```

**Rationale.** Sepsis-pattern patient with moderately reduced compliance. Vt is set at 7 mL/kg so the learner has an obvious lever to move (down to 6 mL/kg). Compliance of 40 produces a plateau in the 18-22 range at Vt 500 — not unsafe, but learner will see the math change as they adjust.

#### Unlocked controls

`tidalVolume`, `respiratoryRate`, `peep`, `fiO2`, `iTime`. Compliance and resistance are locked so the learner can isolate the effect of *their* changes from physiologic drift.

#### Pin list

- **compliance: 40** — DO NOT CHANGE. Tracker thresholds assume this value. With compliance 40 and Vt 430, plat lands at ~16 (430/40 + 5 PEEP); driving pressure ~11.
- **heightInches: 70, gender: male** — DO NOT CHANGE. PBW math depends on these. 6 mL/kg = 438 mL; tracker accepts 410-450.

#### Hidden objective

```yaml
tracker_type: outcome
target_state:
  - measurement: tidalVolume
    operator: between
    min: 410
    max: 450                  # 6 mL/kg PBW ±5%
  - measurement: plat
    operator: lte
    value: 30
  - measurement: drivingPressure
    operator: lte
    value: 15
sustain_breaths: 5
reset_between: false
show_progress_chip: true
```

**Rationale for sustain_breaths: 5.** Title is "set lung-protective VCV." The learner should *land* there and *hold* it, not flick the dial through 430 on the way to 350.

#### User-facing task

> **Set lung-protective VCV.** This is the standard A/C ventilation that gets every fresh ARDS patient and every intubated trauma. Your Vt is currently 500. The patient is 5'10", and his compliance is moderately reduced. Adjust the Vt down to the lung-protective range and confirm that plat and driving pressure are in range. Hold the new state for 5 breaths.

**Success criteria (displayed):**
- Tidal volume 410-450 mL (6 mL/kg ±5% for this patient)
- Plateau pressure ≤30 cmH2O
- Driving pressure ≤15 cmH2O
- Sustained for 5 consecutive breaths

#### Primer (3 MCQs)

**P1.** *On VCV, what does the ventilator guarantee?*
- A. The peak airway pressure. — *Wrong.* PIP is determined by flow, resistance, compliance, and Vt; the vent makes whatever pressure it needs.
- B. The plateau pressure. — *Wrong.* Plat is determined by Vt/compliance + PEEP; the vent doesn't set it.
- C. The tidal volume. — **Correct.** (Book Ch. 9.) The vent opens its valve at a set flow until the set Vt has been delivered. The pressure is whatever it takes.
- D. The respiratory rate, but not the volume. — *Wrong.* It guarantees both rate and Vt; that's the whole point of A/C.

**P2.** *A VCV patient has compliance fall from 40 to 25 overnight at a fixed Vt of 500. The most likely change in plateau pressure is:*
- A. Plat falls — the lungs got softer. — *Wrong.* Lower compliance is stiffer, not softer.
- B. Plat rises — to deliver the same Vt into stiffer lungs takes more alveolar pressure. — **Correct.** (Plat = Vt/C + PEEP, so plat goes from 17.5 to 25.) This is the warning sign of evolving ARDS in a VCV patient.
- C. Plat is unchanged — only PIP rises. — *Wrong.* This would be true only if the resistance changed. Compliance change directly drives plat.
- D. The vent will reduce Vt to compensate. — *Wrong.* VCV does no such thing — dual-control modes do.

**P3.** *Which patient is the textbook indication for VCV (volume A/C)?*
- A. A 70-kg post-arrest patient in shock on norepinephrine. — **Correct.** (Owens, Commandment VIII.) The shocked patient needs guaranteed minute ventilation and reliable Vt; A/C does the work of breathing while you resuscitate.
- B. A spontaneously breathing CHF patient with mild hypoxia. — *Wrong.* This patient may not need intubation at all; if intubated, dual-control or PSV is more comfortable.
- C. A 28-year-old status asthmaticus with severe bronchospasm. — *Partially right — VCV is the mode of choice for severe bronchospasm (Ch. 15)*, but VCV here is to control I:E ratio and prevent stacking, not "do all the work." A is the cleaner indication.
- D. A 50-year-old extubation candidate. — *Wrong.* PSV is the right answer here.

#### Read phase

1. **Opening prose (~150 words).** A/C is the workhorse. The vent delivers a preset number of breaths per minute; if the patient triggers above the set rate, he gets a *full* breath, not a partial one. That's what "assist-control" means — the patient can assist, but the control is the floor. VCV is the simpler of the two A/C flavors: you set a rate, you set a Vt, the vent gives the Vt at a constant flow until it's delivered, and then exhalation begins.

2. **Callout (info)** — *"In VCV, the tidal volume is your variable. The pressure is whatever it needs to be. That's the deal."*

3. **Predict-observe** — `awaits_control: compliance` *(this control is locked in the task; this read-phase block runs with a separate sandbox)* — *Predict:* you'll drop compliance from 50 to 25 at a fixed Vt of 500. What happens to plat? *Observe:* plat doubles. You did not change a single ventilator setting, but the patient's lungs are now twice as expensive to inflate.

4. **Callout (warn)** — *"Plat ≤30 and driving pressure ≤15. These are not soft suggestions. ARMA 2000 showed that 6 mL/kg PBW reduced ARDS mortality by 9%. Amato 2015 showed driving pressure was independently linked to survival."*

#### Explore card

**Patient context.** 70 kg male, post-laparotomy for perforated diverticulitis. Septic, intubated for refractory hypoxemia. Compliance 40 (sepsis pattern).

**Unlocked controls.** Vt 350-600; Rate 8-30; PEEP 0-15; FiO2 0.30-0.80; I-time 0.6-1.5.

**Readouts to watch.** Plat, driving pressure, PIP, MVe.

**Try these.**
- Push Vt to 600. Watch plat and driving pressure climb past safety.
- Pull Vt to 350. Plat falls but is the MVe still adequate?
- Raise rate from 14 to 22 at Vt 500. MVe scales linearly.
- Drop PEEP from 5 to 0. Plat falls; driving pressure unchanged.

#### Hint ladder

- **Tier 1** — *"You're at 7 mL/kg. The book asks for 6."*
- **Tier 2** — *"For this patient, 6 mL/kg PBW is ~430 mL. Move Vt down toward 430 and watch the plat and driving pressure update."*
- **Tier 3** — *demonstrates* moving Vt from 500 to 430, then prompts the learner to confirm the chip locks green.

#### Summative (5 questions)

**Q1.** *A 65-year-old male, 175 cm tall, is intubated for ARDS. The first Vt you should select is approximately:*
- A. 350 mL. — *Wrong.* That's below 5 mL/kg; defensible only if plat is high, but not the *first* choice.
- B. 430 mL. — **Correct.** (PBW ~72 kg, 6 mL/kg = 432.) The ARDSnet starting target.
- C. 600 mL. — *Wrong.* That's 8.3 mL/kg — too high for ARDS.
- D. 800 mL. — *Wrong.* Pre-ARMA dosing, abandoned 25 years ago.

**Q2.** *On VCV, peak pressure (PIP) rises sharply while plateau pressure is unchanged. The most likely cause is:*
- A. Worsening ARDS. — *Wrong.* That raises plat too.
- B. Increased airway resistance — mucus plug, kinked tube, bronchospasm. — **Correct.** (Book Ch. 2.) The PIP-plat gap *is* the resistance signal.
- C. A pneumothorax. — *Wrong.* Pneumo raises both.
- D. Pulmonary edema. — *Wrong.* Raises both.

**Q3.** *A patient on VCV with Vt 500 mL is reported to have a plateau pressure of 34 and a driving pressure of 22. The single most important next move is:*
- A. Sedate more deeply. — *Wrong.* Doesn't address the lung problem.
- B. Increase PEEP. — *Wrong.* That can raise plat further.
- C. Reduce the tidal volume. — **Correct.** (Book Ch. 8, Amato 2015.) DP >15 is the survival-relevant lever.
- D. Switch to PCV. — *Tempting* but does nothing physiologic — same lungs, same compliance.

**Q4.** *The advantage of VCV over PCV is:*
- A. Lower peak airway pressures. — *Wrong.* PCV typically has lower PIP.
- B. Guaranteed minute ventilation, regardless of changes in compliance. — **Correct.** (Book Ch. 9.) The shocked patient with evolving lung injury needs a guaranteed Vt.
- C. Greater patient comfort with constant flow. — *Wrong.* Constant flow is generally less comfortable; that's a PCV advantage.
- D. No volutrauma risk. — *Wrong.* VCV can absolutely cause volutrauma if Vt is set too high.

**Q5.** *Owens's Eleventh Commandment regarding the choice of mode for the shocked patient is:*
- A. PSV — least work for the patient. — *Wrong.* PSV is a recovery mode.
- B. SIMV — best of both worlds. — *Wrong.* SIMV in the shocked patient risks high WOB.
- C. A/C — the shocked patient should not fatigue. — **Correct.** (Commandment VIII.) Don't let the shocked patient do the work of breathing while you're resuscitating him.
- D. APRV — best oxygenation. — *Wrong.* Not the first-line mode for shock.

#### Key points

- VCV guarantees Vt; the pressure is whatever it has to be. Watch plat and driving pressure.
- Lung-protective VCV: 6 mL/kg PBW, plat ≤30, driving pressure ≤15.
- A rising plat at a fixed Vt means compliance is falling — assume worsening lung injury until proven otherwise.
- A rising PIP with unchanged plat means resistance is rising — think mucus, kink, or bronchospasm.
- The shocked patient and the unreliable-drive patient belong on A/C.

---

### M8 — Pressure Control Ventilation

**Track:** Modes · **Archetype:** outcome (Style B with predict-observe) · **Est. minutes:** 18 · **Anchor chapters:** [VB Ch. 9, Ch. 8]

#### Learning objectives

By the end of M8, the learner can:
- Distinguish what PCV guarantees (PINSP, I-time) from what it does not (tidal volume, minute ventilation).
- Predict the direction of change in Vt when compliance changes at a fixed PINSP.
- Distinguish PINSP from driving pressure (PINSP includes resistance; driving pressure = plat - PEEP).
- Set lung-protective PCV: PINSP titrated to Vt 6 mL/kg PBW, total peak pressure ≤30-35.

#### Book anchor

Owens, Ch. 9 ("Pressure Assist-Control"): physician sets rate, PINSP, and I-time; Vt is the dependent variable; PINSP is the change above PEEP, not absolute peak; "PINSP is *not* the same as driving pressure" — PINSP includes resistance, DP doesn't; decelerating-flow waveform is generally more comfortable. Ch. 8 Amato 2015: driving pressure ≤15 predicts survival even in PCV. Ch. 15: PCV in bronchospasm is risky — if airway resistance rises, Vt collapses.

**Maxims tested:**
1. PCV guarantees PINSP and I-time; Vt is whatever it has to be.
2. If compliance improves, Vt rises at the same PINSP — you must titrate down.
3. PINSP ≠ driving pressure. DP needs a plateau measurement.
4. Never assume "you can't measure plat in PCV." One inspiratory hold and there it is.

#### Patient preset

```
mode: PCV
heightInches: 70
gender: male
PInsp: 18                     # delivers ~450 mL at C=35, so ~6.2 mL/kg
respiratoryRate: 14
peep: 8
fiO2: 0.50
iTime: 1.0
compliance: 35                # moderate ARDS pattern
resistance: 10
spontaneousRate: 0
```

**Rationale.** Moderate ARDS, on PCV by clinician choice (maybe the attending prefers it for the decelerating flow). PINSP 18 + PEEP 8 gives total peak ~26, which is under 30 — but the learner will watch compliance change in the read phase and feel the Vt swing.

#### Unlocked controls

`PInsp`, `respiratoryRate`, `peep`, `fiO2`, `iTime`. **Compliance is unlocked in the read phase** for the predict-observe block, then re-locked.

#### Pin list

- **compliance: 35** — DO NOT CHANGE for the task tracker. At PINSP 18, this gives Vt ~430.
- **PInsp range exposed: 8-30** — must allow learner to overshoot.

#### Hidden objective

```yaml
tracker_type: outcome
target_state:
  - measurement: tidalVolume
    operator: between
    min: 410
    max: 470
  - measurement: peakPressure
    operator: lte
    value: 30
  - measurement: drivingPressure
    operator: lte
    value: 15
sustain_breaths: 5
reset_between: false
show_progress_chip: true
```

#### User-facing task

> **Titrate PINSP to a lung-protective Vt.** Your patient is on PCV with PINSP 18 and PEEP 8. The compliance is ~35 mL/cmH2O. Adjust the PINSP so the delivered Vt lands at 6 mL/kg PBW (~430 mL for this patient), with total peak pressure ≤30 and driving pressure ≤15. Hold for 5 breaths.

**Success criteria (displayed):**
- Tidal volume 410-470 mL
- Total peak pressure ≤30 cmH2O
- Driving pressure ≤15 cmH2O
- Sustained for 5 consecutive breaths

#### Primer (3 MCQs)

**P1.** *On PCV, what does the ventilator guarantee?*
- A. The tidal volume. — *Wrong.* Vt is the dependent variable, set by compliance and resistance.
- B. The inspiratory pressure and the I-time. — **Correct.** (Book Ch. 9.) The vent rises to PINSP, holds for I-time, drops back to PEEP.
- C. The plateau pressure. — *Wrong.* Plat depends on whether inspiratory flow reaches zero; in most PCV settings it doesn't.
- D. The driving pressure. — *Wrong.* DP requires a measured plat, which is not what you set in PCV.

**P2.** *A PCV patient's compliance improves overnight from 25 to 50 at a fixed PINSP. The most likely change is:*
- A. Vt is unchanged; only PIP rises. — *Wrong.* PIP doesn't rise in PCV — it's *fixed*.
- B. Vt approximately doubles. — **Correct.** (Book Ch. 9.) Vt = PINSP × C, roughly. This is why PCV needs daily attention — improving lungs lead to higher Vt unless you titrate down.
- C. Vt halves. — *Wrong.* Direction is reversed.
- D. The ventilator reduces PINSP to compensate. — *Wrong.* Dual-control modes do this. PCV does not.

**P3.** *Which statement about PINSP versus driving pressure is correct?*
- A. PINSP and driving pressure are the same thing. — *Wrong.* Common error.
- B. PINSP is the pressure rise above PEEP; driving pressure is plat minus PEEP, and requires a measurement. — **Correct.** (Book Ch. 9.) PINSP includes the resistance-overcoming pressure; DP doesn't.
- C. PINSP is always higher than driving pressure. — *Mostly true, but not the cleanest answer.* Owens explicitly says PINSP ≥ DP, with equality only when end-inspiratory flow has reached zero.
- D. Driving pressure cannot be measured in PCV. — *Wrong.* Common myth; an inspiratory hold gives you plat in PCV just as in VCV.

#### Read phase

1. **Opening prose (~150 words).** PCV reverses VCV's deal. You set the *pressure* you want; the vent goes up to it, holds it, then releases. The tidal volume is whatever the patient's lungs and airway resistance permit. The waveform is decelerating — flow is high at the start and tapers off as the lungs fill, which most patients find more comfortable than VCV's square top.

2. **Callout (info)** — *"PINSP is the rise above PEEP. If PINSP is 18 and PEEP is 8, total peak airway pressure is 26."*

3. **Predict-observe** — `awaits_control: compliance` — *Predict:* you'll drop compliance from 35 to 18. What happens to Vt? *Observe:* Vt falls roughly in proportion. This is the failure mode of PCV in worsening ARDS — the patient gets less and less ventilation as he gets sicker, and you won't see a PIP alarm fire.

4. **Callout (warn)** — *"In PCV, the low-Vt alarm is your friend. If the patient's compliance falls, Vt collapses silently. The PIP alarm will never fire — you set the pressure, the vent obeys."*

5. **Formative (check yourself)** — *"In PCV, you cannot measure plateau pressure. True or false?* **False.** *(Book Ch. 9.) An inspiratory hold equilibrates pressures throughout the airway tree, just as in VCV. You absolutely can — and should — measure plat."*

#### Explore card

**Patient context.** Same post-laparotomy septic patient as M7, but the attending placed him on PCV. Compliance 35.

**Unlocked controls.** PINSP 8-30; Rate 8-30; PEEP 0-18; FiO2 0.30-0.80; I-time 0.6-1.5; **Compliance 20-60** (sandbox only).

**Readouts to watch.** Vt, plat (after inspiratory hold), peak pressure, MVe.

**Try these.**
- Raise PINSP from 18 to 26. Vt climbs from ~430 to ~620.
- Drop compliance to 20 at PINSP 18. Vt falls to ~245.
- At PINSP 18, perform an inspiratory hold. Watch plat lag PIP by 1-2 cmH2O (low resistance).
- Bump resistance to 25 at PINSP 18 — Vt drops, but plat is still measurable.

#### Hint ladder

- **Tier 1** — *"At PINSP 18 and C=35, Vt is in the right range. Have you held it for 5 breaths?"*
- **Tier 2** — *"If the chip won't lock green, check driving pressure. It's plat - PEEP. With this PINSP, you should be at ~12. If you're over 15, lower PINSP."*
- **Tier 3** — *demonstrates* PINSP move to 17, holds, then prompts learner to verify chip is green.

#### Summative (5 questions)

**Q1.** *A patient is on PCV with PINSP 20, PEEP 10, I-time 1.0. Compliance is 25 mL/cmH2O. The expected Vt is approximately:*
- A. 200 mL. — *Wrong.* That's too low — PINSP 20 × C 25 ≈ 500.
- B. 500 mL. — **Correct.** Vt ≈ PINSP × C.
- C. 800 mL. — *Wrong.* That would be C = 40.
- D. Cannot be calculated without knowing flow. — *Wrong.* This is the deterministic relationship.

**Q2.** *A PCV patient's PIP alarm has never fired, but his Vt has dropped from 480 to 270 over six hours. The most likely cause is:*
- A. The vent is broken. — *Unlikely* — PIP alarm wouldn't fire in PCV anyway.
- B. Worsening compliance, increased resistance, or both. — **Correct.** (Book Ch. 9.) In PCV the PIP is *fixed*; Vt collapse is the only warning of worsening mechanics.
- C. The patient is over-sedated. — *Wrong.* Sedation doesn't change Vt at a fixed PINSP.
- D. Migrated endotracheal tube into the right mainstem. — *Possible* but would also raise plat dramatically; first instinct is mechanics.

**Q3.** *Inverse-ratio ventilation (I:E ≥ 1:1) in PCV is:*
- A. Always required in severe ARDS. — *Wrong.* It is a niche maneuver.
- B. Used occasionally for severe hypoxemia, but requires heavy sedation. — **Correct.** (Book Ch. 9.) Owens: "Try breathing in for two seconds and out for one — this is uncomfortable."
- C. Standard for all PCV settings. — *Wrong.* Normal I:E is 1:2 to 1:4.
- D. Used to reduce peak pressures. — *Wrong.* It actually raises mean airway pressure.

**Q4.** *Which is the WORST patient for PCV?*
- A. A stable ARDS patient on chronic vent. — *Wrong.* PCV is fine here.
- B. A status asthmaticus patient with rising resistance. — **Correct.** (Book Ch. 15.) In severe bronchospasm, rising resistance silently drops Vt in PCV; VCV is the mode of choice.
- C. A post-op patient with normal lungs. — *Wrong.* PCV is fine.
- D. A weaning candidate. — *Wrong.* PSV is the answer for a weaning candidate; PCV isn't *worse* than other A/C modes.

**Q5.** *Driving pressure in a PCV patient is measured by:*
- A. Reading the PINSP directly. — *Wrong.* PINSP includes resistance.
- B. Performing an inspiratory hold to obtain plat, then subtracting PEEP. — **Correct.** (Book Ch. 9.) The hold equilibrates airway pressures; plat - PEEP is the DP regardless of mode.
- C. Looking at the peak inspiratory flow. — *Wrong.* Unrelated.
- D. It cannot be measured in PCV. — *Wrong.* Common myth.

#### Key points

- PCV guarantees PINSP and I-time. Vt is the dependent variable.
- Vt = PINSP × Compliance, approximately. As compliance changes, Vt swings.
- The PIP alarm does not warn you in PCV — the low-Vt alarm does.
- PINSP is the rise above PEEP. Driving pressure is plat minus PEEP. Not the same.
- In severe bronchospasm, choose VCV — PCV will silently underventilate as resistance rises.

---

### M9 — PRVC and Dual-Control Ventilation

**Track:** Modes · **Archetype:** outcome with sandbox exploration · **Est. minutes:** 20 · **Anchor chapters:** [VB Ch. 9]

#### Learning objectives

By the end of M9, the learner can:
- State what PRVC does: targets a set Vt by adjusting PINSP on a breath-by-breath basis.
- Distinguish PRVC from VCV (flow pattern) and from PCV (closed-loop target).
- Predict when PRVC's adaptive PINSP is helpful (changing compliance) and when it's harmful (strong patient drive — "pulling away" lowers PINSP and starves the next breath).
- Recognize the "yo-yo" dyssynchrony pattern of dual-control modes.

#### Book anchor

Owens, Ch. 9 ("Dual-Control Modes"): PRVC = pressure-regulated volume control; trade names PRVC (Maquet), CMV with Autoflow (Drager), VC+ (Puritan-Bennett); ventilator adjusts PINSP to hit set Vt with the lowest pressure; the failure mode is the air-hungry patient who pulls big breaths, makes the vent *lower* PINSP, then the next several breaths are short, the patient compensates with quick small efforts, and the vent ramps PINSP back up. The pressure and Vt yo-yo. The clinician thinks the patient is "fighting the vent." The fix is to switch to plain VCV or plain PCV.

**Maxims tested:**
1. PRVC = volume target, pressure delivery. Best of both — until it isn't.
2. PRVC adjusts PINSP every few breaths. The clinician sees Vt steady but PINSP changing.
3. The PRVC failure pattern: strong patient drive → vent lowers support → patient becomes more agitated → diagnostic clue is *cycling* PINSP.
4. Fix the PRVC failure by going to a non-adaptive mode (VCV or PCV) and addressing the cause of agitation.

#### Patient preset

```
mode: PRVC
heightInches: 70
gender: male
tidalVolume: 450              # target volume
respiratoryRate: 14
peep: 8
fiO2: 0.45
iTime: 1.0
compliance: 30                # ARDS-pattern
resistance: 12
spontaneousRate: 0            # passive initially; perturbation flips to 24
```

**Rationale.** Looks identical to a PCV preset but the mode is PRVC. The vent will compute a starting PINSP of ~18 to hit Vt 450. The Try-It task introduces a perturbation — patient drive rises to 24 — and the adaptive logic produces the yo-yo. The learner's job is to *recognize the pattern and switch modes*.

#### Unlocked controls

`tidalVolume`, `respiratoryRate`, `peep`, `fiO2`, `iTime`, `mode`. **`mode` is unlocked here** — this is the one module where switching mode is the correct intervention.

#### Pin list

- **compliance: 30, resistance: 12** — DO NOT CHANGE. Tracker relies on these to make the adaptive PI cycle land in the expected band.
- **Perturbation script:** at 30 seconds of Try-It phase, set `spontaneousRate: 24` and `effortAmplitude: high`. PRVC adaptive logic must produce a PINSP swing of ≥4 cmH2O over 6 breaths. If it doesn't, the sim is mistuned — this is the user-flagged sim limitation noted in v3 master shell.

#### Hidden objective

```yaml
tracker_type: compound
required:
  - measurement: mode
    operator: equals
    value: ["VCV", "PCV"]      # learner must SWITCH OUT of PRVC
  - measurement: PinspSwing6
   # custom tracker: max PINSP - min PINSP over last 6 breaths, before the switch
    operator: gte
    value: 4
    capture_pre_switch: true   # i.e., the swing must have been observed BEFORE mode change
sustain_breaths: 3              # 3 breaths in the new mode
reset_between: false
```

**Rationale.** Two conditions: (a) the learner must have observed the dyssynchrony (PINSP swing ≥4 captured before the switch), and (b) the learner must respond by switching to a non-adaptive mode. Both required — switching without observing is lucky guess; observing without switching is non-response.

#### User-facing task

> **Recognize and respond to PRVC dyssynchrony.** Your patient is on PRVC with a target Vt of 450. He's been comfortable. After about 30 seconds, his respiratory drive will increase. Watch the PINSP trace. If you see the PINSP cycling up and down by more than 4 cmH2O — that's the dual-control yo-yo. Switch the mode to VCV or PCV to stop it. Hold the new mode for 3 breaths.

**Success criteria (displayed):**
- PINSP swing of ≥4 cmH2O observed
- Mode switched from PRVC to VCV or PCV
- Held in new mode for 3 breaths

#### Primer (3 MCQs)

**P1.** *PRVC differs from PCV in that:*
- A. PRVC uses constant flow; PCV uses decelerating flow. — *Wrong.* Both deliver decelerating flow.
- B. PRVC adjusts PINSP breath-by-breath to hit a target Vt; PCV does not. — **Correct.** (Book Ch. 9.) That's the adaptive-control feature.
- C. PRVC has no I-time setting. — *Wrong.* PRVC requires Vt, rate, and I-time.
- D. PRVC guarantees a constant peak pressure. — *Wrong.* The opposite — peak pressure changes as the vent adapts.

**P2.** *In PRVC, the ventilator adjusts the inspiratory pressure when:*
- A. The patient's compliance changes. — **Correct.** (Book Ch. 9.) That's the design intent.
- B. The patient's tidal volume changes. — **Correct, related.** The vent measures the resulting Vt and adjusts PINSP to keep it at the target. *(This is the cleanest answer to mark correct; A is the cause, B is the mechanism the vent actually senses.)*
- C. The clinician changes the target Vt. — *True but trivial.*
- D. The patient triggers a breath. — *Wrong.* Triggering does not, by itself, change the adaptive logic.

*(Note for the implementer: P2 should mark B as the correct answer. A is *also* defensible; you can show "B is more precise" in the explanation.)*

**P3.** *A patient on PRVC with target Vt 500 develops air hunger. Over 30 seconds, you watch his PINSP fall from 18 to 10, then climb back to 22, then fall again. The most likely interpretation is:*
- A. The vent is malfunctioning. — *Wrong.* This is normal PRVC behavior under heavy patient effort.
- B. The patient is yo-yoing the adaptive logic: he pulls a big breath, the vent reads "compliance improved" and lowers PINSP, then his next breaths are short and the vent compensates by raising PINSP. — **Correct.** (Book Ch. 9, dual-control failure mode.)
- C. The compliance is rapidly changing. — *Unlikely* — physiology rarely oscillates at this frequency.
- D. The PEEP is unstable. — *Wrong.* PEEP is fixed.

#### Read phase

1. **Opening prose (~140 words).** PRVC and its cousins (CMV-Autoflow, VC+) try to give you the best of VCV and PCV. You set the Vt you want, and the vent figures out the PINSP needed to deliver it, breath by breath, using a decelerating flow. When compliance improves, PINSP drops. When compliance worsens, PINSP rises. Most of the time, that's a feature.

2. **Callout (info)** — *"PRVC is a pressure-control mode for people who don't like pressure-control. It's the same delivery pattern; it just has a closed-loop volume target on top."*

3. **Predict-observe** — *Predict:* a patient on PRVC has a strong drive and pulls a 900 mL breath when the target was 500. What does the vent do next? *Observe:* it interprets the big breath as improved compliance and lowers PINSP. The next several breaths are small (because PINSP is now low and the patient's effort wasn't enough by itself). The patient gets more agitated. The vent ramps PINSP back up.

4. **Callout (warn)** — *"The fix for PRVC dyssynchrony is *not* to add sedation. The fix is to switch to a non-adaptive mode (VCV or PCV) and then address why the patient was agitated."*

#### Explore card

**Patient context.** ARDS, compliance 30, on PRVC with target Vt 450.

**Unlocked controls.** Vt 300-600; Rate 8-30; PEEP 0-18; FiO2 0.30-0.80; mode; **effortAmplitude** (sandbox).

**Try these.**
- Raise effortAmplitude to "high." Watch PINSP swing.
- Switch mode to VCV with the same Vt. Peak pressure becomes stable, Vt becomes constant.
- Switch mode to PCV with PINSP 20. Pressure is constant, Vt becomes variable.

#### Hint ladder

- **Tier 1** — *"Watch the PINSP trace, not the Vt trace. PRVC keeps Vt constant by *changing* PINSP."*
- **Tier 2** — *"If you've watched the PINSP cycle by 4+ cmH2O over a few breaths, you've seen the pattern. Now change the mode — VCV or PCV — to break the loop."*
- **Tier 3** — *demonstrates* the swing for 6 breaths, then proposes a mode switch and prompts the learner to confirm.

#### Summative (5 questions)

**Q1.** *PRVC is best described as:*
- A. A constant-flow volume-control mode. — *Wrong.* Decelerating flow.
- B. A pressure-control mode with a closed-loop volume target. — **Correct.** (Book Ch. 9.)
- C. A spontaneous mode with no rate. — *Wrong.* That's PSV.
- D. A high-frequency mode. — *Wrong.*

**Q2.** *The adaptive PINSP logic in PRVC is most likely to be problematic in:*
- A. A heavily sedated post-cardiac arrest patient. — *Wrong.* No drive; the adaptive logic is stable.
- B. A patient with strong respiratory drive and air hunger. — **Correct.** (Book Ch. 9.) Drive perturbs the volume measurement, the vent over-corrects, and the loop oscillates.
- C. A patient with stable compliance and no drive. — *Wrong.* PRVC is perfect here.
- D. A weaning candidate. — *Possibly* — but PSV is the answer for weaning, not PRVC.

**Q3.** *A PRVC patient shows Vt of 500 ± 30 mL, but PINSP cycling between 12 and 22. The correct response is:*
- A. Add sedation. — *Wrong.* This treats the symptom only.
- B. Increase the Vt target. — *Wrong.* Doesn't address the loop oscillation.
- C. Switch to VCV or PCV; then evaluate the patient for the cause of the air hunger. — **Correct.** (Book Ch. 9.)
- D. Raise the FiO2. — *Wrong.*

**Q4.** *Which is TRUE about dual-control modes generally (PRVC, VC+, CMV-Autoflow)?*
- A. They eliminate the need to set a tidal volume. — *Wrong.* The Vt is what you set.
- B. They deliver volume-targeted breaths with decelerating flow. — **Correct.** (Book Ch. 9.)
- C. They use constant flow. — *Wrong.*
- D. They are equivalent to SIMV. — *Wrong.* Different concept entirely.

**Q5.** *The peak airway pressure in a PRVC breath:*
- A. Is fixed by the clinician. — *Wrong.* PINSP is set by the vent.
- B. Varies as the vent adapts to deliver the target Vt. — **Correct.** (Book Ch. 9.)
- C. Equals the plateau pressure exactly. — *Wrong.*
- D. Is unrelated to compliance. — *Wrong.*

#### Key points

- PRVC = volume target, pressure delivery, breath-by-breath adaptive PINSP.
- When compliance is stable and drive is absent, PRVC is excellent.
- When drive is strong, PRVC can oscillate — the "yo-yo." Recognize it by watching PINSP, not Vt.
- The fix is to switch to a non-adaptive mode (VCV or PCV), then treat the cause of agitation.
- The peak airway pressure in PRVC is *not* something you set; it's what the vent delivers.


---

### M10 — Pressure Support Ventilation

**Track:** Modes · **Archetype:** outcome with patient-feedback loop · **Est. minutes:** 18 · **Anchor chapters:** [VB Ch. 11, Ch. 13]

#### Learning objectives

By the end of M10, the learner can:
- State that PSV has *no set rate*. The patient breathes; the vent boosts.
- Titrate PSV by watching the patient: target spontaneous rate <25, spontaneous Vt 6-8 mL/kg PBW.
- Identify "too much PS" (Vt too large, rate too slow, patient too comfortable) and "too little PS" (Vt small, rate fast, accessory muscle use).
- Name the patients PSV is *wrong* for: deeply sedated, paralyzed, shocked, ARDS, unreliable drive.

#### Book anchor

Owens, Ch. 11 ("Pressure Support Ventilation"): PSV is a *recovery mode*; patient must have a competent drive; no set rate. The vent senses the patient's effort and applies a set pressure boost. Owens's worked example: a woman on PEEP 5, PS 10, RR 38, Vt 220 — clearly under-supported. Raise PS to 20 — RR 8, Vt 850 — too much. Settle at PS 14 — RR 18, Vt 420. Perfect. **The patient is the titration target, not a number.** Flow-cycled (typically 25-30% of peak flow ends the breath). Ch. 13: triggering — pressure trigger 1-3 cmH2O or flow trigger 1-4 L/min.

**Maxims tested:**
1. PSV has no rate. The patient's rate is the patient's rate.
2. Titrate by looking at the patient — RR, Vt, accessory muscles, comfort.
3. Once PS ≤10 with comfortable breathing, you're at SBT territory.
4. PSV is wrong for the shocked, the paralyzed, the deeply sedated, and the unreliable.

#### Patient preset

```
mode: PSV
heightInches: 70
gender: male
PSupport: 18                  # too high — Vt will be large, RR slow
peep: 5
fiO2: 0.40
compliance: 55                # near-normal — patient is recovering
resistance: 10
spontaneousRate: 12           # the patient's own rate
effortAmplitude: medium
```

**Rationale.** Recovering patient, day 3 post-pneumonia. The clinician set PS at 18 (too generous). The learner's job is to titrate PS down based on the patient's response.

#### Unlocked controls

`PSupport`, `peep`, `fiO2`. Rate is NOT a setting in PSV — that should be visible.

#### Pin list

- **compliance: 55, spontaneousRate: 12 (base), effortAmplitude: medium** — DO NOT CHANGE. The sim's PSV behavior is tuned so that PS 10-14 yields Vt 380-470 and spont RR 16-22. If these change, the tracker thresholds need to be re-tuned.

#### Hidden objective

```yaml
tracker_type: outcome
target_state:
  - measurement: PSupport
    operator: between
    min: 10
    max: 14
  - measurement: spontaneousRate
    operator: between
    min: 14
    max: 24
  - measurement: tidalVolume
    operator: between
    min: 380
    max: 480
sustain_breaths: 5
reset_between: false
show_progress_chip: true
```

#### User-facing task

> **Titrate PSV by watching the patient.** Your patient is on PSV with PS 18. He looks too comfortable — Vt is big and his RR is low. Dial PS down until his spontaneous RR is 14-24 and his Vt is in the lung-protective range. Hold for 5 breaths.

**Success criteria (displayed):**
- PS support 10-14 cmH2O
- Spontaneous RR 14-24
- Spontaneous Vt 380-480 mL
- Sustained for 5 breaths

#### Primer (3 MCQs)

**P1.** *In PSV, the set ventilator rate is:*
- A. 12 breaths per minute. — *Wrong.* There is no set rate.
- B. Determined by the patient's underlying drive — there is no set rate. — **Correct.** (Book Ch. 11.) That's the defining feature of PSV.
- C. The same as in A/C. — *Wrong.*
- D. Calculated from the minute ventilation. — *Wrong.*

**P2.** *A PSV patient has PEEP 5, PS 10, RR 38, Vt 220 mL. The correct interpretation is:*
- A. Adequate support — leave as is. — *Wrong.* Owens's example: this patient is under-supported.
- B. Under-supported — the patient is taking shallow fast breaths. Raise PS. — **Correct.** (Book Ch. 11.)
- C. Over-supported — lower PS. — *Wrong.* Direction is reversed.
- D. Switch to A/C. — *Defensible* if PSV isn't working, but the first move is to raise PS.

**P3.** *Which patient should NOT be on PSV?*
- A. A 60-year-old with pneumonia, day 4, alert and following commands. — *Wrong.* Good PSV candidate.
- B. A 30-year-old post-operative awakening from anesthesia. — *Wrong.* Good candidate as anesthesia clears.
- C. A 45-year-old in septic shock on norepinephrine 0.3 mcg/kg/min, intubated 1 hour ago. — **Correct.** (Book Ch. 11, Commandment VIII.) Shocked, fresh intubation — needs A/C.
- D. A 70-year-old extubation candidate. — *Wrong.* Ideal PSV candidate.

#### Read phase

1. **Opening prose (~150 words).** PSV is the recovery mode. The patient has a working brain and a working diaphragm, but his lungs or his strength aren't quite back to baseline. You set a pressure boost — typically 10-15 cmH2O above PEEP — and the patient does the rest. He breathes when he wants to; he breathes as much as he wants. The vent just makes each breath a little easier.

2. **Callout (info)** — *"There is no rate in PSV. The number on the screen labeled RR is whatever the patient is doing."*

3. **Predict-observe** — `awaits_control: PSupport` — *Predict:* you'll raise PS from 18 to 24. What happens to the patient's spontaneous Vt and RR? *Observe:* Vt rises (each boosted breath is larger), and his rate falls (he can ride the boosted breaths longer between efforts).

4. **Callout (warn)** — *"PSV is wrong for the unreliable patient. Drug overdose, brainstem stroke, status epilepticus, neuromuscular disease — these patients lose their drive intermittently. The vent will sit there and watch."*

5. **Formative (check yourself)** — *"You raise PS from 10 to 20 in an air-hungry patient. His tidal volumes go from 200 to 850 mL. His rate drops from 38 to 8. The correct interpretation is:* (a) ideal — leave; (b) **over-supported — lower PS back to ~14 for a Vt in the 6-8 mL/kg range**; (c) under-supported."*

#### Explore card

**Patient context.** Day 3 post-pneumonia, alert. The patient *is* the readout.

**Unlocked controls.** PS 0-25; PEEP 0-12; FiO2 0.21-0.50.

**Try these.**
- Set PS to 25. Patient is "too comfortable" — RR drops, Vt overshoots.
- Set PS to 5. Patient is "working too hard" — RR climbs, Vt small.
- Find the sweet spot around PS 12. RR 18, Vt 420. Hold.
- Set PS to 8 (extubation threshold). If patient still looks fine, he's an SBT candidate.

#### Hint ladder

- **Tier 1** — *"His Vt is too big and his rate is too slow. He's over-supported."*
- **Tier 2** — *"Drop PS by 4 cmH2O at a time. Pause 30 seconds. Look at his rate and Vt. Repeat until you're around PS 12-14."*
- **Tier 3** — *demonstrates* a PS step from 18 to 14, holds, prompts the learner to confirm chip.

#### Summative (5 questions)

**Q1.** *The flow-cycle threshold that ends a PSV breath is typically:*
- A. 100% of peak flow. — *Wrong.*
- B. 50% of peak flow. — *Close but not standard.*
- C. 25-30% of peak flow. — **Correct.** (Book Ch. 14.) Below this, the vent recognizes the patient has finished inhaling.
- D. Zero flow. — *Wrong.*

**Q2.** *A patient on PSV with PS 14 has RR 28, Vt 320 mL, with accessory muscle use. The next move is:*
- A. Extubate — looks ready. — *Wrong.* Tachypneic, shallow.
- B. Raise PS to 18. — **Correct.** Under-supported.
- C. Lower PS to 8. — *Wrong.*
- D. Add sedation. — *Wrong.*

**Q3.** *Owens identifies the threshold PS for considering an SBT as:*
- A. <5 cmH2O. — *Wrong.*
- B. <10 cmH2O. — **Correct.** (Book Ch. 11.)
- C. <20 cmH2O. — *Wrong.*
- D. There's no specific threshold. — *Wrong — Owens names a number.*

**Q4.** *Which is FALSE about PSV?*
- A. There is no set rate. — *True.*
- B. It is appropriate for paralyzed patients. — **FALSE — correct answer.** (Book Ch. 11.) Paralyzed patients have no drive; they need A/C.
- C. Vt depends on PS, PEEP, compliance, and patient effort. — *True.*
- D. It is flow-cycled. — *True.*

**Q5.** *In PSV, the tidal volume tends to fall when:*
- A. PEEP is increased. — *Indirectly possible, not the textbook answer.*
- B. The patient's compliance worsens or his effort weakens. — **Correct.** (Book Ch. 11.) PSV's variable Vt is the early-warning sign of fatigue.
- C. The trigger is changed from pressure to flow. — *Wrong.*
- D. The flow-cycle threshold is changed from 25% to 50%. — *Could affect timing but not the primary issue.*

#### Key points

- PSV has no set rate. The patient's drive is the rate.
- Titrate PS by looking at the patient: RR 14-24, Vt 6-8 mL/kg, comfortable breathing.
- PS <10 with comfortable breathing = SBT candidate.
- PSV is wrong for the shocked, the paralyzed, the deeply sedated, the unreliable-drive patient.

---

### M11 — Dyssynchrony Recognition

**Track:** Modes · **Archetype:** recognition (click-target) · **Est. minutes:** 16 · **Anchor chapters:** [VB Ch. 14, Ch. 13]

> **Sim limitation note.** Of the five Owens dyssynchrony patterns, the current sim renders two well (double-triggering, ineffective triggering when auto-PEEP is high). It renders flow starvation and reverse triggering only schematically. This module restricts the click-targets to patterns the sim *can* render faithfully — see the click-target list under Hidden Objective. If the user adds waveform rendering for the others later, the spec extends accordingly.

#### Learning objectives

By the end of M11, the learner can:
- Recognize *ineffective triggering* on the pressure-time waveform: patient effort produces a downward deflection but no breath.
- Recognize *double triggering*: two stacked breaths with no expiration between.
- Recognize *flow starvation* (schematic): scooped-out pressure waveform during inspiration.
- Name the first-line corrective action for each pattern.

#### Book anchor

Owens, Ch. 14 ("Patient-Ventilator Dyssynchrony"): three buckets — (1) ineffective/inappropriate triggering, (2) inadequate inspiratory assistance, (3) inappropriate breath termination. Five common patterns: ineffective triggering (auto-PEEP, weak drive), double triggering (patient wants more than the set Vt — common in lung-protective Vt with strong drive), flow starvation (vent doesn't deliver fast enough — patient sucks the line), too-long I-time, and auto-cycling (circuit problem, not patient). The fixes are mode-specific and pattern-specific, but the common thread is *recognize before sedating*. Sedation is the wrong instinct — fix the mismatch first.

**Maxims tested:**
1. Ineffective triggering → look for auto-PEEP first (or weak drive second).
2. Double triggering with lung-protective Vt → raise Vt (or switch to PCV).
3. Flow starvation → shorten I-time or change to constant flow.
4. The first thing to do when "the patient is fighting the vent" is recognize *which* pattern.

#### Patient preset

This module uses a **fixed sequence of three patient scenarios**, each presented with a pre-rendered waveform clip. The sim does not need to generate them live — they are stored waveform snippets.

```
scenarios:
  - id: M11-s1-ineffective
    waveform: clips/dyssyn_ineffective.svg
    context: "65 yo with COPD on VCV. Auto-PEEP measured 9 cmH2O."
    correct_label: "ineffective_triggering"
  - id: M11-s2-double
    waveform: clips/dyssyn_double.svg
    context: "35 yo ARDS on VCV Vt 400 (6 mL/kg), strong respiratory drive."
    correct_label: "double_triggering"
  - id: M11-s3-starvation
    waveform: clips/dyssyn_starvation.svg
    context: "50 yo asthma on PRVC, air hunger."
    correct_label: "flow_starvation"
```

**Rationale.** The patterns require waveform recognition. Live simulation isn't necessary; static SVG clips with annotations are sufficient.

#### Unlocked controls

None — this is a click-target / labeling module.

#### Pin list

- **clip file paths must exist in /public/clips/** — DO NOT CHANGE without re-rendering the SVGs.

#### Hidden objective

```yaml
tracker_type: recognition
required_labels:
  - scenario: M11-s1-ineffective
    correct: "ineffective_triggering"
    distractors: ["normal", "double_triggering", "auto_cycling"]
  - scenario: M11-s2-double
    correct: "double_triggering"
    distractors: ["normal", "ineffective_triggering", "flow_starvation"]
  - scenario: M11-s3-starvation
    correct: "flow_starvation"
    distractors: ["normal", "too_long_itime", "double_triggering"]
all_required: true
```

#### User-facing task

> **Recognize the dyssynchrony pattern.** Three patients in a row. For each, look at the waveform clip and the bedside context, and select the dyssynchrony pattern. You must get all three correct in one pass.

**Success criteria (displayed):**
- Scenario 1: correct label selected
- Scenario 2: correct label selected
- Scenario 3: correct label selected

#### Primer (3 MCQs)

**P1.** *"The patient is fighting the vent." The FIRST step is to:*
- A. Increase sedation. — *Wrong.* That's the reflexive answer. It's also often the wrong one.
- B. Increase neuromuscular blockade. — *Wrong.*
- C. Bag the patient off the vent, then examine and check vent settings. — **Correct.** (Book Ch. 14.) DOPES rule-out, then look for a synchrony pattern.
- D. Switch the mode to APRV. — *Wrong.*

**P2.** *Ineffective triggering on the pressure waveform looks like:*
- A. A second breath stacked immediately on the first. — *Wrong, that's double triggering.*
- B. A downward deflection (patient effort) with no corresponding breath delivery. — **Correct.** (Book Ch. 14.)
- C. A scooped-out pressure waveform during inspiration. — *Wrong, that's flow starvation.*
- D. A high-frequency oscillation in the expiratory phase. — *Wrong.*

**P3.** *Double triggering most commonly occurs because:*
- A. The patient wants more Vt than the vent is set to deliver. — **Correct.** (Book Ch. 14.) Common in low-Vt protocols with strong drive.
- B. The trigger sensitivity is too low. — *Less common — it would cause ineffective triggering, not double.*
- C. The PEEP is too high. — *Wrong.*
- D. The expiratory valve is stuck. — *Wrong.*

#### Read phase

1. **Opening prose (~140 words).** When a vented patient looks uncomfortable, the reflex is to push the sedation dial. Resist. The patient is telling you something. Owens groups dyssynchronies into three buckets — bad triggering, bad assistance, bad termination — and within those, five common patterns recur in the ICU. The waveform tells you which one.

2. **Callout (info)** — *"The DOPES rule-out comes first. Then read the waveform."*

3. **Pattern atlas (static reference, not a tracker).** Three reference clips with annotation:
   - *Ineffective triggering:* small dip in pressure, no breath. Caused by auto-PEEP (most often) or weak drive.
   - *Double triggering:* one Vt delivered, exhalation absent, second Vt stacked. Caused by Vt < patient demand.
   - *Flow starvation:* during inspiration, the pressure waveform scoops downward. Caused by inspiratory flow rate insufficient for the patient's pull.

4. **Callout (warn)** — *"Each pattern has a different fix. Sedation 'fixes' all of them by silencing the patient — which is exactly what you don't want until you've corrected the mismatch."*

#### Explore card

**Patient context.** Three reference clips with labels and fix recommendations.

**Try these.** *(In the explore phase, these scenarios are shown as labeled examples, not unlabeled tests.)*
- Ineffective triggering: try lowering ventilator rate to give more time for exhalation. If auto-PEEP falls, triggering becomes easier.
- Double triggering: try raising Vt from 400 to 500. If pattern resolves, the patient's effort was the cause.
- Flow starvation: try shortening I-time from 1.0 to 0.7. If pressure waveform smooths, the flow was the issue.

#### Hint ladder

- **Tier 1** — *"Each pattern has one distinctive waveform feature. Look at the pressure waveform."*
- **Tier 2** — *"Ineffective: dip with no breath. Double: two breaths stacked. Starvation: scoop in inspiratory pressure."*
- **Tier 3** — *highlights* the distinctive feature on the current clip with a callout arrow.

#### Summative (5 questions)

**Q1.** *Ineffective triggering in a COPD patient is most likely due to:*
- A. The pressure trigger is set too high. — *Possible secondary cause.*
- B. Auto-PEEP — the alveolar pressure exceeds the airway pressure, so the patient must generate a larger negative pressure to trigger. — **Correct.** (Book Ch. 13, Ch. 14.)
- C. Excessive sedation. — *Possible but not the FIRST cause in COPD.*
- D. The endotracheal tube is too small. — *Wrong.*

**Q2.** *Double triggering during low-Vt ARDS ventilation is best addressed by:*
- A. Increasing sedation. — *Wrong reflex.*
- B. Raising Vt or switching to PCV. — **Correct.** (Book Ch. 14.) Match the vent to the patient's demand.
- C. Decreasing PEEP. — *Wrong.*
- D. Lowering the rate. — *Wrong.*

**Q3.** *Flow starvation in a patient on PRVC is best addressed by:*
- A. Increasing PEEP. — *Wrong.*
- B. Shortening I-time, or changing to constant inspiratory flow. — **Correct.** (Book Ch. 14.)
- C. Adding paralytic. — *Wrong.*
- D. Switching to PSV. — *Possible, but not first.*

**Q4.** *A scooped-out, downward deflection in the inspiratory pressure waveform represents:*
- A. Ineffective triggering. — *Wrong.*
- B. Flow starvation. — **Correct.** (Book Ch. 14.)
- C. Auto-cycling. — *Wrong.*
- D. Expiratory dyssynchrony. — *Wrong.*

**Q5.** *The reflexive response to "patient fighting the vent" is sedation. Owens's preferred sequence is:*
- A. Sedate first, troubleshoot later. — *Wrong.*
- B. Bag off the vent → DOPES rule-out → assess waveforms → match the fix to the pattern. — **Correct.** (Book Ch. 14.)
- C. Switch to APRV. — *Wrong.*
- D. Call the attending. — *Wrong (not in this textbook).*

#### Key points

- Sedation is not the first answer when the patient is fighting the vent.
- Bag off the vent and run DOPES; then read the waveform.
- Ineffective triggering → look for auto-PEEP.
- Double triggering → patient wants more Vt; raise it or switch to PCV.
- Flow starvation → shorten I-time or switch to constant flow.

---

### M12 — SIMV and Hybrid Modes

**Track:** Modes · **Archetype:** outcome with combined-effect titration · **Est. minutes:** 14 · **Anchor chapters:** [VB Ch. 10]

#### Learning objectives

By the end of M12, the learner can:
- Distinguish SIMV from A/C: in SIMV, *spontaneous* breaths get no machine support (unless PS is added).
- Identify the failure mode of SIMV: a weak patient pulling sub-dead-space spontaneous Vt between mandatory breaths.
- Set SIMV with appropriate PS: mandatory rate 12-14, mandatory Vt 6 mL/kg, PS 8-12.
- State that SIMV has *no proven weaning advantage* over A/C with daily SBTs.

#### Book anchor

Owens, Ch. 10 ("Synchronized Intermittent Mandatory Ventilation"): SIMV gives mandatory breaths at the set rate; *spontaneous* breaths between mandatory breaths are *not* augmented unless PS is added. The failure mode: weak patient pulls 150-200 mL spontaneous breaths — "barely more than anatomic dead space." Wasted ventilation, fatigue. Adding PS to spontaneous breaths fixes this. Owens's clinical bottom line: SIMV was originally promoted as a weaning mode; it has *no proven advantage* over daily SBT. "There is nothing wrong with SIMV as long as you pay attention to the work of breathing." Initial setup: mandatory rate 12-18, mandatory Vt 6-8 mL/kg, PS 10 default; raise PS if spontaneous Vt is < 3-4 mL/kg.

**Maxims tested:**
1. SIMV mandatory breaths are like A/C; *spontaneous* breaths are like PSV or worse.
2. Without PS, spontaneous SIMV breaths can be dead-space ventilation.
3. The daily SBT, not the mode of ventilation, is what gets patients off the vent.
4. The right SIMV setup includes both a mandatory Vt and a PS for spontaneous breaths.

#### Patient preset

```
mode: SIMV
heightInches: 70
gender: male
tidalVolume: 450               # mandatory breath Vt
respiratoryRate: 10            # mandatory rate — DELIBERATELY low
PSupport: 0                    # no PS — DELIBERATELY missing
peep: 5
fiO2: 0.40
compliance: 45
resistance: 12
spontaneousRate: 18            # patient breathes 18 over a mandatory rate of 10
effortAmplitude: low           # weak — important for the failure pattern
```

**Rationale.** Patient is recovering from sepsis, has some drive but is weak. SIMV rate is set at 10 with no PS. The patient triggers 18 breaths/min — 10 mandatory, 8 spontaneous. The spontaneous breaths are tiny (~150 mL). The learner's job is to add PS so spontaneous Vt rises.

#### Unlocked controls

`tidalVolume`, `respiratoryRate`, `PSupport`, `peep`, `fiO2`.

#### Pin list

- **compliance: 45, effortAmplitude: low** — DO NOT CHANGE. The sim's spontaneous Vt for this patient profile is ~140-180 mL with no PS; ~380-450 mL with PS 12.
- **mandatory rate floor: 10** — must be allowed.

#### Hidden objective

```yaml
tracker_type: outcome
target_state:
  - measurement: PSupport
    operator: between
    min: 8
    max: 14
  - measurement: spontaneousTidalVolume
    operator: gte
    value: 320              # ~4.5 mL/kg PBW
  - measurement: mandatoryTidalVolume
    operator: between
    min: 410
    max: 470                # 6 mL/kg
sustain_breaths: 5
reset_between: false
show_progress_chip: true
```

#### User-facing task

> **Fix the SIMV setup.** Your patient has spontaneous breaths between mandatory breaths, but the spontaneous Vt is only ~150 mL — barely more than dead space. Add pressure support so the spontaneous breaths are adequate. The mandatory Vt should stay at 6 mL/kg PBW.

**Success criteria (displayed):**
- PS support 8-14 cmH2O
- Spontaneous Vt ≥320 mL
- Mandatory Vt 410-470 mL
- Sustained for 5 breaths

#### Primer (3 MCQs)

**P1.** *In SIMV with no pressure support, a spontaneous breath delivers:*
- A. The set mandatory Vt. — *Wrong. That's A/C behavior.*
- B. Whatever the patient can pull on his own. — **Correct.** (Book Ch. 10.) That's the defining difference from A/C.
- C. A small boost equal to PS 5. — *Wrong, only if PS is set.*
- D. The same Vt as the previous mandatory breath. — *Wrong.*

**P2.** *A patient on SIMV (rate 10, Vt 450) has spontaneous Vt of 160 mL at rate 30. The most likely consequence over hours is:*
- A. Adequate gas exchange. — *Wrong.* Spontaneous Vt is at anatomic dead space.
- B. Respiratory muscle fatigue and CO2 retention. — **Correct.** (Book Ch. 10.) Wasted ventilation.
- C. Improved weaning trajectory. — *Wrong.*
- D. Reduced auto-PEEP. — *Wrong.*

**P3.** *SIMV has been studied for weaning. The evidence shows that compared to daily SBTs, SIMV-based weaning is:*
- A. Faster. — *Wrong.*
- B. Slower or no better. — **Correct.** (Book Ch. 10, multiple trials including Brochard, Esteban.)
- C. Equivalent. — *Mostly true, but Owens notes SIMV is *not* faster.*
- D. Superior in COPD. — *Wrong.*

#### Read phase

1. **Opening prose (~140 words).** SIMV looks like A/C with extra rules. The vent delivers a fixed number of mandatory breaths per minute — at the set Vt or PINSP. Between mandatory breaths, the patient can breathe spontaneously. But unlike A/C, those spontaneous breaths are *not* automatically supported. The patient pulls whatever volume he can pull, and that's what he gets.

2. **Callout (info)** — *"In SIMV, the mandatory breaths are A/C-like. The spontaneous breaths are PSV-like — but only if you've set a PS."*

3. **Predict-observe** — `awaits_control: PSupport` — *Predict:* you'll add PS 12 to a patient pulling 160 mL spontaneous breaths. What happens? *Observe:* spontaneous Vt rises into the 400s.

4. **Callout (warn)** — *"SIMV was sold as a weaning mode. It isn't. The daily SBT is. SIMV is fine — pay attention to the work of breathing."*

#### Explore card

**Patient context.** Sepsis-recovery, weak drive.

**Unlocked controls.** Vt 350-600; Rate 6-18; PS 0-20; PEEP 0-12; FiO2 0.30-0.50.

**Try these.**
- Drop mandatory rate to 6, no PS. Spontaneous Vt collapses, patient tachypneic.
- Add PS 14. Spontaneous Vt climbs to ~450.
- Raise mandatory rate to 14, PS 12. Most spontaneous breaths now match mandatory breaths.

#### Hint ladder

- **Tier 1** — *"His mandatory breaths look fine. His spontaneous breaths are too small. What can you add to support them?"*
- **Tier 2** — *"Add pressure support — 10-14 cmH2O is a usual range. Watch the spontaneous Vt rise."*
- **Tier 3** — *demonstrates* setting PS 12, then prompts the learner to confirm.

#### Summative (5 questions)

**Q1.** *The "S" in SIMV stands for:*
- A. Spontaneous. — *Wrong.*
- B. Synchronized. — **Correct.** (Book Ch. 10.) The mandatory breath is delayed to avoid landing during the patient's exhalation.
- C. Supported. — *Wrong.*
- D. Static. — *Wrong.*

**Q2.** *On SIMV with rate 10 and no PS, a weak patient's spontaneous Vt is 180 mL at rate 28. The correct response is:*
- A. Switch to A/C. — *Defensible, but not the first move; PS can fix this.*
- B. Add pressure support 10-12 cmH2O. — **Correct.** (Book Ch. 10.)
- C. Increase the mandatory rate to 20. — *Possible, but eliminates the spontaneous portion.*
- D. Add sedation. — *Wrong.*

**Q3.** *SIMV's claimed advantage over A/C for weaning has been demonstrated to be:*
- A. Faster time to extubation. — *Wrong.*
- B. Less diaphragmatic atrophy. — *Wrong, also unproven.*
- C. No proven advantage; daily SBT is what works. — **Correct.** (Book Ch. 10.)
- D. Lower ICU mortality. — *Wrong.*

**Q4.** *A spontaneous Vt of 150 mL on SIMV represents:*
- A. Adequate ventilation. — *Wrong.*
- B. Near-dead-space ventilation — wasted. — **Correct.** (Book Ch. 10.) Anatomic dead space is ~150-180 mL.
- C. Volume volutrauma risk. — *Wrong.*
- D. Auto-PEEP. — *Wrong.*

**Q5.** *The advantage Owens identifies for SIMV in clinical practice is:*
- A. It's the fastest weaning mode. — *Wrong.*
- B. It prevents diaphragmatic atrophy. — *Wrong.*
- C. It is institutionally familiar and works fine as long as the work of breathing is monitored. — **Correct.** (Book Ch. 10.) Owens's pragmatic answer.
- D. It is the only mode that allows spontaneous breathing. — *Wrong.*

#### Key points

- SIMV: mandatory breaths fully supported, spontaneous breaths unsupported (unless PS added).
- The classic SIMV failure: weak patient pulling sub-dead-space spontaneous Vt.
- The fix is PS, not switching modes.
- SIMV does *not* wean faster than A/C with daily SBTs. There is no proven benefit.

---

## Track 4 — Strategy

The Strategy track is where the workbook earns its residency-level claim. Foundations and Modes give you literacy. Strategy asks you to choose. PEEP for what, and how much? When does the lung-protective recipe diverge from the obstructive recipe? When do you stop chasing PaO2 and let the SpO2 drift to 88%? Every Strategy module forces a multi-axis trade-off the learner has to *land* the patient in.

---

### M13 — PEEP

**Track:** Strategy · **Archetype:** outcome (Style B with secondary risk display) · **Est. minutes:** 22 · **Anchor chapters:** [VB Ch. 12, Ch. 8]

#### Learning objectives

By the end of M13, the learner can:
- State three goals of PEEP: alveolar recruitment, FRC maintenance, LV afterload reduction.
- Set initial PEEP by chest X-ray pattern (clear: 5; scattered: 10; diffuse: 15; whiteout: 20).
- Use the ARDSnet Lower PEEP table to titrate PEEP-FiO2.
- Recognize PEEP-induced hypotension and PEEP-induced overdistension (rising dead space, falling Vt at fixed PINSP, falling PaO2).
- State the major VILI mechanism — *volutrauma*, not barotrauma. PEEP is not the villain.

#### Book anchor

Owens, Ch. 12 ("CPAP, PEEP, and Optimal PEEP"): PEEP recruits and stabilizes alveoli; CXR-guided initial setting (5-20 cmH2O depending on infiltrates); ARDSnet PEEP-FiO2 tables (lower and higher — no proven mortality difference per ALVEOLI 2004); "good enough PEEP" by ARDS severity (mild 5-10, moderate 10-15, severe 15-20); the major complication of excessive PEEP is overdistension → impaired venous return below ~10-12 (or sooner if hypovolemic) and increased dead space (rising PaCO2, falling PaO2). **PEEP is not the major cause of VILI** — volutrauma is. Ch. 8: ARMA. Ch. 3 Commandment VI: "Open the lungs and keep them open."

**Maxims tested:**
1. Set initial PEEP by CXR. Titrate by oxygenation and hemodynamics.
2. Three goals: recruit, splint, afterload-reduce.
3. The complications of too much PEEP are hypotension and dead space.
4. VILI is volutrauma-driven, not PEEP-driven.

#### Patient preset

```
mode: VCV
heightInches: 70
gender: male
tidalVolume: 430
respiratoryRate: 18
peep: 5                       # LOW for this patient's disease
fiO2: 0.70                    # high to compensate
iTime: 1.0
compliance: 32                # moderate ARDS
resistance: 11
PaO2: 58                      # low — needs more recruitment
spontaneousRate: 0
sbpBaseline: 110              # for hemodynamic feedback
```

**Rationale.** Moderate ARDS, scattered-to-diffuse infiltrates on CXR (provided as a context image), but on the LOWER PEEP table column for 70% FiO2 the recommended PEEP is 10. The learner is currently at 5/70%, with PaO2 58 — under-recruited. The task is to climb the table.

#### Unlocked controls

`peep`, `fiO2`. Vt, rate, mode are locked — this is a PEEP module.

#### Pin list

- **compliance: 32, resistance: 11** — DO NOT CHANGE. The PEEP-PaO2 response curve is calibrated to these values.
- **PaO2 response calibration:** PEEP 5 → PaO2 58. PEEP 10 → PaO2 75. PEEP 14 → PaO2 88. PEEP 18 → PaO2 92, BP drops 15 mmHg. PEEP 22 → PaO2 84 (overdistension), BP drops 30 mmHg.

#### Hidden objective

```yaml
tracker_type: outcome
target_state:
  - measurement: peep
    operator: between
    min: 10
    max: 14
  - measurement: PaO2
    operator: between
    min: 65
    max: 90
  - measurement: SBP
    operator: gte
    value: 95          # no significant hemodynamic compromise
sustain_breaths: 5
reset_between: false
show_progress_chip: true
```

#### User-facing task

> **Set PEEP-FiO2 from the ARDSnet table.** Your patient is on PEEP 5, FiO2 0.70, and his PaO2 is 58. CXR shows scattered bilateral infiltrates. Use the ARDSnet Lower PEEP-FiO2 table to climb the ladder until PaO2 is in the 65-90 range. Watch BP — overshooting PEEP causes hypotension.

**Success criteria (displayed):**
- PEEP 10-14 cmH2O
- PaO2 65-90 mmHg
- Systolic BP ≥95 mmHg
- Sustained for 5 breaths

#### Primer (3 MCQs)

**P1.** *Three physiologic effects of PEEP include:*
- A. Alveolar recruitment, FRC maintenance, and left ventricular afterload reduction. — **Correct.** (Book Ch. 12.) These are the *intended* benefits.
- B. Alveolar recruitment, increased venous return, and improved cardiac output. — *Wrong.* PEEP *reduces* venous return.
- C. Lung deflation, bronchodilation, and reduced shunt. — *Wrong.*
- D. Increased PaCO2, decreased PaO2, and decreased work of breathing. — *Wrong.*

**P2.** *On the ARDSnet Lower PEEP-FiO2 table, FiO2 0.70 corresponds to PEEP:*
- A. 5. — *Wrong, that's FiO2 0.30-0.40.*
- B. 10-12. — **Correct.** (Book Ch. 12.) The table lists 70% → 10, 12, or 14 depending on response.
- C. 18-20. — *Wrong, that's FiO2 0.90-1.0.*
- D. There's no specific mapping — use clinical judgment alone. — *Wrong, the table exists.*

**P3.** *The major complication of excessive PEEP is:*
- A. Volutrauma. — *Wrong.* Volutrauma is a tidal volume issue, not a PEEP issue.
- B. Alveolar overdistension causing hypotension and/or increased dead space. — **Correct.** (Book Ch. 12.)
- C. Bronchospasm. — *Wrong.*
- D. Pulmonary embolism. — *Wrong.*

#### Read phase

1. **Opening prose (~160 words).** PEEP is the splint that keeps alveoli open at end-expiration. The lung has a *functional residual capacity* — a reservoir of air that maintains gas exchange even when you're not actively breathing. ARDS and pulmonary edema collapse that reservoir. PEEP rebuilds it.

2. **Callout (info)** — *"Initial PEEP by CXR: clear → 5; scattered infiltrates → 10; diffuse dense → 15; whiteout → 20."*

3. **Predict-observe** — `awaits_control: peep` — *Predict:* you'll raise PEEP from 5 to 12 at FiO2 0.70. *Observe:* PaO2 climbs as alveoli recruit and shunt fraction falls.

4. **Callout (warn)** — *"PEEP-induced hypotension is real but rare below 10-12. If BP drops at PEEP 8 in a sick patient, suspect hypovolemia — fluid bolus first."*

5. **Reference card.** ARDSnet Lower PEEP-FiO2 table (shown inline as a reference). Owens's pragmatic version is in the read panel.

#### Explore card

**Patient context.** Moderate ARDS, day 2.

**Unlocked controls.** PEEP 0-22; FiO2 0.30-1.0.

**Try these.**
- PEEP 0, FiO2 1.0. PaO2 ~50. Pure FiO2 strategy fails — shunt isn't corrected by oxygen alone.
- PEEP 10, FiO2 0.50. PaO2 ~78. The right titration.
- PEEP 20, FiO2 0.40. PaO2 ~88 but BP drops to 85. Overdistension.
- Drop PEEP from 20 to 14. BP recovers, PaO2 in range.

#### Hint ladder

- **Tier 1** — *"At FiO2 0.70, the ARDSnet Lower PEEP table recommends 10-14. You're at 5."*
- **Tier 2** — *"Raise PEEP one step at a time — 5 to 8 to 10 to 12. Pause at each level. Watch PaO2 climb and BP stay stable."*
- **Tier 3** — *demonstrates* PEEP to 10, holds, prompts learner to fine-tune.

#### Summative (5 questions)

**Q1.** *Owens's "good enough PEEP" for moderate ARDS (PaO2/FiO2 101-200) is:*
- A. 0-5. — *Wrong.*
- B. 5-10. — *Wrong, that's mild ARDS.*
- C. 10-15. — **Correct.** (Book Ch. 12.)
- D. 15-20. — *Wrong, that's severe.*

**Q2.** *The ALVEOLI trial compared higher and lower PEEP tables and found:*
- A. Higher PEEP improved mortality. — *Wrong.*
- B. Lower PEEP improved mortality. — *Wrong.*
- C. No difference in mortality, as long as 4-6 mL/kg PBW was used. — **Correct.** (Book Ch. 12.)
- D. Higher PEEP improved oxygenation but caused more pneumothorax. — *Wrong (not the conclusion).*

**Q3.** *PEEP-induced hypotension at PEEP 8 in a previously stable ARDS patient most likely indicates:*
- A. The patient is overdistending. — *Less likely at 8.*
- B. The patient is hypovolemic. — **Correct.** (Book Ch. 12.) Below 10-12, PEEP doesn't routinely impair venous return in euvolemic patients.
- C. A pneumothorax. — *Possible but not the most likely.*
- D. The PEEP is too low. — *Wrong.*

**Q4.** *PEEP causes left ventricular afterload reduction via:*
- A. Reduced venous return. — *That reduces preload, not afterload.*
- B. Increased intrathoracic pressure reducing the transmural pressure across the LV. — **Correct.** (Book Ch. 12.) Afterload = LV systolic pressure - pleural pressure.
- C. Reduced systemic vascular resistance. — *Wrong.*
- D. Direct myocardial depression. — *Wrong.*

**Q5.** *Volutrauma is independent of pressure if:*
- A. The tidal volume is excessive. — **Correct.** (Book Ch. 8 — Webb/Tierney rats, Dreyfuss.)
- B. The plateau pressure is low. — *Implied false — if Vt is high, even at modest plateau, injury occurs.*
- C. The PEEP is high. — *Wrong.*
- D. Compliance is normal. — *Wrong.*

#### Key points

- PEEP's job: recruit alveoli, stabilize FRC, reduce LV afterload.
- Set initial PEEP by CXR; titrate by ARDSnet table or "good enough PEEP" by severity.
- Excessive PEEP overdistends — hypotension or rising dead space (rising PaCO2, falling PaO2).
- VILI is volutrauma-driven, not PEEP-driven.

---

### M14 — Oxygenation Strategies

**Track:** Strategy · **Archetype:** outcome with multi-axis trade-off · **Est. minutes:** 18 · **Anchor chapters:** [VB Ch. 4, Ch. 5, Ch. 12]

#### Learning objectives

By the end of M14, the learner can:
- Distinguish shunt (FiO2-resistant — corrects only with recruitment) from V/Q mismatch (FiO2-responsive).
- State the four ARDSnet oxygenation targets: PaO2 55-80, SpO2 88-94.
- Recognize the "permissive hypoxia" rationale — SaO2 88% is OK if DO2 is adequate.
- Name the four levers for oxygenation: FiO2, PEEP, mean airway pressure (I-time, IRV, APRV), prone positioning.

#### Book anchor

Owens, Ch. 4: causes of hypoxemia — shunt, V/Q mismatch, diffusion limit, dead space, low FiO2, low PB, alveolar hypoventilation. Shunt does not respond to FiO2 alone — recruitment is needed. V/Q mismatch corrects with O2. Ch. 5: oxygen content, DO2 = CaO2 × CO × 10; SaO2 matters more than PaO2; "treat oxygen like any other drug; give only what the patient needs." Ch. 12: ARDSnet targets PaO2 55-80 / SpO2 88-94; conservative oxygen therapy may reduce mortality compared to liberal. Ch. 25: Crisis-level guidance: SpO2 85-95% is sufficient, FiO2 ideally ≤0.6 to preserve alveolar nitrogen and prevent absorption atelectasis.

**Maxims tested:**
1. Shunt doesn't fix with FiO2. Recruitment fixes shunt.
2. SaO2 88% is enough if cardiac output and Hb are OK.
3. FiO2 >0.6 sustained is bad — absorption atelectasis, reactive oxygen species.
4. The oxygenation levers (in order): FiO2, PEEP, mean airway pressure, prone.

#### Patient preset

```
mode: VCV
heightInches: 70
gender: male
tidalVolume: 430
respiratoryRate: 18
peep: 8
fiO2: 1.0                     # MAXIMAL — bad starting point
iTime: 1.0
compliance: 30                # shunt physiology
resistance: 11
PaO2: 65                      # despite FiO2 1.0 — that's the clue
SpO2: 92
shuntFraction: 0.30           # 30% shunt — explains FiO2 resistance
spontaneousRate: 0
```

**Rationale.** Severe ARDS, on FiO2 1.0 but PaO2 only 65 — the FiO2-shunt clue. Climbing FiO2 hasn't worked. The learner needs to (a) recognize shunt, (b) lower FiO2 to ≤0.6, (c) raise PEEP to recruit, accepting SpO2 in the 88-94 band.

#### Unlocked controls

`fiO2`, `peep`. Plus a sandbox "prone" toggle that changes shuntFraction.

#### Pin list

- **shuntFraction: 0.30** — DO NOT CHANGE in initial preset.
- **PEEP-shunt-PaO2 response:**
  - PEEP 8, FiO2 1.0 → PaO2 65, SpO2 92 (shunt-limited).
  - PEEP 14, FiO2 1.0 → PaO2 102, SpO2 99.
  - PEEP 14, FiO2 0.6 → PaO2 78, SpO2 95.
  - PEEP 14, FiO2 0.5 → PaO2 64, SpO2 92.

#### Hidden objective

```yaml
tracker_type: outcome
target_state:
  - measurement: fiO2
    operator: lte
    value: 0.6
  - measurement: peep
    operator: gte
    value: 12
  - measurement: SpO2
    operator: between
    min: 88
    max: 96
sustain_breaths: 5
reset_between: false
show_progress_chip: true
```

#### User-facing task

> **De-escalate FiO2 by recruiting.** Your patient is on FiO2 1.0 with PaO2 only 65 — this is shunt, not V/Q mismatch. Climbing FiO2 won't fix it. Raise PEEP to recruit alveoli, then lower FiO2 to ≤0.6 while keeping SpO2 in the ARDSnet target band of 88-94%.

**Success criteria (displayed):**
- FiO2 ≤0.60
- PEEP ≥12
- SpO2 88-96%
- Sustained for 5 breaths

#### Primer (3 MCQs)

**P1.** *A patient on FiO2 1.0 has PaO2 of 65. Increasing FiO2 to 1.0 from 0.8 had minimal effect. The most likely cause is:*
- A. V/Q mismatch — needs more oxygen. — *Wrong.* V/Q mismatch responds to FiO2.
- B. Shunt — perfused but unventilated alveoli. — **Correct.** (Book Ch. 4.) FiO2-resistant; needs recruitment.
- C. Diffusion limit. — *Possible but rare.*
- D. Hypoventilation. — *Wrong.*

**P2.** *The ARDSnet target SpO2 range is:*
- A. 95-100%. — *Wrong, that's liberal oxygen — associated with worse outcomes.*
- B. 88-94%. — **Correct.** (Book Ch. 12.)
- C. 80-85%. — *Wrong, too low.*
- D. SpO2 doesn't matter — use PaO2 only. — *Wrong.*

**P3.** *Owens's argument against FiO2 >0.6 sustained is:*
- A. It causes ARDS. — *Wrong.*
- B. It causes absorption atelectasis and generates reactive oxygen species. — **Correct.** (Book Ch. 25.) The alveolar nitrogen reservoir is what stabilizes alveoli.
- C. It's expensive. — *Wrong.*
- D. It can cause oxygen ignition. — *Wrong, that's a flammability issue not the physiologic one.*

#### Read phase

1. **Opening prose (~150 words).** Hypoxemia has five mechanisms; only two matter for the ventilated patient. **Shunt:** blood flows past alveoli that aren't ventilated. No amount of FiO2 in the rest of the lung helps the blood that bypassed it. The fix is recruitment — open those alveoli. **V/Q mismatch:** alveoli are ventilated, just poorly matched. FiO2 fixes this.

2. **Callout (info)** — *"The clue for shunt: high FiO2, low PaO2. The clue for V/Q mismatch: PaO2 rises smoothly with FiO2."*

3. **Predict-observe** — `awaits_control: peep` — *Predict:* you'll raise PEEP from 8 to 14 at FiO2 1.0. *Observe:* PaO2 climbs from 65 to >100. Now lower FiO2 to 0.6 — PaO2 settles in the 70s.

4. **Callout (warn)** — *"SaO2 88% is acceptable if cardiac output and Hb are OK. The shape of the oxyhemoglobin curve means PaO2 only has to be ~56 to give SaO2 88."*

#### Explore card

**Patient context.** Severe ARDS, P/F ratio ~65.

**Unlocked controls.** PEEP 5-22; FiO2 0.30-1.0; Prone toggle.

**Try these.**
- FiO2 1.0, PEEP 8. PaO2 65 — shunt limit.
- FiO2 1.0, PEEP 14. PaO2 102 — recruitment worked.
- FiO2 0.5, PEEP 14. PaO2 64, SpO2 92 — within target.
- Prone toggle: shunt fraction drops, PaO2 climbs at the same FiO2/PEEP.

#### Hint ladder

- **Tier 1** — *"Your FiO2 is at the ceiling but the PaO2 hasn't budged. What does that tell you about the mechanism?"*
- **Tier 2** — *"Raise PEEP to recruit. Once PaO2 is over 90, start lowering FiO2 in steps to 0.6 or less."*
- **Tier 3** — *demonstrates* raising PEEP, lowering FiO2, prompts confirm.

#### Summative (5 questions)

**Q1.** *A patient on FiO2 0.6 has SpO2 92%, PaO2 78. The clinical interpretation is:*
- A. Under-oxygenated, raise FiO2. — *Wrong.*
- B. Within ARDSnet target — leave alone. — **Correct.** (Book Ch. 12.)
- C. Over-oxygenated — lower FiO2 to 0.21. — *Wrong, would drop into unsafe range.*
- D. Indicates shunt. — *Not enough info.*

**Q2.** *Conservative oxygen therapy (PaO2 70-100, SpO2 94-98) compared to liberal (PaO2 up to 150, SpO2 97-100) in ICU patients:*
- A. Increased mortality. — *Wrong.*
- B. Reduced mortality in a recent RCT. — **Correct.** (Book Ch. 8, cited in Owens.)
- C. Made no difference. — *Wrong.*
- D. Increased length of stay. — *Wrong.*

**Q3.** *DO2 (oxygen delivery) is:*
- A. PaO2 × Hb. — *Wrong.*
- B. SaO2 × Hb. — *Incomplete.*
- C. CaO2 × CO × 10. — **Correct.** (Book Ch. 5.)
- D. PaO2 ÷ FiO2. — *Wrong, that's the P/F ratio.*

**Q4.** *In a patient with 30% shunt, increasing FiO2 from 0.6 to 1.0 will:*
- A. Substantially improve PaO2. — *Wrong.*
- B. Have minimal effect on PaO2. — **Correct.** (Book Ch. 4.) Shunt is FiO2-resistant.
- C. Lower PaCO2. — *Wrong.*
- D. Improve V/Q matching. — *Wrong.*

**Q5.** *The four levers for improving oxygenation, roughly in order of escalation, are:*
- A. PEEP, FiO2, prone, ECMO. — *Wrong order.*
- B. FiO2, PEEP, mean airway pressure (longer I-time, IRV, APRV), prone positioning. — **Correct.** (Book Ch. 4, Ch. 12, Ch. 17.)
- C. Bronchodilators, FiO2, PEEP, paralytics. — *Wrong.*
- D. Sedation, FiO2, PEEP, diuresis. — *Wrong.*

#### Key points

- Shunt and V/Q mismatch — distinguish them by the FiO2 response.
- ARDSnet target: PaO2 55-80, SpO2 88-94.
- FiO2 >0.6 sustained: bad. Absorption atelectasis, reactive oxygen species.
- Levers: FiO2 → PEEP → mean airway pressure → prone.

---

### M15 — ARDS-Specific Ventilation

**Track:** Strategy · **Archetype:** compound (multi-condition with sustained state) · **Est. minutes:** 25 · **Anchor chapters:** [VB Ch. 1, Ch. 8, Ch. 25]

#### Learning objectives

By the end of M15, the learner can:
- Apply the ARDSnet recipe from scratch: VCV, 6 mL/kg PBW, rate 14-18, PEEP per table, plat ≤30, DP ≤15.
- Titrate Vt down if plat exceeds 30; floor at 4 mL/kg.
- Identify when to escalate to prone, paralytics, or rescue (PaO2/FiO2 <150 → prone; <100 → consider ECMO).
- State the ARMA mortality reduction (9%) and the Amato driving-pressure threshold (15).

#### Book anchor

Owens, Ch. 1: ARDS protocol — VCV, 6 mL/kg PBW (don't go below 4), rate 14-18, PEEP 5-10 starter, plat ≤30, FiO2 to keep SpO2 88-94 / PaO2 55-80, permissive hypercapnia (pH ≥7.15-7.20). Ch. 8: ARMA 2000 (6 vs 12 mL/kg = 9% mortality reduction); Amato 2015 (driving pressure ≤15); pre-2000 history of high-Vt ventilation. Ch. 25: simplified crisis protocol. Ch. 17: APRV if conventional fails. Prone positioning: PaO2/FiO2 <150, 16-18 hours/day.

**Maxims tested:**
1. The recipe: 6 mL/kg PBW, plat ≤30, DP ≤15, SpO2 88-94, pH ≥7.15.
2. ARMA showed a 9% absolute mortality reduction. This is one of the largest effects in ICU medicine.
3. Driving pressure ≤15 is independently linked to survival. Amato 2015.
4. Prone at P/F <150 if you can do it safely.

#### Patient preset

```
mode: VCV
heightInches: 70
gender: male                  # PBW ~73, so 6 mL/kg = 438
tidalVolume: 600              # 8.2 mL/kg — DELIBERATELY too high
respiratoryRate: 12
peep: 5
fiO2: 0.80
iTime: 1.0
compliance: 32                # moderate-severe ARDS — DO NOT CHANGE
resistance: 12
PaO2: 62
SpO2: 91
PaCO2: 38
pH: 7.39
spontaneousRate: 0
```

**Rationale.** This is the master Strategy preset. PBW is 73 kg; 6 mL/kg = 438. At Vt 600 and compliance 32, plat = 600/32 + 5 = 23.75 — under 30 but the *driving pressure* is 18.75, over the Amato threshold. The learner must (a) drop Vt to ~430, (b) raise PEEP per the ARDSnet table, (c) accept permissive hypercapnia.

#### Unlocked controls

`tidalVolume`, `respiratoryRate`, `peep`, `fiO2`. Mode and compliance locked.

#### Pin list

- **compliance: 32, heightInches: 70, gender: male** — DO NOT CHANGE. The math is calibrated:
  - Vt 430, PEEP 10, compliance 32 → plat = 430/32 + 10 = 23.4; DP = 13.4. Lands in target.
  - Vt 430, PEEP 5, compliance 32 → plat = 18.4; DP = 13.4. DP still good.
  - The pinned target row of the ARDSnet table for FiO2 0.6 is PEEP 10.

#### Hidden objective

```yaml
tracker_type: compound
all_required:
  - measurement: tidalVolume
    operator: between
    min: 410
    max: 470          # 6 mL/kg PBW, ±5%
  - measurement: plat
    operator: lte
    value: 30
  - measurement: drivingPressure
    operator: lte
    value: 15
  - measurement: peep
    operator: between
    min: 8
    max: 14
  - measurement: SpO2
    operator: between
    min: 88
    max: 96
  - measurement: fiO2
    operator: lte
    value: 0.70
sustain_breaths: 5
reset_between: false
show_progress_chip: true
```

#### User-facing task

> **Apply the ARDSnet recipe.** Your patient is in moderate-severe ARDS — compliance 32, currently on Vt 600 (too high), PEEP 5 (too low for FiO2 0.80). Set lung-protective Vt at 6 mL/kg PBW, PEEP per the table, and FiO2 down to ≤0.70. Aim for plat ≤30, driving pressure ≤15, SpO2 88-96. Hold for 5 breaths.

**Success criteria (displayed):**
- Tidal volume 410-470 mL (6 mL/kg PBW)
- Plateau pressure ≤30
- Driving pressure ≤15
- PEEP 8-14
- SpO2 88-96
- FiO2 ≤0.70
- Sustained for 5 breaths

#### Primer (3 MCQs)

**P1.** *The ARMA trial (NEJM 2000) compared 6 mL/kg PBW vs 12 mL/kg PBW in ARDS. The result was:*
- A. No difference in mortality. — *Wrong.*
- B. A 9% absolute mortality reduction with low Vt. — **Correct.** (Book Ch. 8.) One of the largest effects in ICU medicine.
- C. Lower Vt caused more pneumothorax. — *Wrong.*
- D. Lower Vt required more sedation but had no mortality effect. — *Wrong.*

**P2.** *A 70-inch male in ARDS — his PBW is ~73 kg. The starting Vt is:*
- A. 350 mL. — *Wrong, that's 4.8 mL/kg — defensible only if plat is high.*
- B. 430-440 mL. — **Correct.** (Book Ch. 8.) 6 mL/kg.
- C. 600 mL. — *Wrong, that's 8.2 mL/kg.*
- D. 800 mL. — *Wrong.*

**P3.** *The Amato 2015 driving pressure analysis showed that:*
- A. Plateau pressure was more important than driving pressure. — *Wrong.*
- B. Driving pressure ≤15 was independently linked to survival, even when plat <30 and Vt was 7 mL/kg or less. — **Correct.** (Book Ch. 8.)
- C. Driving pressure was unrelated to outcome. — *Wrong.*
- D. Higher driving pressure improved oxygenation. — *Wrong.*

#### Read phase

1. **Opening prose (~180 words).** ARDSnet is the most studied recipe in critical care. The components are simple and have not changed since 2000: VCV with 6 mL/kg predicted body weight, plat ≤30, PEEP-FiO2 by the table, SpO2 88-94, permissive hypercapnia. The hard part is that the recipe insists on numbers that feel wrong — Vt that look small, SpO2 that look low, PaCO2 that look high. The recipe is right.

2. **Callout (info)** — *"PBW is calculated from height and gender, not actual weight. A 5'10" man has a PBW of ~73 kg regardless of whether he weighs 60 kg or 130 kg. The lung doesn't grow with obesity."*

3. **Predict-observe #1** — `awaits_control: tidalVolume` — *Predict:* drop Vt from 600 to 430. *Observe:* plat falls, driving pressure falls. PaCO2 will rise; that's expected.

4. **Predict-observe #2** — `awaits_control: peep` — *Predict:* raise PEEP from 5 to 10. *Observe:* PaO2 climbs as more alveoli recruit.

5. **Callout (warn)** — *"Permissive hypercapnia: pH ≥7.15-7.20 is acceptable. The exception is elevated ICP — hypercapnia causes cerebral vasodilation."*

6. **Formative (check yourself).** *"After your changes, plat is 32 and DP is 17. Your next move is:* (a) **lower Vt by 50 mL** — Correct; (b) lower PEEP; (c) raise rate; (d) sedate more."*

#### Explore card

**Patient context.** Moderate-severe ARDS, day 2. PBW 73 kg.

**Unlocked controls.** Vt 200-700; Rate 8-30; PEEP 0-22; FiO2 0.30-1.0.

**Try these.**
- Vt 800 (pre-ARMA dosing). Plat climbs to 30+. DP climbs to 20.
- Vt 430, PEEP 5. Lung-protective Vt but PaO2 only 65 — under-recruited.
- Vt 430, PEEP 12, FiO2 0.6. Recipe lands. Hold.
- Drop Vt to 300 (4.1 mL/kg) for very stiff lungs. PaCO2 rises to 60s; pH falls to 7.20s. Permissive hypercapnia.

#### Hint ladder

- **Tier 1** — *"Vt is at 8 mL/kg. PEEP doesn't match the FiO2. The ARDSnet table is in the reference card."*
- **Tier 2** — *"For this patient, 6 mL/kg = 430. For FiO2 0.70, PEEP 10-14 from the lower table."*
- **Tier 3** — *demonstrates* Vt 430, PEEP 10, FiO2 0.60 step by step.

#### Summative (5 questions)

**Q1.** *The single most important intervention shown to reduce mortality in ARDS is:*
- A. Lower tidal volume. — **Correct.** (Book Ch. 8, ARMA.)
- B. Higher PEEP. — *Wrong.*
- C. Prone positioning. — *Important but second.*
- D. Neuromuscular blockade. — *Wrong.*

**Q2.** *A male, 5'10", in ARDS. Compliance 25, on Vt 500 mL, PEEP 8. The plateau pressure is 28 and the driving pressure is 20. The next move is:*
- A. Increase PEEP. — *Wrong, raises plat further.*
- B. Lower Vt to ~400. — **Correct.** (Book Ch. 8.) DP is over 15.
- C. Sedate more. — *Wrong.*
- D. Switch to PCV. — *Wrong reflex.*

**Q3.** *Permissive hypercapnia is contraindicated in:*
- A. ARDS. — *Wrong, it's the indication.*
- B. Elevated intracranial pressure. — **Correct.** (Book Ch. 6.) Hypercapnia → cerebral vasodilation → worsens ICP.
- C. Septic shock. — *Wrong.*
- D. Asthma exacerbation. — *Wrong, it's used here too.*

**Q4.** *Prone positioning in ARDS is indicated when:*
- A. PaO2/FiO2 <300. — *Wrong, too liberal.*
- B. PaO2/FiO2 <150. — **Correct.** (Book Ch. 25, PROSEVA trial.)
- C. Plat is >30. — *Wrong.*
- D. Auto-PEEP is present. — *Wrong.*

**Q5.** *Owens's pragmatic crisis protocol uses an initial Vt of:*
- A. 4 mL/kg. — *Wrong.*
- B. 6 mL/kg. — **Correct.** (Book Ch. 25.)
- C. 8 mL/kg. — *Wrong.*
- D. 12 mL/kg. — *Wrong.*

#### Key points

- The ARDSnet recipe: VCV, 6 mL/kg PBW, plat ≤30, DP ≤15, PEEP per table, SpO2 88-94, permissive hypercapnia.
- ARMA 2000 = 9% mortality reduction. Real and large.
- Amato 2015: DP ≤15 independently predicts survival.
- Prone at P/F <150.
- The recipe asks for numbers that look wrong. The recipe is right.

---

### M16 — Obstructive Disease Ventilation

**Track:** Strategy · **Archetype:** compound (recognition + correction) · **Est. minutes:** 22 · **Anchor chapters:** [VB Ch. 1, Ch. 15, Ch. 6]

#### Learning objectives

By the end of M16, the learner can:
- Apply the obstructive recipe: VCV, Vt 7-8 mL/kg PBW, rate 10-14, I:E 1:3 to 1:5, constant flow, ZEEP for asthma / modest PEEP for COPD.
- Recognize the auto-PEEP signature on the flow waveform.
- Set rate and I-time to relieve auto-PEEP without causing significant hypercapnia.
- Distinguish asthma (PEEP harmful) from COPD (PEEP can splint).

#### Book anchor

Owens, Ch. 1: severe bronchospasm — VCV, rate 10-14, Vt 8 mL/kg PBW, I:E 1:3 to 1:5, constant flow, ZEEP for asthma. Ch. 15: full chapter on severe bronchospasm; lowering rate is the dominant lever for relieving auto-PEEP; PCV is dangerous in bronchospasm because rising resistance silently drops Vt; goals are adequate (not perfect) oxygenation, permissive hypercapnia. In COPD, PEEP at 75-85% of measured auto-PEEP can splint open small airways (waterfall analogy). In asthma, applied PEEP makes hyperinflation worse. Ch. 6: permissive hypercapnia in ventilated asthmatics has reduced mortality substantially.

**Maxims tested:**
1. The obstructive recipe is different from the ARDS recipe. Vt is higher, PEEP is lower or zero.
2. Lowering rate is the strongest lever for auto-PEEP. Shortening I-time is second.
3. In asthma, PEEP worsens trapping. In COPD, modest PEEP can splint.
4. VCV is the mode of choice. PCV silently underventilates as resistance rises.

#### Patient preset

```
mode: PCV                     # WRONG MODE for this patient — DELIBERATELY
heightInches: 70
gender: male
PInsp: 22
respiratoryRate: 22           # TOO HIGH — auto-PEEP
peep: 8                       # TOO HIGH for asthma
fiO2: 0.50
iTime: 1.0
compliance: 60                # preserved — asthma
resistance: 35                # SEVERE bronchospasm — DO NOT CHANGE
PaCO2: 60                     # baseline hypercapnia
pH: 7.28
autoPEEP: 8                   # CLEARLY auto-trapping
spontaneousRate: 0            # paralyzed for now
```

**Rationale.** 28-year-old in status asthmaticus, intubated 2 hours ago. The previous clinician put him on PCV with PEEP 8 and rate 22. He's air-trapping. The learner must (a) switch to VCV, (b) lower the rate, (c) set Vt 8 mL/kg, (d) drop PEEP to 0, (e) accept hypercapnia.

#### Unlocked controls

`mode`, `tidalVolume`, `PInsp`, `respiratoryRate`, `peep`, `fiO2`, `iTime`.

#### Pin list

- **resistance: 35, compliance: 60** — DO NOT CHANGE. Auto-PEEP math is calibrated:
  - Rate 22, I-time 1.0, R 35 → autoPEEP 8.
  - Rate 12, I-time 1.0, R 35 → autoPEEP 2.
  - Rate 10, I-time 0.8, R 35 → autoPEEP 1.

#### Hidden objective

```yaml
tracker_type: compound
all_required:
  - measurement: mode
    operator: equals
    value: "VCV"
  - measurement: tidalVolume
    operator: between
    min: 530           # 7 mL/kg PBW
    max: 620           # 8.5 mL/kg PBW
  - measurement: respiratoryRate
    operator: between
    min: 10
    max: 14
  - measurement: peep
    operator: lte
    value: 3           # ZEEP or near-ZEEP for asthma
  - measurement: autoPEEP
    operator: lte
    value: 2
sustain_breaths: 5
reset_between: false
show_progress_chip: true
```

#### User-facing task

> **Rescue the trapped asthmatic.** Your patient is in status asthmaticus and was placed on PCV with PEEP 8 and rate 22. He's air-trapping — autoPEEP is 8. Switch to VCV, set Vt 7-8 mL/kg PBW, drop rate to 10-14, drop PEEP to ZEEP (≤3). Accept permissive hypercapnia. Hold the new state for 5 breaths.

**Success criteria (displayed):**
- Mode VCV
- Tidal volume 530-620 mL (7-8 mL/kg PBW)
- Respiratory rate 10-14
- PEEP ≤3
- Auto-PEEP ≤2
- Sustained for 5 breaths

#### Primer (3 MCQs)

**P1.** *The strongest single lever for relieving auto-PEEP is:*
- A. Higher PEEP. — *Wrong, asthma worsens; COPD helps marginally.*
- B. Lower respiratory rate. — **Correct.** (Book Ch. 15.) Longer expiratory time.
- C. Higher Vt. — *Wrong, prolongs I-time.*
- D. Higher FiO2. — *Wrong.*

**P2.** *In severe asthma with rising airway resistance, the mode of choice is:*
- A. PCV — decelerating flow is more comfortable. — *Wrong.* PCV silently drops Vt as R rises.
- B. PRVC — adaptive. — *Wrong.* Same problem.
- C. VCV — guaranteed Vt despite resistance change. — **Correct.** (Book Ch. 15.)
- D. PSV — patient comfort. — *Wrong.*

**P3.** *Applied PEEP in severe asthma:*
- A. Helps splint airways — analogous to COPD. — *Wrong.* The pathology differs.
- B. Makes hyperinflation worse — airways are obstructed by inflammation, not floppy. — **Correct.** (Book Ch. 1, Ch. 15.)
- C. Has no effect. — *Wrong.*
- D. Improves V/Q matching. — *Wrong.*

#### Read phase

1. **Opening prose (~180 words).** Obstructive disease — asthma and COPD — flips the ventilation problem upside down. The lungs aren't stiff; the airways are narrow. The patient can get air in. He can't get it out. Tidal volume isn't the danger. *Trapping* is the danger. Trapped gas compresses venous return, drops blood pressure, and (in severe cases) causes pneumothorax.

2. **Callout (info)** — *"The obstructive recipe: VCV, 7-8 mL/kg PBW, rate 10-14, I:E 1:3 to 1:5, constant flow, ZEEP for asthma / modest PEEP for COPD."*

3. **Predict-observe #1** — `awaits_control: respiratoryRate` — *Predict:* lower rate from 22 to 12 in a trapped patient. *Observe:* auto-PEEP falls from 8 to 2.

4. **Predict-observe #2** — `awaits_control: peep` — *Predict:* drop PEEP from 8 to 0 in this asthmatic. *Observe:* total PEEP falls, BP stabilizes.

5. **Callout (warn)** — *"Permissive hypercapnia in asthma: pH ≥7.10 is acceptable. The PaCO2 will rise (often to 60-80). That's the price of letting the patient exhale."*

#### Explore card

**Patient context.** Status asthmaticus, intubated 2 hours.

**Unlocked controls.** Mode; Vt 350-700; Rate 8-30; PEEP 0-15; FiO2 0.30-1.0; I-time 0.5-1.5.

**Try these.**
- Rate 22, PEEP 8. Auto-PEEP 8. Trouble.
- Rate 12, PEEP 0. Auto-PEEP 2. Resolved.
- Rate 12, PEEP 8. Auto-PEEP rises again — PEEP added insult.
- Switch to PCV at PINSP 22, rate 12. Vt collapses to ~200. Dangerous.

#### Hint ladder

- **Tier 1** — *"Two things are wrong: the mode and the rate."*
- **Tier 2** — *"VCV, rate 12, Vt 7-8 mL/kg, PEEP 0. The pH will be low. That's permitted."*
- **Tier 3** — *demonstrates* the full transition.

#### Summative (5 questions)

**Q1.** *In a ventilated asthmatic, permissive hypercapnia is acceptable down to a pH of:*
- A. 7.35. — *Wrong, too strict.*
- B. 7.20. — *Common but not the textbook floor.*
- C. 7.10-7.15. — **Correct.** (Book Ch. 6, Ch. 15.)
- D. 6.90. — *Wrong, too permissive.*

**Q2.** *The obstructive Vt target is typically:*
- A. 4 mL/kg. — *Wrong, that's ARDS rescue.*
- B. 6 mL/kg. — *Wrong, that's ARDS.*
- C. 7-8 mL/kg. — **Correct.** (Book Ch. 1, Ch. 15.)
- D. 12 mL/kg. — *Wrong.*

**Q3.** *An asthmatic on VCV has a rising PIP but a stable plateau pressure. The most likely cause is:*
- A. Worsening ARDS. — *Wrong.*
- B. Worsening bronchospasm or mucus plugging. — **Correct.** (Book Ch. 2.) The PIP-plat gap is the resistance signal.
- C. Auto-PEEP. — *Possible, but auto-PEEP usually raises plat too.*
- D. Pneumothorax. — *Wrong.*

**Q4.** *In severe COPD with measured auto-PEEP of 10, applied PEEP can be set at:*
- A. 0 (ZEEP), as in asthma. — *Defensible, but Owens permits 7-8.*
- B. ~7-8 cmH2O (75-85% of auto-PEEP). — **Correct.** (Book Ch. 15.)
- C. 15 cmH2O (above auto-PEEP). — *Wrong, worsens trapping.*
- D. 25 cmH2O. — *Wrong.*

**Q5.** *A hypotensive, vented severe-asthma patient with measured auto-PEEP of 16. The first move is:*
- A. Norepinephrine. — *Wrong — treats symptom.*
- B. Disconnect from vent for 10-15 seconds to let him exhale. — **Correct.** (Book Ch. 15.)
- C. Raise PEEP. — *Wrong.*
- D. Lower FiO2. — *Wrong.*

#### Key points

- Obstructive recipe ≠ ARDS recipe. Vt is higher (7-8 mL/kg), rate is lower, PEEP is ZEEP or modest.
- The auto-PEEP killer is high rate. Lowering rate is the strongest lever.
- VCV is the mode. PCV silently underventilates as resistance rises.
- Asthma: PEEP harmful. COPD: PEEP 75-85% of auto-PEEP can splint.
- Hypotensive trapped patient → disconnect first, then sort out vent.

---

## Track 5 — Weaning

The Weaning track replaces a slow, gradual reduction in support with a daily assessment. Owens's framing is crisp: "There are two types of days for patients with respiratory failure — vent days and get-off-the-vent days. A daily spontaneous breathing trial lets you know which kind of day it is." Both modules in this track teach the same loop: assess, trial, decide.

---

### M17 — Weaning Concepts (Liberation)

**Track:** Weaning · **Archetype:** outcome (criteria-met sustained) · **Est. minutes:** 18 · **Anchor chapters:** [VB Ch. 22]

#### Learning objectives

By the end of M17, the learner can:
- State the daily SBT assessment criteria (FiO2 ≤50%, PEEP ≤8, awake, hemodynamically stable, not difficult airway).
- Set up an SBT (CPAP 5 + PS 7, 30-60 minutes).
- Calculate and interpret the RSBI (RR/Vt-in-liters), threshold <105 (or <80 on PSV).
- Name the SBT abort criteria.

#### Book anchor

Owens, Ch. 22 ("Liberation from Mechanical Ventilation"): "Liberation" replaces "weaning"; the patient is *assessed*, then extubated when criteria are met. Pre-SBT criteria: FiO2 ≤50%, PEEP ≤8, follows commands, not requiring frequent suctioning, hemodynamically stable, not on unconventional ventilation, not a known difficult airway. SBT protocol: CPAP 5 + PS 7 for 30-60 min. Calculate RSBI = RR / Vt(L). Threshold: RSBI <105 (Yang-Tobin), or <80 if SBT was done on PSV (Owens's pragmatic adjustment). Abort criteria: SpO2 <88, HR rise ≥20, BP change, diaphoresis, accessory muscle use, paradoxical breathing.

**Maxims tested:**
1. Daily SBT, not gradual reduction.
2. Pre-SBT screen: 5 criteria, all required.
3. SBT setup: CPAP 5 + PS 7, 30-60 min.
4. RSBI = RR / Vt(L). <105 (T-piece) or <80 (PSV).

#### Patient preset

```
mode: PSV
heightInches: 70
gender: male
PSupport: 7                   # SBT setting
peep: 5                       # SBT setting
fiO2: 0.40
compliance: 60                # near-normal
resistance: 12
spontaneousRate: 18           # at start
tidalVolume_spontaneous: 380  # at start
RSBI: 47                      # 18 / 0.38
SpO2: 95
HR: 88
SBP: 124
clinicalScenario: "Post-pneumonia, day 5, awake, following commands. On FiO2 40% / PEEP 8 yesterday. Today, RT set up an SBT."
```

**Rationale.** A reasonable SBT candidate, mid-trial. The learner is presented with the bedside data and must (a) verify pre-SBT criteria are met, (b) compute RSBI from the data, (c) decide pass/fail. The "task" here is decisional, not manipulative.

#### Unlocked controls

None during the trial. After the decision, a "switch to A/C" and "extubate" button appears.

#### Pin list

- **The SBT scenario state must be presented as static data, not live sim.** The learner reads the strip and decides.

#### Hidden objective

```yaml
tracker_type: recognition
required_decision:
  - field: precriteria_check
    expected: "all_met"
  - field: rsbi_calculation
    expected_value: 47
    tolerance: 2
  - field: pass_fail_decision
    expected: "pass"
all_required: true
```

#### User-facing task

> **Read the bedside data and decide.** Your patient finished a 30-minute SBT on CPAP 5 / PS 7 / FiO2 40%. At the 30-minute mark: RR 18, spontaneous Vt 380 mL, SpO2 95%, HR 88, BP 124/72. Calculate his RSBI. Then decide: extubate, or back to A/C?

**Success criteria (displayed):**
- All pre-SBT criteria are met
- RSBI correctly computed (within ±2)
- Correct decision (pass → extubate)

#### Primer (3 MCQs)

**P1.** *Which is NOT a pre-SBT criterion?*
- A. FiO2 ≤50%. — *True criterion.*
- B. PEEP ≤8. — *True.*
- C. PaO2/FiO2 ratio >300. — **Correct — NOT a criterion.** (Book Ch. 22.) Owens does not include this; it's the ARDS-resolution criterion.
- D. Hemodynamically stable, off pressors (or low-dose). — *True.*

**P2.** *An SBT on the vent is typically done with:*
- A. T-piece, no PEEP, no PS. — *Valid alternative, not the default.*
- B. CPAP 5, PS 7, 30-60 min. — **Correct.** (Book Ch. 22.)
- C. A/C with low Vt. — *Wrong.*
- D. PRVC. — *Wrong.*

**P3.** *A patient with RR 24 and spontaneous Vt 300 mL has RSBI of:*
- A. 8. — *Wrong.*
- B. 80. — **Correct.** RR ÷ Vt(L) = 24 ÷ 0.3 = 80.
- C. 0.8. — *Wrong direction.*
- D. 800. — *Wrong.*

#### Read phase

1. **Opening prose (~150 words).** "Weaning" implies a gradual reduction in support. Owens prefers "liberation" because most patients don't need a gradual reduction — they need a daily assessment. There are vent days and there are get-off-the-vent days. The job is to know which kind of day it is.

2. **Callout (info)** — *"Daily SBT protocol: CPAP 5, PS 7, FiO2 unchanged. Run 30-60 min. Compute RSBI. Decide."*

3. **Predict-observe** — Not applicable to this module (decisional).

4. **Reference card.** Owens's SBT protocol table reproduced verbatim:
   - Pre-criteria (5 items)
   - SBT setup
   - Pass: RSBI <80 → extubate
   - Fail: RSBI ≥80 or abort → A/C
   - Abort criteria (5 items)

5. **Callout (warn)** — *"RSBI alone is not a complete answer. A patient with RSBI 75 who is gasping and paradoxical-breathing is not ready. A patient with RSBI 110 who looks calm may do fine. Numbers help. The patient is the final judge."*

#### Explore card

**Patient context.** Several SBT scenarios with different bedside data; the learner predicts the outcome for each.

**Try these.**
- Scenario A: RR 18, Vt 380, SpO2 95. RSBI 47. **Pass.**
- Scenario B: RR 35, Vt 280, SpO2 91, diaphoretic, accessory muscle use. RSBI 125, *also abort.* **Fail.**
- Scenario C: RR 28, Vt 350, SpO2 93. RSBI 80. **Borderline** — clinical judgment.
- Scenario D: RR 14, Vt 600, SpO2 98 — but on PEEP 10 (didn't meet pre-criteria). **Don't start the SBT.**

#### Hint ladder

- **Tier 1** — *"Pre-criteria check first. Then RSBI. Then look at the patient."*
- **Tier 2** — *"RSBI = RR divided by Vt in liters. 18 ÷ 0.38."*
- **Tier 3** — *demonstrates* the full calc and decision.

#### Summative (5 questions)

**Q1.** *The Yang-Tobin RSBI threshold for predicting successful extubation is:*
- A. <50. — *Wrong, too strict.*
- B. <105. — **Correct.** (Book Ch. 22.)
- C. <200. — *Wrong.*
- D. <500. — *Wrong.*

**Q2.** *Owens uses a slightly stricter RSBI threshold of <80 because:*
- A. He prefers to be conservative. — *Half-correct, but the reason is technical.*
- B. He performs SBT on PSV, which gives some assistance, so the bar should be tighter. — **Correct.** (Book Ch. 22.)
- C. <80 is the original Yang-Tobin threshold. — *Wrong.*
- D. <80 is the consensus 2020 guideline. — *Wrong.*

**Q3.** *Which is an SBT abort criterion?*
- A. Spontaneous Vt of 350 mL. — *Wrong, that's adequate.*
- B. HR rise of 25 bpm with accessory muscle use. — **Correct.** (Book Ch. 22.)
- C. RR of 18. — *Wrong.*
- D. SpO2 of 94%. — *Wrong, within target.*

**Q4.** *Daily SBT vs gradual SIMV/PSV weaning:*
- A. Gradual weaning is faster. — *Wrong.*
- B. Equivalent. — *Wrong.*
- C. Daily SBT is faster — shorter time on the vent and shorter ICU stay. — **Correct.** (Book Ch. 22.)
- D. Gradual is associated with better long-term function. — *Wrong.*

**Q5.** *A patient passes the SBT pre-criteria, completes a 30-min SBT, with RSBI 70, comfortable, no accessory muscle use. The correct next step is:*
- A. Repeat SBT in 12 hours. — *Wrong.*
- B. Extubate. — **Correct.** (Book Ch. 22.)
- C. Reduce PS by 2 and try again. — *Wrong, ladder of pressure support is the old approach.*
- D. Get an ABG first. — *Common practice but not required by Owens.*

#### Key points

- Liberation = daily assessment, not gradual reduction.
- Pre-SBT screen (5 criteria), SBT setup (CPAP 5 + PS 7), RSBI (<80 on PSV).
- RSBI alone is not the answer. The patient is the final judge.
- Abort criteria: desat, HR rise, BP change, diaphoresis, accessory muscle use.

---

### M18 — Extubation Criteria and Failure

**Track:** Weaning · **Archetype:** recognition (pattern triage) + outcome (cuff leak) · **Est. minutes:** 18 · **Anchor chapters:** [VB Ch. 22, Ch. 23]

#### Learning objectives

By the end of M18, the learner can:
- State the three pillars for extubation readiness: the *reason* for intubation resolved; *gas exchange* adequate (FiO2 ≤50, PEEP ≤8); *cardiovascular reserve* adequate.
- Recognize the four mechanisms of extubation failure (upper airway, secretions, mental status, cardiovascular).
- Perform and interpret a cuff leak test for stridor risk.
- Distinguish post-extubation distress that responds to NIPPV from distress that mandates re-intubation.

#### Book anchor

Owens, Ch. 22: extubation readiness has three pillars beyond the SBT — (1) reason for intubation resolved, (2) gas exchange (FiO2 ≤50%, PEEP ≤8, no dynamic hyperinflation, MV <10 L/min), (3) cardiovascular reserve (off pressors, no active ischemia). Brain-injured patients with low oxygen requirement and no apnea may do better with *early* extubation despite mental status. Ch. 23 includes the cuff leak discussion (Owens explicitly references the 5-cm cuff-leak test). Post-extubation distress causes: upper airway edema, retained secretions, altered mental status, cardiogenic.

**Maxims tested:**
1. Three pillars: reason, gas exchange, cardiovascular.
2. Cuff leak test screens for upper airway edema (stridor risk).
3. NIPPV can rescue early post-extubation respiratory distress but not protect against upper airway obstruction.
4. Re-intubation in <72 hours = extubation failure.

#### Patient preset

This module uses a **scenario-based decisional format**, similar to M17 but with multiple patient vignettes.

```
scenarios:
  - id: M18-s1-cuff-leak
    context: "62 yo male, intubated 7 days for pneumonia. SBT passed. Cuff leak test shows leak of 80 mL."
    decision: "delay_extubation_consider_steroids"
  - id: M18-s2-cardiogenic
    context: "70 yo with HFrEF, ejection fraction 25%, intubated for pulmonary edema. SBT on PSV passed."
    decision: "extubate_with_NIPPV_standby"
  - id: M18-s3-mental-status
    context: "35 yo s/p TBI, GCS 9, no other reason to be intubated. FiO2 35%, PEEP 5."
    decision: "extubate_per_brain_injury_data"
  - id: M18-s4-failed-screen
    context: "60 yo with severe COPD, FiO2 0.50, PEEP 10, RR 30, RSBI 130."
    decision: "back_to_AC_not_ready"
```

#### Unlocked controls

None during decisional scenarios.

#### Pin list

- **Cuff leak threshold:** <110 mL is positive (high stridor risk). >130 mL is negative. 110-130 borderline.

#### Hidden objective

```yaml
tracker_type: compound
all_required:
  - scenario: M18-s1-cuff-leak
    correct: "delay_extubation_consider_steroids"
  - scenario: M18-s2-cardiogenic
    correct: "extubate_with_NIPPV_standby"
  - scenario: M18-s3-mental-status
    correct: "extubate_per_brain_injury_data"
  - scenario: M18-s4-failed-screen
    correct: "back_to_AC_not_ready"
```

#### User-facing task

> **Four patients. For each, decide: extubate now, extubate with NIPPV standby, delay and treat, or back to A/C.** This is the highest-stakes decision in the workbook. Get all four right.

**Success criteria (displayed):**
- Scenario 1 decision: correct
- Scenario 2 decision: correct
- Scenario 3 decision: correct
- Scenario 4 decision: correct

#### Primer (3 MCQs)

**P1.** *The three pillars of extubation readiness beyond the SBT are:*
- A. Reason resolved, gas exchange adequate, cardiovascular reserve adequate. — **Correct.** (Book Ch. 22.)
- B. Reason resolved, mental status normal, GCS 15. — *Wrong.* Mental status is not strictly required.
- C. RSBI <80, PaO2 >100, normal Hb. — *Wrong.*
- D. Awake, alert, oriented, ambulating. — *Wrong.*

**P2.** *A cuff leak of <110 mL indicates:*
- A. The endotracheal tube cuff is overinflated. — *Wrong.*
- B. Significant upper airway edema; high risk for post-extubation stridor. — **Correct.** (Book Ch. 23.)
- C. The endotracheal tube is the wrong size. — *Wrong.*
- D. A normal finding. — *Wrong.*

**P3.** *NIPPV after extubation in a high-risk patient (CHF, COPD) can:*
- A. Prevent re-intubation in the first 48 hours. — **Correct.** (Established evidence, referenced by Owens.)
- B. Substitute for a failed SBT. — *Wrong.*
- C. Treat upper airway obstruction. — *Wrong.*
- D. Replace endotracheal intubation entirely in respiratory failure. — *Wrong.*

#### Read phase

1. **Opening prose (~150 words).** Passing the SBT is necessary but not sufficient. Three pillars must hold: the reason for intubation must be resolved, gas exchange must be adequate without high-pressure support, and the cardiovascular system must be able to handle the work of breathing.

2. **Callout (info)** — *"Cuff leak test: deflate the cuff, measure expiratory Vt over six breaths, take the average of the three lowest, subtract from the inspired Vt. Difference <110 mL is concerning."*

3. **Pattern atlas.** The four mechanisms of extubation failure:
   - **Upper airway** — stridor, edema. Risk: prolonged intubation, female sex, repeated intubation. Mitigation: steroids 24h pre-extubation if cuff leak is low.
   - **Retained secretions** — weak cough, poor mental status. Mitigation: pulmonary toilet, weight off cough strength.
   - **Cardiogenic** — pulmonary edema unmasked by loss of intrathoracic pressure. Mitigation: diuresis, NIPPV standby.
   - **Mental status / drive** — over-sedation, brain injury. Mitigation: minimize sedation, assess drive on PSV.

4. **Callout (warn)** — *"Re-intubation within 72 hours doubles mortality. It is not 'just doing the SBT again.' Get the extubation right the first time."*

#### Explore card

**Patient context.** Four bedside vignettes (the four scenarios above), explored as labeled examples.

**Try these.** For each scenario, see the rationale for the correct decision and the consequences of the wrong one.

#### Hint ladder

- **Tier 1** — *"For each scenario: check the three pillars. Then think about the failure mode that fits the patient."*
- **Tier 2** — *"Cuff leak <110 = airway risk. Severe HFrEF = cardiogenic risk. Brain injury alone with low O2 needs = extubate."*
- **Tier 3** — *walks through scenario 1 step by step.*

#### Summative (5 questions)

**Q1.** *Re-intubation within 72 hours is associated with:*
- A. Improved outcomes (the patient gets a rest). — *Wrong.*
- B. No change in mortality. — *Wrong.*
- C. Approximately doubled mortality. — **Correct.** (Established literature.)
- D. Lower ICU length of stay. — *Wrong.*

**Q2.** *A patient with prolonged intubation has a cuff leak of 60 mL. The correct next step is:*
- A. Extubate, plan for NIPPV. — *Wrong.* NIPPV doesn't treat upper airway obstruction.
- B. Delay extubation 24 hours; give IV steroids; recheck. — **Correct.** (Book Ch. 23.)
- C. Extubate to high-flow nasal cannula. — *Wrong.*
- D. Tracheostomy. — *Wrong, premature.*

**Q3.** *Which patient is the strongest candidate for prophylactic post-extubation NIPPV?*
- A. A 30-year-old after asthma exacerbation, fully awake, RSBI 35. — *Wrong, low risk.*
- B. A 75-year-old with HFrEF EF 25%, COPD, intubated 5 days. — **Correct.** (Established evidence.)
- C. A trauma patient with GCS 14. — *Wrong.*
- D. A young adult intubated for drug overdose. — *Wrong.*

**Q4.** *A brain-injured patient with GCS 8 but FiO2 35%, PEEP 5, RSBI 50, no apnea, no high secretions burden. The recommendation is:*
- A. Wait for GCS ≥10. — *Wrong.*
- B. Early extubation is supported by evidence — go ahead. — **Correct.** (Book Ch. 22.)
- C. Tracheostomy at day 7. — *Possible later, not first move.*
- D. Continue intubation indefinitely. — *Wrong.*

**Q5.** *Post-extubation stridor that does not respond to nebulized racemic epinephrine should be managed with:*
- A. NIPPV. — *Wrong, doesn't treat airway obstruction.*
- B. Re-intubation. — **Correct.** (Standard of care.) The upper airway will not improve in time.
- C. Heliox. — *Adjunct, not definitive.*
- D. Tracheostomy without re-intubation. — *Wrong, emergency.*

#### Key points

- Three pillars beyond SBT: reason resolved, gas exchange, CV reserve.
- Cuff leak <110 → delay 24h, steroids.
- NIPPV prophylactically for HFrEF/COPD reduces re-intubation.
- Brain-injured patients with low O2 needs do better with early extubation.
- Re-intubation in 72h doubles mortality.

---

## Track 6 — Synthesis

The Synthesis track has one module. M19 is the final exam — a sequence of bedside scenarios that demand the resident apply everything Foundations through Weaning has taught them, under time pressure. The DOPE/DOPES mnemonic is the spine, but the variations are clinical.

---

### M19 — Troubleshooting the Vent (DOPE)

**Track:** Synthesis · **Archetype:** recognition + intervention chain (compound) · **Est. minutes:** 25 · **Anchor chapters:** [VB Ch. 2, Ch. 14, all]

> **Sim limitation note.** Of the DOPES scenarios, the sim renders three faithfully (Obstruction by mucus → high PIP-plat gap; Stacked breaths → auto-PEEP signal; Equipment leak → low Vt + circuit pressure drop). Displacement (mainstem) and Pneumothorax are represented as scripted vital-sign trajectories rather than physical waveform changes. This module's recognition phase uses both live-sim and clip-based items, flagged accordingly.

#### Learning objectives

By the end of M19, the learner can:
- Execute the DOPES mnemonic at the bedside: Displacement, Obstruction, Pneumothorax, Equipment, Stacking.
- Read the high-PIP / high-plat vs. high-PIP / normal-plat distinction (lung vs airway).
- Identify each of the five DOPES patterns from the combination of waveform changes, ETCO2 changes, and vital signs.
- Choose the *first action* for each pattern (not the whole workup).

#### Book anchor

Owens, Ch. 2 ("Quick Adjustments and Troubleshooting"): the high-PIP / high-plat = lung problem (mainstem, atelectasis, pulmonary edema, ARDS worsening, pneumothorax); high-PIP / normal-plat = airway problem (kinked tube, mucus, bronchospasm). Ch. 14: DOPES mnemonic for the patient who suddenly decompensates. Bag the patient off the vent first — if he improves, it's a vent issue; if not, a patient issue. ETCO2 loss = displacement or obstruction (full); shark-fin ETCO2 = partial obstruction (bronchospasm). Capnograph interpretation from Ch. 7.

**Maxims tested:**
1. DOPES at the bedside, bag off first.
2. High PIP, high plat = lungs. High PIP, normal plat = airway.
3. ETCO2 changes diagnose displacement (lost waveform) and partial obstruction (shark fin).
4. The first action — not the whole workup — for each pattern.

#### Patient preset

This module uses a **sequence of five scripted scenarios**. Each scenario starts from a stable baseline preset and applies a perturbation. The learner must (a) identify the pattern, (b) take the first action.

```
baseline:
  mode: VCV
  heightInches: 70
  gender: male
  tidalVolume: 450
  respiratoryRate: 16
  peep: 8
  fiO2: 0.40
  iTime: 1.0
  compliance: 40
  resistance: 12
  spontaneousRate: 0

perturbations:
  - id: M19-s1-displacement
    apply: { etco2: "drops_to_zero", chestRise: "none_or_asymmetric" }
    correct_pattern: "displacement"
    correct_first_action: "verify_tube_position_bag_off"
  - id: M19-s2-obstruction-mucus
    apply: { PIP: "+15", plat: "unchanged", etco2: "shark_fin" }
    correct_pattern: "obstruction"
    correct_first_action: "suction_pass"
  - id: M19-s3-pneumothorax
    apply: { PIP: "+12", plat: "+10", BP: "-25", spo2: "-8", chestRise: "asymmetric" }
    correct_pattern: "pneumothorax"
    correct_first_action: "needle_decompression"
  - id: M19-s4-equipment-leak
    apply: { Vt_exh: "300_from_450", PIP: "-5", circuit_pressure: "drops" }
    correct_pattern: "equipment"
    correct_first_action: "check_circuit_bag_off"
  - id: M19-s5-stacking
    apply: { autoPEEP: "+8", BP: "-15", expiratory_flow: "non_zero" }
    correct_pattern: "stacking"
    correct_first_action: "disconnect_let_exhale"
```

#### Unlocked controls

Mode-specific. Each scenario reveals controls relevant to the correct action (e.g., suction button, disconnect button).

#### Pin list

- **The perturbation script must reset between scenarios.** `reset_between: true` is mandatory or the second scenario inherits the first's chaos.

#### Hidden objective

```yaml
tracker_type: compound
all_required:
  - scenario: M19-s1-displacement
    pattern: "displacement"
    first_action: "verify_tube_position_bag_off"
  - scenario: M19-s2-obstruction-mucus
    pattern: "obstruction"
    first_action: "suction_pass"
  - scenario: M19-s3-pneumothorax
    pattern: "pneumothorax"
    first_action: "needle_decompression"
  - scenario: M19-s4-equipment-leak
    pattern: "equipment"
    first_action: "check_circuit_bag_off"
  - scenario: M19-s5-stacking
    pattern: "stacking"
    first_action: "disconnect_let_exhale"
reset_between: true
```

#### User-facing task

> **Five decompensations in a row.** For each: identify the pattern (D / O / P / E / S) and choose the first action. You must get all five correct. This is the test.

**Success criteria (displayed):**
- 5/5 patterns correctly identified
- 5/5 correct first actions selected

#### Primer (3 MCQs)

**P1.** *The "D" in DOPES is:*
- A. Death. — *Wrong (and not in any textbook).*
- B. Displacement of the endotracheal tube. — **Correct.** (Book Ch. 14.)
- C. Dyssynchrony. — *Wrong.*
- D. Diuresis. — *Wrong.*

**P2.** *High PIP, normal plateau pressure indicates:*
- A. Worsening compliance. — *Wrong.*
- B. Increased airway resistance — mucus, kink, bronchospasm. — **Correct.** (Book Ch. 2.)
- C. Pneumothorax. — *Wrong.*
- D. Pulmonary edema. — *Wrong.*

**P3.** *The first step when a vented patient decompensates is:*
- A. Increase FiO2 to 1.0. — *Reflex, not the first diagnostic step.*
- B. Bag the patient off the ventilator. — **Correct.** (Book Ch. 14.) Distinguishes vent problem from patient problem.
- C. Order a stat CXR. — *Eventually, not first.*
- D. Push sedation. — *Wrong.*

#### Read phase

1. **Opening prose (~180 words).** When a vented patient suddenly decompensates, the reflexes are: increase FiO2, push sedation, call for help. Resist the first two. The mnemonic is DOPES — Displacement, Obstruction, Pneumothorax, Equipment, Stacking — and the very first physical action is to disconnect from the vent and bag the patient. If he improves, it was the vent or the circuit. If he doesn't, it's a patient problem.

2. **Callout (info)** — *"The pressure pattern divides the differential. High PIP + high plat = lung. High PIP + normal plat = airway. Lost ETCO2 waveform = displacement (full) or massive obstruction. Shark-fin ETCO2 = partial obstruction."*

3. **Pattern atlas.** Five DOPES patterns with the dominant clue for each (reference card, not live sim):
   - D — Displacement: lost ETCO2, no breath sounds or asymmetric chest rise.
   - O — Obstruction: PIP up, plat unchanged. Shark-fin ETCO2 if partial.
   - P — Pneumothorax: PIP up, plat up, asymmetric chest rise, BP down, SpO2 down.
   - E — Equipment: low Vt, low circuit pressure, alarms. Bag off fixes it instantly.
   - S — Stacking (auto-PEEP): expiratory flow not returning to zero, BP down, chest hyperinflated.

4. **Callout (warn)** — *"The clinical reflex of 'sedate and turn up FiO2' makes some of these worse. Stacking gets worse with sedation if the underlying rate isn't fixed. Tension pneumothorax gets worse with higher PIP."*

#### Explore card

**Patient context.** Five reference patterns, presented as labeled examples.

**Try these.**
- Reproduce each pattern in the sim sandbox by adjusting the perturbations directly.
- Practice the diagnostic shortcut for each: "If PIP is up and plat is unchanged, my next action is X."

#### Hint ladder

- **Tier 1** — *"Bag off first. Then read the waveform — PIP up? Plat up? Both? Then read the ETCO2."*
- **Tier 2** — *"For this scenario specifically: pay attention to {scenario-specific dominant clue}."*
- **Tier 3** — *highlights* the dominant clue in the current scenario.

#### Summative (5 questions)

**Q1.** *A vented patient suddenly has loss of the ETCO2 waveform and no chest rise. The most likely cause is:*
- A. Worsening ARDS. — *Wrong.*
- B. Displacement of the endotracheal tube. — **Correct.** (Book Ch. 7, Ch. 14.)
- C. Stacked breaths. — *Wrong.*
- D. PEEP set too high. — *Wrong.*

**Q2.** *PIP rises from 28 to 42 with plat unchanged at 22. The cause is in:*
- A. The lung. — *Wrong, plat would change.*
- B. The airway — kinked tube, mucus plug, or bronchospasm. — **Correct.** (Book Ch. 2.)
- C. The ventilator circuit. — *Wrong.*
- D. The PEEP setting. — *Wrong.*

**Q3.** *The shark-fin ETCO2 waveform is characteristic of:*
- A. Pulmonary embolism. — *Wrong.*
- B. Bronchospasm or partial airway obstruction. — **Correct.** (Book Ch. 7, Ch. 14.)
- C. Hyperventilation. — *Wrong.*
- D. Pneumothorax. — *Wrong.*

**Q4.** *A trapped COPD patient with BP 70/40 and measured auto-PEEP of 14. The first action is:*
- A. Norepinephrine. — *Wrong.*
- B. Disconnect from the vent, let him exhale for 10-15 seconds. — **Correct.** (Book Ch. 14, Ch. 15.)
- C. Raise PEEP. — *Wrong.*
- D. Push sedation. — *Wrong.*

**Q5.** *A vented patient has rising PIP, rising plat, unilaterally diminished breath sounds, falling BP. The first action is:*
- A. Stat chest X-ray. — *Will happen, not first.*
- B. Needle decompression of the suspected pneumothorax. — **Correct.** (Book Ch. 14.) Time-critical.
- C. Increase FiO2 to 1.0. — *Reflex but not the first action.*
- D. Push more sedation. — *Wrong.*

#### Key points

- DOPES — Displacement, Obstruction, Pneumothorax, Equipment, Stacking.
- Bag off the vent first. Distinguishes vent problem from patient problem.
- High PIP, high plat = lungs. High PIP, normal plat = airway.
- ETCO2 lost = displacement or full obstruction. Shark-fin ETCO2 = partial obstruction.
- The first action for each scenario is what saves the patient. The rest of the workup follows.

---

## Appendix A — Cross-cutting parameter pin list

This is the single source of truth for tuned parameters that must NOT be changed without re-calibrating the tracker thresholds in the affected module.

| Module | Pinned parameters | Rationale |
|---|---|---|
| M1 | none | Display literacy module — no tuned math. |
| M2 | none | Display literacy module. |
| M3 | compliance: 50, resistance: 10 | Equation of motion calc lands plat ~13 + PEEP. |
| M4 | compliance variants 20/40/60 | Three teaching points; trackers depend on each. |
| M5 | shuntFraction values | Gas exchange math anchored to fixed shunt. |
| M6 | resistance: 28, rate: 22, Ti: 1.0 | Tuned to trip auto-PEEP >2 in the starting state. |
| M7 | compliance: 40, heightInches: 70, gender: male | PBW = 73; 6 mL/kg = 438. Plat math depends on C. |
| M8 | compliance: 35 | Vt = PINSP × C lands ~430 at PINSP 18. |
| M9 | compliance: 30, resistance: 12, perturbation script | PRVC yo-yo amplitude must hit ≥4 swing. |
| M10 | compliance: 55, spontaneousRate: 12, effortAmplitude: medium | PSV titration curve depends on this. |
| M11 | static clip file paths | Recognition module — uses pre-rendered waveforms. |
| M12 | compliance: 45, effortAmplitude: low | Spontaneous Vt curve anchored to these. |
| M13 | compliance: 32, resistance: 11, PEEP-PaO2 response curve | PEEP titration response anchored. |
| M14 | shuntFraction: 0.30, PEEP-FiO2-PaO2 response | Shunt vs V/Q teaching. |
| M15 | compliance: 32, heightInches: 70, gender: male | The master Strategy preset. PBW = 73; 6 mL/kg = 438. |
| M16 | resistance: 35, compliance: 60 | Auto-PEEP math at rate 22 lands at 8. |
| M17 | static SBT data | Decisional scenarios — not live sim. |
| M18 | cuff leak thresholds | <110 = positive; >130 = negative. |
| M19 | perturbation scripts; reset_between: true | DOPES scenario sequence; reset between is mandatory. |

---

## Appendix B — Microcopy lock list

The following user-facing strings are LOCKED. Changing them without updating this document constitutes drift.

- **Task Card title pattern.** "[Verb] [target]." e.g. "Set lung-protective VCV." "Rescue the trapped asthmatic."
- **Tier 1 hint pattern.** Diagnostic, not directive. "Two things are wrong: the mode and the rate."
- **Tier 2 hint pattern.** Specific, with numbers. "VCV, rate 12, Vt 7-8 mL/kg, PEEP 0."
- **Tier 3 hint pattern.** Demonstrative — runs a step, then prompts the learner.
- **Progress chip states.** Three states only: *not yet* (grey), *partial* (amber), *locked* (green). No fourth state. No emoji.
- **Voice rules.** No "awesome." No "great job!" No emoji. Owens dry. Compliments are rare and earned.
- **Failure state copy.** "That's a defensible move but not what the recipe asks for. [One-line rationale]." Never "Wrong!" or "Try again!"

---

## Appendix C — Authoring checklist for changes to existing modules

Before changing a module's preset, tracker thresholds, or microcopy:

1. Check the pin list (Appendix A). If the parameter is pinned, *do not change it* without re-tuning the tracker math.
2. Re-run the manual tracker simulation (a paper exercise — does the new preset still allow the success criteria to be met in 3-5 control moves?).
3. Update the user-facing task wording AND the success_criteria_display together. They must agree.
4. If you change a primer or summative question, update the explanation for *all four* options, not just the new correct one.
5. If you change a click-target or recognition prompt, regenerate the clip and update the file path in Appendix A.
6. If the change affects more than one module (e.g., shared compliance constant), update every affected module section here.

---

*End of MODULE_SPECS_v3.md.*
