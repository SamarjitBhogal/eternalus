import { GUARD_LEASH } from '../structures/guardLeash';
import type { MobDefinition } from './mobs.types';

// balancing.md "Mini-boss and Greater Boss relative to Legends":
// refHealth(L) = 650 × 1.08^(L − 1),
// the level-L Warrior of the anchor table, at the GreaterBoss row's expected level 7 (≈ 1,031).
// TUNE: the level was set for a 20-minute match (DEC-13: 30 minutes; INBOX).
const REF_HEALTH = 650 * 1.08 ** (7 - 1);

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
  baseHealth: Math.round(40 * REF_HEALTH), // TUNE: balancing.md 40 × refHealth ≈ 41,000
  // TUNE: Aryan 2026-11-15 and 2026-11-22 (reference 04 "obscenely massive"), twice the Sentinel;
  // Sam to confirm (INBOX)
  footprintRadius: 2.5,
  // The body shape clicks and hits count on (DEC-381), in local metres for the left-facing pose:
  // the solid shoulders, torso and planted limbs of the 48 m obsidian colossus art (#161), which
  // draws this boss once #160 merges (DEC-370).
  combatHitbox: [
    { x: -20, y: -9 },
    { x: -12, y: -18 },
    { x: 11, y: -18 },
    { x: 20, y: -9 },
    { x: 20, y: 2 },
    { x: 11, y: 9 },
    { x: -15, y: 9 },
    { x: -20, y: 4 },
  ],
  // The head (DEC-381), in the same local metres and pose: the hooded head round the glowing visor
  // of the idle colossus art (#161, colossus-idle.webp, 768 × 512 px). #161's ColossusView draws it
  // 48 m wide (16 px a metre), centred on the boss, from 24 m above it to 8 m below. The visor is
  // at about (-6.8, -10.2); the head spans the hood above it to the chin below.
  headHitbox: [
    { x: -12, y: -12 },
    { x: -8, y: -16 },
    { x: -3, y: -15 },
    { x: -2, y: -10 },
    { x: -4, y: -6 },
    { x: -9, y: -6 },
  ],
  // TUNE: no reference value; the centre zone, so it sees the whole zone from its post
  visionRadius: GUARD_LEASH.greaterBossZone,
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'greater-boss',
  // TUNE: balancing.md 0.45 × refHealth per heavy move, 2.5 s interval, as its one basic attack
  // until the moves land; reach unspecified (the heavy minion's)
  attack: { strategy: 'melee', damage: Math.round(0.45 * REF_HEALTH), reach: 1.5, interval: 2.5 },
  xpValue: 0, // DEC-237: its reward is 5 levels team-wide, not XP; built with its moves
  movementProfile: {
    maxSpeed: 2.8, // TUNE: no reference value; as the heavy minion
    acceleration: 14, // TUNE: as the heavy minion
    mass: 3.125, // TUNE: as the heavy minion
  },
} as const satisfies MobDefinition;
