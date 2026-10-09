import type { MapPreset } from '../maps.types';
import { MAP_1_PRESET } from './map1Preset';

/** Every authored map preset, keyed by content id. `MapConfig.presetId` selects one. */
export const MAP_PRESETS: Readonly<Record<string, MapPreset>> = {
  [MAP_1_PRESET.id]: MAP_1_PRESET,
};
