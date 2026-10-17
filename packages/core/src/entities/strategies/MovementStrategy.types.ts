import type { Vec2 } from '../../utils/geometry.types';
import type { MutableVec2 } from '../../utils/vec2.types';

/**
 * Finds the items near a point. `physics/SpatialHash` satisfies it; the port exists because
 * `entities/` may import only shapes from `physics/` (architecture 02 §2).
 */
type NeighbourQuery = {
  /** Writes the indexes of the items near `(x, y)` into `out` and returns how many it wrote. */
  collectNear(x: number, y: number, radius: number, out: Int32Array): number;
};

/**
 * What a movement strategy may read this tick (architecture 10 §9, 18 §5.2). `PathingSystem` owns
 * every buffer and refills them each tick; a strategy reads them and keeps nothing.
 */
export type MovementContext = {
  /** Every unit's position this tick, by index. */
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly neighbours: NeighbourQuery;
  /** Scratch for neighbour indexes, at least as long as the crowd. */
  readonly found: Int32Array;
  /** Where the unit wants to be: a horde mob's formation slot. */
  readonly target: Vec2;
  /** Scratch the strategy writes its answer into and returns, so nothing allocates. */
  readonly out: MutableVec2;
};

/**
 * How one kind of unit steers (architecture 04 §4): next tick's desired direction. Stateless and
 * shared, selected by the definition's `movementStrategy`. A new kind is one class, one
 * `MovementStrategyId` member and one line in `defaultStrategyRegistry.ts`.
 */
export interface MovementStrategy {
  /**
   * The direction the unit at index `self` of the context wants to move in, or zero to stop.
   * Returns `context.out`.
   */
  desiredVelocity(self: number, context: MovementContext): Vec2;
}
