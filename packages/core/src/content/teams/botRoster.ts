import type { BotRosterDefinition } from './botRoster.types';

/**
 * The shipped bot roster, validated by `loadDisplayContent` (every class must be playable).
 *
 * - Three Vanguards (`warrior`), three Sentinels and three Magi per team (DEC-61), one of each in
 *   each lane (DEC-102). The order makes the lane mix: the minion stack (PR #46,
 *   `assignLanes`) gives each laner, in roster order, the lane with the fewest Legends so far,
 *   lowest lane index first. On `numLanes` lanes that is laner `i` → lane `i % numLanes`, so
 *   grouping the classes gives each lane one of each class (pinned in `botRoster.test.ts`).
 * - The enemy team's tenth member is its Rover, which copies the player's class and Legend
 *   (DEC-61; the Legend copy is DEC-61's `Recommendation:`).
 */
export const BOT_ROSTER = {
  id: 'standard',
  laners: [
    'warrior',
    'warrior',
    'warrior',
    'sentinel',
    'sentinel',
    'sentinel',
    'magus',
    'magus',
    'magus',
  ],
  enemyRover: 'mirror-player',
} as const satisfies BotRosterDefinition;
