import type { MapDefinition } from '../content/maps/maps.types';
import type { WorldMap } from '../map/WorldMap';
import { LaneRoutes } from './LaneRoutes';

/**
 * The map of one match at runtime (architecture 03 §2): the generated definition, its lanes as
 * each team walks them, and the walkability grid that gates and felled obstacles change. The lane
 * structures index joins at minion plan M2c; flow fields stay `PathingSystem`'s cache.
 */
export class MatchWorld {
  /** The map's lanes as each team walks them. */
  public readonly routes: LaneRoutes;

  /**
   * @param definition - The generated map.
   * @param grid - Its walkability grid (`WorldMap.fromDefinition`), built by the composition root.
   */
  public constructor(
    public readonly definition: MapDefinition,
    public readonly grid: WorldMap,
  ) {
    this.routes = new LaneRoutes(definition);
  }
}
