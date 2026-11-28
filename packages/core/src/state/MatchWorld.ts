import type { MapDefinition } from '../content/maps/maps.types';
import type { MapObject } from '../content/maps/mapObjects.types';
import type { MatchGrid } from '../map/MatchGrid';
import type { WorldMap } from '../map/WorldMap';
import { isPlayableTeam, opponentOf } from '../teams/playableTeams';
import type { PlayableTeam, Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
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
  /** Each team's Stronghold position, from the map's features. */
  private readonly strongholds = new Map<Team, Vec2>();

  /** The generated map, the one `matchGrid` was built from. */
  public readonly definition: MapDefinition;

  /** The walkability grid the lane flow fields and A\* share (`MatchGrid.grid`). */
  public readonly grid: WorldMap;

  /**
   * @param matchGrid - The map's grid with the rule that stamped it (`MatchGrid.build`), built by
   *   the composition root. It keeps its map, so the world can never pair a grid with another map.
   */
  public constructor(private readonly matchGrid: MatchGrid) {
    this.definition = matchGrid.definition;
    this.grid = matchGrid.grid;
    this.routes = new LaneRoutes(this.definition);
    for (const { kind, team, position } of this.definition.features) {
      if (kind === 'stronghold' && !this.strongholds.has(team)) {
        this.strongholds.set(team, position);
      }
    }
  }

  /**
   * The direction a unit of `team` placed at `position` faces until it first moves or attacks
   * (DEC-216 (6)): toward the enemy Stronghold, of any length. It comes as the `facing` part of a
   * `Placement`, for a spawn site to spread into the placement it builds; the part is empty for a
   * neutral unit or a map without that Stronghold. A guard is faced by its post instead.
   */
  public startFacing(team: Team, position: Vec2): { readonly facing?: Vec2 } {
    const target = isPlayableTeam(team) ? this.strongholds.get(opponentOf(team)) : undefined;
    return target === undefined
      ? {}
      : { facing: { x: target.x - position.x, y: target.y - position.y } };
  }

  /**
   * Undoes what the grid stamped for a destroyed `object` (`MatchGrid.reopen`). Returns the cells
   * whose walkability changed.
   */
  public reopen(object: MapObject): readonly number[] {
    return this.matchGrid.reopen(object);
  }

  /** Where `team`'s Stronghold stands (a copy), or `undefined` when the map has none for it. */
  public strongholdOf(team: PlayableTeam): Vec2 | undefined {
    const stronghold = this.strongholds.get(team);
    return stronghold === undefined ? undefined : { x: stronghold.x, y: stronghold.y };
  }
}
