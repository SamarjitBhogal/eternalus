import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';

/**
 * The checkpoint defenders at capture point `pointId` that count toward its limit (DEC-350):
 * the living ones, of any side, and the ones waiting for room under the unit cap.
 */
export const countDefenders = (state: GameState, pointId: EntityId): number => {
  let count = 0;
  state.guards.forEach((slot) => {
    const isCounted =
      slot.guardId === null ? slot.respawnAtTick !== null : state.entities.isAlive(slot.guardId);
    count += slot.homeId === pointId && slot.checkpoint !== undefined && isCounted ? 1 : 0;
  });
  return count;
};

/**
 * Cancels every checkpoint defender post at capture point `pointId` still waiting for room under
 * the unit cap for `team`, the point's old owner (DEC-350): they never appear.
 */
export const cancelWaitingDefenders = (state: GameState, pointId: EntityId, team: Team): void => {
  state.guards.forEach((slot, index) => {
    if (
      slot.homeId === pointId &&
      slot.checkpoint !== undefined &&
      slot.team === team &&
      slot.guardId === null &&
      slot.respawnAtTick !== null
    ) {
      state.guards.vacate(index, null);
    }
  });
};
