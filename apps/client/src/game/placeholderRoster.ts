import type { PlayableTeam, RosterSlot } from '@eternalus/core';

import { PLACEHOLDER_BOT_CLASSES } from './Match.constants';

/**
 * The bot Legends until match setup (session E) passes its rosters: every Legend of each team
 * but its Rover is a bot laner, classes in catalogue order (reference 14 §5). The player is
 * their team's Rover (DISC-51); the other team's Rover is the hard bot (11 §4.7).
 *
 * @param playerTeam - The player's team, whose Rover is the player, not a bot.
 */
export const placeholderRoster = (
  legendsPerTeam: number,
  playerTeam: PlayableTeam,
): readonly RosterSlot[] =>
  (['light', 'dark'] as const).flatMap((team) => [
    ...Array.from({ length: legendsPerTeam - 1 }, (_, index) => ({
      team,
      definitionId: PLACEHOLDER_BOT_CLASSES[index % PLACEHOLDER_BOT_CLASSES.length] ?? 'warrior',
      role: 'laner' as const,
      difficulty: 'normal',
    })),
    ...(team === playerTeam
      ? []
      : [{ team, definitionId: 'warrior', role: 'rover' as const, difficulty: 'rover' }]),
  ]);
