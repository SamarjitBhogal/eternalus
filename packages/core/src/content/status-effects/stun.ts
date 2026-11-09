import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Stunned: cannot move, attack or cast. TUNE: 2 s default (DEC-42); sources will set their own
 * duration once abilities land. The `control-immune` follow-up waits for `onExpire`.
 */
export const STUN = {
  id: 'stun',
  displayName: 'Stunned',
  durationSeconds: 2,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['cannot-move', 'cannot-attack', 'cannot-cast'],
  periodic: null,
} as const satisfies AuthoredStatusEffect;
