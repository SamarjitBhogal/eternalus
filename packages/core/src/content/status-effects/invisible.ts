import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Veiled (the Vanguard's Veil, more-abilities.md §7, DEC-266): `untargetable` and `hidden`
 * (`StatusFlag` says what each does). Dealing or taking any damage ends it (DEC-267); casting Fury
 * does not. Recast refreshes the 5 s. TUNE: balancing.md:182 (5 s).
 */
export const INVISIBLE = {
  id: 'invisible',
  displayName: 'Veiled',
  polarity: 'buff',
  controlClass: 'none',
  durationSeconds: 5, // TUNE: balancing.md:182
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [],
  flags: ['untargetable', 'hidden'],
  periodic: null,
  onExpire: [],
  endsOnDamage: true,
} as const satisfies AuthoredStatusEffect;
