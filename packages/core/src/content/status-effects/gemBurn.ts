import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Burned by the Cathedral gem: the tick damage that comes with `gem-shock` (DEC-292). It hits
 * "for the duration of the stun + 1 tick", read as one burn pulse (0.2 s, 6 game ticks), not one
 * game tick: it lasts one period longer than `gem-shock` (36 game ticks), so it hits 6 times (72).
 * The owner keeps this reading (DEC-346: "Keep both readings (as built)"). TUNE: DEC-292 leaves
 * the damage to the build (it should be "a reasonable amount of damage to deter attacking it on
 * purpose, but not a game-breaking amount"): 12 every 0.2 s, 72 in all, about an eighth of a
 * Warrior's health; it can kill.
 */
export const GEM_BURN = {
  id: 'gem-burn',
  displayName: 'Burned',
  polarity: 'debuff',
  controlClass: 'none',
  durationSeconds: 1.2, // TUNE: DEC-292, the stun + one burn pulse
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: [],
  periodic: { everySeconds: 0.2, effects: [{ kind: 'damage', amount: 12 }] }, // TUNE: DEC-292
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
