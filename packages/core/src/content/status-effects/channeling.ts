import type { AuthoredStatusEffect } from './statusEffects.types';

/** TUNE: balancing.md starter abilities; Hamstring gaps approved 2026-11-17. */
export const CHANNELING = {
  id: 'channeling',
  displayName: 'Channeling',
  polarity: 'buff',
  controlClass: 'none',
  durationSeconds: 8,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['cannot-move', 'cannot-attack'],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
