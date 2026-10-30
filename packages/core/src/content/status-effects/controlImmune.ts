import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Unshaken: refuses hard control (stun) for a moment after it, so chains cannot lock a unit forever.
 * TUNE: more-abilities.md section 7 (0.5 s after hard control). Avalanche's 6 s waits for abilities.
 */
export const CONTROL_IMMUNE = {
  id: 'control-immune',
  displayName: 'Unshaken',
  polarity: 'buff',
  controlClass: 'none',
  durationSeconds: 0.5,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['control-immune'],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
