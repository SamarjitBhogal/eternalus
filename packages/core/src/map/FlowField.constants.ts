/** Integration value of a cell the flood fill never reached (`Uint16Array` maximum). */
export const UNREACHED = 0xffff;

/** Direction value of a cell with no way on: the goal, a blocked or an unreached cell. */
export const NO_DIRECTION = -1;

/** Octile step costs scaled to whole numbers (1 and about √2), so integration stays integral. */
export const STRAIGHT_COST = 10;
export const DIAGONAL_COST = 14;

/** Column step of each direction index: E, W, N, S, NE, NW, SE, SW (rows grow southward). */
export const DIRECTION_COLS: readonly number[] = [1, -1, 0, 0, 1, -1, 1, -1];
/** Row step of each direction index, in the same order as `DIRECTION_COLS`. */
export const DIRECTION_ROWS: readonly number[] = [0, 0, -1, 1, -1, -1, 1, 1];

/** The opposite of each direction index (E and W, N and S, NE and SW, NW and SE swapped). */
export const REVERSE_DIRECTION: readonly number[] = [1, 0, 3, 2, 7, 6, 5, 4];

/** Unit vector of each direction index, in the same order as `DIRECTION_COLS`. */
export const DIRECTION_XS: readonly number[] = [
  1,
  -1,
  0,
  0,
  Math.SQRT1_2,
  -Math.SQRT1_2,
  Math.SQRT1_2,
  -Math.SQRT1_2,
];
export const DIRECTION_YS: readonly number[] = [
  0,
  0,
  -1,
  1,
  -Math.SQRT1_2,
  -Math.SQRT1_2,
  Math.SQRT1_2,
  Math.SQRT1_2,
];

/**
 * The order in which each team prefers a direction when two neighbours are equally downhill.
 * Dark's order is Light's mirrored across the vertical centre line (E and W swapped), so the two
 * teams' fields of one lane are exact mirror images (architecture 06 §2).
 */
export const DIRECTION_PREFERENCE = {
  light: [0, 1, 2, 3, 4, 5, 6, 7],
  dark: [1, 0, 2, 3, 5, 4, 7, 6],
} as const;
