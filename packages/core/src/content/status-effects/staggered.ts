import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Staggered: the short animation lock after every knock-back; cannot cast, can still move and
 * attack. TUNE: 0.3 s, more-abilities.md section 7 (`staggered` 0.2-0.3 s; `knockback` row 0.3 s).
 */
export const STAGGERED = {
  id: 'staggered',
  displayName: 'Staggered',
  polarity: 'debuff',
  controlClass: 'soft',
  durationSeconds: 0.3,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['cannot-cast'],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
