/**
 * PBWWidget — interactive predicted-body-weight calculator.
 *
 * Per per-module novice fixes §7.1 and §15.1: PBW is referenced repeatedly
 * across the curriculum without ever showing the math. This widget lets
 * a novice plug in height + sex, see the computation step-by-step, and
 * see the 4/6/8 mL/kg PBW target table that follows.
 *
 * Drop into any content block as a regular React component (modules with
 * `kind: 'figure'` accept ascii — use the alt path: render in ReadPane
 * via the figure caption, or embed in a callout. For now consumed
 * directly by the explore card / read view via a dedicated content
 * block kind 'pbw_widget'.)
 */
import React, { useState } from 'react';

interface PBWWidgetProps {
  /** Optional default height (in inches) — typically the module's scenario patient. */
  defaultHeightInches?: number;
  /** Optional default sex. */
  defaultSex?: 'M' | 'F';
  /** Optional one-line label above the widget. */
  label?: string;
}

function pbwKg(sex: 'M' | 'F', heightInches: number): number {
  // Devine formula, the standard used in ARDSnet protocols.
  // Men:   50   + 2.3 × (height_in − 60)
  // Women: 45.5 + 2.3 × (height_in − 60)
  const base = sex === 'M' ? 50 : 45.5;
  return base + 2.3 * (heightInches - 60);
}

export default function PBWWidget({
  defaultHeightInches = 70,
  defaultSex = 'M',
  label,
}: PBWWidgetProps) {
  const [sex, setSex] = useState<'M' | 'F'>(defaultSex);
  const [height, setHeight] = useState(defaultHeightInches);

  const pbw = pbwKg(sex, height);
  const pbwRounded = Math.round(pbw);
  const base = sex === 'M' ? 50 : 45.5;

  return (
    <div className="my-4 rounded-xl border border-brand-olive/40 bg-stone-50 p-4">
      {label && (
        <div className="text-[10px] font-black uppercase tracking-widest text-brand-olive mb-2">
          {label}
        </div>
      )}
      <div className="text-sm font-bold text-zinc-800 mb-3">
        Predicted body weight (PBW) — try the math
      </div>

      <div className="flex flex-wrap gap-3 items-end mb-3">
        <label className="flex flex-col text-[11px] font-semibold text-zinc-600">
          Sex
          <div className="flex gap-1 mt-1">
            {(['M', 'F'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSex(s)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-colors ${
                  sex === s
                    ? 'bg-brand-olive text-white border-brand-olive'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                }`}
              >
                {s === 'M' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>
        </label>
        <label className="flex flex-col text-[11px] font-semibold text-zinc-600">
          Height (inches)
          <input
            type="number"
            value={height}
            min={48}
            max={84}
            onChange={e => setHeight(Math.max(48, Math.min(84, parseInt(e.target.value) || 60)))}
            className="mt-1 w-24 px-2 py-1.5 text-sm font-mono border border-zinc-300 rounded-md focus:border-brand-olive focus:outline-none"
          />
        </label>
        <div className="text-[11px] text-zinc-500 self-end pb-1.5">
          ({(height * 2.54).toFixed(0)} cm)
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-3 mb-3 font-mono text-[12px] text-zinc-700 leading-relaxed">
        <div>
          PBW = {base} + 2.3 × ({height} − 60)
        </div>
        <div>
          &nbsp;&nbsp;&nbsp; = {base} + 2.3 × {height - 60}
        </div>
        <div>
          &nbsp;&nbsp;&nbsp; = {base} + {(2.3 * (height - 60)).toFixed(1)}
        </div>
        <div className="font-bold text-brand-olive">
          &nbsp;&nbsp;&nbsp; = <span className="text-base">{pbw.toFixed(1)} kg</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[4, 6, 8].map(mlPerKg => (
          <div
            key={mlPerKg}
            className={`rounded-md border p-2 ${
              mlPerKg === 6
                ? 'border-brand-olive bg-brand-olive/10'
                : 'border-zinc-200 bg-white'
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {mlPerKg} mL/kg PBW
            </div>
            <div className="text-lg font-mono font-bold text-zinc-900">
              {Math.round(pbwRounded * mlPerKg)} mL
            </div>
            {mlPerKg === 6 && (
              <div className="text-[10px] text-brand-olive font-semibold">
                lung-protective target
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 text-[11px] text-zinc-500 italic">
        Note: PBW uses height, not actual weight. A 200-lb 5'10" man and a 130-lb
        5'10" man both have the same lung volumes, so they get the same target Vt.
      </div>
    </div>
  );
}
