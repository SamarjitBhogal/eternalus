import type { AuthoredStatusEffect } from './statusEffects.types';

/** TUNE: Imbue's Damage variety, balancing.md: eight seconds, +25% damage, +20% attack speed. */
export const IMBUE = {
  id: 'imbue',
  displayName: 'Imbued',
  durationSeconds: 8,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [
    { stat: 'damageDealt', op: 'mul', value: 1.25 },
    { stat: 'attackSpeed', op: 'mul', value: 1.2 },
  ],
  flags: [],
  periodic: null,
} as const satisfies AuthoredStatusEffect;
