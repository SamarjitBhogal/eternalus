import type { Vec2 } from '../../utils/geometry.types';
import type { MutableVec2 } from '../../utils/vec2.types';

/**
 * Finds the units near a point. `state.space` satisfies it; the port keeps `entities/` free of
 * `physics/` (architecture 02 §2).
 */
type NeighbourQuery = {
  /** Writes the indexes within `radius` of `(x, y)` into `out`, ascending; returns the count. */
  queryCircle(x: number, y: number, radius: number, out: Int32Array): number;
};

/**
 * What a movement strategy may read this tick (architecture 10 §9, 18 §5.2): the neighbour index
 * and `PathingSystem`'s scratch. A strategy reads them and keeps nothing.
 */
export type MovementContext = {
  /** Unit `i` is at `(positions[2i], positions[2i + 1])`. */
  readonly positions: Float64Array;
  readonly neighbours: NeighbourQuery;
  /** Scratch for neighbour indexes, at least as long as the crowd. */
  readonly found: Int32Array;
  /** Where the unit wants to be: a horde mob's formation slot, or the unit it chases. */
  readonly target: Vec2;
  /** Within this distance of `target` the unit is there and stops steering toward it. */
  arrivalRadius: number;
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
