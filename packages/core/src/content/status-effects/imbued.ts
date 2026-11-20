import type { AuthoredStatusEffect } from './statusEffects.types';

/** TUNE: balancing.md starter abilities; Hamstring gaps approved 2026-11-17. */
export const IMBUED = {
  id: 'imbued',
  displayName: 'Imbued',
  polarity: 'buff',
  controlClass: 'none',
  durationSeconds: 8,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [
    { stat: 'weaponDamageDealt', op: 'mul', value: 1.25 },
    { stat: 'attackSpeed', op: 'mul', value: 1.2 },
  ],
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
