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

/**
 * What a shot does over an object's footprint (HC-Q89, DEC-345). Set only by the map builder, on
 * lakes and lava rivers; absent on every other object, which stops a shot. Units collide with the
 * footprint whatever the flags say.
 */
export type MapObjectFlags = {
  /** A shot flies over it (a lake, a lava river); a unit or a dash still stops at it. */
  readonly isLowGround?: true;
  /** A shot that flies over it catches fire (a lava river); a bridge deck over it is not fire. */
  readonly isFire?: true;
};

/** Authored ownership: all art of one object changes together when that object is destroyed. */
export type MapObjectArt = MapObjectFlags & {
  readonly id: string;
  readonly kind: MapObjectKind;
  readonly isFootprint: boolean;
};

/** Exact world geometry shared by collision, targeting and destruction presentation. */
export type MapObject = MapObjectFlags & {
  readonly id: string;
  readonly kind: MapObjectKind;
  readonly footprints: readonly Polygon[];
  readonly isBlocking: boolean;
  readonly buildingId?: string;
  readonly isInterior?: true;
  readonly passages?: readonly Polygon[];
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
