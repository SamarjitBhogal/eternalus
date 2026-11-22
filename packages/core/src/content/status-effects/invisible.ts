import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Veiled (the Vanguard's Veil, more-abilities.md §7, DEC-266): `untargetable` and `hidden`
 * (`StatusFlag` says what each does). A hit ends it, dealt or taken (`endsOnHit`, DEC-327, which
 * replaces DEC-267's "bleed ticks too"): damage, or a debuff from another entity. A bleed that
 * was on before Veil keeps ticking and does not end it; casting Fury does not. Recast refreshes
 * the 5 s. TUNE: balancing.md:182 (5 s).
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
  endsOnHit: true, // DEC-327
} as const satisfies AuthoredStatusEffect;
