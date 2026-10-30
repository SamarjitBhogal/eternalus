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
};

/** Mutable object state projected from the simulation; geometry stays in the map definition. */
export type MapObjectSnapshot = {
  readonly id: string;
  readonly entityId: string | null;
  readonly health: { readonly current: number; readonly max: number } | null;
  readonly isDestroyed: boolean;
};
