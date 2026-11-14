import type {
  AbilitySlotSnapshot,
  CaptureSnapshot,
  EntityId,
  MapDefinition,
  Snapshot,
  Vec2,
} from '@eternalus/core';

import type {
  AbilitySlotStatus,
  CapturePointStatus,
  PlayerHudSnapshot,
  StructureStatus,
} from '../bridge/hud.types';
import { ROSTER_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import type { CaptureSite, MatchBridgeDeps } from './MatchBridge.types';

/**
 * All game → UI publishing for one match (architecture 12 §8, 13 §5), owned by `Match`. It
 * publishes only what the simulation has today (DEC-17, HC-F6: no made-up values):
 * - `match-clock` and `hud-state` (the player's health, aether, level and XP; every other value
 *   `null`) every `publishEveryTicks`;
 * - the team structures (health `null`) and the capture points (owner and progress from each
 *   point's zone) from the map's features every `ROSTER_PUBLISH_EVERY_TICKS`.
 * `publishAll` sends everything once, before the first tick. A re-send with no change carries the
 * same arrays, so the store sees no change.
 */
export class MatchBridge {
  private readonly structures: readonly StructureStatus[];
  private readonly captureSites: readonly CaptureSite[];
  private capturePoints: readonly CapturePointStatus[];

  /** Builds the two rosters from the map; publishes nothing yet. */
  public constructor(private readonly deps: MatchBridgeDeps) {
    this.structures = MatchBridge.structuresOf(deps.map);
    const features = deps.map.features.filter((feature) =>
      deps.captureKinds.includes(feature.kind),
    );
    this.captureSites = features.map((feature) => ({
      position: feature.position,
      withoutZone: {
        pointId: feature.id,
        kind: feature.kind,
        laneIndex: MatchBridge.laneIndexOf(deps.map, feature.laneId),
        ownerTeam: 'neutral',
        progress: null,
      },
    }));
    this.capturePoints = this.captureSites.map(({ withoutZone }) => withoutZone);
  }

  /** Publishes both rosters, the clock and the HUD once, before the first tick. */
  public publishAll(snapshot: Snapshot, playerId: EntityId | null): void {
    this.publishRosters(snapshot);
    this.publishFast(snapshot, playerId);
  }

  /** After each tick: the clock and the HUD on the fast cadence, the rosters on the slow one. */
  public afterTick(snapshot: Snapshot, playerId: EntityId | null): void {
    if (snapshot.tick % this.deps.publishEveryTicks === 0) {
      this.publishFast(snapshot, playerId);
    }
    if (snapshot.tick % ROSTER_PUBLISH_EVERY_TICKS === 0) {
      this.publishRosters(snapshot);
    }
  }

  private publishFast(snapshot: Snapshot, playerId: EntityId | null): void {
    const { bus, tickRate } = this.deps;
    bus.emit('match-clock', { tick: snapshot.tick, seconds: snapshot.tick / tickRate });
    bus.emit('hud-state', { player: MatchBridge.playerOf(snapshot, playerId) });
  }

  private publishRosters(snapshot: Snapshot): void {
    this.capturePoints = this.liveCapturePoints(snapshot);
    this.deps.bus.emit('structure-state', { structures: this.structures });
    this.deps.bus.emit('capture-state', { points: this.capturePoints });
  }

  /**
   * The capture points with each zone's owner and progress. A zone stands on its feature's
   * position, which links it to its point; a point with no zone shows no capture (neutral, no
   * progress). An unchanged point, and an unchanged list, is the last one published.
   */
  private liveCapturePoints(snapshot: Snapshot): readonly CapturePointStatus[] {
    const points = this.captureSites.map(({ position, withoutZone }, index) => {
      const capture = MatchBridge.captureAt(snapshot, position);
      const next =
        capture === null
          ? withoutZone
          : { ...withoutZone, ownerTeam: capture.owner, progress: capture.progress };
      const last = this.capturePoints[index] ?? withoutZone;
      return last.ownerTeam === next.ownerTeam && last.progress === next.progress ? last : next;
    });
    return points.every((point, index) => point === this.capturePoints[index])
      ? this.capturePoints
      : points;
  }

  private static captureAt(snapshot: Snapshot, position: Vec2): CaptureSnapshot | null {
    const zone = snapshot.entities.find(
      ({ capture, transform }) =>
        capture !== null &&
        transform !== null &&
        transform.x === position.x &&
        transform.y === position.y,
    );
    return zone?.capture ?? null;
  }

  /**
   * The player's HUD values, joined from the Legend's entity groups by id (05 §15, DEC-232): health,
   * aether, level and XP, and its ability slots from `Snapshot.player` (none while that is `null`).
   * The rest is `null` until core publishes it (13 §10). Names and icons are not joined here: the
   * HUD's kit selector joins them by slot from the catalogue.
   */
  private static playerOf(snapshot: Snapshot, playerId: EntityId | null): PlayerHudSnapshot | null {
    const entity = snapshot.entities.find((candidate) => candidate.id === playerId);
    if (entity === undefined) {
      return null;
    }
    return {
      entityId: entity.id,
      definitionId: entity.definitionId,
      health: entity.health?.current ?? null,
      maxHealth: entity.health?.max ?? null,
      aether: entity.aether?.current ?? null,
      maxAether: entity.aether?.max ?? null,
      level: entity.progression?.level ?? null,
      xp: entity.progression?.xp ?? null,
      xpToNext: entity.progression?.xpToNext ?? null,
      weaponProgress: null,
      ultimatePips: null,
      slots:
        snapshot.player?.entityId === entity.id ? MatchBridge.slotsOf(snapshot.player.slots) : [],
    };
  }

  /** The bar slots the HUD draws: `default-action` has no HUD slot. */
  private static slotsOf(slots: readonly AbilitySlotSnapshot[]): readonly AbilitySlotStatus[] {
    return slots.flatMap(({ slot, ...rest }) =>
      slot === 'default-action' ? [] : [{ slot, ...rest }],
    );
  }

  /** Every team-owned feature is a team structure (07 §1); camps, objectives and scenery are neutral. */
  private static structuresOf(map: MapDefinition): readonly StructureStatus[] {
    return map.features.flatMap((feature) =>
      feature.team === 'neutral'
        ? []
        : [
            {
              structureId: feature.id,
              kind: feature.kind,
              team: feature.team,
              laneIndex: MatchBridge.laneIndexOf(map, feature.laneId),
              health: null,
            },
          ],
    );
  }

  private static laneIndexOf(map: MapDefinition, laneId: string | undefined): number | null {
    return map.lanes.find((lane) => lane.id === laneId)?.index ?? null;
  }
}
