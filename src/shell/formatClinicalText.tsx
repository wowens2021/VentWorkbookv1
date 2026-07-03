import React from 'react';

/**
 * Presentational clinical-text formatter.
 *
 * Reformats HOW units, chemical/gas symbols, and comparison operators are
 * DISPLAYED — it never changes a value, unit, threshold, range, or the
 * meaning of any statement. Content strings stay authored in plain ASCII
 * (`cmH2O`, `FiO2`, `>=`) and render as proper typography (cmH₂O, FiO₂, ≥).
 *
 * Applied only at the render layer (ContentBlocks) so the transformation is
 * consistent and maintainable rather than hand-edited into every string.
 *
 * Deliberately NOT applied inside `code` spans — those hold literal formulas
 * and are meant to render monospaced and verbatim.
 */

// Chemical / gas-tension tokens whose trailing digits are subscripts. Listed
// longest-first so a specific symbol (e.g. "PaCO2") is matched before its
// substring ("CO2", "O2"); the whole token is kept on one line so a unit
// never wraps mid-symbol. Prefixes not listed here (rare variants) still
// render correctly — only the O2/CO2/H2O/HCO3 tail is subscripted and the
// prefix rides along as adjacent text.
const UNIT_TOKENS = [
  'cmH2O', 'H2CO3',
  'ScvO2', 'PaCO2', 'PACO2', 'ETCO2', 'FeCO2', 'VCO2',
  'FiO2', 'FeO2', 'PaO2', 'PAO2', 'SaO2', 'SpO2', 'SvO2',
  'CaO2', 'CvO2', 'VO2', 'DO2',
  'HCO3', 'H2O', 'N2O', 'CO2', 'O2',
].sort((a, b) => b.length - a.length);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const UNIT_RE = new RegExp('(' + UNIT_TOKENS.map(escapeRe).join('|') + ')', 'g');

/** Render one unit token with its digit runs wrapped in <sub>, kept on one line. */
const renderUnit = (tok: string, key: string): React.ReactNode => {
  const segs = tok.split(/(\d+)/).filter(s => s !== '');
  return (
    <span key={key} className="whitespace-nowrap">
      {segs.map((s, i) =>
        /^\d+$/.test(s)
          ? <sub key={i}>{s}</sub>
          : <React.Fragment key={i}>{s}</React.Fragment>,
      )}
    </span>
  );
};

/**
 * Format a plain-text run into React nodes with typographic units/operators.
 * Returns an array of strings and inline elements suitable for embedding in
 * a <p>, <strong>, <li>, etc.
 */
export function formatClinicalText(text: string, keyBase = 'u'): React.ReactNode[] {
  // Comparison operators → typographic glyphs (presentational only). The
  // content already uses ≤ ≥ → × in most places; this catches the residual
  // ASCII forms so they render consistently.
  const norm = text.replace(/<=/g, '≤').replace(/>=/g, '≥');

  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  UNIT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = UNIT_RE.exec(norm)) !== null) {
    if (m.index > last) out.push(norm.slice(last, m.index));
    out.push(renderUnit(m[0], `${keyBase}-${key++}`));
    last = m.index + m[0].length;
  }
  if (last < norm.length) out.push(norm.slice(last));
  return out;
}
