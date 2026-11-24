import type { AuthoredStatusEffect } from './statusEffects.types';

/** Holds movement and basic attacks until the boss finishes its cast recovery. */
export const BOSS_CAST_LOCK = {
  id: 'boss-cast-lock',
  displayName: 'Casting',
  polarity: 'form',
  controlClass: 'none',
  durationSeconds: null,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['cannot-move', 'cannot-attack'],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
