import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Warded by the Cathedral gem: for a while after the gem strikes a unit, touching it strikes that
 * unit no more (`CATHEDRAL_GEM.touchCooldownStatusId`). It does nothing else. A lane runs through
 * the Cathedral's centre, so marching minions walk across the gem: a touch strikes a unit at most
 * once every 5 s, so a minion that walks across the gem takes one strike; a unit that stays on
 * the gem is struck every 5 s and can still die. TUNE: DEC-292 leaves the numbers to the build.
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
