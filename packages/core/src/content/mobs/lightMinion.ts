import type { MobDefinition } from './mobs.types';

/**
 * The light lane minion (Skirmisher in the balancing proposal), spawned in hordes by the
 * Stronghold and the SpawnerTowers (architecture 18 §3). Values are the light-minion anchors of
 * `docs/reference/suggestions/balancing.md` ("Reference anchor values").
 */
export const LIGHT_MINION = {
  id: 'light-minion',
  kind: 'light-mob',
  displayName: 'Light Minion',
  baseHealth: 150, // TUNE: balancing.md light minion
  footprintRadius: 0.4, // TUNE: balancing.md light minion
  visionRadius: 10, // TUNE:
  movement: {
    maxSpeed: 3.5, // TUNE: m/s, balancing.md light minion
    acceleration: 17.5, // TUNE: m/s², top speed after 0.2 s
    mass: 0.5, // TUNE: balancing.md's 40 on this repo's scale (Warrior mass 1 for its 80)
  },
} as const satisfies MobDefinition;
