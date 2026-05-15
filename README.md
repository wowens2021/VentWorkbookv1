# Ventilator Playground / Workbook

A 19-module learning curriculum that pairs Owens's *The Ventilator Book*
with a live ventilator simulator. Built for novices — medical students,
junior residents, new RTs, ICU nurses — encountering a ventilator for
the first or second time.

## Running locally

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Architecture pointers

- `src/modules/` — module configs (M1–M19). Each module specifies a
  primer quiz, content blocks, a scenario, a hidden objective tracker,
  a summative quiz, and an explore card.
- `src/shell/ModuleShell.tsx` — the per-module shell that drives the
  5-phase flow: briefing → primer → read (+ check yourself) → explore
  → try-it → debrief.
- `src/shell/usePhaseFlow.ts` — phase state machine, advanceFrom*
  actions, retake/restart.
- `src/shell/useEngagementTelemetry.ts` — active-time accumulator,
  idle/hint timers, per-phase engagement counters.
- `src/components/PlaygroundSim.tsx` — the ventilator sim. Forward-
  computes pressure/flow/volume waveforms and ABG values from the
  patient state + vent settings each frame.
- `src/trackers/` — hidden-objective tracker primitives
  (manipulation, outcome, recognition, compound).
- `src/harness/ScenarioHarness.ts` — pub-sub bus between the sim and
  the trackers.
- `src/scoring.ts` — composite-score formula (primer 30 + summative 50
  + hint/reset bonuses + check-yourself 5).

## Known sim limitations

Some module specs call for sim primitives that don't exist yet. Rather
than burying that as JSDoc paragraphs scattered across module files,
the full inventory lives in **[docs/BLOCKED_SIM.md](docs/BLOCKED_SIM.md)**.
Read that before authoring a module that needs a capability the sim
doesn't have.

## Curriculum specs

Authoritative specs are tracked in `docs/`:

- `docs/MODULE_SPECS_v3.md` — base curriculum.
- `docs/MODULE_SPEC_UPDATE_v3.1.md` — v3.1 revisions.
- `docs/MODULE_SPECS_v3.2_revisions.md` — v3.2 revisions (per-module
  fixes covering predict_mcq, perturbation API, SBP guardrail, etc).

When specs conflict, the highest version wins for the modules that
version covers; everything else falls through to the prior spec.
