import type { StatusEffectDefinition } from './statusEffects.types';

/**
 * Bleeding: physical damage over time, stacking. TUNE: more-abilities.md section 7 (6 per second
 * per stack for 4 s, 3 stacks from balancing.md). Ignoring shields waits for damage types.
 */
export const BLEED = {
  id: 'bleed',
  displayName: 'Bleeding',
  duration: 4,
  stacking: 'intensity',
  maxStacks: 3,
  modifiers: [],
  flags: [],
  periodic: { every: 1, effect: 'damage', amount: 6 },
} as const satisfies StatusEffectDefinition;
