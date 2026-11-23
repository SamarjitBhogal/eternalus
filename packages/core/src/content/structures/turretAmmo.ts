import { ContentCatalogue } from '../ContentCatalogue';
import { HEAVY_TARGET_KINDS, LANE_TOWER, WALL_TURRET } from '../ai/turret';
import type { AuthoredTurretAmmo } from './turrets.types';

/**
 * The turret ammo table (architecture 07 §5; balancing.md "Turrets — MVP", which names this file):
 * one entry per ammo, so changing an ammo is one entry: the wall turret's two bolts and the lane
 * tower's orb (DEC-342). Every ammo is physical; an attack carries no damage type yet. Each reach
 * is the range of the profile of the turrets that carry it (the wall turret's for the bolts, the
 * lane tower's for the orb), so its attack reaches every target it takes (`loadTurrets` checks it).
 */
export const TURRET_AMMO = new ContentCatalogue<AuthoredTurretAmmo>([
  {
    id: 'bolt-default',
    displayName: 'Bolt',
    attack: {
      strategy: 'ranged-projectile',
      damage: 150, // TUNE: balancing.md "Turrets — MVP" (150 physical)
      reach: WALL_TURRET.range,
      interval: 5, // TUNE: seconds; game doc via balancing.md (1 bolt / 5 s)
      projectile: { projectileId: 'turret-bolt', falloff: null },
    },
    preferredAgainst: 'any',
  },
  {
    id: 'bolt-heavy',
    displayName: 'Heavy Bolt',
    attack: {
      strategy: 'ranged-projectile',
      damage: 500, // TUNE: balancing.md "Turrets — MVP" (500 physical)
      reach: WALL_TURRET.range,
      interval: 10, // TUNE: seconds; game doc via balancing.md (1 bolt / 10 s)
      projectile: { projectileId: 'turret-heavy-bolt', falloff: null },
      // TUNE: balancing.md "Turrets — MVP" (concussion 1.5 s)
      onHit: [
        { kind: 'debuff', statusId: 'concussion', durationSeconds: 1.5, shape: { kind: 'hit' } },
      ],
    },
    preferredAgainst: HEAVY_TARGET_KINDS,
  },
  {
    id: 'tower-orb',
    displayName: 'Tower Orb',
    attack: {
      strategy: 'ranged-projectile',
      damage: 120, // TUNE: HC-Q97 (Owner Calls v70, pending), option A
      reach: LANE_TOWER.range, // a lane tower's reach is its range, as the wall turret's
      interval: 2, // TUNE: HC-Q97 (Owner Calls v70, pending), option A; seconds
      projectile: {
        projectileId: 'tower-orb',
        falloff: null,
        // TUNE: HC-Q98 (Owner Calls v70, pending), option A
        splash: { radius: 3, edgeMultiplier: 0.5 },
      },
    },
    // The tower's one ammo fits every target (`loadTurrets`). It does not order targets: the
    // lane-tower profile's `priority` does (HC-Q100).
    preferredAgainst: 'any',
  },
]);
