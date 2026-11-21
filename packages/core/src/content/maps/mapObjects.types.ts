import type { PlayableTeam } from '../../teams/teams.types';
import type { Polygon } from '../../utils/geometry.types';

/** Physical map-object categories; material marks and floors are not objects. */
export type MapObjectKind =
  | 'tree'
  | 'rock'
  | 'house'
  | 'wall'
  | 'furniture'
  | 'fort'
  | 'camp'
  | 'terrain'
  | 'stronghold'
  | 'cathedral'
  | 'spawner-tower'
  | 'buff-tower'
  | 'turret'
  | 'gate';

/** Authored ownership: all art of one object changes together when that object is destroyed. */
export type MapObjectArt = {
  readonly id: string;
  readonly kind: MapObjectKind;
  readonly isFootprint: boolean;
  /** The feature whose structure this object is part of the body of (`MapObject.partOf`). */
  readonly partOf?: string;
};

/** Exact world geometry shared by collision, targeting and destruction presentation. */
export type MapObject = {
  readonly id: string;
  readonly kind: MapObjectKind;
  readonly footprints: readonly Polygon[];
  readonly isBlocking: boolean;
  readonly buildingId?: string;
  readonly isInterior?: true;
  readonly passages?: readonly Polygon[];
  /**
   * The id of the feature whose structure this object is part of the body of: a wall of a lane
   * tower's fort. While the tower stands, the wall shares the tower's one health pool and reach to
   * it is reach to the tower (DEC-185 B). When the tower falls, the wall that took the killing hit
   * falls with it and each other wall stands as scenery with health of its own (DEC-217 (12),
   * DEC-219 (a)).
   */
  readonly partOf?: string;
  /**
   * The side that built it: its Stronghold and everything of that palace, its gates, wall
   * segments, turrets and lane towers. Only the other side may break it (DEC-121 (a)). Absent on
   * scenery (trees, rocks, houses, camps, forts), which anyone may break.
   */
  readonly team?: PlayableTeam;
};

/** Mutable object state projected from the simulation; geometry stays in the map definition. */
export type MapObjectSnapshot = {
  readonly id: string;
  readonly entityId: string | null;
  readonly health: { readonly current: number; readonly max: number } | null;
  readonly isDestroyed: boolean;
};
