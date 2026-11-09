import type { MobDefinition } from './mobs.types';

/**
 * The corner camp boss (game doc "Outer (Corner) Camps"): one per corner camp, held at its camp
 * by `GuardController`. Interim (PM-approved for Phase 3): a heavy mob with the MiniBoss's stats
 * and no moves, support or team-wide reward yet. Leash and the 5-minute respawn are the corner
 * camp's guard plan (`content/structures/guardPlans.ts`).
 */
export const CORNER_BOSS = {
  id: 'corner-boss',
  kind: 'heavy-mob',
  displayName: 'Corner Camp Boss',
  // TUNE: balancing.md "Mini-boss and Greater Boss relative to Legends", MiniBoss row:
  // 10 × refHealth ≈ 8,200 (refHealth ≈ 819 at the expected level 4).
  baseHealth: 8200,
  footprintRadius: 1.5, // TUNE: about twice a heavy camp mob
  visionRadius: 26, // TUNE: as far as its aggro radius, so it sees the whole camp ring
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'corner-boss',
  // TUNE: balancing.md MiniBoss row: 0.25 × refHealth ≈ 205 per hit, 1.5 s interval.
  attack: { strategy: 'melee', damage: 205, reach: 2, interval: 1.5 },
  // TUNE: balancing.md MiniBoss row's 500 XP. The row pays it team-wide; until the boss reward
  // lands it goes through the ordinary kill path.
  xpValue: 500,
  movementProfile: {
    maxSpeed: 2.5, // TUNE: m/s, a bit slower than a heavy camp mob
    acceleration: 8, // TUNE: m/s², slow to get going
    mass: 12, // TUNE: hard to push
  },
} as const satisfies MobDefinition;
