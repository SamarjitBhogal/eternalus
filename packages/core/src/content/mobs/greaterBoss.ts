import { GUARD_LEASH } from '../structures/guardLeash';
import { HEAVY_MOB_BASE, refHealth } from './bossReference';
import type { MobDefinition } from './mobs.types';

// balancing.md's GreaterBoss row: the reference Legend at its expected level 7 (≈ 1,031).
// TUNE: the level was set for a 20-minute match (DEC-13: 30 minutes; INBOX).
const REF_HEALTH = refHealth(7);

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
 * and whose plan (`content/structures/guardPlans.ts`) gives its (no) respawn. Its movement profile
 * and reach are the heavy minion's (`HEAVY_MOB_BASE`, DEC-371 E2). It has no movement strategy:
 * its controller steers it with `move` commands, so `PathingSystem` leaves it alone. It takes a
 * quarter of a minion's hit (`BOSS_MINION_DAMAGE_TAKEN`), and its kill lifts the killer's team 2.5
 * levels and the last hitter 5 (`XP_SOURCES.teamKills`, DEC-237, DEC-371 E8, DEC-416). Its
 * `attack` is never used: the controller gives it no attack target, only moves.
 */
export const GREATER_BOSS = {
  id: 'greater-boss',
  kind: 'heavy-mob',
  displayName: 'Greater Boss',
  baseHealth: Math.round(40 * REF_HEALTH), // DEC-371 E3: balancing.md 40 × refHealth, 41,259
  // TUNE: Aryan 2026-11-15 and 2026-11-22 (reference 04 "obscenely massive"), twice the Sentinel;
  // Sam to confirm (INBOX)
  footprintRadius: 2.5,
  bodyShape: {
    // The body shape clicks and hits count on (DEC-381), in local metres for the left-facing pose:
    // the solid shoulders, torso and planted limbs of the 48 m obsidian colossus art (#161), which
    // draws this boss once #160 merges (DEC-370). #161 traced the feet at y 9; the art ends at y 8
    // (drawn from 24 m above the boss to 8 m below), so the bottom edge is cut to the art's edge.
    outline: [
      { x: -20, y: -9 },
      { x: -12, y: -18 },
      { x: 11, y: -18 },
      { x: 20, y: -9 },
      { x: 20, y: 2 },
      { x: 11, y: 8 },
      { x: -15, y: 8 },
      { x: -20, y: 4 },
    ],
    // The head (DEC-381), in the same local metres and pose: the hooded head round the glowing
    // visor of the idle colossus art (#161, colossus-idle.webp, 768 × 512 px). #161's ColossusView
    // draws it 48 m wide (16 px a metre), centred on the boss, from 24 m above it to 8 m below. The
    // visor is at about (-6.8, -10.2); the head spans the hood above it to the chin below.
    head: [
      { x: -12, y: -12 },
      { x: -8, y: -16 },
      { x: -3, y: -15 },
      { x: -2, y: -10 },
      { x: -4, y: -6 },
      { x: -9, y: -6 },
    ],
  },
  // TUNE: no reference value; the centre zone, so it sees the whole zone from its post
  visionRadius: GUARD_LEASH.greaterBossZone,
  xpValue: 0, // the killer earns nothing alone: its reward is team-wide (XP_SOURCES.teamKills)
  controller: 'boss',
  aiProfile: 'greater-boss',
  // Unused (see above), kept from the heavy minion; INBOX asks whether to drop it. Its reach would
  // count from the body outline (`bodyShape.outline`, DEC-421); the moves count from the centre.
  attack: {
    strategy: 'melee',
    damage: GREATER_BOSS_HEAVY_HIT,
    reach: HEAVY_MOB_BASE.reach,
    interval: GREATER_BOSS_HEAVY_INTERVAL,
  },
  movementProfile: HEAVY_MOB_BASE.movementProfile, // TUNE: DEC-371 E2, as the heavy minion
} as const satisfies MobDefinition;
