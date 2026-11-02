import type { RosterSlot } from '@eternalus/core';

import type { FilledRosters } from '../../bridge/events';
import { BOT_DIFFICULTY } from './botRosterSlots.constants';

/**
 * The setup's bots as the simulation's roster (architecture 18 §8): every bot of both teams, in
 * roster order (each team's lane bots in lane-fill order, DEC-102), with its class as its Legend
 * definition. A Rover bot takes no lane and plays `BOT_DIFFICULTY.rover`; a lane bot plays
 * `BOT_DIFFICULTY.laner`. The player is not a slot: `Match` spawns the player's Legend.
 */
export function botRosterSlots(rosters: FilledRosters): readonly RosterSlot[] {
  return [...rosters.allies, ...rosters.enemies]
    .filter(({ isBot }) => isBot)
    .map(({ team, classId, isRover }) => ({
      team,
      definitionId: classId,
      role: isRover ? 'rover' : 'laner',
      difficulty: isRover ? BOT_DIFFICULTY.rover : BOT_DIFFICULTY.laner,
    }));
}
