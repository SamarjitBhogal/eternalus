import type { AuthoredStatusEffect } from './statusEffects.types';

/** TUNE: balancing.md starter abilities; Hamstring gaps approved 2026-11-17. */
export const FURY = {
  id: 'fury',
  displayName: 'Fury',
  polarity: 'buff',
  controlClass: 'none',
  durationSeconds: 8,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [
    { stat: 'attackSpeed', op: 'mul', value: 3 },
    { stat: 'damageDealt', op: 'mul', value: 1.5 },
  ],
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
