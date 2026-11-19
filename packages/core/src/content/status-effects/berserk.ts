import type { AuthoredStatusEffect } from './statusEffects.types';

/** TUNE: balancing.md starter abilities; Hamstring gaps approved 2026-11-17. */
export const BERSERK = {
  id: 'berserk',
  displayName: 'Berserk',
  polarity: 'buff',
  controlClass: 'none',
  durationSeconds: 12,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [
    { stat: 'size', op: 'mul', value: 1.3 },
    { stat: 'damageDealt', op: 'mul', value: 1.5 },
    { stat: 'moveSpeed', op: 'mul', value: 1.2 },
    { stat: 'damageTaken', op: 'mul', value: 0.7 },
  ],
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
