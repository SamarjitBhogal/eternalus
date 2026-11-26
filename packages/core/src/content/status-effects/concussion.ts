import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Concussed: slower movement and attacks, and casts cost more aether. TUNE: more-abilities.md
 * section 7 (−30% speed, −30% attack speed, abilities cost +25% aether; 3 s from balancing.md
 * Shockwave). `CastValidator.price` reads `aetherCost`.
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
    { stat: 'aetherCost', op: 'mul', value: 1.25 },
  ],
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
