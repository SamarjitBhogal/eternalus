import type { SpatialHash } from '../../physics/SpatialHash';

/**
 * Every unit's position this tick, by index, with the grid that finds neighbours
 * (architecture 18 §5.2). Filled once per tick by `PathingSystem`; read, never kept.
 */
export type Crowd = {
  readonly hash: SpatialHash;
  readonly xs: Float64Array;
  readonly ys: Float64Array;
};
