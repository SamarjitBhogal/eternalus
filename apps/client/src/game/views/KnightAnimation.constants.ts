import type { KnightAction } from './KnightAnimation.types';

/** Atlas geometry and presentation scale. */
export const KNIGHT_ATLAS = {
  columns: 8,
  rows: 10,
  size: 8,
  width: 1122,
  height: 1402,
  left: 32,
  stride: 133,
} as const;
/** Measured row crops and foot anchors of the generated sheet, in original image pixels. */
export const KNIGHT_ROWS = [
  { top: 38, bottom: 174, foot: 166 },
  { top: 174, bottom: 312, foot: 302 },
  { top: 312, bottom: 447, foot: 444 },
  { top: 447, bottom: 581, foot: 576 },
  { top: 581, bottom: 713, foot: 704 },
  { top: 713, bottom: 845, foot: 834 },
  { top: 845, bottom: 978, foot: 966 },
  { top: 978, bottom: 1110, foot: 1098 },
  { top: 1110, bottom: 1242, foot: 1228 },
  { top: 1242, bottom: 1380, foot: 1362 },
] as const;
/** Presentation durations in seconds; independent of gameplay cooldowns. */
export const KNIGHT_ACTIONS: Readonly<
  Record<KnightAction, { readonly row: number; readonly seconds: number }>
> = {
  attack: { row: 5, seconds: 0.72 },
  'ability-1': { row: 6, seconds: 1.04 },
  'ability-2': { row: 7, seconds: 1.04 },
  'ability-3': { row: 8, seconds: 1.44 },
  'ability-4': { row: 9, seconds: 2.08 },
};
