import type { MapDefinition } from '../content/maps/maps.types';
import type { WorldMap } from '../map/WorldMap';
import type { CollisionQuery } from './CollisionQuery.types';
import { LaneRoutes } from './LaneRoutes';

/**
 * The map of one match at runtime (architecture 03 §2): the generated definition, its lanes as
 * each team walks them, the walkability grid that gates and felled obstacles change, and the
 * static collision sweep that walls and world objects stop units with. The lane structures index
 * joins at minion plan M2c; flow fields stay `PathingSystem`'s cache.
 */
export class MatchWorld {
  /** The map's lanes as each team walks them. */
  public readonly routes: LaneRoutes;

  /**
   * @param definition - The generated map.
   * @param grid - Its walkability grid (`WorldMap.fromDefinition`), built by the composition root.
   * @param collisions - The sweep `CollisionSystem` moves units with, on the same index; `null`
   *   when the match has no `CollisionSystem` (no map objects), so no wall stops a unit.
   */
  public constructor(
    public readonly definition: MapDefinition,
    public readonly grid: WorldMap,
    public readonly collisions: CollisionQuery | null,
  ) {
    this.routes = new LaneRoutes(definition);
  }
}
