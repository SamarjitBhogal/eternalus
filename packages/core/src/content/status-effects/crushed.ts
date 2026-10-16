import type { StatusEffectDefinition } from './statusEffects.types';

/**
 * Crushed: held by Grab, stunned and losing 3% of max health per second. TUNE: more-abilities.md
 * section 7 (max 3 s). Grab ends it early once it exists; the `slowed` on release waits for
 * `onExpire`.
 */
export const CRUSHED = {
  id: 'crushed',
  displayName: 'Crushed',
  duration: 3,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['cannot-move', 'cannot-attack', 'cannot-cast'],
  periodic: { every: 1, effect: 'max-health-damage', amount: 0.03 },
} as const satisfies StatusEffectDefinition;
