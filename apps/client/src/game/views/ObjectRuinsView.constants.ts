import type { MapObjectKind } from '@eternalus/core';
import type { RuinArtwork } from './ObjectRuinsView.types';
import { TREE_RUIN } from './treeRuin';
import { HOUSE_RUIN } from './houseRuin';
import { ROCK_RUIN, WALL_RUIN, TOWER_RUIN } from './stoneRuins';
import { TIMBER_RUIN, TENT_RUIN, GATE_RUIN } from './timberRuins';
import { PALACE_RUIN } from './palaceRuin';
/** One entry per physical kind; stone and timber families reuse their authored materials. */
export const OBJECT_RUINS: Readonly<Record<MapObjectKind, RuinArtwork>> = {
  tree: TREE_RUIN,
  house: HOUSE_RUIN,
  rock: ROCK_RUIN,
  wall: WALL_RUIN,
  furniture: TIMBER_RUIN,
  camp: TENT_RUIN,
  fort: TOWER_RUIN,
  terrain: ROCK_RUIN,
  stronghold: PALACE_RUIN,
  cathedral: TOWER_RUIN,
  'spawner-tower': TOWER_RUIN,
  'buff-tower': TOWER_RUIN,
  turret: TOWER_RUIN,
  gate: GATE_RUIN,
};
