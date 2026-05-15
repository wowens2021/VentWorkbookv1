/**
 * Single source of truth for short, plain-English descriptions of every
 * sim readout and control. Used by:
 *
 *   · ModuleShell — wrong-click feedback ("Vte shows expired tidal volume
 *     per breath — not pip.")
 *   · PlaygroundSim — hover tooltips on each control box and numeric card
 *     (A5: new learners can mouse over a tile to see what it is without
 *      having to read M2 first).
 *
 * Keep entries to one short clause. The tooltip surface is small and the
 * wrong-click feedback already says "X shows {description}." so the value
 * must read naturally after that lead-in.
 */
export const READOUT_DESC: Record<string, string> = {
  pip: 'peak inspiratory pressure (cmH2O)',
  plat: 'plateau pressure (cmH2O)',
  drivingPressure: 'driving pressure — plateau minus PEEP (cmH2O)',
  mve: 'minute ventilation — exhaled volume per minute (L/min)',
  vte: 'expired tidal volume per breath (mL)',
  totalPeep: 'total PEEP — set PEEP plus any auto-PEEP (cmH2O)',
  autoPeep: 'auto-PEEP — trapped end-expiratory pressure (cmH2O)',
  actualRate: 'measured respiratory rate (breaths/min)',
  ieRatio: 'inspiration : expiration ratio',
  rsbi: 'rapid shallow breathing index — RR ÷ Vt(L)',
  // Gas-exchange readouts (when present)
  ph: 'arterial pH',
  paco2: 'arterial CO2 partial pressure (mmHg)',
  pao2: 'arterial O2 partial pressure (mmHg)',
  spo2: 'pulse oximetry oxygen saturation (%)',
  hco3: 'serum bicarbonate (mEq/L)',
  fio2: 'fraction of inspired oxygen (%)',
  peep: 'positive end-expiratory pressure — the set floor (cmH2O)',
  tidalVolumeSet: 'set tidal volume — the volume you ordered (mL)',
  meanAirwayPressure: 'mean airway pressure across the breath cycle (cmH2O)',
  sbp: 'systolic blood pressure (mmHg) — drops with overshoot PEEP if hemodynamically marginal',
  etco2: 'end-tidal CO2 — the value at the mouth (mmHg); loss-of-signal flags disconnect',
};

export const CONTROL_DESC: Record<string, string> = {
  mode: 'ventilator mode',
  respiratoryRate: 'set respiratory rate — the minimum mandatory rate (breaths/min)',
  tidalVolume: 'set tidal volume — the volume delivered each breath (mL)',
  pInsp: 'set inspiratory pressure — the target pressure each breath (cmH2O)',
  psLevel: 'pressure support — the boost added to spontaneous breaths (cmH2O)',
  iTime: 'inspiratory time — how long each delivered breath lasts (sec)',
  peep: 'PEEP — the end-expiratory pressure floor you set (cmH2O)',
  fiO2: 'FiO2 — fraction of inspired oxygen you order (%)',
  endInspiratoryPercent: 'expiratory-trigger threshold — flow level at which PSV cycles off (%)',
  compliance: 'patient lung compliance (mL/cmH2O) — locked unless the module unlocks it',
  resistance: 'airway resistance (cmH2O/L/s) — locked unless the module unlocks it',
  spontaneousRate: 'patient\'s native respiratory rate when breathing on their own (breaths/min)',
};
