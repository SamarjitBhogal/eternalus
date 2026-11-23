import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Concussed: slower movement and attacks. TUNE: more-abilities.md section 7 (−30% each, 3 s from
 * balancing.md Shockwave). The +25% aether cost waits for abilities (phase 4).
 */
export const CONCUSSION = {
  id: 'concussion',
  displayName: 'Concussed',
  polarity: 'debuff',
  controlClass: 'soft',
  durationSeconds: 3,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [
    { stat: 'moveSpeed', op: 'mul', value: 0.7 },
    { stat: 'attackSpeed', op: 'mul', value: 0.7 },
  ],
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
