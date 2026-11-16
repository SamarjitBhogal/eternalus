import type { Polygon, Vec2 } from '../utils/geometry.types';

/** The ground one friendly structure's healing bonus covers (DEC-188, DEC-215). */
export type HealingZone = {
  /**
   * The zone's outer edge: no point outside it is in the zone. Two zones' outlines never overlap
   * (DEC-215 (1)).
   */
  readonly outline: Polygon;
  /** Whether a unit whose centre point is at `point` is in the zone (DEC-215 (3)). */
  readonly contains: (point: Vec2) => boolean;
};
