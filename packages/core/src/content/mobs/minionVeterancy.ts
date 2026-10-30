import type { MinionVeterancyDefinition } from './mobs.types';

/**
 * Minion XP (game doc, MVP-if-time). TUNE: balancing.md `Recommendation:` ("minion level +1 per 2
 * kills, max 3, each level +10% health and damage, plus an aura of +5% damage to friendly minions
 * within 4 m"); the damage parts are the `veteran` and `rallied` statuses.
 */
export const MINION_VETERANCY = {
  killsPerLevel: 2, // TUNE: game doc "after two kills"
  maxLevel: 3, // TUNE: balancing.md
  healthPerLevel: 0.1, // TUNE: balancing.md +10%
  statusId: 'veteran',
  aura: {
    statusId: 'rallied',
    radius: 4, // TUNE: balancing.md 4 m
    everySeconds: 0.5, // TUNE: no reference value
  },
} as const satisfies MinionVeterancyDefinition;
