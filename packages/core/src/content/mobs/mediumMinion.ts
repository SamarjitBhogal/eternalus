import type { MobDefinition } from './mobs.types';

/**
 * The medium lane minion (Footman in the balancing proposal), spawned in hordes by the BuffTowers
 * (architecture 18 §3). Placeholder stats (minion plan §1, "Placeholder numbers") from the medium-minion anchors of
 * `docs/reference/suggestions/balancing.md` ("Reference anchor values").
 */
export const MEDIUM_MINION = {
  id: 'medium-minion',
  kind: 'medium-mob',
  displayName: 'Medium Minion',
  baseHealth: 400, // TUNE: balancing.md medium minion
  footprintRadius: 0.5, // TUNE: balancing.md medium minion
  visionRadius: 10, // TUNE:
  xpValue: 45, // TUNE: balancing.md "XP sources" (medium minion kill)
  movementStrategy: 'lane-follow',
  movement: {
    maxSpeed: 3.2, // TUNE: m/s, balancing.md medium minion
    acceleration: 16, // TUNE: m/s², top speed after 0.2 s
    mass: 1.125, // TUNE: balancing.md's 90 on this repo's scale (Warrior mass 1 for its 80)
  },
} as const satisfies MobDefinition;
