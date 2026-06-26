import React, { useEffect, useState } from 'react';
import { AlertTriangle, Lightbulb, Bell, Eye } from 'lucide-react';
import type { ScenarioHarness, ShellNotification } from '../harness/ScenarioHarness';

interface Props {
  harness?: ScenarioHarness;
}

const kindStyle: Record<ShellNotification['kind'], { bg: string; border: string; chipText: string; chipBg: string; iconColor: string; Icon: React.FC<{ size?: number; className?: string }>; label: string }> = {
  alert: {
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    chipText: 'text-rose-800',
    chipBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    Icon: AlertTriangle,
    label: 'Alert',
  },
  hint: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    chipText: 'text-amber-800',
    chipBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    Icon: Lightbulb,
    label: 'Hint',
  },
  prompt: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    chipText: 'text-emerald-800',
    chipBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    Icon: Eye,
    label: 'Prompt',
  },
  reminder: {
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    chipText: 'text-sky-800',
    chipBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    Icon: Bell,
    label: 'Reminder',
  },
};

/**
 * Single consolidated notification stack at the top-right of the
 * viewport. Replaces the four older surfaces that used to compete for
 * the same screen real-estate (AlertContainer toast, workbook Hints
 * panel, ModuleShell soft-prompt chip, fixed idle-reminder toast).
 *
 * Subscribes to the harness; every source (PlaygroundSim physiology
 * alerts, ModuleShell step-level soft prompts and idle reminders)
 * pushes via `harness.notify` and the list rolls up here.
 */
// Per user request, the consolidated "Hints & Alerts" surface is hidden
// from the workbook UI. The harness still runs its notify/dismiss logic
// (so nothing else breaks), but this panel renders nothing. Flip back to
// `true` to restore the top-right toast stack.
const SHOW_NOTIFICATIONS = false;

const Notifications: React.FC<Props> = ({ harness }) => {
  const [items, setItems] = useState<ShellNotification[]>(() => harness?.getNotifications() ?? []);
  useEffect(() => {
    if (!harness) return;
    setItems(harness.getNotifications());
    return harness.onNotifications(setItems);
  }, [harness]);

  if (!SHOW_NOTIFICATIONS || items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[300] flex flex-col gap-2 w-[22rem] max-w-[calc(100vw-2rem)] pointer-events-none">
      <div className="flex items-center gap-1.5 px-1 pointer-events-none">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/90 bg-zinc-900/80 px-2 py-0.5 rounded shadow">
          Hints &amp; Alerts · {items.length}
        </span>
      </div>
      {items.map(n => {
        const s = kindStyle[n.kind];
        return (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-start gap-2.5 px-3 py-2.5 rounded-lg shadow-lg border ${s.bg} ${s.border} animate-in fade-in slide-in-from-right-4 duration-300`}
          >
            <s.Icon size={16} className={`${s.iconColor} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className={`text-[9px] font-black uppercase tracking-widest ${s.chipText} mb-0.5`}>{s.label}</div>
              <div className="text-[12.5px] text-zinc-800 leading-snug">{n.message}</div>
            </div>
            {n.dismissable && (
              <button
                onClick={() => harness?.dismiss(n.id)}
                className="text-zinc-500 hover:text-zinc-800 text-[16px] leading-none shrink-0"
                aria-label="Dismiss"
              >×</button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Notifications;
