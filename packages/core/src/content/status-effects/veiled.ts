import type { AuthoredStatusEffect } from './statusEffects.types';

/** TUNE: balancing.md starter abilities; Hamstring gaps approved 2026-11-17. */
export const VEILED = {
  id: 'veiled',
  displayName: 'Veiled',
  polarity: 'buff',
  controlClass: 'none',
  durationSeconds: 5,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['invisible', 'break-on-attack', 'break-on-damage'],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
