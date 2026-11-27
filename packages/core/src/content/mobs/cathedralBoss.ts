import type { MobDefinition } from './mobs.types';
import { CATHEDRAL_BOSS_ABILITIES } from './cathedralBossAbilities';

/** The Eternal's arena and guard post at the Cathedral's centre. */
export const CATHEDRAL_BOSS_ARENA = { leash: 25, postGap: 0, tolerance: 9 } as const;

/** The neutral Greater Boss, using the GreaterBoss row in balancing.md. */
export const CATHEDRAL_BOSS = {
  id: 'cathedral-boss',
  kind: 'heavy-mob',
  displayName: 'The Eternal',
  bossMoves: CATHEDRAL_BOSS_ABILITIES,
  baseHealth: 41_000,
  footprintRadius: 1.25, // TUNE: keep navigation on the shared guard footprint scale.
  // The 48 m sprite's solid shoulders, torso and planted limbs in its left-facing pose.
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
  visionRadius: CATHEDRAL_BOSS_ARENA.leash,
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'cathedral-boss',
  attack: { strategy: 'melee', damage: 465, reach: 5, interval: 2.5 }, // TUNE: oversized reach.
  xpValue: 0,
  movementProfile: { maxSpeed: 2.8, acceleration: 14, mass: 30 }, // TUNE: deliberate movement.
} as const satisfies MobDefinition;
