import type { Polygon, Rect } from '../../utils/geometry.types';
import type { WorldMap } from '../WorldMap';

/** The square with corners `(x0, y0)` and `(x1, y1)`. */
const box = (x0: number, y0: number, x1: number, y1: number): Polygon => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];

/**
 * A fort stand-in for 2 m cells: walls 2 m thick round x 20..40, y 10..30, with one doorway in the
 * east wall (y 18..22), and its court (x 22..38, y 12..28) stamped as a court (DEC-217 (15)).
 */
export const WALLED_COURT = {
  box: { x: 20, y: 10, width: 20, height: 20 } satisfies Rect,
  walls: [
    box(20, 10, 40, 12),
    box(20, 28, 40, 30),
    box(20, 10, 22, 30),
    box(38, 10, 40, 18),
    box(38, 22, 40, 30),
  ],
  court: box(22, 12, 38, 28),
  /** A point in the court, near its west wall: the doorway is east, the wall's outside west. */
  inside: { x: 25, y: 20 },
} as const;

/** Stamps `WALLED_COURT`'s walls and court on `grid`. */
export const stampWalledCourt = (grid: WorldMap): void => {
  for (const wall of WALLED_COURT.walls) grid.stampFootprint(wall);
  grid.stampCourt(WALLED_COURT.court);
};
