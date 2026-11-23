import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Burning: fire damage over time, from a lit arrow (HC-Q89, DEC-345). TUNE: the Cathedral gem's
 * burn numbers (DEC-292, PR #132 `gemBurn.ts`): 12 damage every 0.2 s for 1.2 s, refreshed by a
 * new hit, one stack. Ignoring shields waits for damage types, as `bleed` does.
 */
export const BURN = {
  id: 'burn',
  displayName: 'Burning',
  polarity: 'debuff',
  controlClass: 'none',
  durationSeconds: 1.2,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: [],
  periodic: { everySeconds: 0.2, effects: [{ kind: 'damage', amount: 12 }] },
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
