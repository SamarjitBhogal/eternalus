import type {
  CaptureSnapshot,
  EntityId,
  MapDefinition,
  MatchResult,
  Simulation,
  Snapshot,
  Unsubscribe,
} from '@eternalus/core';

import type { CapturePointStatus, PlayerHudSnapshot, StructureStatus } from '../bridge/hud.types';
import { ROSTER_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import type { MatchBridgeDeps } from './MatchBridge.types';
import { PublishedRoster } from './PublishedRoster';

/**
 * All game → UI publishing for one match (architecture 12 §8, 13 §5), owned by `Match`. It
 * publishes only what the simulation has today (DEC-17, HC-F6: no made-up values):
 * - `match-clock` and `hud-state` (the player's health; every other value `null`) every
 *   `publishEveryTicks`;
 * - the team structures and the capture points from the map's features every
 *   `ROSTER_PUBLISH_EVERY_TICKS`: each structure with the live health of the structure core built
 *   from its feature (DEC-212), each capture point with its zone's owner and progress;
 * - `match-ended` once, after the tick whose step ended the match: the result is latched inside
 *   the simulation's event and published from `afterTick`, never mid-step.
 * `publishAll` sends everything once, before the first tick. A roster re-send with no change
 * carries the same array, so the roster selectors return the same value and the HUD does not
 * re-render. Its subscriptions to the simulation's
 * events are one listener table (`listen`): each announcement 12 §8 plans is one line.
 */
export class MatchBridge {
  private readonly structures: readonly StructureStatus[];
  private readonly structureRoster: PublishedRoster<StructureStatus>;
  /** The max health of each structure tile bound to a structure at match start, by feature id. */
  private readonly boundMaxHealth: ReadonlyMap<string, number>;
  /** Each capture point's status while no zone names its feature: neutral, no progress. */
  private readonly pointsWithoutZone: readonly CapturePointStatus[];
  private readonly captureRoster: PublishedRoster<CapturePointStatus>;
  private readonly listeners: readonly Unsubscribe[];
  private result: MatchResult | null = null;
  private wasEndPublished = false;

  /**
   * Builds the two rosters from the map, binds each structure tile to the structure the first
   * snapshot names for its feature, and subscribes its listener table; publishes nothing yet.
   */
  public constructor(private readonly deps: MatchBridgeDeps) {
    this.structures = MatchBridge.structuresOf(deps.map);
    this.structureRoster = new PublishedRoster(
      this.structures,
      (last, next) =>
        last.health?.current === next.health?.current && last.health?.max === next.health?.max,
    );
    this.boundMaxHealth = new Map(
      [...MatchBridge.healthByFeature(deps.firstSnapshot)].map(([id, { max }]) => [id, max]),
    );
    const features = deps.map.features.filter((feature) =>
      deps.captureKinds.includes(feature.kind),
    );
    this.pointsWithoutZone = features.map((feature) => ({
      pointId: feature.id,
      kind: feature.kind,
      laneIndex: MatchBridge.laneIndexOf(deps.map, feature.laneId),
      ownerTeam: 'neutral',
      progress: null,
    }));
    this.captureRoster = new PublishedRoster(
      this.pointsWithoutZone,
      (last, next) => last.ownerTeam === next.ownerTeam && last.progress === next.progress,
    );
    this.listeners = this.listen(deps.events);
  }

  /** Publishes both rosters, the clock and the HUD once, before the first tick. */
  public publishAll(snapshot: Snapshot, playerId: EntityId | null): void {
    this.publishRosters(snapshot);
    this.publishFast(snapshot, playerId);
  }

  /**
   * After each tick: the clock and the HUD on the fast cadence, the rosters on the slow one.
   * Returns `true` only after the tick that ended the match, the once it publishes `match-ended`.
   */
  public afterTick(snapshot: Snapshot, playerId: EntityId | null): boolean {
    if (snapshot.tick % this.deps.publishEveryTicks === 0) {
      this.publishFast(snapshot, playerId);
    }
    if (snapshot.tick % ROSTER_PUBLISH_EVERY_TICKS === 0) {
      this.publishRosters(snapshot);
    }
    if (this.result === null || this.wasEndPublished) return false;
    this.wasEndPublished = true;
    const { result } = this;
    this.deps.bus.emit('match-ended', {
      result,
      durationSeconds: result.durationTicks / this.deps.tickRate,
    });
    return true;
  }

  /** Unsubscribes the whole listener table; a later `match-ended` is never latched. */
  public destroy(): void {
    for (const unsubscribe of this.listeners) unsubscribe();
  }

  /**
   * The listener table: one subscription per simulation event the bridge hears. `match-ended`
   * only latches the result; `afterTick` publishes it.
   */
  private listen(events: Pick<Simulation, 'on'>): readonly Unsubscribe[] {
    return [
      events.on('match-ended', ({ result }) => {
        this.result = result;
      }),
    ];
  }

  private publishFast(snapshot: Snapshot, playerId: EntityId | null): void {
    const { bus, tickRate } = this.deps;
    bus.emit('match-clock', { tick: snapshot.tick, seconds: snapshot.tick / tickRate });
    bus.emit('hud-state', { player: MatchBridge.playerOf(snapshot, playerId) });
  }

  /** Publishes both rosters; each keeps its unchanged items and array (`PublishedRoster`). */
  private publishRosters(snapshot: Snapshot): void {
    const structures = this.structureRoster.update(this.structuresAt(snapshot));
    const points = this.captureRoster.update(this.liveCapturePoints(snapshot));
    this.deps.bus.emit('structure-state', { structures });
    this.deps.bus.emit('capture-state', { points });
  }

  /**
   * The structure roster with live health (DEC-212): a tile bound at match start takes its
   * structure's health from `snapshot`, and 0 once the structure is gone from it (`DeathSystem`
   * removes a structure only when it dies; DEC-69). A feature core built no structure for (walls
   * and turrets, 07 §13) keeps `null`: the HUD shows "no data", never a made-up value.
   */
  private structuresAt(snapshot: Snapshot): readonly StructureStatus[] {
    const live = MatchBridge.healthByFeature(snapshot);
    return this.structures.map((structure) => {
      const max = this.boundMaxHealth.get(structure.structureId);
      if (max === undefined) return structure;
      return { ...structure, health: live.get(structure.structureId) ?? { current: 0, max } };
    });
  }

  /** The health of each structure in `snapshot` that names its map feature, by feature id. */
  private static healthByFeature(
    snapshot: Snapshot,
  ): ReadonlyMap<string, NonNullable<StructureStatus['health']>> {
    const health = new Map<string, NonNullable<StructureStatus['health']>>();
    for (const entity of snapshot.entities) {
      if (entity.mapFeatureId !== undefined && entity.health !== null) {
        health.set(entity.mapFeatureId, entity.health);
      }
    }
    return health;
  }

  /**
   * The capture points with each zone's owner and progress. A zone names its point's map feature
   * (`EntitySnapshot.mapFeatureId`, DEC-231), which links it to its point, never its position; a
   * point with no zone shows no capture (neutral, no progress).
   */
  private liveCapturePoints(snapshot: Snapshot): readonly CapturePointStatus[] {
    const zones = MatchBridge.captureByFeature(snapshot);
    return this.pointsWithoutZone.map((point) => {
      const capture = zones.get(point.pointId);
      return capture === undefined
        ? point
        : { ...point, ownerTeam: capture.owner, progress: capture.progress };
    });
  }

  /** The capture state of each zone in `snapshot` that names its map feature, by feature id. */
  private static captureByFeature(snapshot: Snapshot): ReadonlyMap<string, CaptureSnapshot> {
    const captures = new Map<string, CaptureSnapshot>();
    for (const entity of snapshot.entities) {
      if (entity.mapFeatureId !== undefined && entity.capture !== null) {
        captures.set(entity.mapFeatureId, entity.capture);
      }
    }
    return captures;
  }

  /**
   * The player's HUD values: health from the snapshot, everything else `null` until core
   * publishes it (interim until core fills a player snapshot; 13 §10).
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
      aether: null,
      maxAether: null,
      level: null,
      xp: null,
      xpToNext: null,
      weaponProgress: null,
      ultimatePips: null,
      slots: [],
    };
  }

  /**
   * Every team-owned feature is a team structure (07 §1); camps, objectives and scenery are
   * neutral. Health starts `null`; `structuresAt` fills it for the features bound to a structure.
   */
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
