import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Activity, User, Pause, Play, X, Plus, Minus, BookOpen, Lock,
} from 'lucide-react';
import AlertContainer from './AlertContainer';
import { DEFAULT_PATIENT, DEFAULT_SETTINGS, P_ATM, P_H2O, R_QUOTIENT, HUFNER_NUMBER, O2_PLASMA_SOLUBILITY } from '../sim/constants';
import type { ScenarioHarness } from '../harness/ScenarioHarness';
import type { ControlName, SimPreset } from '../shell/types';

interface PlaygroundSimProps {
  /** Optional harness — if provided, the sim emits events into it. */
  harness?: ScenarioHarness;
  /** Initial preset to load (mode, settings, patient overrides). */
  initialPreset?: SimPreset;
  /** List of controls the learner is allowed to modify. If absent, all are unlocked. */
  unlockedControls?: ControlName[];
  /** Optional content to render in the workbook slot. */
  workbookContent?: React.ReactNode;
  /** Optional overlay for inline recognition prompts. */
  inlinePromptOverlay?: React.ReactNode;
  /** Hide the header (when embedded inside a shell that has its own header). */
  hideHeader?: boolean;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

const getRandomDemographics = () => {
  const gender: 'M' | 'F' = Math.random() > 0.5 ? 'M' : 'F';
  const heightInches = gender === 'M'
    ? Math.floor(Math.random() * (75 - 64 + 1) + 64)
    : Math.floor(Math.random() * (70 - 59 + 1) + 59);
  return { gender, heightInches };
};

const calculatePBW = (gender: 'M' | 'F', heightInches: number) => {
  const base = gender === 'M' ? 50 : 45.5;
  return base + 2.3 * (heightInches - 60);
};

const roundTo10 = (val: number) => Math.round(val / 10) * 10;

const generateSegmentedPaths = (
  data: any[],
  key: string,
  bounds: { min: number; max: number },
  defaultColor: string,
) => {
  if (!data || data.length < 2) return [];
  const { min, max } = bounds;
  const segments: { isSpont: boolean; points: { x: number; y: number }[] }[] = [];
  let current = { isSpont: !!data[0].isSpontaneous, points: [] as { x: number; y: number }[] };

  data.forEach((d, i) => {
    const x = i;
    const y = 120 - ((d[key] - min) / (max - min) * 120);
    const pointIsSpont = !!d.isSpontaneous;
    if (pointIsSpont !== current.isSpont) {
      segments.push(current);
      const prevY = 120 - ((data[i - 1][key] - min) / (max - min) * 120);
      current = { isSpont: pointIsSpont, points: [{ x: i - 1, y: prevY }, { x, y }] };
    } else {
      current.points.push({ x, y });
    }
  });
  segments.push(current);

  return segments.map(s => ({
    path: s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' '),
    color: s.isSpont ? '#facc15' : defaultColor,
  }));
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const MetricBox = ({ label, value, color }: { label: string; value: any; color: string }) => (
  <div className="bg-slate-950/50 rounded-lg p-1.5 border border-slate-800 flex flex-col items-center">
    <span className="text-[7px] font-bold text-slate-500 uppercase leading-none mb-1">{label}</span>
    <span className={`text-sm font-mono font-black ${color}`}>{value}</span>
  </div>
);

const NumericCard = ({ label, value, unit, color, sub = null }: any) => (
  <div className="bg-slate-900 rounded-lg border border-slate-800 p-1.5 flex flex-col justify-between shadow-md">
    <div className="flex justify-between leading-none">
      <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">{label}</span>
      {sub && <span className="text-[8px] font-bold text-slate-600">{sub}</span>}
    </div>
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-mono font-black tracking-tighter ${color}`}>
        {typeof value === 'number' ? value.toFixed(0) : value}
      </span>
      <span className="text-[9px] text-slate-500 uppercase font-black">{unit}</span>
    </div>
  </div>
);

const ControlBox = ({ label, value, unit, min, max, step, onChange, forceDecimal = false, className = '' }: any) => {
  const timerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  const handleAction = (delta: number) => {
    const newValue = parseFloat((valueRef.current + delta).toFixed(2));
    if (newValue >= min && newValue <= max) onChange(newValue);
  };
  const startRepeat = (delta: number) => {
    handleAction(delta);
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => handleAction(delta), 80);
    }, 400);
  };
  const stopRepeat = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-1">{label}</span>
      <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 shadow-inner hover:border-sky-500/50 transition-all">
        <div className="flex-1 text-center px-1">
          <div className="text-xl font-mono font-extrabold leading-none tracking-tight text-white">
            {forceDecimal ? Number(value).toFixed(1) : value}
          </div>
          <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none mt-1">{unit}</div>
        </div>
        <div className="flex flex-col gap-0.5">
          <button
            aria-label="Increase"
            onMouseDown={() => startRepeat(step)} onMouseUp={stopRepeat} onMouseLeave={stopRepeat}
            onTouchStart={() => startRepeat(step)} onTouchEnd={stopRepeat}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-400 active:scale-95"
          ><Plus size={14} strokeWidth={2} /></button>
          <button
            aria-label="Decrease"
            onMouseDown={() => startRepeat(-step)} onMouseUp={stopRepeat} onMouseLeave={stopRepeat}
            onTouchStart={() => startRepeat(-step)} onTouchEnd={stopRepeat}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-400 active:scale-95"
          ><Minus size={14} strokeWidth={2} /></button>
        </div>
      </div>
    </div>
  );
};

const WaveformPanel = React.memo(({
  title, dataKey, unit, bounds, segmentedPaths, cursorIndex, dataPoints, isHoldActive = false, showZeroLine = false, isFrozen,
}: {
  title: string; dataKey: string; unit: string;
  bounds: { min: number; max: number };
  segmentedPaths: { path: string; color: string }[];
  cursorIndex: number | null; dataPoints: any[];
  isHoldActive?: boolean; showZeroLine?: boolean; isFrozen: boolean;
}) => {
  const { min, max } = bounds;
  const cursorValue = cursorIndex !== null && dataPoints[cursorIndex] ? dataPoints[cursorIndex][dataKey] : 0;
  const cursorY = 120 - (((cursorValue - min) / (max - min)) * 120);
  const zeroY = 120 - (((0 - min) / (max - min)) * 120);
  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-2 flex-1 relative min-h-0 overflow-hidden shadow-inner">
      <div className="absolute left-0 top-3 bottom-3 w-10 flex flex-col justify-between items-end pr-1.5 border-r border-slate-800/50 z-20 pointer-events-none">
        {[max, (max + min) / 2, min].map((v, i) => (
          <div key={i} className="text-[8px] font-mono text-slate-300 font-black">{Math.round(v)}</div>
        ))}
      </div>
      <div className="flex justify-between items-start relative z-30 pl-10">
        <div className="flex flex-col leading-none">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{title}</span>
          <span className="text-[9px] font-bold text-slate-400">{unit}</span>
        </div>
      </div>
      <svg className="absolute inset-0 w-full h-full pt-3 pl-10 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 450 120">
        {showZeroLine && <line x1="0" y1={zeroY} x2="450" y2={zeroY} stroke="#475569" strokeWidth="1" strokeDasharray="4" vectorEffect="non-scaling-stroke" />}
        {segmentedPaths.map((seg, idx) => (
          <path key={idx} d={seg.path} fill="none" stroke={seg.color} strokeWidth="2.0" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        ))}
        {isHoldActive && title === "Airway Pressure" && (
          <text x="225" y="60" textAnchor="middle" fill="#facc15" className="text-xl font-black uppercase tracking-widest animate-pulse">HOLD</text>
        )}
        {isFrozen && cursorIndex !== null && !isNaN(cursorIndex) && (
          <g>
            <line x1={cursorIndex} y1="0" x2={cursorIndex} y2="120" stroke="white" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" vectorEffect="non-scaling-stroke" />
            <circle cx={cursorIndex} cy={cursorY} r="3" fill="white" vectorEffect="non-scaling-stroke" />
            <g transform={`translate(${cursorIndex + (cursorIndex > 400 ? -50 : 10)}, ${cursorY > 100 ? 100 : cursorY < 20 ? 20 : cursorY})`}>
              <rect width="40" height="15" rx="3" fill="rgba(15,23,42,0.9)" stroke="#475569" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
              <text x="20" y="11" textAnchor="middle" fill="white" className="text-[10px] font-mono">{Math.round(Number(cursorValue))}</text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

const PlaygroundSim: React.FC<PlaygroundSimProps> = ({
  harness,
  initialPreset,
  unlockedControls,
  workbookContent,
  inlinePromptOverlay,
  hideHeader,
}) => {
  const isLocked = useCallback((control: ControlName) => {
    if (!unlockedControls) return false;
    return !unlockedControls.includes(control);
  }, [unlockedControls]);

  // ── State (seeded from initialPreset if provided) ──
  const [mode, setMode] = useState(initialPreset?.mode ?? 'PRVC');
  const [isFrozen, setIsFrozen] = useState(false);
  const [isParalyzed, setIsParalyzed] = useState(false);
  const [cursorIndex, setCursorIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPatientSettings, setShowPatientSettings] = useState(false);
  const [heightUnit, setHeightUnit] = useState<'in' | 'cm'>('in');
  const [alerts, setAlerts] = useState<{ id: number; message: string; type: 'positive' | 'negative' }[]>([]);
  const [dataPoints, setDataPoints] = useState<any[]>([]);
  const [activeHoldType, setActiveHoldType] = useState<'INSP' | 'EXP' | null>(null);
  const [prvcAdaptivePi, setPrvcAdaptivePi] = useState(15);

  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS, ...(initialPreset?.settings ?? {}) });
  const [patient, setPatient] = useState(() => {
    const demo = initialPreset?.patient?.gender && initialPreset?.patient?.heightInches
      ? { gender: initialPreset.patient.gender, heightInches: initialPreset.patient.heightInches }
      : getRandomDemographics();
    const pbw = calculatePBW(demo.gender as 'M' | 'F', demo.heightInches);
    return {
      ...DEFAULT_PATIENT,
      ...demo,
      compliance: Math.min(100, Math.round(pbw)),
      ...(initialPreset?.patient ?? {}),
    };
  });

  // ── Listen for harness reset_to_preset ──
  useEffect(() => {
    if (!harness) return;
    const off = harness.onReset(() => {
      if (initialPreset?.settings) setSettings({ ...DEFAULT_SETTINGS, ...initialPreset.settings });
      if (initialPreset?.patient) setPatient(p => ({ ...p, ...initialPreset.patient }));
      if (initialPreset?.mode) setMode(initialPreset.mode);
    });
    return off;
  }, [harness, initialPreset]);

  // ── Register snapshot provider with the harness ──
  useEffect(() => {
    if (!harness) return;
    harness.registerSnapshotProvider(() => ({
      mode, settings, patient,
      lastBreathMetrics: { ...metricsRef.current },
      dataPoints: dataPoints.slice(-100),
      timestamp: Date.now(),
    }));
  }, [harness, mode, settings, patient, dataPoints]);

  const [metrics, setMetrics] = useState({
    pip: 0, plat: 0, drivingPressure: 0, map: 0,
    mve: 6.5, mveSpont: 1.2, totalPeep: 5, vte: 440,
    isLastSpont: false, actualRate: 20,
  });
  const [ieRatioDisplay, setIeRatioDisplay] = useState('1:2.0');

  // ── Refs ──
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const settingsRef = useRef(settings);
  const patientRef = useRef(patient);
  const modeRef = useRef(mode);
  const prvcAdaptivePiRef = useRef(prvcAdaptivePi);
  const isFrozenRef = useRef(isFrozen);
  const isParalyzedRef = useRef(isParalyzed);
  const metricsRef = useRef(metrics);
  const activeHoldTypeRef = useRef(activeHoldType);

  const pendingInspRef = useRef(false);
  const pendingExpRef = useRef(false);
  const isHolding = useRef(false);
  const isExpHolding = useRef(false);
  const holdStartTimeRef = useRef(0);
  const holdOffsetRef = useRef(0);
  const lastVolumeRef = useRef(0);
  const lastBreathStartTimeRef = useRef(0);
  const nextMandatoryTimeRef = useRef(0);
  const nextSpontaneousTimeRef = useRef(0);
  const isPatientTriggeredRef = useRef(false);
  const isCurrentBreathSpontaneousRef = useRef(false);
  const wasInInspirationRef = useRef(false);
  const vAtEndOfInspRef = useRef(0.45);
  const currentBreathPeakPressureRef = useRef(0);
  const lastFreezeTimeRef = useRef(0);
  const totalFreezeOffsetRef = useRef(0);
  const peakExpiratoryFlowRef = useRef(0);
  const currentFlowLpmRef = useRef(0);
  const trappedVolumeAtBreathStartRef = useRef(0);
  const actualInspDurationRef = useRef(1.0);
  const abgRef = useRef<any>(null);

  // Sync refs
  useEffect(() => {
    settingsRef.current = settings;
    patientRef.current = patient;
    modeRef.current = mode;
    prvcAdaptivePiRef.current = prvcAdaptivePi;
    isFrozenRef.current = isFrozen;
    isParalyzedRef.current = isParalyzed;
    metricsRef.current = metrics;
    activeHoldTypeRef.current = activeHoldType;
  }, [settings, patient, mode, prvcAdaptivePi, isFrozen, isParalyzed, metrics, activeHoldType]);

  // ── Derived ──
  const demographics = useMemo(() => ({
    pbw: calculatePBW(patient.gender, patient.heightInches),
  }), [patient.gender, patient.heightInches]);

  const displayHeight = useMemo(() => {
    return heightUnit === 'in' ? Math.round(patient.heightInches) : Math.round(patient.heightInches * 2.54);
  }, [patient.heightInches, heightUnit]);

  // ── ABG Engine (§9, §15.5) ──
  // Computes pH, PaCO2, PaO2, HCO3, SpO2, BE, ETCO2 from patient state + vent settings.
  const abg = useMemo(() => {
    const pbw = calculatePBW(patient.gender, patient.heightInches);
    const VCO2 = 200; // mL/min baseline
    const actualVt = metrics.vte || settings.tidalVolume;
    const actualRr = metrics.actualRate || settings.respiratoryRate;

    // Dead-space: anatomic + PEEP overdistension penalty (§12.6)
    const V_D_anat = actualVt * (patient.deadSpaceFraction ?? 0.30);
    const optimalPeep = patient.compliance < 40 ? 10 : 5;
    const peepVDPenalty = Math.floor(Math.max(0, settings.peep - optimalPeep) / 2) * 0.15;
    let V_D = V_D_anat * (1 + peepVDPenalty);

    // Auto-PEEP dead-space amplification (§12.6)
    const latentAutoPeep = trappedVolumeAtBreathStartRef.current / (patient.compliance / 1000);
    const effectiveAutoPeep = Math.max(metrics.totalPeep - settings.peep, latentAutoPeep);
    V_D += V_D_anat * (effectiveAutoPeep * 0.030);
    V_D = Math.min(actualVt * 0.95, V_D);

    // Alveolar ventilation → PaCO2 (§15.5)
    const normalVt = pbw * 7;
    const normalVa = ((normalVt - normalVt * 0.30) / 1000) * 14;
    const V_A = Math.max(0.1, ((actualVt - V_D) / 1000) * actualRr);
    let PaCO2 = 40 * (normalVa / V_A) * (VCO2 / 200);
    PaCO2 = Math.max(15, Math.min(130, PaCO2));

    // Acid-base (§9.4)
    let HCO3 = 24;
    const acute_CO2_shift = PaCO2 - 40;
    if (acute_CO2_shift > 0) {
      HCO3 += (acute_CO2_shift / 10) * 1.0; // acute resp acidosis buffering
    } else {
      HCO3 += (acute_CO2_shift / 10) * 2.0; // acute resp alkalosis
    }
    const H_plus = 24 * (PaCO2 / HCO3);
    const final_pH = 9 - Math.log10(H_plus);

    // Oxygenation (§9.6, §15.5)
    const P_AO2 = ((P_ATM - P_H2O) * (settings.fiO2 / 100)) - (PaCO2 / R_QUOTIENT);

    // Shunt fraction from compliance (§15.5 shunt_factor table)
    let baselineShunt = 0.05;
    if (patient.compliance < 20) baselineShunt = 0.40;
    else if (patient.compliance < 35) baselineShunt = 0.30;
    else if (patient.compliance < 55) baselineShunt = 0.15;

    const peepRecruitment = Math.min(13, Math.max(0, settings.peep - 5));
    const Qs_Qt = Math.max(0.02, Math.min(0.80, baselineShunt - peepRecruitment * 0.018));

    const base_PF = 500 - (Qs_Qt * 1000);
    let PaO2 = (settings.fiO2 / 100) * base_PF;
    PaO2 = Math.max(25, Math.min(P_AO2, PaO2));

    // Bohr effect — O2 dissociation curve shift (§15.5)
    let p50 = 26.7;
    if (final_pH < 7.30) p50 += 3;
    else if (final_pH > 7.50) p50 -= 3;
    const r = Math.pow(PaO2 / p50, 3.0);
    let SpO2 = Math.max(0, Math.min(100, 100 * (r / (r + 1))));

    // Hemodynamic coupling — cardiac output (§15.6)
    const cycleTime = 60 / Math.max(1, actualRr);
    const iT = settings.iTime || 1.0;
    const P_mean = settings.peep + ((metrics.pip - settings.peep) * Math.min(1, iT / cycleTime));
    const pleural_transmission = patient.compliance < 40 ? 0.3 : 0.5;
    const mean_alveolar_pressure = P_mean + effectiveAutoPeep;
    const ITP = mean_alveolar_pressure * pleural_transmission;
    const MSFP = 7;
    const RAP = ITP;
    const venous_return = Math.max(0, (MSFP - RAP));
    let CO = Math.max(0.5, Math.min(15.0, venous_return));

    // O2 delivery (§9.10)
    const O2_Content = (HUFNER_NUMBER * 12.0 * (SpO2 / 100)) + (PaO2 * O2_PLASMA_SOLUBILITY);
    const DO2 = CO * O2_Content * 10;

    // A-a gradient (§9.6)
    const aAGradient = Math.max(0, P_AO2 - PaO2);

    // ETCO2 — alveolar CO2 minus physiologic dead-space gradient (§10)
    const etco2 = Math.max(0, Math.round(PaCO2 - 5));

    // Base excess — Van Slyke approximation (§9.5)
    const be = Math.round(((HCO3 - 24) + 16.2 * (final_pH - 7.40)) * 10) / 10;

    return {
      ph: final_pH.toFixed(2),
      paco2: Math.round(PaCO2),
      pao2: Math.round(PaO2),
      hco3: Math.round(HCO3),
      spo2: Math.round(SpO2),
      pfRatio: Math.round(PaO2 / (settings.fiO2 / 100)),
      be,
      etco2,
      effectiveAutoPeep,
      effectiveP_mean: mean_alveolar_pressure,
      calculated_co: CO,
      do2: Math.round(DO2),
      aAGradient: Math.round(aAGradient),
    };
  }, [
    metrics.mve, metrics.totalPeep, metrics.pip, metrics.actualRate, metrics.vte,
    settings.fiO2, settings.peep, settings.iTime, settings.respiratoryRate, settings.tidalVolume,
    patient.compliance, patient.deadSpaceFraction, patient.gender, patient.heightInches,
  ]);

  // ABG ref stays current for the animation loop and clinical alerts
  const hasAlteredRef = useRef(false);
  useEffect(() => {
    if (!abgRef.current) abgRef.current = abg;
    abgRef.current = abg;
  }, [abg]);

  // ── Emit sim_tick on every completed breath ──
  const breathNumRef = useRef(0);
  useEffect(() => {
    if (!harness) return;
    if (metrics.vte <= 0) return;
    breathNumRef.current += 1;
    const autoPeep = (metrics.totalPeep || settings.peep) - settings.peep;
    harness.emit({
      type: 'sim_tick',
      breath_number: breathNumRef.current,
      computed_readouts: {
        pip: metrics.pip,
        plat: metrics.plat,
        drivingPressure: metrics.drivingPressure,
        mve: metrics.mve,
        vte: metrics.vte,
        totalPeep: metrics.totalPeep,
        autoPeep: autoPeep > 0.1 ? autoPeep : 0,
        actualRate: metrics.actualRate,
        ph: parseFloat(abg.ph),
        paco2: abg.paco2,
        pao2: abg.pao2,
        spo2: abg.spo2,
        hco3: abg.hco3,
        fio2: settings.fiO2,
        peep: settings.peep,
        tidalVolumeSet: settings.tidalVolume,
      },
      timestamp: Date.now(),
    });
  }, [metrics.vte, harness]); // fires once per completed breath

  // RSBI (§12.13)
  const rsbiValue = useMemo(() => {
    const vtL = metrics.vte / 1000;
    if (vtL < 0.05) return 0;
    return Math.round(metrics.actualRate / vtL);
  }, [metrics.actualRate, metrics.vte]);

  // Auto-PEEP display value
  const autoPeepValue = useMemo(() => {
    const diff = (metrics.totalPeep || settings.peep) - settings.peep;
    return diff > 0.1 ? diff : 0;
  }, [metrics.totalPeep, settings.peep]);

  // I:E ratio
  const currentIERatio = useMemo(() => {
    if (mode === 'PSV') return 'N/A';
    const totalRate = metrics.actualRate || (settings.respiratoryRate + patient.spontaneousRate);
    if (totalRate <= 0) return 'N/A';
    const cycleTime = 60 / totalRate;
    const eTime = Math.max(0.1, cycleTime - (settings.iTime || 1.0));
    return `1:${(eTime / (settings.iTime || 1.0)).toFixed(1)}`;
  }, [metrics.actualRate, settings.iTime, settings.respiratoryRate, patient.spontaneousRate, mode]);

  // ── Alert helpers ──
  const addAlert = useCallback((message: string, type: 'positive' | 'negative') => {
    setAlerts(prev => {
      if (prev.some(a => a.message === message)) return prev;
      const id = Date.now() + Math.random();
      const newAlert = { id, message, type };
      if (type === 'positive') setTimeout(() => setAlerts(p => p.filter(a => a.id !== id)), 10000);
      return [...prev, newAlert];
    });
  }, []);

  const removeAlert = useCallback((message: string) => {
    setAlerts(prev => prev.filter(a => a.message !== message));
  }, []);

  // ── Generic clinical alerts ──
  useEffect(() => {
    if (isFrozen) return;
    // Auto-PEEP warning
    const msg = 'Auto-PEEP detected. Expiratory flow does not return to zero. Consider decreasing RR or I-time.';
    if (autoPeepValue > 3) addAlert(msg, 'negative');
    else removeAlert(msg);
  }, [autoPeepValue, isFrozen, addAlert, removeAlert]);

  useEffect(() => {
    if (isFrozen) return;
    const msg = 'Plateau Pressure > 30 cmH₂O — risk of volutrauma/barotrauma. Reduce Vt or PEEP.';
    if (metrics.plat > 30 && metrics.plat > 0) addAlert(msg, 'negative');
    else removeAlert(msg);
  }, [metrics.plat, isFrozen, addAlert, removeAlert]);

  useEffect(() => {
    if (isFrozen) return;
    const msg = 'Driving Pressure > 15 cmH₂O — associated with excess mortality in ARDS.';
    if (metrics.drivingPressure > 15 && metrics.drivingPressure > 0) addAlert(msg, 'negative');
    else removeAlert(msg);
  }, [metrics.drivingPressure, isFrozen, addAlert, removeAlert]);

  // Spontaneous rate adapts gently to physiology
  useEffect(() => {
    const interval = setInterval(() => {
      if (isFrozenRef.current) return;
      const ph = parseFloat(abg.ph);
      if (ph > 7.32 && abg.effectiveAutoPeep < 4) {
        if (patient.spontaneousRate > 6 && Math.random() > 0.7)
          setPatient(p => ({ ...p, spontaneousRate: Math.max(6, p.spontaneousRate - (Math.random() > 0.5 ? 1 : 0)) }));
      } else if (ph < 7.28 || abg.effectiveAutoPeep > 8) {
        if (patient.spontaneousRate < 28 && Math.random() > 0.7)
          setPatient(p => ({ ...p, spontaneousRate: Math.min(28, p.spontaneousRate + (Math.random() > 0.5 ? 1 : 0)) }));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [abg, patient.spontaneousRate]);

  // ── Handlers ──
  const handleSettingChange = (key: string, val: number) => {
    if (isLocked(key as ControlName)) return;
    hasAlteredRef.current = true;
    const old = (settings as any)[key];
    setSettings(prev => ({ ...prev, [key]: val }));
    harness?.emit({ type: 'control_changed', control: key as ControlName, old_value: old, new_value: val, timestamp: Date.now() });
  };

  const handleModeChange = (newMode: string) => {
    if (isLocked('mode')) return;
    hasAlteredRef.current = true;
    harness?.emit({ type: 'control_changed', control: 'mode', old_value: mode, new_value: newMode, timestamp: Date.now() });
    const currentVE = metrics.mve;
    if (newMode === 'PSV') {
      const predictedVtL = (patient.compliance * settings.psLevel * 0.9) / 1000;
      const calculatedRate = Math.round(currentVE / Math.max(0.1, predictedVtL));
      setSettings(s => ({ ...s, tidalVolume: roundTo10(predictedVtL * 1000) }));
      setPatient(p => ({ ...p, spontaneousRate: Math.max(6, Math.min(40, calculatedRate)) }));
    } else if (newMode === 'PRVC') {
      const estPi = (settings.tidalVolume / 1000) / (patient.compliance / 1000);
      setPrvcAdaptivePi(Math.max(5, Math.min(35, Math.round(estPi))));
    } else if (newMode === 'PCV') {
      const requiredPi = Math.min(60, Math.round(settings.tidalVolume / Math.max(1, patient.compliance)));
      setSettings(prev => ({ ...prev, pInsp: requiredPi }));
    } else if (newMode === 'SIMV/PS') {
      const requiredPi = Math.min(60, Math.round(settings.tidalVolume / Math.max(1, patient.compliance)));
      setSettings(prev => ({ ...prev, psLevel: requiredPi }));
    }
    setMode(newMode);
    setMetrics(prev => ({ ...prev, pip: 0, plat: 0, drivingPressure: 0 }));
  };

  const handlePatientChange = (key: string, val: any) => {
    if (isLocked(key as ControlName)) return;
    hasAlteredRef.current = true;
    const old = (patient as any)[key];
    setPatient(prev => {
      const next: any = { ...prev, [key]: (val === 'M' || val === 'F') ? val : parseFloat(val) };
      if (key === 'gender') {
        const base = val === 'M' ? 50 : 45.5;
        next.compliance = Math.min(100, Math.round(base + 2.3 * (next.heightInches - 60)));
      }
      return next;
    });
    const newNum = (val === 'M' || val === 'F') ? val : parseFloat(val);
    harness?.emit({ type: 'control_changed', control: key as ControlName, old_value: old, new_value: newNum, timestamp: Date.now() });
  };

  const handleHeightInput = (val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return;
    const newHeight = heightUnit === 'in' ? n : n / 2.54;
    setPatient(prev => {
      const base = prev.gender === 'M' ? 50 : 45.5;
      return { ...prev, heightInches: newHeight, compliance: Math.min(100, Math.round(base + 2.3 * (newHeight - 60))) };
    });
  };

  const handleWaveformInteraction = (e: React.MouseEvent) => {
    if (!isFrozen || !waveformContainerRef.current) return;
    const rect = waveformContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 48;
    const pct = Math.max(0, Math.min(1, x / (rect.width - 48)));
    const index = Math.round(pct * 179);
    if (!isNaN(index) && dataPoints.length > 0) setCursorIndex(Math.min(index, dataPoints.length - 1));
  };

  // ── Simulation Loop (§12.2 equation of motion) ──
  useEffect(() => {
    const animate = () => {
      const settings = settingsRef.current;
      const patient = patientRef.current;
      const mode = modeRef.current;
      const prvcAdaptivePi = prvcAdaptivePiRef.current;
      const isFrozen = isFrozenRef.current;
      const metrics = metricsRef.current;

      if (isFrozen) { requestRef.current = requestAnimationFrame(animate); return; }

      const now = Date.now();
      const elapsedTotal = (now - startTimeRef.current - totalFreezeOffsetRef.current) / 950;
      const elapsedInSim = elapsedTotal - holdOffsetRef.current;

      const ventInterval = 60 / settings.respiratoryRate;
      const tSinceLastStart = elapsedInSim - lastBreathStartTimeRef.current;
      const iT = settings.iTime || 1.0;

      const C = patient.compliance / 1000;
      const tau_insp_check = patient.resistance * C;

      let isCurrentlyInInsp = false;
      if (mode === 'PSV' || (mode === 'SIMV/PS' && isCurrentBreathSpontaneousRef.current)) {
        if (Math.exp(-Math.max(0, tSinceLastStart - 0.1) / tau_insp_check) > settings.endInspiratoryPercent / 100 && tSinceLastStart < 3.0) isCurrentlyInInsp = true;
      } else if (tSinceLastStart < iT) {
        isCurrentlyInInsp = true;
      }

      let startNewBreath = false, triggeredByPatient = false;
      if (!isCurrentlyInInsp && tSinceLastStart >= 0.2 && !isHolding.current && !isExpHolding.current) {
        if (mode === 'PSV') {
          if (patient.spontaneousRate > 0 && elapsedInSim >= nextSpontaneousTimeRef.current) {
            startNewBreath = true; triggeredByPatient = true;
          }
        } else {
          const currentExpFlow = Math.abs(currentFlowLpmRef.current);
          const flowThreshold = Math.max(0.5, Math.abs(peakExpiratoryFlowRef.current) * 0.25);
          const isFlowSyncMet = !isCurrentBreathSpontaneousRef.current || currentExpFlow <= flowThreshold;
          if (elapsedInSim >= nextMandatoryTimeRef.current && isFlowSyncMet) {
            startNewBreath = true; triggeredByPatient = false;
          } else if (patient.spontaneousRate > 0 && elapsedInSim >= nextSpontaneousTimeRef.current) {
            startNewBreath = true; triggeredByPatient = true;
          }
        }
      }

      // Expiratory hold takes priority over a new breath
      if (startNewBreath && pendingExpRef.current) {
        isExpHolding.current = true;
        setActiveHoldType('EXP');
        holdStartTimeRef.current = elapsedTotal;
        pendingExpRef.current = false;
        startNewBreath = false;
      }

      if (startNewBreath) {
        trappedVolumeAtBreathStartRef.current = lastVolumeRef.current;
        const isMandatoryAdaptive = mode === 'PRVC' || (mode === 'SIMV/PS' && !triggeredByPatient);
        if (isMandatoryAdaptive && metrics.vte > 10) {
          const vtErr = settings.tidalVolume - metrics.vte;
          if (Math.abs(vtErr) > 5) {
            const correction = Math.max(-10, Math.min(10, vtErr / (patient.compliance || 40)));
            setPrvcAdaptivePi(p => Math.max(2, Math.min(45, p + correction)));
          }
        }
        lastBreathStartTimeRef.current = elapsedInSim;
        isPatientTriggeredRef.current = triggeredByPatient;
        isCurrentBreathSpontaneousRef.current = triggeredByPatient;
        peakExpiratoryFlowRef.current = 0;
        if (triggeredByPatient) {
          nextSpontaneousTimeRef.current = elapsedInSim + (60 / (patient.spontaneousRate || 0.1) * (0.8 + Math.random() * 0.4));
        } else {
          nextMandatoryTimeRef.current = elapsedInSim + ventInterval;
        }
        currentBreathPeakPressureRef.current = 0;

        // Actual rate calculation (mode-dependent)
        let newActualRate = settings.respiratoryRate;
        if (mode === 'PSV') {
          newActualRate = patient.spontaneousRate;
        } else if (mode === 'SIMV/PS') {
          newActualRate = Math.max(settings.respiratoryRate, patient.spontaneousRate);
        } else {
          if (patient.spontaneousRate > settings.respiratoryRate) {
            newActualRate = patient.spontaneousRate;
          } else if (patient.spontaneousRate > 0) {
            newActualRate = settings.respiratoryRate + (patient.spontaneousRate / 2);
          }
        }
        setMetrics(m => ({ ...m, actualRate: newActualRate }));
      }

      // ── Equation of motion (§12.2) ──
      const R_insp = patient.resistance;
      const R_exp = patient.resistance * 1.5;
      const Vt_s = settings.tidalVolume / 1000;
      const tau_insp = R_insp * C;
      const tau_exp = R_exp * C;
      const tCycle = elapsedInSim - lastBreathStartTimeRef.current;
      const triggerDelay = 0.1;

      let inInsp = false;
      if (!isHolding.current && !isExpHolding.current) {
        if (mode === 'PSV' || (mode === 'SIMV/PS' && isPatientTriggeredRef.current)) {
          if (Math.exp(-Math.max(0, tCycle - triggerDelay) / tau_insp) > settings.endInspiratoryPercent / 100 && tCycle < 3.0) inInsp = true;
        } else if (tCycle < iT) inInsp = true;
      }

      if (wasInInspirationRef.current && !inInsp) {
        actualInspDurationRef.current = tCycle;
        vAtEndOfInspRef.current = lastVolumeRef.current;
        if (pendingInspRef.current) {
          isHolding.current = true;
          setActiveHoldType('INSP');
          holdStartTimeRef.current = elapsedTotal;
          pendingInspRef.current = false;
        }
        setMetrics(m => {
          const newVte = Math.round((vAtEndOfInspRef.current - trappedVolumeAtBreathStartRef.current) * 1000);
          const totalMve = (newVte * m.actualRate) / 1000;
          const mveSpontContrib = isPatientTriggeredRef.current ? (newVte * patient.spontaneousRate) / 1000 : m.mveSpont;
          return { ...m, pip: Math.round(currentBreathPeakPressureRef.current), vte: newVte, isLastSpont: isPatientTriggeredRef.current, mve: totalMve, mveSpont: mveSpontContrib };
        });
      }
      wasInInspirationRef.current = inInsp;

      let p = settings.peep, f = 0, v = 0;

      if (isHolding.current) {
        const dur = elapsedTotal - holdStartTimeRef.current;
        if (dur < 0.5) {
          f = 0; v = vAtEndOfInspRef.current; p = (v / C) + settings.peep;
        } else {
          holdOffsetRef.current += dur;
          isHolding.current = false;
          setActiveHoldType(null);
          const platMeasured = (vAtEndOfInspRef.current / C) + settings.peep;
          setMetrics(m => ({ ...m, plat: Math.round(platMeasured), drivingPressure: Math.round(platMeasured - settings.peep) }));
        }
      } else if (isExpHolding.current) {
        const dur = elapsedTotal - holdStartTimeRef.current;
        const measuredTotalPeep = settings.peep + (lastVolumeRef.current / C);
        if (dur < 1.5) {
          f = 0; v = lastVolumeRef.current; p = measuredTotalPeep;
        } else {
          holdOffsetRef.current += dur;
          isExpHolding.current = false;
          setActiveHoldType(null);
          setMetrics(m => ({ ...m, totalPeep: Math.round(measuredTotalPeep) }));
        }
      } else if (inInsp) {
        const effT = isPatientTriggeredRef.current ? tCycle - triggerDelay : tCycle;
        if (isPatientTriggeredRef.current && tCycle < triggerDelay) {
          p = settings.peep - (2.5 * Math.sin((tCycle / triggerDelay) * Math.PI));
          f = -(3 / 60) * Math.sin((tCycle / triggerDelay) * Math.PI);
          v = trappedVolumeAtBreathStartRef.current;
        } else {
          if (mode === 'VCV') {
            const vDot = Vt_s / (isPatientTriggeredRef.current ? iT - triggerDelay : iT);
            const delivered = Math.min(Vt_s, vDot * Math.max(0, effT));
            v = trappedVolumeAtBreathStartRef.current + delivered;
            f = delivered < Vt_s ? vDot : 0;
            p = (v / C) + (f * R_insp) + settings.peep;
          } else {
            const activeTargetPi =
              (mode === 'PRVC' || (mode === 'SIMV/PS' && !isCurrentBreathSpontaneousRef.current)) ? prvcAdaptivePi
              : (mode === 'PSV' || (mode === 'SIMV/PS' && isCurrentBreathSpontaneousRef.current)) ? settings.psLevel
              : settings.pInsp;
            const riseProgress = Math.min(1, effT / 0.15);
            p = (activeTargetPi * riseProgress) + settings.peep;
            f = (activeTargetPi / R_insp) * Math.exp(-Math.max(0, effT) / tau_insp);
            v = trappedVolumeAtBreathStartRef.current + (C * activeTargetPi * (1 - Math.exp(-Math.max(0, effT) / tau_insp)));
          }
        }
        currentBreathPeakPressureRef.current = Math.max(currentBreathPeakPressureRef.current, p);
      } else {
        const tExp = Math.max(0, tCycle - actualInspDurationRef.current);
        v = vAtEndOfInspRef.current * Math.exp(-tExp / tau_exp);
        f = -(vAtEndOfInspRef.current / tau_exp) * Math.exp(-tExp / tau_exp);
        p = settings.peep + (Math.abs(f) * 1.5);
        if (Math.abs(f * 60) > Math.abs(peakExpiratoryFlowRef.current)) peakExpiratoryFlowRef.current = f * 60;
      }

      currentFlowLpmRef.current = f * 60;
      lastVolumeRef.current = v;
      frameCountRef.current++;

      if (frameCountRef.current % 2 === 0) {
        const newDataPoint = { pressure: p, flow: f * 60, volume: v * 1000, isSpontaneous: isCurrentBreathSpontaneousRef.current };
        setDataPoints(prev => {
          const d = [...prev, newDataPoint];
          return d.length > 450 ? d.slice(d.length - 450) : d;
        });
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // Freeze side-effects
  useEffect(() => {
    if (isFrozen) {
      lastFreezeTimeRef.current = Date.now();
      if (dataPoints.length > 0) setCursorIndex(dataPoints.length - 1);
    } else {
      if (lastFreezeTimeRef.current > 0) totalFreezeOffsetRef.current += (Date.now() - lastFreezeTimeRef.current);
      setCursorIndex(null);
      setIsDragging(false);
    }
  }, [isFrozen]);

  // ── Waveform bounds (auto-scale) ──
  const pressureBounds = useMemo(() => {
    if (dataPoints.length === 0) return { min: 0, max: 40 };
    return { min: 0, max: Math.ceil(Math.max(...dataPoints.map(d => d.pressure), 30) + 5) };
  }, [dataPoints]);

  const flowBounds = useMemo(() => {
    if (dataPoints.length === 0) return { min: -60, max: 60 };
    const vals = dataPoints.map(d => d.flow);
    return { min: Math.floor(Math.min(...vals, -40) - 5), max: Math.ceil(Math.max(...vals, 40) + 5) };
  }, [dataPoints]);

  const volumeBounds = useMemo(() => {
    if (dataPoints.length === 0) return { min: 0, max: 600 };
    return { min: 0, max: Math.max(600, Math.max(...dataPoints.map(d => d.volume)) + 50) };
  }, [dataPoints]);

  const pressurePaths = useMemo(() => generateSegmentedPaths(dataPoints, 'pressure', pressureBounds, '#3b82f6'), [dataPoints, pressureBounds]);
  const flowPaths = useMemo(() => generateSegmentedPaths(dataPoints, 'flow', flowBounds, '#3b82f6'), [dataPoints, flowBounds]);
  const volumePaths = useMemo(() => generateSegmentedPaths(dataPoints, 'volume', volumeBounds, '#3b82f6'), [dataPoints, volumeBounds]);

  // ── Render ──
  return (
    <div
      className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans p-4 overflow-hidden select-none"
      onMouseMove={e => {
        if (isDragging && isFrozen && waveformContainerRef.current) {
          const rect = waveformContainerRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left - 48;
          const pct = Math.max(0, Math.min(1, x / (rect.width - 48)));
          const index = Math.round(pct * 179);
          if (!isNaN(index) && dataPoints.length > 0) setCursorIndex(Math.min(index, dataPoints.length - 1));
        }
      }}
      onMouseUp={() => setIsDragging(false)}
    >
      <AlertContainer alerts={alerts} />

      {/* Header (hidden when embedded in shell) */}
      {!hideHeader && (
      <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-t-lg border-b border-zinc-800 shadow-xl">
        <h1 className="text-lg font-bold tracking-tight text-white uppercase ml-1">
          Ventilator Playground
          <span className="text-sky-400 ml-3 border-l border-zinc-700 pl-3 font-mono text-[10px] tracking-widest">FREE PLAY</span>
        </h1>
        <div className="flex items-center gap-3">
          {/* Patient Settings */}
          <div className="relative">
            <button
              onClick={() => setShowPatientSettings(v => !v)}
              className="flex items-center gap-2 px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all"
            >
              <User size={14} /> PATIENT SETTINGS
            </button>
            {showPatientSettings && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><User size={16} className="text-rose-500" /> Patient Settings</h3>
                  <button onClick={() => setShowPatientSettings(false)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
                </div>

                {/* Height + Gender + PBW */}
                <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Height</span>
                    <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded overflow-hidden h-8">
                      <input type="number" value={String(displayHeight)} onChange={e => handleHeightInput(e.target.value)} className="w-full bg-transparent p-1 text-sm font-mono font-bold text-rose-400 focus:outline-none text-right" />
                      <button onClick={() => setHeightUnit(u => u === 'in' ? 'cm' : 'in')} className="bg-zinc-800 px-2 h-full text-[10px] font-black text-zinc-300 uppercase border-l border-zinc-700">{heightUnit}</button>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Gender</span>
                    <div className="flex gap-1 h-8">
                      <button onClick={() => handlePatientChange('gender', 'M')} className={`flex-1 flex items-center justify-center font-black rounded border transition-all text-[10px] ${patient.gender === 'M' ? 'bg-[#4CBB17] border-[#4CBB17] text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700'}`}>M</button>
                      <button onClick={() => handlePatientChange('gender', 'F')} className={`flex-1 flex items-center justify-center font-black rounded border transition-all text-[10px] ${patient.gender === 'F' ? 'bg-pink-600 border-pink-400 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700'}`}>F</button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center pl-4 border-l border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">PBW</span>
                    <div className="text-emerald-400 text-xl font-mono font-black">{demographics.pbw.toFixed(1)}<span className="text-[10px] ml-1 text-zinc-500 uppercase">kg</span></div>
                  </div>
                </div>

                {/* Compliance */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Compliance (mL/cmH₂O)</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ label: 'Normal (80)', val: 80, cls: 'emerald' }, { label: 'Reduced (50)', val: 50, cls: 'yellow' }, { label: 'Severe (10)', val: 10, cls: 'rose' }].map(({ label, val, cls }) => (
                      <button key={val} onClick={() => handlePatientChange('compliance', val)} className={`py-2 px-1 rounded border text-[10px] font-bold transition-all ${patient.compliance === val ? `bg-${cls}-900/50 border-${cls}-500 text-${cls}-400` : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* Resistance */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Resistance (cmH₂O/L/s)</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ label: 'Normal (10)', val: 10, cls: 'emerald' }, { label: 'Elevated (25)', val: 25, cls: 'yellow' }, { label: 'Severe (50)', val: 50, cls: 'rose' }].map(({ label, val, cls }) => (
                      <button key={val} onClick={() => handlePatientChange('resistance', val)} className={`py-2 px-1 rounded border text-[10px] font-bold transition-all ${patient.resistance === val ? `bg-${cls}-900/50 border-${cls}-500 text-${cls}-400` : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* Spontaneous rate */}
                <div className="flex flex-col gap-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Spontaneous Rate</span>
                    <span className="text-yellow-400 font-mono font-bold">{patient.spontaneousRate} bpm</span>
                  </div>
                  <input type="range" min={0} max={30} value={patient.spontaneousRate} onChange={e => handlePatientChange('spontaneousRate', parseInt(e.target.value))} className="w-full accent-yellow-500" />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsFrozen(v => !v)}
            className={`flex items-center gap-2 px-2.5 py-1 border rounded text-[10px] font-bold transition-all ${isFrozen ? 'bg-sky-600 border-sky-400 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700'}`}
          >
            {isFrozen ? <Play size={14} /> : <Pause size={14} />} {isFrozen ? 'RESUME' : 'FREEZE'}
          </button>
        </div>
      </div>
      )}

      {/* Main grid — left 7 cols: waveforms + controls | right 5 cols: data strip + workbook */}
      <div
        ref={waveformContainerRef}
        className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 mt-2 overflow-hidden min-h-0"
        onMouseDown={e => { if (isFrozen) { setIsDragging(true); handleWaveformInteraction(e); } }}
      >
        {/* ── Left column: waveforms + vent controls ── */}
        <div className="lg:col-span-7 flex flex-col gap-2 min-h-0 cursor-crosshair">
          {/* Waveforms — slightly compact gap */}
          <div className="flex-1 flex flex-col gap-2 overflow-hidden relative">
            <WaveformPanel title="Airway Pressure" dataKey="pressure" unit="cmH2O" segmentedPaths={pressurePaths} bounds={pressureBounds} cursorIndex={cursorIndex} dataPoints={dataPoints} isHoldActive={!!activeHoldType} showZeroLine isFrozen={isFrozen} />
            <WaveformPanel title="Flow Rate" dataKey="flow" unit="L/min" segmentedPaths={flowPaths} bounds={flowBounds} cursorIndex={cursorIndex} dataPoints={dataPoints} showZeroLine isFrozen={isFrozen} />
            <WaveformPanel title="Volume" dataKey="volume" unit="mL" segmentedPaths={volumePaths} bounds={volumeBounds} cursorIndex={cursorIndex} dataPoints={dataPoints} showZeroLine isFrozen={isFrozen} />
            {/* Inline recognition prompt overlay */}
            {inlinePromptOverlay && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm p-4">
                {inlinePromptOverlay}
              </div>
            )}
          </div>

          {/* Ventilator controls — tightened padding */}
          <div className="bg-zinc-900 shrink-0 rounded-xl border border-zinc-800 p-2 shadow-2xl">
            {/* Mode + hold buttons */}
            <div className="flex items-center gap-2 mb-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-1">
                {isLocked('mode') && <Lock size={10} className="text-zinc-600 ml-1" />}
                {['VCV', 'PCV', 'PRVC', 'SIMV/PS', 'PSV'].map(m => (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    disabled={isLocked('mode')}
                    title={isLocked('mode') ? 'This control is locked for this module.' : ''}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                      isLocked('mode') ? 'text-zinc-600 cursor-not-allowed' :
                      mode === m ? 'bg-sky-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                    } ${mode === m && isLocked('mode') ? 'bg-zinc-800' : ''}`}
                  >{m}</button>
                ))}
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <button onClick={() => { pendingInspRef.current = true; }} disabled={isLocked('inspiratory_pause')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all border ${isLocked('inspiratory_pause') ? 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed' : activeHoldType === 'INSP' ? 'bg-sky-600 border-sky-500 text-white shadow-md animate-pulse' : 'bg-sky-200 border-sky-300 text-sky-900 hover:bg-sky-300'}`}>INSP HOLD</button>
                <button onClick={() => { pendingExpRef.current = true; }} disabled={isLocked('expiratory_pause')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all border ${isLocked('expiratory_pause') ? 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed' : activeHoldType === 'EXP' ? 'bg-amber-600 border-amber-500 text-white shadow-md animate-pulse' : 'bg-amber-200 border-amber-300 text-amber-900 hover:bg-amber-300'}`}>EXP HOLD</button>
              </div>
            </div>

            {/* Knobs */}
            <div className="flex flex-row flex-wrap justify-center gap-1.5 px-1 items-center">
              {mode !== 'PSV' && <ControlBox className="w-[90px]" label="Rate" value={settings.respiratoryRate} unit="bpm" min={4} max={40} step={1} onChange={(v: number) => handleSettingChange('respiratoryRate', v)} />}
              {mode === 'PCV'
                ? <ControlBox className="w-[90px]" label="Pinsp" value={settings.pInsp} unit="cmH2O" min={1} max={60} step={1} onChange={(v: number) => handleSettingChange('pInsp', v)} />
                : mode === 'PSV'
                  ? <ControlBox className="w-[90px]" label="PS" value={settings.psLevel} unit="cmH2O" min={0} max={60} step={1} onChange={(v: number) => handleSettingChange('psLevel', v)} />
                  : <ControlBox className="w-[90px]" label="Vt" value={settings.tidalVolume} unit="mL" min={200} max={1000} step={10} onChange={(v: number) => handleSettingChange('tidalVolume', v)} />}
              {mode !== 'PSV' && <ControlBox className="w-[90px]" label="I-time" value={settings.iTime} unit="sec" min={0.3} max={3.0} step={0.1} onChange={(v: number) => handleSettingChange('iTime', v)} forceDecimal />}
              <ControlBox className="w-[90px]" label="PEEP" value={settings.peep} unit="cmH2O" min={0} max={24} step={1} onChange={(v: number) => handleSettingChange('peep', v)} />
              <ControlBox className="w-[90px]" label="FiO2" value={settings.fiO2} unit="%" min={21} max={100} step={5} onChange={(v: number) => handleSettingChange('fiO2', v)} />
              {mode === 'SIMV/PS' && <ControlBox className="w-[90px]" label="PS" value={settings.psLevel} unit="cmH2O" min={0} max={60} step={1} onChange={(v: number) => handleSettingChange('psLevel', v)} />}
              {(mode === 'PSV' || mode === 'SIMV/PS') && <ControlBox className="w-[90px]" label="End-Insp %" value={settings.endInspiratoryPercent} unit="%" min={0} max={50} step={1} onChange={(v: number) => handleSettingChange('endInspiratoryPercent', v)} />}
            </div>
          </div>
        </div>

        {/* ── Right column: measured values + hints + workbook ── */}
        <div className="lg:col-span-5 flex flex-col gap-2 min-h-0">

          {/* Measured values strip */}
          <div className="bg-zinc-900 rounded-xl border border-emerald-500/20 p-1.5 shadow-xl shrink-0">
            <div className="flex items-center gap-1 mb-1 text-emerald-400 px-1">
              <Activity size={11} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">Measured Values</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              <NumericCard label="RR" value={metrics.actualRate} unit="bpm" color="text-white" />
              <NumericCard label="I:E" value={currentIERatio} unit="" color="text-amber-200" />
              <NumericCard label="PIP" value={metrics.pip} unit="cmH2O" color="text-emerald-400" />
              <NumericCard label="Pplat" value={metrics.plat || '--'} unit="cmH2O" color={metrics.plat > 30 ? 'text-rose-500 animate-pulse' : 'text-emerald-300'} />
              <NumericCard label="DP" value={metrics.drivingPressure || '--'} unit="cmH2O" color={metrics.drivingPressure > 15 ? 'text-rose-500' : 'text-violet-400'} />
              <NumericCard label="VE" value={metrics.mve.toFixed(1)} unit="L/min" color="text-sky-400" />
              <NumericCard label="Vte" value={metrics.vte} unit="mL" color={metrics.isLastSpont ? 'text-yellow-400' : 'text-sky-400'} />
              <NumericCard label="Vt/PBW" value={(metrics.vte / (demographics.pbw || 1)).toFixed(1)} unit="mL/kg" color="text-emerald-500" />
              <NumericCard label="tPEEP" value={metrics.totalPeep} unit="cmH2O" color="text-amber-400" />
              <NumericCard label="autoPEEP" value={String(autoPeepValue.toFixed(1))} unit="cmH2O" color="text-rose-400" />
              <NumericCard label="RSBI" value={rsbiValue} unit="b/L" color={rsbiValue > 105 ? 'text-rose-500' : rsbiValue > 80 ? 'text-yellow-400' : 'text-emerald-400'} />
            </div>
          </div>

          {/* Hints — compact, only shows when alerts are active */}
          {alerts.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-2 shrink-0 max-h-28 overflow-y-auto">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Hints</span>
              </div>
              <div className="space-y-1">
                {alerts.map(alert => (
                  <div key={alert.id} className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold leading-snug ${alert.type === 'positive' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-amber-900/40 text-amber-200 border border-amber-800'}`}>
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workbook — primary content area, fills remaining space */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 shrink-0">
              <BookOpen size={13} className="text-sky-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Workbook</span>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              {workbookContent ?? (
                <div className="h-full flex items-center justify-center text-zinc-700 text-[11px] font-semibold tracking-wide p-4">
                  MODULE CONTENT GOES HERE
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PlaygroundSim;
