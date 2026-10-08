import type { MapLane, MapLayout } from '../content/maps/maps.types';
import { LaneGeometry } from './LaneGeometry';
import type { MirroredFeatureSpec, WallRingInput } from './MapBuilder.types';
import { MapGenerationError } from './MapGenerationError';
import type { MapConfig } from './MapGenerator.types';
import { buildWallRing } from './wallRing';

/** `count` evenly spaced positions inside a `[from, to]` band, never on its edges. */
const bandPositions = (count: number, [from, to]: readonly [number, number]): number[] =>
  Array.from({ length: count }, (_, slot) => from + ((slot + 1) / (count + 1)) * (to - from));

/**
 * One lane's Light towers: `spawnTowersPerLane` SpawnerTowers on the front band, then
 * `buffTowersPerLane` BuffTowers on the second band, at fractions of the lane's length from
 * the Light gate. "Front" and "second line" are bands, so any count per lane works.
 */
export const laneTowerSpecs = (
  lane: MapLane,
  config: MapConfig,
  layout: MapLayout,
): readonly MirroredFeatureSpec[] => {
  const geometry = new LaneGeometry(lane.path);
  const towers = [
    {
      name: 'spawner-tower',
      definitionId: layout.definitionIds.spawnerTower,
      ts: bandPositions(config.spawnTowersPerLane, layout.laneBands.spawner),
    },
    {
      name: 'buff-tower',
      definitionId: layout.definitionIds.buffTower,
      ts: bandPositions(config.buffTowersPerLane, layout.laneBands.buff),
    },
  ];
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
