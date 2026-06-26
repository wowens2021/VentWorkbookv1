// src/components/DyssynchronyWaveform.tsx
// Live dyssynchrony waveform renderer for M11. Mirrors PlaygroundSim's
// equation-of-motion engine (P = V/C + R·flow + PEEP). Three patterns:
// ineffective triggering, double triggering, flow starvation.

import { useState, useEffect, useRef } from 'react';

// ── Equation-of-motion engine ─────────────────────────────────────────────
// tau_insp = R·C,  tau_exp = R·C·1.5

function runScenario(breathSpecs: BreathSpec[], totalSec = 6, fps = 200) {
  const steps = Math.round(totalSec * fps);
  const pressureData: number[] = [];
  const flowData: number[] = [];
  const volumeData: number[] = []; // mL — computed in-loop from actual v (correctly seeded)

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * totalSec;
    let tAcc = 0;
    let spec: (BreathSpec & { tLocal: number }) | null = null;
    for (const s of breathSpecs) {
      if (t >= tAcc && t < tAcc + s.duration) {
        spec = { ...s, tLocal: t - tAcc };
        break;
      }
      tAcc += s.duration;
    }
    if (!spec) {
      pressureData.push(breathSpecs[0]?.PEEP ?? 5);
      flowData.push(0);
      volumeData.push(0);
      continue;
    }
    const { tLocal: tl, C = 0.042, R = 10, PEEP = 5, Pi = 18, Ti = 1.0,
            mode = 'psv', flowLps = 0.82, trapVol = 0,
            effortAmp = 0, effortDur = 0.3,
            scoopAmp = 0, scoopFrac = 0.45 } = spec;
    const tau_i = R * C;
    const tau_e = R * C * 1.5;
    let p: number, f: number, v: number;

    if (mode === 'flat') {
      p = PEEP; f = 0; v = trapVol;
    } else if (mode === 'effort') {
      const bell = tl < effortDur ? Math.sin((tl / effortDur) * Math.PI) : 0;
      p = PEEP - effortAmp * bell;
      f = -effortAmp * bell * 5;
      v = trapVol;
    } else if (mode === 'psv') {
      if (tl <= Ti) {
        // v computed analytically — correctly includes trapVol as baseline
        v = trapVol + C * Pi * (1 - Math.exp(-tl / tau_i));
        f = (Pi / R) * Math.exp(-tl / tau_i) * 60;
        p = Pi + PEEP;
      } else {
        const te = tl - Ti;
        const Vend = trapVol + C * Pi * (1 - Math.exp(-Ti / tau_i));
        const Veq  = PEEP * C;
        v = Math.max(trapVol, Veq + (Vend - Veq) * Math.exp(-te / tau_e));
        const dv = -(Vend - Veq) / tau_e * Math.exp(-te / tau_e);
        f = dv * 60;
        p = (v / C) + PEEP - (trapVol / C);
      }
    } else {
      // vcv
      if (tl <= Ti) {
        v = trapVol + flowLps * tl;
        f = flowLps * 60;
        p = (v / C) + flowLps * R + PEEP - (trapVol / C);
        if (scoopAmp > 0 && tl < Ti * scoopFrac)
          p -= scoopAmp * Math.sin((tl / (Ti * scoopFrac)) * Math.PI);
      } else {
        const te   = tl - Ti;
        const Vend = trapVol + flowLps * Ti;
        const Veq  = PEEP * C;
        v = Math.max(trapVol, Veq + (Vend - Veq) * Math.exp(-te / tau_e));
        const dv = -(Vend - Veq) / tau_e * Math.exp(-te / tau_e);
        f = dv * 60;
        p = (v / C) + PEEP - (trapVol / C);
      }
    }
    pressureData.push(Math.max(0, Math.min(50, p)));
    flowData.push(Math.max(-70, Math.min(80, f)));
    volumeData.push(Math.max(0, v * 1000)); // mL
  }
  return { pressureData, flowData, volumeData };
}

// ── Breath spec type ──────────────────────────────────────────────────────
interface BreathSpec {
  duration: number;
  C?: number; R?: number; PEEP?: number; Pi?: number; Ti?: number;
  mode?: 'psv' | 'vcv' | 'flat' | 'effort';
  flowLps?: number; trapVol?: number;
  effortAmp?: number; effortDur?: number;
  scoopAmp?: number; scoopFrac?: number;
}

// ── Pattern library ───────────────────────────────────────────────────────
const _C = 0.042, _R_hi = 22, _R_lo = 10, _PEEP = 5, _Pi = 18, _Ti = 1.0;
const _tau_i = _R_lo * _C, _tau_e = _R_lo * _C * 1.5;
const _VendA  = _C * _Pi * (1 - Math.exp(-_Ti / _tau_i));
const _Veq    = _PEEP * _C;
const _VtrapB = Math.max(0, _Veq + (_VendA - _Veq) * Math.exp(-0.75 / _tau_e));

// Build a run of `n` stacked breaths for the double-triggering pattern.
// Each breath inspires for `Ti` then exhales only `teShort` (an
// INCOMPLETE exhalation) before the next breath fires, so residual lung
// volume ratchets upward breath-over-breath — the unmistakable volume
// signature of breath stacking. The last breath in the run is given a
// long tail so it exhales fully back to baseline. The trapped-volume
// chain is computed with the same single-compartment formulas the engine
// uses, so the rendered volume trace is physically self-consistent.
function stackedTrain(n: number, Ti: number, teShort: number): BreathSpec[] {
  const tau_iL = _R_lo * _C;
  const tau_eL = _R_lo * _C * 1.5;
  const Veq = _PEEP * _C;
  const dV = _C * _Pi * (1 - Math.exp(-Ti / tau_iL));
  const specs: BreathSpec[] = [];
  let trap = 0;
  for (let k = 0; k < n; k++) {
    const dur = k === n - 1 ? Ti + 0.7 : Ti + teShort;
    specs.push({ duration: dur, C: _C, R: _R_lo, PEEP: _PEEP, Pi: _Pi, Ti, mode: 'psv', trapVol: trap });
    const Vend = trap + dV;
    trap = Math.max(0, Veq + (Vend - Veq) * Math.exp(-teShort / tau_eL));
  }
  return specs;
}

interface PatternDef {
  label: string; badge: string; badgeColor: string;
  description: string; fix: string;
  peep: number;
  annotationLabel: string;     // diagnostic conclusion — atlas mode only
  recognitionLabel: string;    // neutral timing — shown during scored question
  highlightWindow: [number, number]; // sweep slows inside this [tStart, tEnd] window
  breathSpecs: BreathSpec[];
}

const PATTERNS: Record<string, PatternDef> = {
  ineffective: {
    label: 'Ineffective triggering', badge: 'ineffective / inappropriate triggering', badgeColor: '#dc2626',
    description: 'Patient effort (↓ pressure dip + negative flow blip) with no delivered breath. Auto-PEEP forces the patient to overcome a higher threshold than the trigger is set for.',
    fix: 'Lower RR to clear auto-PEEP; add extrinsic PEEP at ~80% of measured auto-PEEP in COPD.',
    peep: _PEEP,
    annotationLabel: 'effort — no breath delivered',
    recognitionLabel: 'pressure event at ~4.5 s',
    highlightWindow: [4.2, 5.3],
    breathSpecs: [
      { duration: 2.0,  C: _C, R: _R_hi, PEEP: _PEEP, Pi: _Pi, Ti: 0.85, mode: 'psv' },
      { duration: 2.0,  C: _C, R: _R_hi, PEEP: _PEEP, Pi: _Pi, Ti: 0.85, mode: 'psv' },
      { duration: 0.40, C: _C, R: _R_hi, PEEP: _PEEP, mode: 'flat' },
      { duration: 0.30, C: _C, R: _R_hi, PEEP: _PEEP, mode: 'effort', effortAmp: 2.8, effortDur: 0.30 },
      { duration: 0.35, C: _C, R: _R_hi, PEEP: _PEEP, mode: 'flat' },
      { duration: 0.30, C: _C, R: _R_hi, PEEP: _PEEP, mode: 'effort', effortAmp: 2.8, effortDur: 0.30 },
      { duration: 0.65, C: _C, R: _R_hi, PEEP: _PEEP, Pi: _Pi, Ti: 0.85, mode: 'psv' },
    ],
  },
  double: {
    label: 'Double triggering', badge: 'breath stacking', badgeColor: '#d97706',
    description: 'A second breath fires before the first has fully expired. Peak of breath B is higher because the lung never emptied. Expiratory flow never returns to zero between A and B.',
    fix: "Raise Vt to match patient demand, or switch to PCV so the patient's neural Ti sets the cycle.",
    peep: _PEEP,
    annotationLabel: 'breaths stack before the lung empties — volume ratchets up',
    recognitionLabel: 'a run of stacked breaths at ~1.7–4.6 s',
    highlightWindow: [1.6, 4.0],
    breathSpecs: [
      // One normal, fully-exhaled reference breath...
      { duration: 1.7, C: _C, R: _R_lo, PEEP: _PEEP, Pi: _Pi, Ti: _Ti, mode: 'psv' },
      // ...then a run of three breaths stacked back-to-back, each
      // triggered before the previous has finished exhaling.
      ...stackedTrain(3, 0.7, 0.28),
    ],
  },
  starvation: {
    label: 'Flow starvation', badge: 'inadequate inspiratory assistance', badgeColor: '#7c3aed',
    description: "In VCV, the set flow can't keep up with the patient's demand. Pressure scoops downward during inspiration while flow stays perfectly square — the patient is actively pulling against the vent.",
    fix: 'Increase peak inspiratory flow, shorten inspiratory time, or switch to a pressure-based mode.',
    peep: _PEEP,
    annotationLabel: 'pressure scoops down while flow stays square',
    recognitionLabel: 'inspiratory phase at ~2.1–5.9 s',
    highlightWindow: [2.0, 4.2],
    breathSpecs: [
      { duration: 2.1, C: _C, R: _R_lo, PEEP: _PEEP, Ti: 0.55, mode: 'vcv', flowLps: 0.82 },
      { duration: 2.1, C: _C, R: _R_lo, PEEP: _PEEP, Ti: 0.55, mode: 'vcv', flowLps: 0.82, scoopAmp: 9, scoopFrac: 0.45 },
      { duration: 1.8, C: _C, R: _R_lo, PEEP: _PEEP, Ti: 0.55, mode: 'vcv', flowLps: 0.82, scoopAmp: 9, scoopFrac: 0.45 },
    ],
  },
};

// ── Waveform panel ────────────────────────────────────────────────────────
function WaveformPanel({
  title, unit, data, showZero = false, peepValue, sweepPct, height = 110,
}: {
  title: string; unit: string; data: number[];
  showZero?: boolean; peepValue?: number; sweepPct: string; height?: number;
}) {
  const min = Math.min(...data, 0), max = Math.max(...data, 1);
  const range = max - min || 1;
  const toY = (v: number) => 120 - ((v - min) / range) * 120;
  let d = '';
  data.forEach((v, i) => {
    d += (i === 0 ? 'M ' : ' L ') + ((i / Math.max(data.length - 1, 1)) * 450).toFixed(1) + ',' + toY(v).toFixed(1);
  });
  const zeroY = toY(0);
  const peepY = peepValue !== undefined ? toY(peepValue) : null;
  const ticks = [0, 1, 2, 3, 4].map(i => Math.round(max - (i * range) / 4));

  return (
    <div style={{ background: '#e0e0e0', borderRadius: 10, border: '1px solid #d1d5db',
                  padding: 8, position: 'relative', height, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 38,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    alignItems: 'flex-end', paddingRight: 5,
                    borderRight: '1px solid rgba(90,90,90,0.35)', zIndex: 20, pointerEvents: 'none' }}>
        {ticks.map((t, i) => (
          <div key={i} style={{ fontSize: 8, fontFamily: 'monospace', fontWeight: 700, color: '#5a5a5a' }}>{t}</div>
        ))}
      </div>
      <div style={{ paddingLeft: 42, marginBottom: 2, position: 'relative', zIndex: 30 }}>
        <span style={{ fontSize: 10, fontWeight: 900, color: '#3f3f3f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#6b6b6b', marginLeft: 4 }}>{unit}</span>
      </div>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                    paddingTop: 12, paddingLeft: 38, boxSizing: 'border-box' }}
           preserveAspectRatio="none" viewBox="0 0 450 120">
        {showZero && <line x1="0" y1={zeroY} x2="450" y2={zeroY}
          stroke="#7a7a7a" strokeWidth="0.6" strokeDasharray="3,5" strokeOpacity="0.7"
          vectorEffect="non-scaling-stroke" />}
        {peepY !== null && <line x1="0" y1={peepY!} x2="450" y2={peepY!}
          stroke="#47713e" strokeWidth="0.8" strokeDasharray="4,4" strokeOpacity="0.9"
          vectorEffect="non-scaling-stroke" />}
        <path d={d} fill="none" stroke="#3b82f6" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {peepY !== null && peepValue !== undefined && (
        <div style={{ position: 'absolute', right: 6, top: `calc(${(peepY! / 120) * 100}% - 4px)`,
                      zIndex: 20, pointerEvents: 'none', fontSize: 8, fontWeight: 900,
                      textTransform: 'uppercase', color: '#47713e',
                      background: 'rgba(255,255,255,0.85)', padding: '2px 5px',
                      borderRadius: 3, border: '1px solid rgba(71,113,62,0.35)', lineHeight: 1 }}>
          PEEP {peepValue}
        </div>
      )}
      <div style={{ position: 'absolute', top: 0, bottom: 0,
                    left: `calc(${sweepPct} * (100% - 38px) + 38px)`,
                    width: 1.5, background: 'rgba(59,130,246,0.55)',
                    pointerEvents: 'none', zIndex: 30 }} />
    </div>
  );
}

// ── Sweep hook — pauseable + adaptive speed ───────────────────────────────
function useSweep(
  totalSec = 6,
  paused = false,
  highlightWindow?: [number, number],
) {
  const [progress, setProgress] = useState(0);
  const elapsedRef = useRef(0);
  const lastTsRef  = useRef<number | null>(null);
  const rafRef     = useRef<number>(0);

  useEffect(() => {
    if (paused) {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
      return;
    }
    const animate = (ts: number) => {
      if (lastTsRef.current !== null) {
        const dt = (ts - lastTsRef.current) / 1000;
        const t  = elapsedRef.current % totalSec;
        const inWindow = highlightWindow && t >= highlightWindow[0] && t <= highlightWindow[1];
        elapsedRef.current += dt * (inWindow ? 0.25 : 1.0);
      }
      lastTsRef.current = ts;
      setProgress((elapsedRef.current % totalSec) / totalSec);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [paused, totalSec, highlightWindow]);

  return progress;
}

// ── Single pattern card ───────────────────────────────────────────────────
function PatternCard({
  patternKey,
  recognitionMode = false,
}: {
  patternKey: string;
  recognitionMode?: boolean;
}) {
  const pattern = PATTERNS[patternKey];

  // Hook order must be stable — call hooks BEFORE any early return.
  const [paused, setPaused] = useState(false);
  const data = pattern ? runScenario(pattern.breathSpecs, 6, 200) : { pressureData: [], flowData: [], volumeData: [] };
  const sweep    = useSweep(6, paused, pattern?.highlightWindow);
  const sweepPct = `${(sweep * 100).toFixed(1)}%`;

  if (!pattern) return null;

  const chipLabel = recognitionMode ? pattern.recognitionLabel : pattern.annotationLabel;

  return (
    <div style={{ background: '#18181b', borderRadius: 12, border: '1px solid #3f3f46',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(90deg,rgba(71,113,62,.15),rgba(71,113,62,.05))',
                    borderBottom: '1px solid rgba(71,113,62,.3)', padding: '7px 12px',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: '#47713e', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white"
               strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {!recognitionMode && (
            <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
                          letterSpacing: '0.18em', color: '#47713e', lineHeight: 1, marginBottom: 2 }}>
              {pattern.badge}
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.1,
                        color: recognitionMode ? '#71717a' : '#f4f4f5',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {recognitionMode ? 'Waveform — 6 s recording' : pattern.label}
          </div>
        </div>
        <button onClick={() => setPaused(p => !p)} style={{
          background: paused ? 'rgba(71,113,62,.25)' : 'rgba(59,130,246,.15)',
          border: paused ? '1px solid rgba(71,113,62,.5)' : '1px solid rgba(59,130,246,.35)',
          borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
          fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
          color: paused ? '#47713e' : '#3b82f6', flexShrink: 0,
        }}>
          {paused ? '▶ play' : '⏸ pause'}
        </button>
      </div>

      {/* Waveform panels */}
      <div style={{ padding: '8px 8px 4px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <WaveformPanel title="Airway Pressure" unit="cmH2O"
          data={data.pressureData} peepValue={pattern.peep} sweepPct={sweepPct} height={110} />
        <WaveformPanel title="Flow Rate" unit="L/min"
          data={data.flowData} showZero sweepPct={sweepPct} height={90} />
        {patternKey === 'double' && data.volumeData.length > 0 && (
          <WaveformPanel title="Tidal Volume" unit="mL"
            data={data.volumeData} sweepPct={sweepPct} height={80} />
        )}
      </div>

      {/* Annotation chip */}
      <div style={{ padding: '0 8px 8px' }}>
        <div style={{ background: recognitionMode ? '#f3f4f6' : '#fef3c7',
                      border: recognitionMode ? '1px solid #d1d5db' : '1px solid #b45309',
                      borderRadius: 5, padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%',
                        background: recognitionMode ? '#9ca3af' : '#b45309', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3,
                         color: recognitionMode ? '#6b7280' : '#92400e' }}>
            {chipLabel}
          </span>
        </div>
      </div>

      {/* Description + fix — suppressed during scored recognition */}
      {!recognitionMode && (
        <div style={{ borderTop: '1px solid #3f3f46', padding: '9px 12px',
                      display: 'flex', flexDirection: 'column', gap: 5 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#a1a1aa', lineHeight: 1.5 }}>{pattern.description}</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
                          color: '#47713e', background: 'rgba(71,113,62,.15)',
                          border: '1px solid rgba(71,113,62,.3)', padding: '2px 5px',
                          borderRadius: 3, flexShrink: 0, marginTop: 1 }}>fix</div>
            <p style={{ margin: 0, fontSize: 12, color: '#d4d4d8', lineHeight: 1.5 }}>{pattern.fix}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Public API ────────────────────────────────────────────────────────────
//
// Recognition-prompt (scored question — no labels, no description/fix):
//   <DyssynchronyWaveform pattern="ineffective" />
//
// Atlas (read phase — labeled tabs, description, fix):
//   <DyssynchronyWaveform defaultPattern="ineffective" mode="atlas" />
//
export default function DyssynchronyWaveform({
  pattern,
  defaultPattern = 'ineffective',
  mode = 'recognition',
}: {
  pattern?: string;
  defaultPattern?: string;
  mode?: 'recognition' | 'atlas';
}) {
  const keys = ['ineffective', 'double', 'starvation'];
  const [active, setActive] = useState(pattern ?? defaultPattern);
  const isAtlas = mode === 'atlas';

  if (pattern && !isAtlas) {
    return (
      <div style={{ fontFamily: 'ui-sans-serif,system-ui,-apple-system,Inter,sans-serif', marginBottom: 12,
                    width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <PatternCard patternKey={pattern} recognitionMode={true} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'ui-sans-serif,system-ui,-apple-system,Inter,sans-serif',
                  width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 10,
                    background: '#27272a', borderRadius: 8, padding: 3 }}>
        {keys.map(k => (
          <button key={k} onClick={() => setActive(k)} style={{
            flex: 1, padding: '6px 4px', borderRadius: 6, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
            background: active === k ? '#47713e' : 'transparent',
            color: active === k ? '#fff' : '#71717a',
            transition: 'all 0.15s',
          }}>
            {PATTERNS[k]?.label}
          </button>
        ))}
      </div>
      <PatternCard patternKey={active} recognitionMode={false} />
    </div>
  );
}
