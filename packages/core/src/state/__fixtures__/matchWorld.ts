import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { MAP_FEATURE_DEFINITIONS } from '../../content/maps/mapFeatureDefinitions';
import type { MapDefinition } from '../../content/maps/maps.types';
import { MatchGrid } from '../../map/MatchGrid';
import { MatchWorld } from '../MatchWorld';

/** `map` as `Simulation` builds its world: the default cell size and the content's blocking rule. */
export const matchWorldOf = (
  map: MapDefinition,
  cellSize = createDefaultGameConfig().map.navCellSize,
): MatchWorld =>
  new MatchWorld(MatchGrid.build(map, [], { cellSize, features: MAP_FEATURE_DEFINITIONS }));
