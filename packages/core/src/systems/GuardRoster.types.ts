import type { GameState } from '../state/GameState';
import type { GuardSlot } from '../state/GuardStore.types';

/**
 * How a guard plan's posts come back after their guards are lost (architecture 18 §7, 07 §6),
 * chosen by the plan's `respawn` id (DEC-168). It owns any announcement that its home was cleared.
 */
export interface GuardRespawnRule {
  /**
   * Empties post `index`, whose guard (`slot.guardId`) was lost this tick, and sets when the post
   * may be filled again.
   */
  release(state: GameState, index: number, slot: GuardSlot): void;
}
