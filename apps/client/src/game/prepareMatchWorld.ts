import {
  MapGenerator,
  type MapGeneratorConfig,
  MapObjectBuilder,
  MapPresentationBuilder,
} from '@eternalus/core';

import type { PreparedWorld } from './Match.types';

/**
 * Builds a match's world from the config's map part and the seed (architecture 06 §1: the
 * generator runs in the client before `Simulation` starts): the generated map, its presentation
 * (scenery and building footprints) and its map objects. Pure: the same config and seed give the
 * same world.
 */
export function prepareMatchWorld(config: MapGeneratorConfig, seed: number): PreparedWorld {
  const map = new MapGenerator().generate(config, seed);
  const presentation = new MapPresentationBuilder().build(map);
  return { map, presentation, mapObjects: new MapObjectBuilder().build(map, presentation) };
}
