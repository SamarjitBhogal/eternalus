import { LANE_TOWER_REACH_FROM_CENTRE } from '../ai/turret';
import type { ProjectileDefinition } from './projectiles.types';

/**
 * A lane tower's orb (architecture 07 §5, DEC-302, DEC-342): a slow arc shot that flies over walls
 * and bodies to its aim point and bursts there (the splash is the ammo's, `tower-orb`).
 *
 * TUNE: `acceleration` and `mass` are not tuning: `MovementProfile` requires them, the loader
 * overwrites the first and flight ignores the second.
 */
export const TOWER_ORB = {
  id: 'tower-orb',
  kind: 'projectile',
  displayName: 'Tower Orb',
  footprintRadius: 0.5, // TUNE: no reference value
  movementProfile: {
    maxSpeed: 20, // TUNE: HC-Q99 (Owner Calls v70, pending), option A; m/s
    acceleration: 20, // Required by `MovementProfile`; `loadProjectiles` overwrites it with the top speed (full speed in tick 1)
    mass: 0.05, // Required by `MovementProfile`; flight does not read it, any positive value
  },
  // TUNE: no reference value. The cap is the tower's reach from its centre (an orb starts there)
  // plus a lead margin: the aim point leads a moving target, so it can lie past the reach. About
  // 14 m covers the lead on a fast Legend over the longest flight (26 m at 20 m/s) and the launch
  // delay. The shot flies only as far as its aim point (`isArc`).
  range: LANE_TOWER_REACH_FROM_CENTRE + 14,
  slowFrom: LANE_TOWER_REACH_FROM_CENTRE + 14, // equal to range: an orb flies at full speed until it lands
  isArc: true, // HC-Q99 (Owner Calls v70, pending), option A: it flies over walls and units
  endDuration: 0.5, // TUNE: no reference value; seconds, the burst's look
} as const satisfies ProjectileDefinition;
