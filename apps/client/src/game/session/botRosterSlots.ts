import type { BotRole, BotRosterDefinition, RosterSlot } from '@eternalus/core';

import type { FilledRosters } from '../../bridge/events';

/**
 * The setup's bots as the simulation's roster (architecture 18 §8): every bot of both teams, in
 * roster order (each team's lane bots in lane-fill order, DEC-102), with its class as its Legend
 * definition. A Rover bot takes no lane; each bot's `BotRole` picks its difficulty from the
 * roster's `difficulties` (core `content/teams/botRoster.ts`, DEC-149, DEC-151). The player is not
 * a slot: `Match` spawns the player's Legend. `difficulties` is the injected catalogue's roster
 * difficulties, the one source (rule 11).
 */
export function botRosterSlots(
  rosters: FilledRosters,
  difficulties: BotRosterDefinition['difficulties'],
): readonly RosterSlot[] {
  return [...rosters.allies, ...rosters.enemies]
    .filter(({ isBot }) => isBot)
    .map(({ team, classId, isRover }) => {
      const role: BotRole = isRover ? 'rover' : 'laner';
      return { team, definitionId: classId, role, difficulty: difficulties[role] };
    });
}
