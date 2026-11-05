import type { GameState } from '../state/GameState';
import type { GuardSlot } from '../state/GuardStore.types';
import type { GuardRespawnRule } from './GuardRoster.types';

/** The `each` respawn (tower guards, 07 §6): a post comes back `respawnSeconds` after its guard. */
export class EachGuardRespawn implements GuardRespawnRule {
  /** Empties the post and lets it fill again `respawnTicks` from now. */
  public release(state: GameState, index: number, slot: GuardSlot): void {
    state.guards.vacate(index, state.tick + slot.respawnTicks);
  }
}
