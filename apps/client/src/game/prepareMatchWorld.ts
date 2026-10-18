import {
  CathedralInteriorBuilder,
  MapGenerator,
  type MapGeneratorConfig,
  MapSceneryBuilder,
} from '@eternalus/core';

import type { PreparedWorld } from './Match.types';

/**
 * Builds a match's world from the config's map part and the seed (architecture 06 §1: the
 * generator runs in the client before `Simulation` starts): the generated map, its scenery and
 * its cathedral interior. Pure: the same config and seed give the same world.
 */
export function prepareMatchWorld(config: MapGeneratorConfig, seed: number): PreparedWorld {
  const map = new MapGenerator().generate(config, seed);
  return {
    map,
    scenery: new MapSceneryBuilder(map).build(),
    interior: new CathedralInteriorBuilder().build(map),
  };
}
