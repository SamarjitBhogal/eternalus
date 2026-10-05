import type { MapFeatureDefinition, MapLayout, MapPreset } from '../content/maps/maps.types';
import type { Team } from '../teams/teams.types';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import type { LaneGeometry } from './LaneGeometry';
import type { LaneShape } from './LaneShape.types';
import type { MapConfig } from './MapGenerator.types';
import type { Rng } from './Rng.types';

/** Everything one `MapBuilder` run reads. */
export type MapBuildInput = {
  readonly config: MapConfig;
  readonly seed: number;
  readonly layout: MapLayout;
  readonly definitions: Readonly<Record<string, MapFeatureDefinition>>;
  readonly preset: MapPreset | undefined;
  readonly laneShape: LaneShape;
  readonly rng: Rng;
};

/** Optional extras when the builder places a feature. */
type FeatureExtras = { readonly laneId?: string; readonly footprint?: Polygon };

/** One feature to place: who owns it, which content it spawns, where, and its extras. */
export type FeatureSpec = FeatureExtras & {
  readonly id: string;
  readonly team: Team;
  readonly definitionId: string;
  readonly position: Vec2;
};

/** A feature to place on the Light/west half; the builder adds its mirrored twin. */
export type MirroredFeatureSpec = FeatureExtras & {
  readonly suffix: string;
  readonly definitionId: string;
  readonly position: Vec2;
};

/** What `placeCampSlots` needs: the lanes, the camp counts per corridor and the span. */
export type CampLayoutInput = {
  readonly lightHalves: readonly LaneGeometry[];
  readonly lanePaths: readonly (readonly Vec2[])[];
  readonly counts: readonly number[];
  readonly stronghold: Vec2;
  readonly centreX: number;
  readonly band: readonly [number, number];
};

/** One piece of a Stronghold's wall ring on the Light side. */
export type WallRingPiece = {
  readonly kind: 'gate' | 'wall-segment';
  /** The lane leaving through this gate; only gates have one. */
  readonly laneIndex?: number;
  readonly position: Vec2;
  /** Straight-line width of the piece along the ring, in world units. */
  readonly width: number;
  readonly footprint: Polygon;
};

/** A Light wall ring: gates and wall segments in order around the ring, and its corners. */
export type WallRing = {
  readonly pieces: readonly WallRingPiece[];
  readonly vertices: readonly Vec2[];
};

/** A camp spot on the Light half, with how deep it sits between its two lanes (0..1). */
export type CampSlot = {
  readonly corridorIndex: number;
  readonly index: number;
  readonly position: Vec2;
  readonly depth: number;
};

/** A scattered obstacle on the Light half. */
export type ObstacleSlot = { readonly definitionId: string; readonly position: Vec2 };

/** One side of a mirrored pair: the id prefix and the owning team. */
export type MirrorSide = { readonly idPrefix: string; readonly team: Team };

/** What `wallRingSpecs` needs to raise one Light wall ring. */
export type WallRingInput = {
  readonly stronghold: Vec2;
  readonly exitAngles: readonly number[];
  readonly layout: MapLayout;
  readonly definitions: Readonly<Record<string, MapFeatureDefinition>>;
  readonly numLanes: number;
};
