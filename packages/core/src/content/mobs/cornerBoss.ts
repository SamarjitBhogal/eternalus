import { CORNER_CAMP_RING } from '../structures/cornerCampRing';
import type { MobDefinition } from './mobs.types';

/**
 * The corner camp boss (game doc "Outer (Corner) Camps"): one per corner camp, held at its camp
 * by `GuardController`. Interim (DEC-236, until the `Boss` family in sprint 3.6): a heavy mob
 * with the MiniBoss's stats and no moves or support yet. Leash and the 5-minute respawn are the
 * corner camp's guard plan (`content/structures/guardPlans.ts`). Its kill pays the killer's whole
 * team, capped (`XP_SOURCES.teamKills`, DEC-237).
 */
export const CORNER_BOSS = {
  id: 'corner-boss',
  kind: 'heavy-mob',
  displayName: 'Corner Camp Boss', // DEC-296 (2)
  // DEC-296 (1): balancing.md "Mini-boss and Greater Boss relative to Legends", MiniBoss row:
  // 10 × refHealth ≈ 8,200 (refHealth ≈ 819 at the expected level 4).
  baseHealth: 8200,
  footprintRadius: 1.5, // DEC-296 (1): about twice a heavy camp mob
  visionRadius: CORNER_CAMP_RING.acquisitionRadius, // as far as its aggro: the whole ring
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'corner-boss',
  // DEC-296 (1): balancing.md MiniBoss row: 0.25 × refHealth ≈ 205 per hit, 1.5 s interval.
  attack: { strategy: 'melee', damage: 205, reach: 2, interval: 1.5 },
  xpValue: 0, // the killer earns nothing alone: its 500 XP is team-wide (XP_SOURCES.teamKills)
  movementProfile: {
    maxSpeed: 2.5, // DEC-296 (1): m/s, a bit slower than a heavy camp mob
    acceleration: 8, // DEC-296 (1): m/s², slow to get going
    mass: 6, // DEC-296 (1), HC-S12 (d): the Sentinel's mass (content/legends/sentinel.ts)
  },
} as const satisfies MobDefinition;
