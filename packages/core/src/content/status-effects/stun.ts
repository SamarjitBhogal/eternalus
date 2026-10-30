import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Stunned: cannot move, attack or cast. TUNE: 2 s default (DEC-42); sources will set their own
 * duration once abilities land. Hard control, so `control-immune` follows it (more-abilities.md
 * section 7).
 */
export const STUN = {
  id: 'stun',
  displayName: 'Stunned',
  polarity: 'debuff',
  controlClass: 'hard',
  durationSeconds: 2,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['cannot-move', 'cannot-attack', 'cannot-cast'],
  periodic: null,
  onExpire: [{ kind: 'apply-status', statusId: 'control-immune' }],
} as const satisfies AuthoredStatusEffect;
