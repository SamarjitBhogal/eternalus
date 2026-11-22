import type { AuthoredZoneLevelUp } from './zones.types';

/**
 * The zone level-up of every capture point (architecture 07 §7; DEC-258: all three central zones
 * count). TUNE: balancing.md `Recommendation:` "after 90 s of continuous ownership, friendly minions
 * spawned on that lane get +1 minion level (max 3)", approved by DEC-258.
 */
export const ZONE_LEVEL_UP = {
  holdSeconds: 90, // TUNE: balancing.md
  levels: 1, // TUNE: balancing.md
} as const satisfies AuthoredZoneLevelUp;
