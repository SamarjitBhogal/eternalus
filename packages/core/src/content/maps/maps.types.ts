import type { Team } from '../../teams/teams.types';
import type { Polygon, Vec2 } from '../../utils/geometry.types';

/**
 * The kinds of placed things a generated map contains. Each kind becomes one entity kind when
 * the match starts (`EntityFactory`), so the list is specific rather than generic.
 */
export type MapFeatureKind =
  | 'stronghold'
  | 'spawner-tower'
  | 'buff-tower'
  | 'wall-segment'
  | 'gate'
  | 'turret'
  | 'camp'
  | 'corner-camp'
  | 'capture-point'
  | 'cathedral'
  | 'obstacle';

/** The shape of a feature's minimap marker. */
export type MinimapGlyphShape = 'dot' | 'square' | 'diamond' | 'ring';

/** Which palette entry colours a minimap marker. `team` uses the owner's team colour. */
export type MinimapColourRole = 'team' | 'neutral' | 'objective' | 'terrain' | 'obstacle';

/** How a feature looks on the minimap. Sizes are in minimap pixels at a device pixel ratio of 1. */
export type MinimapGlyph = {
  readonly shape: MinimapGlyphShape;
  readonly size: number;
  readonly colourRole: MinimapColourRole;
};

/** A single placed thing on the map, such as a tower, a camp or the Cathedral. */
export type MapFeature = {
  readonly id: string;
  readonly kind: MapFeatureKind;
  readonly team: Team;
  /** Content id of the definition this feature spawns, e.g. `'spawner-tower'` or `'tree'`. */
  readonly definitionId: string;
  readonly position: Vec2;
  readonly minimapGlyph: MinimapGlyph;
  /** The lane this feature belongs to, for lane structures, gates and capture points. */
  readonly laneId?: string;
  /** The ground the feature covers, in world units, when its definition has a size. */
  readonly footprint?: Polygon;
};

/** The kinds of ground shapes that are not entities. Walls are features, not terrain. */
export type MapTerrainKind = 'out-of-bounds' | 'rift';

/**
 * A ground shape that is part of the map's layout. This only describes where it is;
 * `WorldMap` and collision decide what it blocks.
 */
export type MapTerrain = {
  readonly id: string;
  readonly kind: MapTerrainKind;
  readonly shape: Polygon;
};

/** A path that units follow from the Light gate to the Dark gate. Every segment is straight. */
export type MapLane = {
  readonly id: string;
  readonly index: number;
  readonly path: readonly Vec2[];
};

/** Everything needed to build and draw one generated map. Sizes are in world units. */
export type MapDefinition = {
  readonly id: string;
  readonly displayName: string;
  readonly width: number;
  readonly height: number;
  readonly seed: number;
  readonly lanes: readonly MapLane[];
  readonly terrain: readonly MapTerrain[];
  readonly features: readonly MapFeature[];
};

/** Content describing one kind of placed thing: how big it is and how it shows on the minimap. */
export type MapFeatureDefinition = {
  readonly id: string;
  readonly kind: MapFeatureKind;
  readonly minimapGlyph: MinimapGlyph;
  /** Radius of the round footprint in world units; 0 for features without one. */
  readonly footprintRadius: number;
  /** Whether the footprint blocks walking in the `WorldMap` grid. */
  readonly blocksMovement: boolean;
};

/**
 * One bend of a lane on the Light half. `u` is the fraction of the way from the Stronghold to
 * the centre line; `v` is the fraction of the lane's final sideways offset reached there.
 * Lanes are straight segments between bends, so a one-bend profile is the MVP straight lane.
 */
export type LaneKnot = { readonly u: number; readonly v: number };

/** A camp definition and the minimum depth (0 at a lane, 1 midway between two lanes) it needs. */
export type CampWeightClass = { readonly minDepth: number; readonly definitionId: string };

/** An obstacle definition and its relative chance when obstacles are scattered. */
export type ObstacleChoice = { readonly definitionId: string; readonly weight: number };

/**
 * Layout tuning the generator reads besides the `MapConfig` counts. All lengths are in world
 * units and angles in degrees. Presets may override the lane and terrain parts.
 */
export type MapLayout = {
  /** Id and display name of a map generated without a preset. */
  readonly unnamedMap: { readonly id: string; readonly displayName: string };
  readonly strongholdInset: number;
  readonly laneEdgeMargin: number;
  readonly laneProfile: readonly LaneKnot[];
  readonly laneBands: {
    readonly spawner: readonly [number, number];
    readonly buff: readonly [number, number];
  };
  readonly wallRing: {
    readonly radius: number;
    readonly thickness: number;
    readonly gateArcDegrees: number;
    readonly maxSegmentArcDegrees: number;
  };
  readonly camps: {
    readonly band: readonly [number, number];
    readonly weightClasses: readonly CampWeightClass[];
  };
  readonly cornerCamps: {
    readonly insetX: number;
    readonly insetY: number;
    readonly stepX: number;
  };
  readonly rift: { readonly halfWidth: number; readonly bridgeWidth: number };
  readonly defaultCornerSize: number;
  readonly obstacles: {
    readonly perTenThousandUnits: number;
    readonly laneClearance: number;
    readonly featureClearance: number;
    readonly choices: readonly ObstacleChoice[];
  };
  readonly footprintSides: number;
  readonly navCellSize: number;
  readonly definitionIds: {
    readonly stronghold: string;
    readonly spawnerTower: string;
    readonly buffTower: string;
    readonly wallSegment: string;
    readonly gate: string;
    readonly turret: string;
    readonly cornerCamp: string;
    readonly capturePoint: string;
    readonly cathedral: string;
    readonly bridgeSegment: string;
  };
};

/**
 * An authored look for a map. It may shape the ground and bend the lanes, but it never places
 * a structure: towers, gates, camps and capture points always come from the generator, so a
 * preset honours every `MapConfig` count by construction.
 */
export type MapPreset = {
  readonly id: string;
  readonly displayName: string;
  /** Out-of-bounds polygons on the Light (west) half; the generator mirrors them east. */
  readonly westOutOfBounds: readonly Polygon[];
  /** The rift's centre line from top to bottom; gaps are cut wherever a lane crosses it. */
  readonly riftCentreline: readonly Vec2[];
  readonly laneProfile?: readonly LaneKnot[];
  readonly laneEdgeMargin?: number;
};
