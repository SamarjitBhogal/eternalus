import type { MapDefinition, MapFeature, MapLane, MapTerrain } from '../content/maps/maps.types';
import type { Vec2 } from '../utils/geometry.types';
import {
  campDefinitionFor,
  cornerCampPositions,
  distributeCamps,
  placeCampSlots,
} from './campPlacement';
import { createMapFeature } from './createMapFeature';
import { LaneGeometry } from './LaneGeometry';
import { RADIANS_PER_DEGREE } from '../utils/geometry';
import { NEUTRAL_SIDES, TEAM_SIDES } from './MapBuilder.constants';
import type {
  FeatureSpec,
  MapBuildInput,
  MirroredFeatureSpec,
  MirrorSide,
} from './MapBuilder.types';
import { MapGenerationError } from './MapGenerationError';
import { laneTowerSpecs, wallRingSpecs } from './laneStructures';
import { scatterObstacles } from './obstacleScatter';
import { mirrorPoint, mirrorPolygon } from './symmetry';
import { layOutTerrain } from './terrainLayout';

/**
 * Builds one `MapDefinition` step by step (Builder). Every step reads the config, the layout,
 * the seeded RNG and what earlier steps placed; `MapGenerator` calls them in a fixed order.
 * Team features are placed for Light on the west half and mirrored for Dark.
 */
export class MapBuilder {
  private readonly input: MapBuildInput;
  private readonly stronghold: Vec2;
  private readonly centreX: number;
  private readonly exitAngles: readonly number[];
  private readonly lanes: MapLane[] = [];
  private readonly lightHalves: LaneGeometry[] = [];
  private readonly terrain: MapTerrain[] = [];
  private readonly features: MapFeature[] = [];

  /** Starts an empty map for one config, seed and layout. */
  public constructor(input: MapBuildInput) {
    this.input = input;
    this.centreX = input.config.worldWidth / 2;
    this.stronghold = { x: input.layout.strongholdInset, y: input.config.worldHeight / 2 };
    const { numLanes } = input.config;
    const arc = input.layout.wallRing.exitArcDegrees * RADIANS_PER_DEGREE;
    // Architecture 06 §3: gates are spread evenly over the arc facing the enemy, north first.
    this.exitAngles = Array.from({ length: numLanes }, (_, index) =>
      numLanes > 1 ? -arc / 2 + (index * arc) / (numLanes - 1) : 0,
    );
  }

  /** Light's Stronghold on the west edge, centred vertically; Dark's is its mirror. */
  public placeStrongholds(): this {
    this.addMirrored(
      { suffix: 'stronghold', definitionId: this.ids().stronghold, position: this.stronghold },
      TEAM_SIDES,
    );
    return this;
  }

  /** `numLanes` lanes fanned evenly between the edge margins, each mirrored onto Dark's half. */
  public layLanes(): this {
    const { numLanes, worldHeight, worldWidth } = this.input.config;
    const margin = this.input.layout.laneEdgeMargin;
    const spacing = numLanes > 1 ? (worldHeight - 2 * margin) / (numLanes - 1) : 0;
    this.exitAngles.forEach((exitAngle, index) => {
      const half = this.input.laneShape.traceLightHalf({
        stronghold: this.stronghold,
        centreX: this.centreX,
        lateralOffset: (index - (numLanes - 1) / 2) * spacing,
        ringRadius: this.input.layout.wallRing.radius,
        exitAngle,
        apron: this.input.layout.wallRing.laneApron,
      });
      const darkHalf = half.slice(0, -1).map((point) => mirrorPoint(point, worldWidth));
      this.lightHalves.push(new LaneGeometry(half));
      this.lanes.push({
        id: `lane-${String(index)}`,
        index,
        path: [...half, ...darkHalf.reverse()],
      });
    });
    return this;
  }

  /** Per lane: SpawnerTowers on the front band, then BuffTowers on the second band. */
  public placeLaneStructures(): this {
    for (const lane of this.lanes) {
      for (const spec of laneTowerSpecs(lane, this.input.config, this.input.layout)) {
        this.addMirrored(spec, TEAM_SIDES);
      }
    }
    return this;
  }

  /** A wall ring around each Stronghold: one gate per lane exit, turrets on every corner. */
  public raiseWalls(): this {
    const specs = wallRingSpecs({
      stronghold: this.stronghold,
      exitAngles: this.exitAngles,
      layout: this.input.layout,
      definitions: this.input.definitions,
      numLanes: this.input.config.numLanes,
    });
    for (const spec of specs) {
      this.addMirrored(spec, TEAM_SIDES);
    }
    return this;
  }

  /** Forest camps between adjacent lanes (weight by depth, DISC-42), then the corner camps. */
  public placeCamps(): this {
    const { config, layout } = this.input;
    const slots = placeCampSlots({
      lightHalves: this.lightHalves,
      lanePaths: this.lanes.map((lane) => lane.path),
      counts: distributeCamps(config.campsPerSide, config.numLanes - 1),
      stronghold: this.stronghold,
      centreX: this.centreX,
      band: layout.camps.band,
    });
    for (const slot of slots) {
      const definitionId = campDefinitionFor(slot.depth, layout.camps.weightClasses);
      if (definitionId === undefined) {
        throw new MapGenerationError(`No camp weight class covers depth ${String(slot.depth)}`);
      }
      this.addMirrored(
        {
          suffix: `camp-corridor-${String(slot.corridorIndex)}-${String(slot.index)}`,
          definitionId,
          position: slot.position,
        },
        NEUTRAL_SIDES,
      );
    }
    cornerCampPositions(config.cornerCamps, layout.cornerCamps, config.worldHeight).forEach(
      (position, index) => {
        this.addMirrored(
          { suffix: `corner-camp-${String(index)}`, definitionId: this.ids().cornerCamp, position },
          NEUTRAL_SIDES,
        );
      },
    );
    return this;
  }

  /** One capture point where each lane crosses the centre line; the middle lane's is the Cathedral. */
  public placeCapturePoints(): this {
    const ids = this.ids();
    const middle = (this.lanes.length - 1) / 2;
    this.lanes.forEach((lane, index) => {
      const isCathedral = index === middle;
      this.addFeature({
        id: `${isCathedral ? 'cathedral' : 'capture-point'}-${lane.id}`,
        team: 'neutral',
        definitionId: isCathedral ? ids.cathedral : ids.capturePoint,
        position: this.crossingOf(index),
        laneId: lane.id,
      });
    });
    return this;
  }

  /** The rift along the symmetry axis with a bridge gap per lane, and the out-of-bounds corners. */
  public carveRiftAndBounds(): this {
    const { config, layout, preset } = this.input;
    this.terrain.push(
      ...layOutTerrain({
        preset,
        layout,
        width: config.worldWidth,
        height: config.worldHeight,
        crossings: this.lanes.map((_, index) => this.crossingOf(index).y),
      }),
    );
    this.lanes.forEach((lane, index) => {
      this.addFeature({
        id: `bridge-segment-${lane.id}`,
        team: 'neutral',
        definitionId: layout.definitionIds.bridgeSegment,
        position: this.crossingOf(index),
        laneId: lane.id,
      });
    });
    return this;
  }

  /** Trees and rocks scattered on open ground with the seeded RNG, mirrored onto Dark's half. */
  public scatterObstacles(): this {
    const { config, layout, rng } = this.input;
    const slots = scatterObstacles(
      rng,
      {
        width: config.worldWidth,
        height: config.worldHeight,
        blocked: this.terrain.map((piece) => piece.shape),
        lanes: this.lanes.map((lane) => lane.path),
        occupied: this.features.map((feature) => feature.position),
        keepOut: {
          centre: this.stronghold,
          radius: layout.wallRing.radius + layout.obstacles.featureClearance,
        },
      },
      layout.obstacles,
    );
    slots.forEach((slot, index) => {
      this.addMirrored(
        {
          suffix: `obstacle-${String(index)}`,
          definitionId: slot.definitionId,
          position: slot.position,
        },
        NEUTRAL_SIDES,
      );
    });
    return this;
  }

  /** The finished map. `MapGenerator` validates and freezes it. */
  public build(): MapDefinition {
    const { config, preset, layout, seed } = this.input;
    return {
      id: preset?.id ?? layout.unnamedMap.id,
      displayName: preset?.displayName ?? layout.unnamedMap.displayName,
      width: config.worldWidth,
      height: config.worldHeight,
      seed,
      lanes: this.lanes,
      terrain: this.terrain,
      features: this.features,
    };
  }

  /** Where lane `index` crosses the symmetry axis (the last point of its Light half). */
  private crossingOf(index: number): Vec2 {
    const half = this.lightHalves[index];
    if (half === undefined) {
      throw new MapGenerationError(`Lane ${String(index)} has not been laid`);
    }
    return half.pointAt(1);
  }

  private ids(): MapBuildInput['layout']['definitionIds'] {
    return this.input.layout.definitionIds;
  }

  /** Places a feature on the west half and its mirror image on the east half. */
  private addMirrored(
    spec: MirroredFeatureSpec,
    [west, east]: readonly [MirrorSide, MirrorSide],
  ): void {
    const width = this.input.config.worldWidth;
    const { suffix, footprint, ...rest } = spec;
    this.addFeature({
      ...rest,
      ...(footprint === undefined ? {} : { footprint }),
      id: `${west.idPrefix}-${suffix}`,
      team: west.team,
    });
    this.addFeature({
      ...rest,
      ...(footprint === undefined ? {} : { footprint: mirrorPolygon(footprint, width) }),
      id: `${east.idPrefix}-${suffix}`,
      team: east.team,
      position: mirrorPoint(spec.position, width),
    });
  }

  private addFeature(spec: FeatureSpec): void {
    this.features.push(
      createMapFeature(spec, this.input.definitions, this.input.layout.footprintSides),
    );
  }
}
