/**
 * Rotating microcopy for CTAs, success/failure banners, and other surfaces
 * that would otherwise repeat the same phrase. Variety keeps the workbook
 * surface from feeling robotic.
 *
 * Selection is deterministic per (`seed`, options.length) so the same render
 * cycle returns the same phrase — call sites pass a stable seed (e.g. the
 * active prompt_id, the question id, or `Date.now()` rounded to the nearest
 * second) to keep things from flickering on re-render.
 */

const SUCCESS_PHRASES = [
  'Correct.',
  'Nailed it.',
  'You got it.',
  'Right on.',
  'Yes — that one.',
  'Spot on.',
  'Exactly.',
];

const WRONG_PHRASES = [
  'Not that one.',
  'Not quite.',
  'Close, but no.',
  'Try another.',
  'Not the right one.',
];

const CONTINUE_CTAS = [
  'Continue →',
  'Onwards →',
  'Got it →',
  'Keep going →',
  'Next →',
];

/** Hash any string-or-number seed into a non-negative integer for indexing. */
function hashSeed(seed: string | number): number {
  if (typeof seed === 'number') return Math.abs(Math.floor(seed));
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickFrom<T>(arr: T[], seed: string | number | undefined): T {
  if (!seed) return arr[Math.floor(Math.random() * arr.length)];
  return arr[hashSeed(seed) % arr.length];
}

export const successPhrase = (seed?: string | number) => pickFrom(SUCCESS_PHRASES, seed);
export const wrongPhrase = (seed?: string | number) => pickFrom(WRONG_PHRASES, seed);
export const continueCTA = (seed?: string | number) => pickFrom(CONTINUE_CTAS, seed);
