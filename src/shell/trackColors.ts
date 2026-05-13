import type { Track } from './types';

/**
 * G2: a small visual identity per track so the learner can see at a glance
 * which curriculum branch they're in. Tailwind utility strings, ready to drop
 * into className expressions. Foundations keeps the brand olive; the other
 * five tracks pick from a complementary spectrum.
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
    hex: '#3d4e2a',
  },
  Physiology: {
    bg: 'bg-indigo-600',
    bgHover: 'hover:bg-indigo-500',
    chipBg: 'bg-indigo-50',
    chipBorder: 'border-indigo-200',
    chipText: 'text-indigo-700',
    fgOnSolid: 'text-white',
    accentText: 'text-indigo-700',
    hex: '#4f46e5',
  },
  Modes: {
    bg: 'bg-sky-600',
    bgHover: 'hover:bg-sky-500',
    chipBg: 'bg-sky-50',
    chipBorder: 'border-sky-200',
    chipText: 'text-sky-700',
    fgOnSolid: 'text-white',
    accentText: 'text-sky-700',
    hex: '#0284c7',
  },
  Strategy: {
    bg: 'bg-amber-600',
    bgHover: 'hover:bg-amber-500',
    chipBg: 'bg-amber-50',
    chipBorder: 'border-amber-200',
    chipText: 'text-amber-800',
    fgOnSolid: 'text-white',
    accentText: 'text-amber-700',
    hex: '#d97706',
  },
  Weaning: {
    bg: 'bg-rose-600',
    bgHover: 'hover:bg-rose-500',
    chipBg: 'bg-rose-50',
    chipBorder: 'border-rose-200',
    chipText: 'text-rose-700',
    fgOnSolid: 'text-white',
    accentText: 'text-rose-700',
    hex: '#e11d48',
  },
  Synthesis: {
    bg: 'bg-violet-600',
    bgHover: 'hover:bg-violet-500',
    chipBg: 'bg-violet-50',
    chipBorder: 'border-violet-200',
    chipText: 'text-violet-700',
    fgOnSolid: 'text-white',
    accentText: 'text-violet-700',
    hex: '#7c3aed',
  },
};

export const trackTone = (track: Track): TrackTone => TRACK_COLORS[track] ?? TRACK_COLORS.Foundations;
