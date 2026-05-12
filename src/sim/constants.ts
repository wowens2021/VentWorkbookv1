// §9.4 Henderson-Hasselbalch CO2 solubility coefficient (mmol/L per mmHg at 37°C)
export const CO2_SOLUBILITY = 0.03;

// §9.10 Hüfner number: mL O2 per gram of fully saturated Hb
export const HUFNER_NUMBER = 1.34;

// §9.10 O2 solubility in plasma (mL O2/dL/mmHg)
export const O2_PLASMA_SOLUBILITY = 0.003;

// §9.6 Sea-level constants for alveolar gas equation
export const P_ATM = 760;   // mmHg
export const P_H2O = 47;    // mmHg at 37°C
export const R_QUOTIENT = 0.8;

// §12.9 Specific elastance of healthy alveoli (cmH2O/L)
export const SPECIFIC_ELASTANCE = 13.5;

// Default patient physiology for the playground
export const DEFAULT_PATIENT = {
  compliance: 73,       // mL/cmH2O — healthy intubated ~70-85
  resistance: 10,       // cmH2O/(L/s) — intubated, no bronchospasm
  gender: 'M' as 'M' | 'F',
  heightInches: 70,
  spontaneousRate: 4,   // bpm
  deadSpaceFraction: 0.30,
  bpSys: 120,
  bpDia: 80,
  hr: 80,
};

// Default ventilator settings for the playground
export const DEFAULT_SETTINGS = {
  tidalVolume: 440,         // mL
  pInsp: 15,                // cmH2O (PCV driving pressure)
  psLevel: 10,              // cmH2O (PSV support level)
  endInspiratoryPercent: 30,// % of peak flow for PSV cycle-off
  respiratoryRate: 16,      // bpm
  peep: 5,                  // cmH2O
  iTime: 1.0,               // seconds
  fiO2: 40,                 // %
};
