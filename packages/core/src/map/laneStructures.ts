import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import type { MapLane, MapLayout } from '../content/maps/maps.types';
import { fortInWorld } from './fortInWorld';
import { LaneGeometry } from './LaneGeometry';
import type { MirroredFeatureSpec, WallRingInput } from './MapBuilder.types';
import { MapGenerationError } from './MapGenerationError';
import type { MapConfig } from './MapGenerator.types';
import { buildWallRing } from './wallRing';

/**
 * `count` evenly spaced positions inside a `[from, to]` band, never on its edges. A band too
 * narrow to keep neighbours `minGap` apart widens round its middle until it does (DEC-227).
 */
const bandPositions = (
  count: number,
  [from, to]: readonly [number, number],
  minGap: number,
): number[] => {
  const isWideEnough = count < 2 || (to - from) / (count + 1) >= minGap;
  const half = ((count + 1) * minGap) / 2;
  const [start, end] = isWideEnough ? [from, to] : [(from + to) / 2 - half, (from + to) / 2 + half];
  return Array.from(
    { length: count },
    (_, slot) => start + ((slot + 1) / (count + 1)) * (end - start),
  );
};

/** Relative slack for the gap check: a widened band lands exactly on `minGap`, give or take rounding. */
const GAP_TOLERANCE = 1e-9;

/**
 * Throws when a tower position leaves the lane or two towers (of any kind) stand closer than
 * `minGap`: DEC-215 (1) calls an overlap a bug in the code.
 */
const assertTowersApart = (
  laneId: string,
  allTs: readonly number[],
  minGap: number,
  config: MapConfig,
): void => {
  const sorted = [...allTs].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted.at(-1);
  const hasGap = sorted.every(
    (t, index) => index === 0 || t - (sorted[index - 1] ?? t) >= minGap * (1 - GAP_TOLERANCE),
  );
  const isOnLane = first === undefined || last === undefined || (first >= 0 && last <= 1);
  if (!hasGap || !isOnLane) {
    throw new MapGenerationError(
      `map.spawnTowersPerLane = ${String(config.spawnTowersPerLane)} and map.buffTowersPerLane = ${String(config.buffTowersPerLane)} put lane towers on ${laneId} closer than one fort box or off the lane (map.worldWidth = ${String(config.worldWidth)}, map.worldHeight = ${String(config.worldHeight)}); a lane tower fort may not overlap another (DEC-215 (1)): use fewer towers per lane or a larger world`,
    );
  }
};

/**
 * One lane's Light towers: `spawnTowersPerLane` SpawnerTowers on the front band, then
 * `buffTowersPerLane` BuffTowers on the second band, at fractions of the lane's length from
 * the Light gate. "Front" and "second line" are bands. Towers stand at least a fort box's
 * diagonal apart along the lane (the box in world units), so their forts never overlap whatever
 * the lane's heading (DEC-227, DEC-215 (1)). Throws MapGenerationError when the counts cannot be
 * kept that far apart inside the lane.
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
  // The larger side times root 2 covers the fort box's diagonal on any lane heading.
  const minGap = (Math.max(fort.width, fort.height) * Math.SQRT2) / geometry.length;
  const towers = [
    {
      name: 'spawner-tower',
      definitionId: layout.definitionIds.spawnerTower,
      ts: bandPositions(config.spawnTowersPerLane, layout.laneBands.spawner, minGap),
    },
    {
      name: 'buff-tower',
      definitionId: layout.definitionIds.buffTower,
      ts: bandPositions(config.buffTowersPerLane, layout.laneBands.buff, minGap),
    },
  ];
  assertTowersApart(
    lane.id,
    towers.flatMap((tower) => tower.ts),
    minGap,
    config,
  );
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
