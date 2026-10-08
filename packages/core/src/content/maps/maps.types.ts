import type { Polygon, Vec2 } from '../../utils/geometry.types';

/** The two playable teams. */
export type TeamId = 'light' | 'dark';

/** Who owns a map feature when the match starts. */
export type FeatureOwner = TeamId | 'neutral';

/** The kinds of places that can appear on a map. */
export type MapFeatureKind =
  | 'camp'
  | 'capital'
  | 'team-structure'
  | 'capture-point'
  | 'cathedral'
  | 'crossing'
  | 'side-objective';

/** A single named place on the map, such as a capital or the cathedral. */
export type MapFeature = {
  readonly id: string;
  readonly kind: MapFeatureKind;
  readonly owner: FeatureOwner;
  readonly position: Vec2;
};

/** The kinds of ground shapes that make up a map's layout. */
export type MapTerrainKind = 'out-of-bounds' | 'rift' | 'capital-wall';

/**
 * A ground shape that is part of the map's layout. This only describes where it is;
 * collision rules (owned separately) decide whether it blocks movement.
 */
export type MapTerrain = {
  readonly id: string;
  readonly kind: MapTerrainKind;
  readonly shape: Polygon;
};

/** A path that units follow between the two capitals. */
export type MapLane = {
  readonly id: string;
  readonly path: readonly Vec2[];
};

/** Everything needed to draw one map. Sizes are in world units. */
export type MapDefinition = {
  readonly id: string;
  readonly displayName: string;
  readonly width: number;
  readonly height: number;
  readonly lanes: readonly MapLane[];
  readonly terrain: readonly MapTerrain[];
  readonly features: readonly MapFeature[];
  readonly scenery?: readonly MapDecoration[];
  readonly presentationScale?: number;
  readonly groundColor?: string;
  readonly interior?: MapDefinition;
  readonly interiorEntry?: { readonly halfWidth: number; readonly halfHeight: number };
};

/** A presentation-only polygon; it never changes collision, ownership or gameplay. */
export type MapDecoration = {
  readonly id: string;
  readonly shape: Polygon;
  readonly color: string;
  readonly layer: 'ground' | 'detail';
};
