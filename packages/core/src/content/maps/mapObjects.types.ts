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
   * The side that built it: its Stronghold and everything of that palace, its gates, wall
   * segments, turrets and lane towers. Only the other side may break it (DEC-121 (a)). Absent on
   * scenery (trees, rocks, houses, camps, forts), which anyone may break.
   */
  readonly team?: PlayableTeam;
};

/**
 * What is left of a map object (DEC-389, HC-B38 (3)). `standing`: it is whole. `ruin`: a
 * structure's body whose structure is gone (a lane tower's fort, a wall turret's pylon); it still
 * stands and blocks, and it draws as ruins (DEC-341, HC-Q91); a pylon keeps its own health
 * (DEC-388). `destroyed`: its own health ran out; it blocks no more and draws as rubble.
 */
export type MapObjectCondition = 'standing' | 'ruin' | 'destroyed';

/** Mutable object state projected from the simulation; geometry stays in the map definition. */
export type MapObjectSnapshot = {
  readonly id: string;
  readonly entityId: string | null;
  readonly health: { readonly current: number; readonly max: number } | null;
  readonly condition: MapObjectCondition;
  /**
   * The health of the structure mounted on it, while that stands (a wall turret on its pylon,
   * DEC-388). `health` is then the object's own.
   */
  readonly mountedHealth?: { readonly current: number; readonly max: number };
};
