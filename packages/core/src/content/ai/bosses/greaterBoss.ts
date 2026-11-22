import {
  GREATER_BOSS,
  GREATER_BOSS_HEAVY_HIT,
  GREATER_BOSS_HEAVY_INTERVAL,
  GREATER_BOSS_LIGHT_HIT,
} from '../../mobs/greaterBoss';
import { GUARD_LEASH } from '../../structures/guardLeash';
import type { BossMoveDefinition, BossProfileDefinition } from '../ai.types';

/** The Greater Boss's sweep (balancing.md "cone knockback", the MiniBoss row's sweep). */
const GREATER_BOSS_SWEEP = {
  id: 'greater-boss-sweep',
  effect: 'cone',
  // TUNE: balancing.md gives the sweep "cone knockback" (the MiniBoss row) and no size (INBOX)
  radius: 6,
  halfAngleDegrees: 60, // TUNE: no reference value (INBOX)
  range: 6, // TUNE: starts the sweep once the target is inside its reach
  damage: GREATER_BOSS_LIGHT_HIT, // balancing.md: light move 0.15 × refHealth
  knockback: 3, // TUNE: the Sentinel's Slam knockback (balancing.md), the only one in the docs
  // TUNE: balancing.md gives only the heavy moves' interval, used here too (INBOX)
  cooldownSeconds: GREATER_BOSS_HEAVY_INTERVAL,
  telegraphSeconds: 1, // TUNE: no reference value (INBOX)
  recoverSeconds: 1, // TUNE: no reference value (INBOX)
} as const satisfies BossMoveDefinition;

/**
 * The Greater Boss's second sweep (balancing.md "two sweeps").
 */
const GREATER_BOSS_WIDE_SWEEP = {
  // balancing.md: "two sweeps"; nothing tells them apart, so the second is the first, wider (INBOX)
  ...GREATER_BOSS_SWEEP,
  id: 'greater-boss-wide-sweep',
  halfAngleDegrees: 90, // TUNE: a half circle in front of the boss (INBOX)
} as const satisfies BossMoveDefinition;

/**
 * The Greater Boss's beam (balancing.md's GreaterBoss row).
 */
const GREATER_BOSS_BEAM = {
  id: 'greater-boss-beam',
  effect: 'line',
  // TUNE: the Magus's Death Ray beam (balancing.md, 30 m × 1.5 m), the only beam in the docs
  length: 30,
  width: 1.5,
  range: 30, // TUNE: starts the beam once the target is within its length
  // TUNE: balancing.md does not say whether the beam is heavy or light; heavy, 0.45 ×
  // refHealth (INBOX)
  damage: GREATER_BOSS_HEAVY_HIT,
  cooldownSeconds: GREATER_BOSS_HEAVY_INTERVAL, // balancing.md: heavy moves every 2.5 s
  telegraphSeconds: 1, // TUNE: no reference value (INBOX)
  recoverSeconds: 1, // TUNE: no reference value (INBOX)
} as const satisfies BossMoveDefinition;

/**
 * The Greater Boss's `BossController` profile (architecture 11 §4.6, balancing.md's GreaterBoss
 * row). Its six moves (balancing.md: two sweeps, slam, beam, charge, roar), used in this order, one
 * after another (`BossController`'s rotation). balancing.md gives none of them a radius, telegraph
 * or recovery, so those are TUNE (INBOX).
 */
export const GREATER_BOSS_PROFILE = {
  id: 'greater-boss',
  controller: 'boss',
  // TUNE: reference 04 "erupts ... and roars"; balancing.md gives the GreaterBoss's roar no
  // effect or length, so the entrance is an event and a pause, no gameplay effect (INBOX)
  entranceSeconds: 2,
  roamSeconds: 3, // TUNE: doc 11 §4.6 "a new point every cadence", no cadence given (INBOX)
  roamArrivalRadius: 1, // TUNE:
  zoneMargin: 3, // TUNE: keeps its centre (footprint 2.5 m) inside the 25 m zone at speed
  moves: [
    {
      id: 'greater-boss-slam',
      effect: 'area',
      // TUNE: the Sentinel's Slam radius (balancing.md, 4 m), the only slam radius in the docs
      radius: 4,
      range: 4, // TUNE: starts the slam once the target is inside its area
      // TUNE: balancing.md's heavy move 0.45 × refHealth; which moves are heavy is open (INBOX)
      damage: GREATER_BOSS_HEAVY_HIT,
      cooldownSeconds: GREATER_BOSS_HEAVY_INTERVAL, // balancing.md: heavy moves every 2.5 s
      telegraphSeconds: 1, // TUNE: no reference value (INBOX)
      recoverSeconds: 1, // TUNE: no reference value (INBOX)
    },
    GREATER_BOSS_SWEEP,
    GREATER_BOSS_WIDE_SWEEP,
    GREATER_BOSS_BEAM,
    {
      id: 'greater-boss-charge',
      effect: 'charge',
      length: 10, // TUNE: no reference value (INBOX)
      range: 10, // TUNE: starts the charge once the target is within its length
      width: 2 * GREATER_BOSS.footprintRadius, // TUNE: the boss's own body width (INBOX)
      damage: GREATER_BOSS_HEAVY_HIT, // balancing.md: heavy move 0.45 × refHealth
      cooldownSeconds: GREATER_BOSS_HEAVY_INTERVAL, // balancing.md: heavy moves every 2.5 s
      telegraphSeconds: 1, // TUNE: no reference value (INBOX)
      recoverSeconds: 1, // TUNE: no reference value (INBOX)
    },
    {
      id: 'greater-boss-roar',
      effect: 'roar',
      // The whole zone: it roars at any target inside it (balancing.md "centre zone, 25 m").
      range: GUARD_LEASH.greaterBossZone,
      cooldownSeconds: GREATER_BOSS_HEAVY_INTERVAL, // TUNE: no reference value (INBOX)
      telegraphSeconds: 1, // TUNE: no reference value (INBOX)
      recoverSeconds: 1, // TUNE: no reference value (INBOX)
    },
  ],
} as const satisfies BossProfileDefinition;
