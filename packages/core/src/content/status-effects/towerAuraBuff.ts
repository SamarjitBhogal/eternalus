import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Tower Buff: a living BuffTower's aura on the units of its own team within its radius (DEC-315
 * (4), balancing.md "allies +10% damage"), refreshed while they stay inside and ended when they
 * leave.
 */
export const TOWER_AURA_BUFF = {
  id: 'tower-aura-buff',
  displayName: 'Tower Buff',
  polarity: 'buff',
  controlClass: 'none',
  // TUNE: DEC-315 (4); no reference value, a little over the aura's refresh interval (as `rallied`).
  durationSeconds: 1,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [{ stat: 'damageDealt', op: 'mul', value: 1.1 }], // TUNE: DEC-315 (4)
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
