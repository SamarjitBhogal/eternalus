import type { GameState } from '../state/GameState';
import type { GuardSlot } from '../state/GuardStore.types';
import type { GuardRespawnRule } from './GuardRoster.types';

/**
 * The `group` respawn (forest camps, 18 §7.1): an emptied post has no respawn time while another
 * post of its home still holds a guard. When the home's last guard is lost, every post of the home
 * comes back `respawnSeconds` later, together, and the home is announced with `camp-cleared`,
 * naming whoever killed that last guard and their team.
 */
export class GroupGuardRespawn implements GuardRespawnRule {
  /** Empties the post; if it was its home's last guard, starts the group's timer and announces it. */
  public release(state: GameState, index: number, slot: GuardSlot): void {
    state.guards.vacate(index, null);
    let held = 0;
    state.guards.forEach(({ homeId, guardId }) => {
      held += homeId === slot.homeId && guardId !== null ? 1 : 0;
    });
    if (held > 0) {
      return;
    }
    const respawnAtTick = state.tick + slot.respawnTicks;
    state.guards.forEach(({ homeId }, at) => {
      if (homeId === slot.homeId) {
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
}
