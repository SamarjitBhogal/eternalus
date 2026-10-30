import { Movement } from '../components/Movement';
import type { EntityId } from '../state/EntityStore.types';
import type { GameEventMap } from '../state/GameEvents.types';
import type { GameState } from '../state/GameState';
import type { Horde } from '../state/Horde.types';
import type { System, SystemContext } from './System.types';

/**
 * Keeps the hordes (architecture 18 §4): it notes members on `entity-removed` and `team-changed`
 * and drops them at the start of its next pass (03 §4), so a member removed late in a tick leaves
 * its record at the start of the next; the lowest remaining id in string order leads and an empty
 * horde dissolves with `horde-dissolved`. Each tick it advances every horde's formation anchor by `marchSpeedFactor`
 * of its slowest member's top speed, up to the lane's end, except while the leader has an attack
 * target, when the anchor holds. It never creates a horde: `SpawnSystem`
 * adds members and record together (18 §3.2).
 *
 * @remarks ponytail: the anchor does not hold at a standing objective yet; that arrives with
 * structure entities (minion plan M2c).
 */
export class HordeSystem implements System {
  public readonly name = 'hordes';
  private readonly leaving: EntityId[] = [];

  /**
   * @param state - The match whose events this system listens to.
   * @param marchSpeedFactor - The anchor's speed as a fraction of the slowest member's top speed.
   */
  public constructor(
    state: GameState,
    private readonly marchSpeedFactor: number,
  ) {
    const leave = ({ entityId }: { readonly entityId: EntityId }): void => {
      this.leaving.push(entityId);
    };
    state.events.on('entity-removed', leave);
    state.events.on('team-changed', leave);
  }

  /** Drops the members that left, then advances every horde's formation anchor along its lane. */
  public update({ state }: SystemContext): void {
    for (const entityId of this.leaving) {
      const horde = state.hordes.removeMember(entityId);
      if (horde?.memberIds.length === 0) {
        state.events.emit('horde-dissolved', HordeSystem.payloadOf(horde));
      }
    }
    this.leaving.length = 0;
    const routes = state.world?.routes;
    if (routes === undefined) {
      return;
    }
    state.hordes.forEach((horde) => {
      // The anchor holds while the leader fights (18 §4), so the ranks wait for it.
      if (state.entities.attackTargetOf(horde.leaderId) !== null) {
        return;
      }
      let slowest = Number.POSITIVE_INFINITY;
      for (const id of horde.memberIds) {
        slowest = Math.min(
          slowest,
          state.entities.get(id)?.findComponent(Movement)?.maxSpeed ?? slowest,
        );
      }
      if (slowest === Number.POSITIVE_INFINITY) {
        return;
      }
      const end = routes.length(horde.lane);
      state.hordes.setProgress(
        horde.id,
        Math.min(end, horde.progress + slowest * this.marchSpeedFactor),
      );
    });
  }

  private static payloadOf(horde: Horde): GameEventMap['horde-dissolved'] {
    return { hordeId: horde.id, lane: horde.lane, team: horde.team, memberIds: horde.memberIds };
  }
}
