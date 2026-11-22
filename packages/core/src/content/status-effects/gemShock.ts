import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Shocked by the Cathedral gem: a toned-down stun on whoever hits or touches it (DEC-292). TUNE:
 * DEC-292 leaves the numbers to the build; 1 s is half the 2 s default `stun` (DEC-42). Hard
 * control, so `control-immune` blocks it and follows it, as after `stun` (DEC-99).
 */
export const GEM_SHOCK = {
  id: 'gem-shock',
  displayName: 'Shocked',
  polarity: 'debuff',
  controlClass: 'hard',
  durationSeconds: 1, // TUNE: DEC-292, half the default stun
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['cannot-move', 'cannot-attack', 'cannot-cast'],
  periodic: null,
  onExpire: [{ kind: 'apply-status', statusId: 'control-immune' }],
} as const satisfies AuthoredStatusEffect;
