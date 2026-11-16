import { Capturable } from '../components/Capturable';
import type { ZoneLevelUpDefinition } from '../content/zones/zones.types';
import { CapturePoint } from '../entities/zones/CapturePoint';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import { isPlayableTeam } from '../teams/playableTeams';
import type { System, SystemContext } from './System.types';

/**
 * The zone level-up (architecture 07 §7, DEC-258): once a team has held a capture point for
 * `holdSeconds` without a break, every horde of that team spawned on the point's lane gets
 * `levels` minion levels (`minion-levels-granted`, applied by `VeterancySystem`). When the point
 * changes owner, the levels it granted are taken back on that tick and its clock restarts for the
 * new owner. Runs after `CaptureSystem`, so it sees this tick's spawns and owner changes.
 *
 * @remarks ponytail: the hold clocks and the granted members live here, not in `GameState`, so
 * they are not hashed; they are rebuilt from the same events on a replay. Move them into state if
 * a match must restore from a snapshot.
 */
export class ZoneLevelUpSystem implements System {
  public readonly name = 'zone-level-up';
  private readonly holdTicks: number;
  /** The tick each capture point's owner took it. */
  private readonly ownedSince = new Map<EntityId, number>();
  /** The minions each capture point granted levels, in grant order. */
  private readonly granted = new Map<EntityId, EntityId[]>();
  private readonly changes: { readonly pointId: EntityId; readonly tick: number }[] = [];
  private readonly spawned: string[] = [];

  /**
   * @param state - The match whose events this system listens to.
   * @param levelUp - The hold time and the levels (content).
   */
  public constructor(
    state: GameState,
    private readonly levelUp: ZoneLevelUpDefinition,
  ) {
    this.holdTicks = Math.round(levelUp.holdSeconds * state.config.tickRate);
    state.events.on('capture-point-owner-changed', ({ pointId }) => {
      this.changes.push({ pointId, tick: state.tick });
    });
    state.events.on('horde-spawned', ({ hordeId }) => {
      this.spawned.push(hordeId);
    });
  }

  /** Takes back the levels of points that changed owner, then grants this tick's hordes theirs. */
  public update({ state }: SystemContext): void {
    for (const { pointId, tick } of this.changes) {
      for (const entityId of this.granted.get(pointId) ?? []) {
        if (state.entities.has(entityId)) {
          state.events.emit('minion-levels-granted', { entityId, levels: -this.levelUp.levels });
        }
      }
      this.granted.delete(pointId);
      this.ownedSince.set(pointId, tick);
    }
    for (const hordeId of this.spawned) {
      const horde = state.hordes.get(hordeId);
      const point = horde === undefined ? undefined : this.heldPoint(state, horde.team, horde.lane);
      if (horde === undefined || point === undefined) {
        continue;
      }
      const members = this.granted.get(point) ?? [];
      for (const entityId of horde.memberIds) {
        members.push(entityId);
        state.events.emit('minion-levels-granted', { entityId, levels: this.levelUp.levels });
      }
      this.granted.set(point, members);
    }
    this.changes.length = 0;
    this.spawned.length = 0;
  }

  /** A capture point on `lane` that `team` has held for the hold time, if any. */
  private heldPoint(state: GameState, team: string, lane: string): EntityId | undefined {
    let held: EntityId | undefined;
    state.entities.forEach((entity) => {
      const owner = entity.findComponent(Capturable)?.owner;
      const since = this.ownedSince.get(entity.id);
      if (
        held === undefined &&
        entity instanceof CapturePoint &&
        entity.laneId === lane &&
        owner === team &&
        isPlayableTeam(owner) &&
        since !== undefined &&
        state.tick - since >= this.holdTicks
      ) {
        held = entity.id;
      }
    });
    return held;
  }
}
