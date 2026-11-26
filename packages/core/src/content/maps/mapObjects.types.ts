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
 * What an object's footprint does to a shot (HC-Q89, DEC-345). A map builder sets them; an object
 * without them stops a shot. A unit or a dash collides with the footprint whatever they say.
 */
export type MapObjectFlags = {
  /** A shot flies over the footprint: it does not stop the shot. A unit or a dash still stops. */
  readonly canShotsCross?: true;
  /**
   * A shot that flies over the footprint, outside its passages, catches fire (if its definition
   * lets it). A passage (a bridge deck) does not light a shot.
   */
  readonly canLightShots?: true;
};

/**
 * What a map builder says about an object besides its art: what it does to a shot
 * (`MapObjectFlags`), and the structure it is part of the body of (`MapObject.partOf`).
 */
export type MapObjectTraits = MapObjectFlags & {
  /** The feature whose structure this object is part of the body of (`MapObject.partOf`). */
  readonly partOf?: string;
};

/** Authored ownership: all art of one object changes together when that object is destroyed. */
export type MapObjectArt = MapObjectTraits & {
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
   * The id of the feature whose structure this object is part of the body of: the Stronghold's
   * outer walls and its throne (DEC-373 (1)). A blocking such object has no health of its own:
   * a hit on it is a hit on the structure (one pool, as a lane tower's fort, DEC-185 B), and it
   * outlives the structure as a ruin that blocks (DEC-341). Its polygons are solid polygons of the
   * structure's `Footprint`.
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
  /**
   * Set when the object is a structure's body (a lane tower's fort, a wall turret's pylon) and its
   * structure is gone: it still stands and blocks, and it draws as ruins (DEC-341, HC-Q91).
   */
  readonly isRuined?: true;
};
