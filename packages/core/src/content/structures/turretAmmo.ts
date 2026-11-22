import { ContentCatalogue } from '../ContentCatalogue';
import { HEAVY_TARGET_KINDS, WALL_TURRET } from './turret';
import type { AuthoredTurretAmmo } from './turrets.types';

/**
 * The turret ammo table (architecture 07 §5; balancing.md "Turrets — MVP", which names this file):
 * one entry per ammo, so changing an ammo is one entry. Both are physical; an attack carries no
 * damage type yet. Each reach is the wall turret's range, so its attack reaches every target it
 * takes.
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
]);
