import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';

/**
 * Pathfinding for Legends on the state (architecture 10 §9, 11 §3): `map/AStarPathfinder`
 * satisfies it; a port because `ai/` may not import `map/`.
 */
export interface PathQuery {
  /**
   * Writes into `out` where a walker at `start` should head next to reach `goal`; `false` when
   * there is no way (or none found within the search budget). When the straight line to `goal` is
   * clear, `out` is an exact copy of `goal` (no search ran): `BotMovement` relies on this to tell a
   * searched waypoint, which it caches, from the goal itself.
   */
  waypoint(start: Vec2, goal: Vec2, out: MutableVec2): boolean;
  /**
   * Writes into `out` where a walker standing on blocked ground in a lane tower's court should
   * head next to leave it by a doorway (DEC-217 (15)); `false` on open ground or with no way out.
   */
  exitWaypoint(start: Vec2, out: MutableVec2): boolean;

  /** Whether a walker can go straight from `start` to `end` without crossing blocked ground. */
  isLineClear(start: Vec2, end: Vec2): boolean;
}
