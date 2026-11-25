import { Transform } from '../components/Transform';
import type { GameState } from '../state/GameState';
import type { GuardSlot } from '../state/GuardStore.types';
import type { GuardRespawnRule } from './GuardRoster.types';

/**
 * The respawn of a capture point's checkpoint defenders (07 §7, DEC-261): a post whose defender
 * is lost stays empty for the rest of the match, as with `never`. When no post of its set
 * (`GuardSlot.defenceId`) still holds a defender or waits for one, the set is announced with
 * `checkpoint-cleared`, naming whoever killed that last defender, their team and where it fell.
 * A set whose last waiting posts are cancelled (DEC-350) after its last defender died is never
 * announced.
 */
export class CheckpointGuardRespawn implements GuardRespawnRule {
  /** Empties the post for good; if it was its set's last defender, announces the set cleared. */
  public release(state: GameState, index: number, slot: GuardSlot): void {
    state.guards.vacate(index, null);
    const { defenceId, checkpoint, guardId } = slot;
    if (defenceId === undefined || checkpoint === undefined || guardId === null) {
      return;
    }
    let held = 0;
    state.guards.forEach((post) => {
      const isHeld = post.guardId !== null || post.respawnAtTick !== null;
      held += post.defenceId === defenceId && isHeld ? 1 : 0;
    });
    if (held > 0) {
      return;
    }
    const killerId = state.killerOf(guardId)?.attackerId ?? null;
    // A killer whose team cannot be read (it left the store) is not named: both or neither.
    const team = killerId === null ? null : (state.entities.teamOf(killerId) ?? null);
    const position = state.entities.get(guardId)?.findComponent(Transform)?.position;
    state.events.emit('checkpoint-cleared', {
      pointId: slot.homeId,
      checkpoint,
      defenceId,
      defendersTeam: slot.team,
      team,
      killerId: team === null ? null : killerId,
      position: position === undefined ? null : { x: position.x, y: position.y },
    });
  }
}
