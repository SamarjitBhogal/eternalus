import type { BotRole, BotRosterDefinition, RosterSlot } from '@eternalus/core';

import type { FilledRosters } from '../../bridge/events';

/**
 * The setup's rosters as the simulation's roster (architecture 18 §8): every Legend of both
 * teams, in roster order (each team's Rover, then its lane bots in lane-fill order, DEC-102), with
 * its class as its Legend definition. The player is the `human` slot, which core spawns with no
 * controller (DISC-51: the human player is their team's Rover); every other entry is a `bot` slot
 * whose `BotRole` picks its difficulty from the roster's `difficulties` (core
 * `content/teams/botRoster.ts`, DEC-149, DEC-151). A Rover takes no lane. `difficulties` is the
 * injected catalogue's roster difficulties, the one source (rule 11).
 */
export function rosterSlots(
  rosters: FilledRosters,
  difficulties: BotRosterDefinition['difficulties'],
): readonly RosterSlot[] {
  return [...rosters.allies, ...rosters.enemies].map(
    ({ team, classId, isPlayer, isRover }): RosterSlot => {
      const role: BotRole = isRover ? 'rover' : 'laner';
      return isPlayer
        ? { pilot: 'human', team, definitionId: classId, role }
        : { pilot: 'bot', team, definitionId: classId, role, difficulty: difficulties[role] };
    },
  );
}
