import { GUARD_LEASH } from '../structures/guardLeash';
import { HEAVY_MOB_BASE, refHealth } from './bossReference';
import type { MobDefinition } from './mobs.types';

// balancing.md's GreaterBoss row: the reference Legend at its expected level 7 (≈ 1,031).
// TUNE: the level was set for a 20-minute match (DEC-13: 30 minutes; INBOX).
const REF_HEALTH = refHealth(7);

/**
 * The Greater Boss, "the Eternal" (reference 04, balancing.md's GreaterBoss row), summoned at the
 * Cathedral when the gem erupts (12 §3). Interim (doc 04's `GreaterBoss` class and doc 11
 * §4.6's `BossController` come later): a neutral heavy mob on the Cathedral zone's guard post,
 * driven by `GuardController` with one basic attack and no moves; its post, zone leash and (no)
 * respawn are the zone's guard plan (`content/structures/guardPlans.ts`). It takes a quarter of a
 * minion's hit (`BOSS_MINION_DAMAGE_TAKEN`). No kill reward yet: DEC-237's flat 5 levels come with
 * the boss's moves.
 */
export const GREATER_BOSS = {
  id: 'greater-boss',
  kind: 'heavy-mob',
  displayName: 'Greater Boss',
  baseHealth: Math.round(40 * REF_HEALTH), // DEC-371 E3: balancing.md 40 × refHealth, 41,259
  // TUNE: Aryan 2026-11-15 and 2026-11-22 (reference 04 "obscenely massive"), twice the Sentinel;
  // Sam to confirm (INBOX)
  footprintRadius: 2.5,
  // TUNE: no reference value; the centre zone, so it sees the whole zone from its post
  visionRadius: GUARD_LEASH.greaterBossZone,
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'greater-boss',
  // TUNE: balancing.md 0.45 × refHealth per heavy move, 2.5 s interval, as its one basic attack
  // until the moves land; reach unspecified (the heavy minion's)
  attack: {
    strategy: 'melee',
    damage: Math.round(0.45 * REF_HEALTH),
    reach: HEAVY_MOB_BASE.reach,
    interval: 2.5,
  },
  xpValue: 0, // DEC-237: its reward is 5 levels team-wide, not XP; built with its moves
  movementProfile: HEAVY_MOB_BASE.movementProfile, // TUNE: DEC-371 E2, as the heavy minion
} as const satisfies MobDefinition;
