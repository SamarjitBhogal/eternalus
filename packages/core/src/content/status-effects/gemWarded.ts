import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Warded by the Cathedral gem: for a while after the gem strikes a unit, touching it strikes that
 * unit no more (`CATHEDRAL_GEM.touchCooldownStatusId`). It does nothing else. A lane runs through
 * the Cathedral's centre, so marching minions walk across the gem; without it, a unit still on
 * the gem when its burn ends is struck again and dies of contact alone, the
 * "game-breaking" amount DEC-292 rules out. TUNE: DEC-292 leaves the numbers to the build.
 */
export const GEM_WARDED = {
  id: 'gem-warded',
  displayName: 'Warded',
  polarity: 'debuff',
  controlClass: 'none',
  durationSeconds: 5, // TUNE: DEC-292, one strike per pass
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
