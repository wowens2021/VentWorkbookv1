import type { Track } from './types';

/**
 * Per-track visual identity. Anchored to the book's racing-green palette:
 * three olive/green variants for the foundational physiology arc, then
 * three warm complements (gold, rust, slate) for the strategy / clinical
 * arc. Every option is a Tailwind built-in so chip / hover variants
 * compose naturally, and every hex is paired with the matching solid for
 * inline-style use (track header bar, progress strip pills).
 */
export interface TrackTone {
  /** Solid background for filled chips / primary CTAs. */
  bg: string;
  /** Hover state of the solid background. */
  bgHover: string;
  /** Light wash + border for chip pills. */
  chipBg: string;
  chipBorder: string;
  /** Text color on a light-wash chip. */
  chipText: string;
  /** Foreground text on the solid background (almost always white). */
  fgOnSolid: string;
  /** Generic accent text color for non-chip surfaces (e.g. headings). */
  accentText: string;
  /** Hex value used for inline SVG fills (the progress-strip pills). */
  hex: string;
}

export const TRACK_COLORS: Record<Track, TrackTone> = {
  Foundations: {
    bg: 'bg-brand-olive',
    bgHover: 'hover:bg-brand-olive-hover',
    chipBg: 'bg-stone-50',
    chipBorder: 'border-stone-200',
    chipText: 'text-brand-olive',
    fgOnSolid: 'text-white',
    accentText: 'text-brand-olive',
    hex: '#47713e',
  },
  // Deep emerald — a darker, library-shelf green that reads as "go deeper."
  Physiology: {
    bg: 'bg-emerald-800',
    bgHover: 'hover:bg-emerald-700',
    chipBg: 'bg-emerald-50',
    chipBorder: 'border-emerald-200',
    chipText: 'text-emerald-900',
    fgOnSolid: 'text-white',
    accentText: 'text-emerald-800',
    hex: '#065f46',
  },
  // Teal — the green-to-blue hinge. Still in the cool half but distinct.
  Modes: {
    bg: 'bg-teal-700',
    bgHover: 'hover:bg-teal-600',
    chipBg: 'bg-teal-50',
    chipBorder: 'border-teal-200',
    chipText: 'text-teal-900',
    fgOnSolid: 'text-white',
    accentText: 'text-teal-800',
    hex: '#0f766e',
  },
  // Book gold — the warm accent that pairs with racing green on tradition-rich
  // book covers (Oxford, Penguin Classics). Picks up the cream page background.
  Strategy: {
    bg: 'bg-amber-700',
    bgHover: 'hover:bg-amber-600',
    chipBg: 'bg-amber-50',
    chipBorder: 'border-amber-200',
    chipText: 'text-amber-900',
    fgOnSolid: 'text-white',
    accentText: 'text-amber-800',
    hex: '#b45309',
  },
  // Warm clay/rust — the leather-binding tone. Earthy, distinct from gold.
  Weaning: {
    bg: 'bg-stone-700',
    bgHover: 'hover:bg-stone-600',
    chipBg: 'bg-stone-50',
    chipBorder: 'border-stone-300',
    chipText: 'text-stone-800',
    fgOnSolid: 'text-white',
    accentText: 'text-stone-700',
    hex: '#44403c',
  },
  // Slate — Oxford-library blue-grey for the capstone synthesis track.
  Synthesis: {
    bg: 'bg-slate-700',
    bgHover: 'hover:bg-slate-600',
    chipBg: 'bg-slate-50',
    chipBorder: 'border-slate-200',
    chipText: 'text-slate-800',
    fgOnSolid: 'text-white',
    accentText: 'text-slate-700',
    hex: '#334155',
  },
};

export const trackTone = (track: Track): TrackTone => TRACK_COLORS[track] ?? TRACK_COLORS.Foundations;
