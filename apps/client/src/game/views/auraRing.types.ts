import type { WorldPoint } from '../engine/render/Renderer.types';

/** A closed outline in world units, with the distance along it to each point, to walk it. */
export type AuraRing = {
  /** The outline's points in order, the first repeated at the end, so a path through them closes. */
  readonly points: readonly WorldPoint[];
  /** `lengths[i]` is the distance along the ring from `points[0]` to `points[i]`. */
  readonly lengths: readonly number[];
  /** The ring's length: the last of `lengths`. */
  readonly perimeter: number;
};
