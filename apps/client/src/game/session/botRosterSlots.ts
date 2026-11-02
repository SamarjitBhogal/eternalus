import type { BotRosterDefinition, RosterSlot } from '@eternalus/core';

import type { FilledRosters } from '../../bridge/events';

/**
 * The setup's bots as the simulation's roster (architecture 18 §8): every bot of both teams, in
 * roster order (each team's lane bots in lane-fill order, DEC-102), with its class as its Legend
 * definition. A Rover bot takes no lane and plays the roster's `difficulties.rover`; a lane bot
 * plays its `difficulties.laner` (core `content/teams/botRoster.ts`, DEC-149). The player is not
 * a slot: `Match` spawns the player's Legend. `difficulties` is the injected catalogue's roster
 * difficulties, the one source (rule 11).
 */
export function botRosterSlots(
  rosters: FilledRosters,
  difficulties: BotRosterDefinition['difficulties'],
): readonly RosterSlot[] {
  return [...rosters.allies, ...rosters.enemies]
    .filter(({ isBot }) => isBot)
    .map(({ team, classId, isRover }) => ({
      team,
      definitionId: classId,
      role: isRover ? 'rover' : 'laner',
      difficulty: isRover ? difficulties.rover : difficulties.laner,
    }));
}
