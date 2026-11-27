/** Provisional display tuning approved by DEC-238 (owner decisions log). */
import type { MinionPalette, MinionWeight } from './MinionView.types';

/** Presentation scale only; physical size continues to come from the snapshot. */
export const MINION_ART_SCALE = 2;
export const MINION_INK = '#171e24';

/** Silver Dawn knights, violet-armored goblins and neutral woodland fighters. */
export const MINION_PALETTES: Readonly<Record<string, MinionPalette>> = {
  light: {
    armor: '#8ea5b1',
    highlight: '#d8e4df',
    trim: '#62d9ec',
    cloth: '#e1d8ba',
    skin: '#ccb98f',
    eyes: '#b9f7ff',
    hasHorns: false,
  },
  dark: {
    armor: '#3e354f',
    highlight: '#83728e',
    trim: '#ce72ec',
    cloth: '#2a2638',
    skin: '#809663',
    eyes: '#f1baff',
    hasHorns: true,
  },
  neutral: {
    armor: '#6f7564',
    highlight: '#b9bba1',
    trim: '#c8b77e',
    cloth: '#4b5642',
    skin: '#a2a275',
    eyes: '#e6dcad',
    hasHorns: false,
  },
};

/** Proportions create scout, foot soldier and massive guardian silhouettes. */
export const MINION_PROPORTIONS: Readonly<
  Record<MinionWeight, { readonly width: number; readonly shoulder: number }>
> = {
  light: { width: 0.43, shoulder: 0.6 },
  medium: { width: 0.58, shoulder: 0.85 },
  heavy: { width: 0.85, shoulder: 1.2 },
};
