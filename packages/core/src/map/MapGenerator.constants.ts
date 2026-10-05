import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { MAP_PRESETS } from '../content/maps/presets/mapPresets';
import { MapRandom } from './MapRandom';
import type { MapGeneratorDeps } from './MapGenerator.types';
import { ProfileLaneShape } from './ProfileLaneShape';

/** The content, RNG and lane shape a `MapGenerator` uses unless a test passes its own. */
export const MAP_GENERATOR_DEFAULTS: MapGeneratorDeps = {
  layout: DEFAULT_MAP_LAYOUT,
  definitions: MAP_FEATURE_DEFINITIONS,
  presets: MAP_PRESETS,
  createRng: (seed) => new MapRandom(seed),
  createLaneShape: (profile) => new ProfileLaneShape(profile),
};

/** Largest seed: seeds are unsigned 32-bit, so larger values would alias smaller ones. */
export const MAX_SEED = 0xffff_ffff;
