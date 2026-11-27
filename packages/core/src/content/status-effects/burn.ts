import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Burning: damage over time, from a lit arrow (HC-Q89, DEC-345). TUNE: more-abilities.md section 7
 * (10 magical per second for 3 s, refresh, 1 stack). "Magical" waits for damage types, as bleed's
 * shield rule does.
 */
export const BURN = {
  id: 'burn',
  displayName: 'Burning',
  polarity: 'debuff',
  controlClass: 'none',
  durationSeconds: 3,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: [],
  periodic: { everySeconds: 1, effects: [{ kind: 'damage', amount: 10 }] },
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
