import type { MapFeatureDefinition, MapLayout, MapPreset } from '../content/maps/maps.types';
import type { Team } from '../teams/teams.types';
import type { Polygon, Vec2 } from '../utils/geometry.types';
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
export type FeatureExtras = { readonly laneId?: string; readonly footprint?: Polygon };

/** One piece of a Stronghold's wall ring on the Light side. */
export type WallRingPiece = {
  readonly kind: 'gate' | 'wall-segment';
  /** The lane leaving through this gate; only gates have one. */
  readonly laneIndex?: number;
  readonly position: Vec2;
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
