import type { EntityId } from './EntityStore.types';

/**
 * The read-only neighbour index on the state (architecture 11 §3, 10 §5): every unit's position
 * at the last rebuild, by index in store order, and a circle query. `physics/SpaceIndex`
 * satisfies it; `SpaceSystem` rebuilds it once a tick after movement, so between rebuilds it may
 * still list a unit removed or miss one spawned since.
 */
export interface SpaceQuery {
  /** How many units the index holds. */
  readonly count: number;
  /** Unit `i` is at `(positions[2i], positions[2i + 1])`. */
  readonly positions: Float64Array;
  /** The id of the unit at `index`. */
  idAt(index: number): EntityId;
  /** The index of `id`, or `undefined` when the index does not hold it. */
  indexOf(id: EntityId): number | undefined;
  /** Writes the indexes within `radius` of `(x, y)` into `out`, ascending; returns the count. */
  queryCircle(x: number, y: number, radius: number, out: Int32Array): number;
}
