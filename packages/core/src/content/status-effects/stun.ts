import type { StatusEffectDefinition } from './statusEffects.types';

/**
 * Stunned: cannot move, attack or cast. TUNE: more-abilities.md section 7 (0.5–1 s per source;
 * sources will set their own duration once abilities land). The `control-immune` follow-up waits
 * for `onExpire`.
 */
export const STUN = {
  id: 'stun',
  displayName: 'Stunned',
  duration: 1,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['cannot-move', 'cannot-attack', 'cannot-cast'],
  periodic: null,
} as const satisfies StatusEffectDefinition;
