import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Tower Debuff: a living BuffTower's aura on the units of the other playable team within its
 * radius (DEC-315 (4), balancing.md): they deal less and take more damage. Refreshed while they
 * stay inside and ended when they leave.
 */
export const TOWER_AURA_DEBUFF = {
  id: 'tower-aura-debuff',
  displayName: 'Tower Debuff',
  polarity: 'debuff',
  controlClass: 'none',
  // TUNE: DEC-315 (4); no reference value, a little over the aura's refresh interval (as `rallied`).
  durationSeconds: 1,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [
    { stat: 'damageDealt', op: 'mul', value: 0.9 }, // TUNE: DEC-315 (4)
    { stat: 'damageTaken', op: 'mul', value: 1.1 }, // TUNE: DEC-315 (4)
  ],
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
