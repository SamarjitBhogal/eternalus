import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';

/**
 * Pathfinding for Legends on the state (architecture 10 §9, 11 §3): `map/AStarPathfinder`
 * satisfies it; a port because `ai/` may not import `map/`.
 */
export interface PathQuery {
  /**
   * Writes into `out` where a walker at `start` should head next to reach `goal`; `false` when
   * there is no way (or none found within the search budget).
   */
  waypoint(start: Vec2, goal: Vec2, out: MutableVec2): boolean;
}
