import type { RosterSlot } from '@eternalus/core';

import { PLACEHOLDER_BOT_CLASSES } from './Match.constants';

/**
 * The bot Legends until match setup (session E) passes its rosters: every Legend of each team
 * but its Rover is a bot laner, classes in catalogue order (reference 14 §5). The player is
 * their team's Rover (DISC-51); the enemy Rover joins with its controller (minion plan M8).
 */
export const placeholderRoster = (legendsPerTeam: number): readonly RosterSlot[] =>
  (['light', 'dark'] as const).flatMap((team) =>
    Array.from({ length: legendsPerTeam - 1 }, (_, index) => ({
      team,
      definitionId: PLACEHOLDER_BOT_CLASSES[index % PLACEHOLDER_BOT_CLASSES.length] ?? 'warrior',
      role: 'laner' as const,
      difficulty: 'normal',
    })),
  );
