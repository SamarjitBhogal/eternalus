import type { GameState } from '../state/GameState';
import type { GuardSlot } from '../state/GuardStore.types';
import type { GuardRespawnRule } from './GuardRoster.types';

/**
 * The `group` respawn (forest camps, 18 §7.1): an emptied post has no respawn time while another
 * post of its home still holds a guard. When the home's last guard is lost, every post of the home
 * comes back `respawn.ticks` later, together, and the home is announced with `camp-cleared`,
 * naming whoever killed that last guard and their team. The group is the posts of the home's own
 * plan: a capture point's checkpoint defenders (`GuardSlot.checkpoint`) on the same home are not
 * in it (18 §7.1).
 */
export class GroupGuardRespawn implements GuardRespawnRule {
  /** Empties the post; if it was its home's last guard, starts the group's timer and announces it. */
  public release(state: GameState, index: number, slot: GuardSlot): void {
    state.guards.vacate(index, null);
    let held = 0;
    state.guards.forEach((post) => {
      held += GroupGuardRespawn.isGroupPost(post, slot) && post.guardId !== null ? 1 : 0;
    });
    if (held > 0) {
      return;
    }
    const respawnAtTick = state.tick + slot.respawnTicks;
    state.guards.forEach((post, at) => {
      if (GroupGuardRespawn.isGroupPost(post, slot)) {
        state.guards.vacate(at, respawnAtTick);
      }
    });
    const killerId =
      (slot.guardId === null ? undefined : state.killerOf(slot.guardId))?.attackerId ?? null;
    // A killer whose team cannot be read (it left the store) is not named: both or neither.
    const team = killerId === null ? null : (state.entities.teamOf(killerId) ?? null);
    state.events.emit('camp-cleared', {
      entityId: slot.homeId,
      team,
      killerId: team === null ? null : killerId,
    });
  }

  /** Whether `post` is in `slot`'s group: a post of the same home's own plan. */
  private static isGroupPost(post: GuardSlot, slot: GuardSlot): boolean {
    return post.homeId === slot.homeId && post.checkpoint === slot.checkpoint;
  }
}
