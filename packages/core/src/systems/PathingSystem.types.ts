import type { SpatialHash } from '../physics/SpatialHash';

/** `PathingSystem`'s per-tick buffers, refilled every tick and grown with the crowd. */
export type PathingBuffers = {
  readonly neighbours: SpatialHash;
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly found: Int32Array;
};
