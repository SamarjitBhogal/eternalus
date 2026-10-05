import type {
  LaneKnot,
  MapFeatureDefinition,
  MapLayout,
  MapPreset,
} from '../content/maps/maps.types';
import type { LaneShape } from './LaneShape.types';
import type { Rng } from './Rng.types';

/**
 * The map part of `GameConfig` (integration contract §2.2).
 *
 * TODO(sholtzman): replace with `GameConfig['map']` from session B's `config/` once it lands.
 */
export type MapConfig = {
  readonly numLanes: number;
  readonly spawnTowersPerLane: number;
  readonly buffTowersPerLane: number;
  readonly campsPerSide: number;
  readonly cornerCamps: number;
  readonly worldWidth: number;
  readonly worldHeight: number;
  readonly presetId?: string;
};

/** The slice of `GameConfig` the generator reads; a full `GameConfig` satisfies it. */
export type MapGeneratorConfig = { readonly map: MapConfig };

/** Creates the seeded RNG for one generation run. */
export type RngFactory = (seed: number) => Rng;

/** Creates the lane strategy for a lane profile. */
export type LaneShapeFactory = (profile: readonly LaneKnot[]) => LaneShape;

/** Everything the generator can be given instead of the defaults; tests swap these. */
export type MapGeneratorDeps = {
  readonly layout: MapLayout;
  readonly definitions: Readonly<Record<string, MapFeatureDefinition>>;
  readonly presets: Readonly<Record<string, MapPreset>>;
  readonly createRng: RngFactory;
  readonly createLaneShape: LaneShapeFactory;
};
