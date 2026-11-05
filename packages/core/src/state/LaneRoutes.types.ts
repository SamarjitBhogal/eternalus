import type { Vec2 } from '../utils/geometry.types';

/** One team's walk of one lane: its waypoints and the distance from the gate to each. */
export type Route = {
  readonly points: readonly Vec2[];
  /** `along[i]` is the path length from `points[0]` to `points[i]`. */
  readonly along: readonly number[];
};
