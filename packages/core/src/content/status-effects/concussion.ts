import type { StatusEffectDefinition } from './statusEffects.types';

/**
 * Concussed: slower movement and attacks. TUNE: more-abilities.md section 7 (−30% each, 3 s from
 * balancing.md Shockwave). The +25% aether cost waits for abilities (phase 4).
 */
export const CONCUSSION = {
  id: 'concussion',
  displayName: 'Concussed',
  duration: 3,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [
    { stat: 'moveSpeed', perStack: -0.3 },
    { stat: 'attackSpeed', perStack: -0.3 },
  ],
  flags: [],
  periodic: null,
} as const satisfies StatusEffectDefinition;
