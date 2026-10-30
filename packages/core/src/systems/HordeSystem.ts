import { Movement } from '../components/Movement';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Horde } from '../state/Horde.types';
import type { HordeSteeringProfile } from '../content/ai/ai.types';
import type { System, SystemContext } from './System.types';

/**
 * Keeps the hordes (architecture 18 §4): it notes members on `entity-removed` and `team-changed`
 * and drops them at the start of its next pass (03 §4), so a member removed late in a tick leaves
 * its record at the start of the next; the lowest remaining id in string order leads and an empty
 * horde dissolves with `horde-dissolved`. Each tick it advances every horde's formation anchor by `marchSpeedFactor`
 * of its slowest member's top speed, up to the lane's end, except while the leader has an attack
 * target, when the anchor holds, and never past `objectiveHoldGap` in front of the edge of its
 * next standing objective (18 §6.2), so the horde gathers there; when that objective falls the
 * next one takes over and the anchor advances again. It never creates a horde: `SpawnSystem`
 * adds members and record together (18 §3.2).
 */
export class HordeSystem implements System {
  public readonly name = 'hordes';
  private readonly leaving: EntityId[] = [];

  /**
   * @param state - The match whose events this system listens to.
   * @param steering - The anchor's speed (a fraction of the slowest member's top speed) and how far
   *   in front of an objective it stops.
   */
  public constructor(
    state: GameState,
    private readonly steering: Pick<HordeSteeringProfile, 'marchSpeedFactor' | 'objectiveHoldGap'>,
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
    const routes = state.routes;
    if (routes === null) {
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
      const objective = state.laneStructures.objectiveFor(horde.lane, horde.team, state.entities);
      const hold =
        objective === null
          ? routes.length(horde.lane)
          : objective.progress - objective.radius - this.steering.objectiveHoldGap;
      const next = Math.min(
        routes.length(horde.lane),
        horde.progress + slowest * this.steering.marchSpeedFactor,
      );
      // Never walk back: a horde already past its hold point (spawned there) just stops.
      state.hordes.setProgress(horde.id, next > hold ? Math.max(horde.progress, hold) : next);
    });
  }

  private static payloadOf(horde: Horde): {
    readonly hordeId: string;
    readonly lane: string;
    readonly team: Horde['team'];
    readonly memberIds: readonly EntityId[];
  } {
    return { hordeId: horde.id, lane: horde.lane, team: horde.team, memberIds: horde.memberIds };
  }
}
