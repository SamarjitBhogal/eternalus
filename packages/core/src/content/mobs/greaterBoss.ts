import { GUARD_LEASH } from '../structures/guardLeash';
import { HEAVY_MINION } from './heavyMinion';
import type { MobDefinition } from './mobs.types';

// balancing.md "Mini-boss and Greater Boss relative to Legends": refHealth(L) = 650 × 1.08^(L − 1),
// the level-L Warrior of the anchor table, at the GreaterBoss row's expected level 7 (≈ 1,031).
// TUNE: the level was set for a 20-minute match (DEC-13: 30 minutes; INBOX).
const REF_HEALTH = 650 * 1.08 ** (7 - 1);

/** TUNE: balancing.md's heavy move, 0.45 × refHealth (≈ 465); the slam's damage. */
export const GREATER_BOSS_HEAVY_HIT = Math.round(0.45 * REF_HEALTH);

/** TUNE: balancing.md's heavy moves come every 2.5 s ("2.5 s interval"). */
export const GREATER_BOSS_HEAVY_INTERVAL = 2.5;

/** TUNE: balancing.md's light move, 0.15 × refHealth (≈ 155); the sweep's damage. */
export const GREATER_BOSS_LIGHT_HIT = Math.round(0.15 * REF_HEALTH);

/**
 * The Greater Boss, "the Eternal" (reference 04, balancing.md's GreaterBoss row), summoned at the
 * Cathedral when the gem erupts (architecture 12 §3), driven by `BossController` (11 §4.6) with
 * its moves in `content/ai/bosses/greaterBoss.ts`. Interim (doc 04's `GreaterBoss` class comes
 * later): a neutral heavy mob on the Cathedral capture zone's guard post, whose circle is its zone
 * and whose plan (`content/structures/guardPlans.ts`) gives its (no) respawn. Movement is the heavy
 * minion's, spread from it, since no reference gives the boss's (INBOX). It takes a quarter of a
 * minion's hit (`BOSS_MINION_DAMAGE_TAKEN`), and its kill lifts the killer's team 5 levels
 * (`XP_SOURCES.teamKills`, DEC-237). Its `attack` is never used: the controller gives it no attack
 * target, only moves.
 */
export const GREATER_BOSS = {
  ...HEAVY_MINION,
  id: 'greater-boss',
  displayName: 'Greater Boss',
  baseHealth: Math.round(40 * REF_HEALTH), // TUNE: balancing.md 40 × refHealth ≈ 41,000
  // TUNE: Aryan 2026-11-15 and 2026-11-22 (reference 04 "obscenely massive"), twice the Sentinel;
  // Sam to confirm (INBOX)
  footprintRadius: 2.5,
  // TUNE: no reference value; the centre zone, so it sees the whole zone from its post
  visionRadius: GUARD_LEASH.greaterBossZone,
  xpValue: 0, // the killer earns nothing alone: its reward is team-wide (XP_SOURCES.teamKills)
  movementStrategy: 'leashed-chase',
  controller: 'boss',
  aiProfile: 'greater-boss',
  // Unused (see above), kept from the heavy minion's spread; INBOX asks whether to drop it.
  attack: {
    strategy: 'melee',
    damage: GREATER_BOSS_HEAVY_HIT,
    reach: 1.5,
    interval: GREATER_BOSS_HEAVY_INTERVAL,
  },
} as const satisfies MobDefinition;
