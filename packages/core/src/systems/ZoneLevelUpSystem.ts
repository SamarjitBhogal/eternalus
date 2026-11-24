import { Capturable } from '../components/Capturable';
import { Veterancy } from '../components/Veterancy';
import type { ZoneLevelUpDefinition } from '../content/zones/zones.types';
import { CapturePoint } from '../entities/zones/CapturePoint';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { PlayableTeam } from '../teams/teams.types';
import type { System, SystemContext } from './System.types';

/**
 * The zone level-up (architecture 07 §7, DEC-258): once a team has held a capture point for its
 * hold time (`holdTicks`, per zone definition, DEC-353 (c)) without a break
 * (`Capturable.ownedSinceTick`), every horde of that team spawned on the point's lane gets the
 * zone's `levels` minion levels (`minion-levels-granted`, applied by `MinionLevelSystem`, which
 * records the point as `Veterancy.grantedBy`). When the point changes
 * owner, the levels it granted are taken back on that tick. Runs after `CaptureSystem`, so it sees
 * this tick's spawns and owner changes. Its queues empty every tick; the match state it reads is
 * hashed.
 */
export class ZoneLevelUpSystem implements System {
  public readonly name = 'zone-level-up';
  private readonly changed: EntityId[] = [];
  private readonly spawned: string[] = [];

  /**
   * @param state - The match whose events this system listens to.
   * @param levelUps - Each zone definition's hold time and levels, as loaded (`loadZoneLevelUp`).
   */
  public constructor(
    state: GameState,
    private readonly levelUps: ReadonlyMap<string, ZoneLevelUpDefinition>,
  ) {
    state.events.on('capture-point-owner-changed', ({ pointId }) => {
      this.changed.push(pointId);
    });
    state.events.on('horde-spawned', ({ hordeId }) => {
      this.spawned.push(hordeId);
    });
  }

  /** Takes back the levels of points that changed owner, then grants this tick's hordes theirs. */
  public update({ state }: SystemContext): void {
    for (const pointId of this.changed) {
      state.entities.forEach((entity) => {
        const granted = entity.findComponent(Veterancy);
        if (granted?.grantedBy === pointId && state.entities.isAlive(entity.id)) {
          const levels = -granted.granted;
          state.events.emit('minion-levels-granted', {
            entityId: entity.id,
            levels,
            sourceId: pointId,
          });
        }
      });
    }
    for (const hordeId of this.spawned) {
      const horde = state.hordes.get(hordeId);
      const held = horde === undefined ? undefined : this.heldPoint(state, horde.team, horde.lane);
      if (horde === undefined || held === undefined) {
        continue;
      }
      for (const entityId of horde.memberIds) {
        state.events.emit('minion-levels-granted', {
          entityId,
          levels: held.levels,
          sourceId: held.id,
        });
      }
    }
    this.changed.length = 0;
    this.spawned.length = 0;
  }

  /**
   * A capture point on `lane` that `team` has held for its hold time, with its levels, if any:
   * the first in `state.entities` order (insertion order, so deterministic) when several qualify.
   */
  private heldPoint(
    state: GameState,
    team: PlayableTeam,
    lane: string,
  ): { readonly id: EntityId; readonly levels: number } | undefined {
    let held: { readonly id: EntityId; readonly levels: number } | undefined;
    state.entities.forEach((entity) => {
      const capturable = entity.findComponent(Capturable);
      const levelUp = this.levelUps.get(entity.definitionId);
      if (
        held === undefined &&
        levelUp !== undefined &&
        entity instanceof CapturePoint &&
        entity.laneId === lane &&
        capturable?.owner === team &&
        state.tick - capturable.ownedSinceTick >= levelUp.holdTicks
      ) {
        held = { id: entity.id, levels: levelUp.levels };
      }
    });
    return held;
  }
}
