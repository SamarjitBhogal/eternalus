import type { MapFeatureDefinition } from '../content/maps/maps.types';
import type { Polygon } from '../utils/geometry.types';

/** How a map feature's footprint is stamped in the grid, so `MatchWorld.reopen` can clear it. */
export type FeatureBacking = {
  readonly footprint: Polygon;
  /** Whether it was stamped as a fort's court (`WorldMap.stampCourt`) rather than as a footprint. */
  readonly isCourt: boolean;
};

/** What `MatchWorld.build` reads beside the map and its objects. */
export type MatchWorldBuildOptions = {
  /** The navigation cell size of the grid, in world units. */
  readonly cellSize: number;
  /** Every map feature definition by id: which features block, which are courts. */
  readonly features: Readonly<Record<string, MapFeatureDefinition>>;
};
