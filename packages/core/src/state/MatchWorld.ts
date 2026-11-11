import type { MapDefinition } from '../content/maps/maps.types';
import type { MapObject } from '../content/maps/mapObjects.types';
import type { MatchGrid } from '../map/MatchGrid';
import type { WorldMap } from '../map/WorldMap';
import { LaneRoutes } from './LaneRoutes';

/**
 * The map of one match at runtime (architecture 03 §2): the generated definition, its lanes as
 * each team walks them, and the walkability grid that gates and felled obstacles change. The lane
 * structures index joins at minion plan M2c; flow fields stay `PathingSystem`'s cache. The rule
 * that stamps the grid and undoes it is `MatchGrid`'s.
 */
export class MatchWorld {
  /** The map's lanes as each team walks them. */
  public readonly routes: LaneRoutes;

  /** The walkability grid the lane flow fields and A\* share (`MatchGrid.grid`). */
  public readonly grid: WorldMap;

  /**
   * @param definition - The generated map.
   * @param stamps - Its grid with the rule that stamped it (`MatchGrid.build`), built by the
   *   composition root.
   */
  public constructor(
    public readonly definition: MapDefinition,
    private readonly stamps: MatchGrid,
  ) {
    this.grid = stamps.grid;
    this.routes = new LaneRoutes(definition);
  }

  /**
   * Undoes what the grid stamped for a destroyed `object` (`MatchGrid.reopen`). Returns the cells
   * whose walkability changed.
   */
  public reopen(object: MapObject): readonly number[] {
    return this.stamps.reopen(object);
  }
}
