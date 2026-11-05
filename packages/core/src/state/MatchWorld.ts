import type { MapDefinition } from '../content/maps/maps.types';
import type { WorldMap } from '../map/WorldMap';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import { LaneRoutes } from './LaneRoutes';

/**
 * The map of one match at runtime (architecture 03 §2): the generated definition, its lanes as
 * each team walks them, and the walkability grid that gates and felled obstacles change. The lane
 * structures index joins at minion plan M2c; flow fields stay `PathingSystem`'s cache.
 */
export class MatchWorld {
  /** The map's lanes as each team walks them. */
  public readonly routes: LaneRoutes;
  /** Each team's Stronghold position, from the map's features. */
  private readonly strongholds = new Map<Team, Vec2>();

  /**
   * @param definition - The generated map.
   * @param grid - Its walkability grid (`WorldMap.fromDefinition`), built by the composition root.
   */
  public constructor(
    public readonly definition: MapDefinition,
    public readonly grid: WorldMap,
  ) {
    this.routes = new LaneRoutes(definition);
    for (const { kind, team, position } of definition.features) {
      if (kind === 'stronghold' && !this.strongholds.has(team)) {
        this.strongholds.set(team, position);
      }
    }
  }

  /**
   * The direction a unit of `team` placed at `position` faces until it first moves or attacks
   * (DEC-216 (6)): toward the enemy Stronghold, of any length (`Placement.facing`). `undefined`
   * for a neutral unit or a map without that Stronghold; a guard is faced by its post instead.
   */
  public startFacing(team: Team, position: Vec2): Vec2 | undefined {
    const enemy = team === 'light' ? 'dark' : team === 'dark' ? 'light' : undefined;
    const target = enemy === undefined ? undefined : this.strongholds.get(enemy);
    return target && { x: target.x - position.x, y: target.y - position.y };
  }
}
