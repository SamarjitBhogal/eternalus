import type { MapDefinition, MapFeature, MapLane, MapTerrain } from '../content/maps/maps.types';
import type { Team } from '../teams/teams.types';
import { regularPolygon } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import { campDefinitionFor, distributeCamps, placeCampSlots } from './campPlacement';
import { LaneGeometry } from './LaneGeometry';
import { NEUTRAL_SIDES, TEAM_SIDES } from './MapBuilder.constants';
import type { FeatureExtras, MapBuildInput, MirrorSide } from './MapBuilder.types';
import { MapGenerationError } from './MapGenerationError';
import { scatterObstacles } from './obstacleScatter';
import { carveRift, centrelineXAtY, defaultCentreline, defaultWestBounds } from './riftTerrain';
import { mirrorPoint, mirrorPolygon } from './symmetry';
import { buildWallRing } from './wallRing';

/**
 * Builds one `MapDefinition` step by step (Builder). Every step reads the config, the layout,
 * the seeded RNG and what earlier steps placed; `MapGenerator` calls them in a fixed order.
 * Team features are placed for Light on the west half and mirrored for Dark.
 */
export class MapBuilder {
  private readonly input: MapBuildInput;
  private readonly stronghold: Vec2;
  private readonly centreX: number;
  private readonly lanes: MapLane[] = [];
  private readonly lightHalves: LaneGeometry[] = [];
  private readonly terrain: MapTerrain[] = [];
  private readonly features: MapFeature[] = [];

  /** Starts an empty map for one config, seed and layout. */
  public constructor(input: MapBuildInput) {
    this.input = input;
    this.centreX = input.config.worldWidth / 2;
    this.stronghold = { x: input.layout.strongholdInset, y: input.config.worldHeight / 2 };
  }

  /** Light's Stronghold on the west edge of the symmetry axis' row; Dark's is its mirror. */
  public placeStrongholds(): this {
    this.addTeamPair('stronghold', this.input.layout.definitionIds.stronghold, this.stronghold);
    return this;
  }

  /** `numLanes` lanes fanned evenly between the edge margins, each mirrored onto Dark's half. */
  public layLanes(): this {
    const { numLanes, worldHeight, worldWidth } = this.input.config;
    const margin = this.input.preset?.laneEdgeMargin ?? this.input.layout.laneEdgeMargin;
    const spacing = numLanes > 1 ? (worldHeight - 2 * margin) / (numLanes - 1) : 0;
    for (let index = 0; index < numLanes; index += 1) {
      const half = this.input.laneShape.traceLightHalf({
        stronghold: this.stronghold,
        centreX: this.centreX,
        lateralOffset: (index - (numLanes - 1) / 2) * spacing,
        ringRadius: this.input.layout.wallRing.radius,
      });
      const darkHalf = half.slice(0, -1).map((point) => mirrorPoint(point, worldWidth));
      this.lightHalves.push(new LaneGeometry(half));
      this.lanes.push({
        id: `lane-${String(index)}`,
        index,
        path: [...half, ...darkHalf.reverse()],
      });
    }
    return this;
  }

  /** Per lane: SpawnerTowers on the front band, then BuffTowers on the second band. */
  public placeLaneStructures(): this {
    const { layout, config } = this.input;
    for (const lane of this.lanes) {
      const geometry = new LaneGeometry(lane.path);
      const place = (
        definitionId: string,
        count: number,
        band: readonly [number, number],
        name: string,
      ): void => {
        for (let slot = 0; slot < count; slot += 1) {
          const t = band[0] + ((slot + 1) / (count + 1)) * (band[1] - band[0]);
          this.addTeamPair(
            `${name}-${lane.id}-${String(slot)}`,
            definitionId,
            geometry.pointAt(t),
            { laneId: lane.id },
          );
        }
      };
      place(
        layout.definitionIds.spawnerTower,
        config.spawnTowersPerLane,
        layout.laneBands.spawner,
        'spawner-tower',
      );
      place(
        layout.definitionIds.buffTower,
        config.buffTowersPerLane,
        layout.laneBands.buff,
        'buff-tower',
      );
    }
    return this;
  }

  /** A wall ring around each Stronghold: one gate per lane exit, turrets on every corner. */
  public raiseWalls(): this {
    const ids = this.input.layout.definitionIds;
    const exits = this.lanes.map((lane) => {
      const gate = lane.path[0] ?? this.stronghold;
      return Math.atan2(gate.y - this.stronghold.y, gate.x - this.stronghold.x);
    });
    const ring = buildWallRing(this.stronghold, exits, this.input.layout.wallRing);
    let wallIndex = 0;
    for (const piece of ring.pieces) {
      const laneId = piece.laneIndex === undefined ? undefined : this.lanes[piece.laneIndex]?.id;
      if (laneId === undefined) {
        this.addTeamPair(`wall-segment-${String(wallIndex)}`, ids.wallSegment, piece.position, {
          footprint: piece.footprint,
        });
        wallIndex += 1;
      } else {
        this.addTeamPair(`gate-${laneId}`, ids.gate, piece.position, {
          laneId,
          footprint: piece.footprint,
        });
      }
    }
    ring.vertices.forEach((vertex, index) => {
      this.addTeamPair(`turret-${String(index)}`, ids.turret, vertex);
    });
    return this;
  }

  /** Forest camps between adjacent lanes (weight by depth, DISC-42), then the corner camps. */
  public placeCamps(): this {
    const { config, layout } = this.input;
    const counts = distributeCamps(config.campsPerSide, config.numLanes - 1);
    const slots = placeCampSlots(
      this.lightHalves,
      this.lanes.map((lane) => lane.path),
      counts,
      { stronghold: this.stronghold, centreX: this.centreX },
      layout.camps.band,
    );
    for (const slot of slots) {
      const definitionId = campDefinitionFor(slot.depth, layout.camps.weightClasses);
      if (definitionId === undefined) {
        throw new MapGenerationError(`No camp weight class covers depth ${String(slot.depth)}`);
      }
      this.addNeutralPair(
        `camp-corridor-${String(slot.corridorIndex)}-${String(slot.index)}`,
        definitionId,
        slot.position,
      );
    }
    const corner = layout.cornerCamps;
    for (let index = 0; index < config.cornerCamps / 2; index += 1) {
      const isTop = index % 2 === 0;
      const position = {
        x: corner.insetX + Math.floor(index / 2) * corner.stepX,
        y: isTop ? corner.insetY : config.worldHeight - corner.insetY,
      };
      this.addNeutralPair(
        `corner-camp-${String(index)}`,
        layout.definitionIds.cornerCamp,
        position,
      );
    }
    return this;
  }

  /** One capture point where each lane crosses the centre line; the middle lane's is the Cathedral. */
  public placeCapturePoints(): this {
    const ids = this.input.layout.definitionIds;
    const middle = (this.lanes.length - 1) / 2;
    for (const lane of this.lanes) {
      const isCathedral = lane.index === middle;
      const position = this.lightHalves[lane.index]?.pointAt(1) ?? this.stronghold;
      this.addFeature(
        `${isCathedral ? 'cathedral' : 'capture-point'}-${lane.id}`,
        'neutral',
        isCathedral ? ids.cathedral : ids.capturePoint,
        position,
        { laneId: lane.id },
      );
    }
    return this;
  }

  /** The rift along the centre line with a bridge gap per lane, and the out-of-bounds corners. */
  public carveRiftAndBounds(): this {
    const { config, layout, preset } = this.input;
    const centreline =
      preset?.riftCentreline ?? defaultCentreline(config.worldWidth, config.worldHeight);
    const crossings = this.lightHalves.map((half) => half.pointAt(1).y);
    carveRift(centreline, crossings, { height: config.worldHeight, ...layout.rift }).forEach(
      (shape, index) => {
        this.terrain.push({ id: `rift-${String(index)}`, kind: 'rift', shape });
      },
    );
    const westBounds =
      preset?.westOutOfBounds ?? defaultWestBounds(layout.defaultCornerSize, config.worldHeight);
    westBounds.forEach((shape, index) => {
      this.terrain.push({ id: `west-bounds-${String(index)}`, kind: 'out-of-bounds', shape });
      this.terrain.push({
        id: `east-bounds-${String(index)}`,
        kind: 'out-of-bounds',
        shape: mirrorPolygon(shape, config.worldWidth),
      });
    });
    this.lanes.forEach((lane, index) => {
      const y = crossings[index] ?? this.stronghold.y;
      this.addFeature(
        `bridge-segment-${lane.id}`,
        'neutral',
        layout.definitionIds.bridgeSegment,
        { x: centrelineXAtY(centreline, y), y },
        { laneId: lane.id },
      );
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
        keepOut: [
          {
            centre: this.stronghold,
            radius: layout.wallRing.radius + layout.obstacles.featureClearance,
          },
        ],
      },
      layout.obstacles,
    );
    slots.forEach((slot, index) => {
      this.addNeutralPair(`obstacle-${String(index)}`, slot.definitionId, slot.position);
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

  private addTeamPair(
    suffix: string,
    definitionId: string,
    position: Vec2,
    extras: FeatureExtras = {},
  ): void {
    this.addMirrored(suffix, TEAM_SIDES, definitionId, position, extras);
  }

  private addNeutralPair(
    suffix: string,
    definitionId: string,
    position: Vec2,
    extras: FeatureExtras = {},
  ): void {
    this.addMirrored(suffix, NEUTRAL_SIDES, definitionId, position, extras);
  }

  private addMirrored(
    suffix: string,
    [west, east]: readonly [MirrorSide, MirrorSide],
    definitionId: string,
    position: Vec2,
    extras: FeatureExtras,
  ): void {
    const width = this.input.config.worldWidth;
    this.addFeature(`${west.idPrefix}-${suffix}`, west.team, definitionId, position, extras);
    this.addFeature(
      `${east.idPrefix}-${suffix}`,
      east.team,
      definitionId,
      mirrorPoint(position, width),
      {
        ...extras,
        ...(extras.footprint === undefined
          ? {}
          : { footprint: mirrorPolygon(extras.footprint, width) }),
      },
    );
  }

  private addFeature(
    id: string,
    team: Team,
    definitionId: string,
    position: Vec2,
    extras: FeatureExtras = {},
  ): void {
    const definition = this.input.definitions[definitionId];
    if (definition === undefined) {
      throw new MapGenerationError(`Feature '${id}' uses unknown definition '${definitionId}'`);
    }
    const footprint: Polygon | undefined =
      extras.footprint ??
      (definition.footprintRadius > 0
        ? regularPolygon(position, definition.footprintRadius, this.input.layout.footprintSides)
        : undefined);
    this.features.push({
      id,
      kind: definition.kind,
      team,
      definitionId,
      position: { x: position.x, y: position.y },
      minimapGlyph: definition.minimapGlyph,
      ...(extras.laneId === undefined ? {} : { laneId: extras.laneId }),
      ...(footprint === undefined ? {} : { footprint }),
    });
  }
}
