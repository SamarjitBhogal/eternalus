import type { MobDefinition } from './mobs.types';

/**
 * The heavy lane minion (Goliath in the balancing proposal), spawned in hordes by the Stronghold
 * down the worst lane (architecture 18 §3). Placeholder stats (minion plan §1, "Placeholder numbers") from the heavy-minion anchors
 * of `docs/reference/suggestions/balancing.md` ("Reference anchor values").
 */
export const HEAVY_MINION = {
  id: 'heavy-minion',
  kind: 'heavy-mob',
  displayName: 'Heavy Minion',
  baseHealth: 1200, // TUNE: balancing.md heavy minion
  footprintRadius: 0.8, // TUNE: balancing.md heavy minion
  visionRadius: 10, // TUNE:
  xpValue: 120, // TUNE: balancing.md "XP sources" (heavy minion kill)
  movementStrategy: 'lane-follow',
  controller: 'minion',
  aiProfile: 'lane-minion',
  attack: { strategy: 'melee', damage: 70, reach: 1.5, interval: 1.6 }, // TUNE: balancing.md heavy minion (70 / 1.6 s); reach unspecified
  movementProfile: {
    maxSpeed: 2.8, // TUNE: m/s, balancing.md heavy minion
    acceleration: 14, // TUNE: m/s², top speed after 0.2 s
    mass: 3.125, // TUNE: balancing.md's 250 on this repo's scale (Warrior mass 1 for its 80)
  },
} as const satisfies MobDefinition;
