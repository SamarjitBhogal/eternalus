import type { GameState } from '../state/GameState';
import type { GuardRespawnRule } from './GuardRoster.types';

/**
 * The `never` respawn (the capture point mini-boss and its support mobs, reference 04 "one
 * mini-boss per match"; the Greater Boss, `TUNE`): a post whose guard is lost stays empty for the
 * rest of the match.
 */
export class NeverGuardRespawn implements GuardRespawnRule {
  /** Empties the post for good: with no respawn tick, it is never filled again. */
  public release(state: GameState, index: number): void {
    state.guards.vacate(index, null);
  }
}
