import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Burned by the Cathedral gem: the tick damage that comes with `gem-shock` (DEC-292). It hits
 * "for the duration of the stun + 1 tick": it lasts one period longer than `gem-shock`, so it hits
 * 6 times (periods in whole ticks at 30 ticks/s). TUNE: DEC-292 leaves the damage to the build
 * ("enough to deter attacking it on purpose, not game-breaking"): 12 every 0.2 s, 72 in all, about
 * an eighth of a Warrior's health; it can kill.
 */
export const GEM_BURN = {
  id: 'gem-burn',
  displayName: 'Burned',
  polarity: 'debuff',
  controlClass: 'none',
  durationSeconds: 1.2, // TUNE: DEC-292, the stun + one period
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: [],
  periodic: { everySeconds: 0.2, effects: [{ kind: 'damage', amount: 12 }] }, // TUNE: DEC-292
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
