import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Enraged (minions): a permanent stack per structure lost on the lane, so the cap is the lane's
 * structure count (more-abilities.md section 7). TUNE: balancing.md (+15% damage, +10% attack and
 * move speed per stack).
 */
export const ENRAGED = {
  id: 'enraged',
  displayName: 'Enraged',
  durationSeconds: null,
  stacking: 'intensity',
  maxStacks: 'structures-per-lane',
  modifiers: [
    { stat: 'damageDealt', op: 'mul', value: 1.15 },
    { stat: 'attackSpeed', op: 'mul', value: 1.1 },
    { stat: 'moveSpeed', op: 'mul', value: 1.1 },
  ],
  flags: [],
  periodic: null,
} as const satisfies AuthoredStatusEffect;
