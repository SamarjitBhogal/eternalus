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
 * the unit cap for `team`, the point's old owner (DEC-350): they never appear. A set this leaves
 * with no defender, living or waiting, is never announced cleared, so its damage tally is dropped.
 */
export const cancelWaitingDefenders = (state: GameState, pointId: EntityId, team: Team): void => {
  const touched = new Set<string>();
  state.guards.forEach((slot, index) => {
    if (
      slot.homeId === pointId &&
      slot.defenceId !== undefined &&
      slot.team === team &&
      slot.guardId === null &&
      slot.respawnAtTick !== null
    ) {
      state.guards.vacate(index, null);
      touched.add(slot.defenceId);
    }
  });
  state.guards.forEach(({ defenceId, guardId, respawnAtTick }) => {
    if (defenceId !== undefined && (guardId !== null || respawnAtTick !== null)) {
      touched.delete(defenceId);
    }
  });
  for (const defenceId of touched) {
    state.defenderDamage.take(defenceId);
  }
};
