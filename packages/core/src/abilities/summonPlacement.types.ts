import type { Polygon } from '../utils/geometry.types';

/**
 * A body placed for a cast: the outline where it stands (metres, turned to face the aim) and
 * whether it cannot stand there (`summonPreview`).
 */
export type PlacedSummon = {
  /** The corners of the placed outline. */
  readonly outline: Polygon;
  /** Whether the outline overlaps a wall or reaches past the map's edge. */
  readonly isBlocked: boolean;
};
