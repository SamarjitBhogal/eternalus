import type {
  EntityId,
  MapDefinition,
  MapFeatureKind,
  MatchResult,
  Snapshot,
} from '@eternalus/core';

import type { CapturePointStatus, PlayerHudSnapshot, StructureStatus } from '../bridge/hud.types';
import { ROSTER_PUBLISH_EVERY_TICKS } from './MatchBridge.constants';
import type { MatchBridgeDeps } from './MatchBridge.types';

/**
 * All game → UI publishing for one match (architecture 12 §8, 13 §5), owned by `Match`. It
 * publishes only what the simulation has today (DEC-17, HC-F6: no made-up values):
 * - `match-clock` and `hud-state` (the player's health; every other value `null`) every
 *   `publishEveryTicks`;
 * - the team structures and the capture points from the map's features (health `null`, owner
 *   `neutral`) every `ROSTER_PUBLISH_EVERY_TICKS`;
 * - `match-ended` once, after the tick whose step ended the match: the result is latched inside
 *   the simulation's event and published from `afterTick`, never mid-step.
 * `publishAll` sends everything once, before the first tick. The rosters are built once, so each
 * re-send carries the same arrays and the store sees no change.
 */
export class MatchBridge {
  private readonly structures: readonly StructureStatus[];
  private readonly capturePoints: readonly CapturePointStatus[];
  private readonly stopListening: () => void;
  private result: MatchResult | null = null;
  private wasEndPublished = false;

  /** Builds the two rosters from the map and listens for the match's end; publishes nothing yet. */
  public constructor(private readonly deps: MatchBridgeDeps) {
    this.structures = MatchBridge.structuresOf(deps.map);
    this.capturePoints = MatchBridge.capturePointsOf(deps.map, deps.captureKinds);
    this.stopListening = deps.onMatchEnded(({ result }) => {
      this.result = result;
    });
  }

  /** Whether `match-ended` has been published: from the end of the tick that ended the match. */
  public get hasEnded(): boolean {
    return this.wasEndPublished;
  }

  /** Publishes both rosters, the clock and the HUD once, before the first tick. */
  public publishAll(snapshot: Snapshot, playerId: EntityId | null): void {
    this.publishRosters();
    this.publishFast(snapshot, playerId);
  }

  /** After each tick: the clock and the HUD on the fast cadence, the rosters on the slow one. */
  public afterTick(snapshot: Snapshot, playerId: EntityId | null): void {
    if (snapshot.tick % this.deps.publishEveryTicks === 0) {
      this.publishFast(snapshot, playerId);
    }
    if (snapshot.tick % ROSTER_PUBLISH_EVERY_TICKS === 0) {
      this.publishRosters();
    }
    if (this.result !== null && !this.wasEndPublished) {
      this.wasEndPublished = true;
      const { result } = this;
      this.deps.bus.emit('match-ended', {
        result,
        durationSeconds: result.durationTicks / this.deps.tickRate,
      });
    }
  }

  /** Stops listening for the match's end; a later `match-ended` is never latched. */
  public destroy(): void {
    this.stopListening();
  }

  private publishFast(snapshot: Snapshot, playerId: EntityId | null): void {
    const { bus, tickRate } = this.deps;
    bus.emit('match-clock', { tick: snapshot.tick, seconds: snapshot.tick / tickRate });
    bus.emit('hud-state', { player: MatchBridge.playerOf(snapshot, playerId) });
  }

  private publishRosters(): void {
    this.deps.bus.emit('structure-state', { structures: this.structures });
    this.deps.bus.emit('capture-state', { points: this.capturePoints });
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

  private static capturePointsOf(
    map: MapDefinition,
    captureKinds: readonly MapFeatureKind[],
  ): readonly CapturePointStatus[] {
    return map.features
      .filter((feature) => captureKinds.includes(feature.kind))
      .map((feature) => ({
        pointId: feature.id,
        kind: feature.kind,
        laneIndex: MatchBridge.laneIndexOf(map, feature.laneId),
        ownerTeam: 'neutral',
        progress: null,
      }));
  }

  private static laneIndexOf(map: MapDefinition, laneId: string | undefined): number | null {
    return map.lanes.find((lane) => lane.id === laneId)?.index ?? null;
  }
}
