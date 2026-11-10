import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { MAP_FEATURE_DEFINITIONS } from '../../content/maps/mapFeatureDefinitions';
import type { MapDefinition } from '../../content/maps/maps.types';
import { WorldMap } from '../../map/WorldMap';
import { MatchWorld } from '../MatchWorld';

/** `map` as `Simulation` builds its world: the default cell size and the content's blocking rule. */
export const matchWorldOf = (
  map: MapDefinition,
  cellSize = createDefaultGameConfig().map.navCellSize,
): MatchWorld =>
  new MatchWorld(
    map,
    WorldMap.fromDefinition(
      map,
      cellSize,
      (definitionId) => MAP_FEATURE_DEFINITIONS[definitionId]?.isBlocking ?? false,
    ),
  );
