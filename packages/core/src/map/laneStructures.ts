import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import type { MapFeature, MapLane, MapLayout } from '../content/maps/maps.types';
import { fortInWorld } from './fortInWorld';
import { brokenLaneBandRules } from './laneBandRules';
import type { LaneBand } from './laneBandRules';
import { LaneGeometry } from './LaneGeometry';
import type { MirroredFeatureSpec, WallRingInput } from './MapBuilder.types';
import { MapGenerationError } from './MapGenerationError';
import type { MapConfig } from './MapGenerator.types';
import { buildWallRing } from './wallRing';

/**
 * The band `count` towers need inside `[from, to]`: the band itself, or, when it is too narrow to
 * keep neighbours `minGap` apart, a band widened round its middle until it is wide enough (DEC-227).
 */
const towerBand = (count: number, [from, to]: LaneBand, minGap: number): LaneBand => {
  if (count < 2 || (to - from) / (count + 1) >= minGap) return [from, to];
  const half = ((count + 1) * minGap) / 2;
  return [(from + to) / 2 - half, (from + to) / 2 + half];
};

/** The ground towers at `ts` occupy: `[first, last]`, or `configured` for a kind with no tower. */
const occupiedBand = (ts: readonly number[], configured: LaneBand): LaneBand =>
  ts.length === 0 ? configured : [Math.min(...ts), Math.max(...ts)];

/** `count` evenly spaced positions inside `[start, end]`, never on its edges. */
const bandPositions = (count: number, [start, end]: LaneBand): number[] =>
  Array.from({ length: count }, (_, slot) => start + ((slot + 1) / (count + 1)) * (end - start));

const towerCounts = (config: MapConfig): string =>
  `map.spawnTowersPerLane = ${String(config.spawnTowersPerLane)} and map.buffTowersPerLane = ${String(config.buffTowersPerLane)}`;

const worldSize = (config: MapConfig): string =>
  `map.worldWidth = ${String(config.worldWidth)}, map.worldHeight = ${String(config.worldHeight)}`;

/** Relative slack for the overlap check: two forts touch, not overlap, when one axis gap equals the box side. */
const TOUCH_TOLERANCE = 1e-9;

/**
 * Checks every pair of lane tower forts on the whole map, both teams and all lanes, in world
 * units: each fort is an upright box round its tower (`fortInWorld`), and two boxes overlap when
 * both axes are closer than the box. Placement keeps towers of one kind on a lane apart along
 * the lane; this check also covers towers of different kinds, bends and neighbouring lanes
 * (DEC-215 (1)).
 *
 * @throws MapGenerationError naming both towers when two forts overlap.
 */
export const assertLaneFortsApart = (towers: readonly MapFeature[], config: MapConfig): void => {
  const fort = fortInWorld(G.fort.laneTowerSize, {
    width: config.worldWidth,
    height: config.worldHeight,
  });
  towers.forEach((a, index) => {
    for (const b of towers.slice(index + 1)) {
      const dx = Math.abs(a.position.x - b.position.x);
      const dy = Math.abs(a.position.y - b.position.y);
      if (dx < fort.width * (1 - TOUCH_TOLERANCE) && dy < fort.height * (1 - TOUCH_TOLERANCE)) {
        throw new MapGenerationError(
          `${towerCounts(config)} put the forts of ${a.id} and ${b.id} over each other (${worldSize(config)}); a lane tower fort may not overlap another (DEC-215 (1)): use fewer towers per lane or a larger world`,
        );
      }
    }
  });
};

/**
 * One lane's Light towers: `spawnTowersPerLane` SpawnerTowers on the front band, then
 * `buffTowersPerLane` BuffTowers on the second band, at fractions of the lane's length from
 * the Light gate. "Front" and "second line" are bands. Towers of one kind stand at least a fort
 * box's diagonal apart along the lane (the box in world units), a band too narrow for that widens
 * round its middle (DEC-227); `assertLaneFortsApart` then checks the forts on the whole map.
 * Throws MapGenerationError when the ground the towers occupy breaks a lane band rule
 * (`brokenLaneBandRules`): a tower off the lane, or the first SpawnerTower not ahead of the last
 * BuffTower.
 */
export const laneTowerSpecs = (
  lane: MapLane,
  config: MapConfig,
  layout: MapLayout,
): readonly MirroredFeatureSpec[] => {
  const geometry = new LaneGeometry(lane.path);
  const fort = fortInWorld(G.fort.laneTowerSize, {
    width: config.worldWidth,
    height: config.worldHeight,
  });
  // Two upright boxes this far apart along any heading do not overlap: the box's diagonal.
  const minGap = Math.hypot(fort.width, fort.height) / geometry.length;
  const towers = [
    {
      name: 'spawner-tower',
      definitionId: layout.definitionIds.spawnerTower,
      ts: bandPositions(
        config.spawnTowersPerLane,
        towerBand(config.spawnTowersPerLane, layout.laneBands.spawner, minGap),
      ),
    },
    {
      name: 'buff-tower',
      definitionId: layout.definitionIds.buffTower,
      ts: bandPositions(
        config.buffTowersPerLane,
        towerBand(config.buffTowersPerLane, layout.laneBands.buff, minGap),
      ),
    },
  ];
  const [spawner, buff] = towers;
  const broken = brokenLaneBandRules({
    spawner: occupiedBand(spawner?.ts ?? [], layout.laneBands.spawner),
    buff: occupiedBand(buff?.ts ?? [], layout.laneBands.buff),
  });
  if (broken.length > 0) {
    throw new MapGenerationError(
      `${towerCounts(config)} put the towers of ${lane.id} where a lane band rule breaks: ${broken.join('; ')} (${worldSize(config)}): use fewer towers per lane or a larger world`,
    );
  }
  return towers.flatMap((tower) =>
    tower.ts.map((t, slot) => ({
      suffix: `${tower.name}-${lane.id}-${String(slot)}`,
      definitionId: tower.definitionId,
      position: geometry.pointAt(t),
      laneId: lane.id,
    })),
  );
};

/**
 * The Light wall ring as features: a gate per lane, wall segments between them and a turret
 * on every ring corner. Throws when a gate would be narrower than `wallRing.minGateOpening`
 * once its two turrets stand on its edges, so a sealed Stronghold can never be generated.
 */
export const wallRingSpecs = (input: WallRingInput): readonly MirroredFeatureSpec[] => {
  const { layout, definitions } = input;
  const ids = layout.definitionIds;
  const ring = buildWallRing(input.stronghold, input.exitAngles, layout.wallRing);
  const turret = definitions[ids.turret];
  if (turret === undefined) {
    throw new MapGenerationError(`Wall ring uses unknown turret definition '${ids.turret}'`);
  }
  const turretRadius = turret.footprintRadius;
  let wallIndex = 0;
  const pieces = ring.pieces.map((piece): MirroredFeatureSpec => {
    if (piece.laneIndex === undefined) {
      wallIndex += 1;
      return {
        suffix: `wall-segment-${String(wallIndex - 1)}`,
        definitionId: ids.wallSegment,
        position: piece.position,
        footprint: piece.footprint,
      };
    }
    const laneId = `lane-${String(piece.laneIndex)}`;
    const opening = piece.width - 2 * turretRadius;
    if (opening < layout.wallRing.minGateOpening) {
      throw new MapGenerationError(
        `map.numLanes = ${String(input.numLanes)} leaves the gate of ${laneId} ${opening.toFixed(1)} units open between its turrets; wallRing.minGateOpening is ${String(layout.wallRing.minGateOpening)} (use fewer lanes, or a larger wallRing.radius or exitArcDegrees)`,
      );
    }
    return {
      suffix: `gate-${laneId}`,
      definitionId: ids.gate,
      position: piece.position,
      laneId,
      footprint: piece.footprint,
    };
  });
  const turrets = ring.vertices.map((position, index) => ({
    suffix: `turret-${String(index)}`,
    definitionId: ids.turret,
    position,
  }));
  return [...pieces, ...turrets];
};
