/**
 * Fix 4 — dev-only drop-off panel.
 *
 * Gated behind import.meta.env.DEV so it never ships in production
 * bundles. Toggle with `Shift+?` anywhere on the Modules page.
 *
 * Renders a readable dump of every module's phase_entries +
 * last_abandon point. No styling polish — this is for the team.
 */
import React, { useEffect, useState } from 'react';
import { listAllProgress } from '../persistence/progress';
import { MODULES } from '../modules';

export default function DebugDropOffPanel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Shift+? — the `?` key with shift produces `?` and key === '?'.
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        setOpen(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!import.meta.env.DEV || !open) return null;

  const records = listAllProgress();
  const byId = new Map(records.map(r => [r.module_id, r] as const));

  const rows = MODULES.map(m => {
    const r = byId.get(m.id);
    const entries = r?.phase_entries ?? {};
    return {
      id: m.id,
      title: m.title,
      briefing: entries.briefing ?? 0,
      primer: entries.primer ?? 0,
      read: entries.read ?? 0,
      check_yourself: entries.check_yourself ?? 0,
      explore: entries.explore ?? 0,
      try_it: entries.try_it ?? 0,
      debrief: entries.debrief ?? 0,
      submitted: r?.quiz_submitted_at,
      last_abandon_at: r?.last_abandon_at,
      last_abandon_phase: r?.last_abandon_phase,
    };
  });

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 9999,
        maxHeight: '80vh',
        width: 760,
        overflow: 'auto',
        background: 'rgba(28, 25, 23, 0.96)',
        color: '#fafaf9',
        border: '1px solid #57534e',
        borderRadius: 8,
        padding: 12,
        fontFamily: 'ui-monospace, monospace',
        fontSize: 11,
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <strong style={{ fontSize: 13 }}>Drop-off panel</strong>
        <span style={{ color: '#a8a29e' }}>· Shift+? to close</span>
        <button
          onClick={() => setOpen(false)}
          style={{
            marginLeft: 'auto',
            background: '#44403c',
            color: '#fafaf9',
            border: '1px solid #57534e',
            borderRadius: 4,
            padding: '2px 6px',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>
      <pre style={{ margin: 0, whiteSpace: 'pre' }}>
        {rows
          .map(r => {
            const counts = `B${r.briefing} P${r.primer} R${r.read} CY${r.check_yourself} E${r.explore} T${r.try_it} D${r.debrief}`.padEnd(
              30,
            );
            const status = r.submitted
              ? '✓ done'
              : r.last_abandon_at
                ? `abandoned @ ${r.last_abandon_phase ?? '?'}`
                : '—';
            return `${r.id.padEnd(6)} ${r.title.slice(0, 32).padEnd(34)} ${counts}  ${status}`;
          })
          .join('\n')}
      </pre>
      <div style={{ marginTop: 8, color: '#a8a29e', fontSize: 10 }}>
        Counts: B briefing · P primer · R read · CY check yourself · E explore · T try-it · D debrief.
        Each tick = one entry into that phase (including back-nav).
      </div>
    </div>
  );
}
