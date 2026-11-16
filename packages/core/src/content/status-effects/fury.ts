import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Fury (the Vanguard's ultimate): for 8 s the holder attacks three times as fast (DEC-271) for 1.5×
 * damage, each basic hit knocks the struck body back 1 m (less for a heavier one, DEC-208), and
 * Space dashes 3 m (`fury-dash`, granted while it lasts, DEC-270). Recast refreshes the 8 s. It
 * ends at death: the fallen Legend is removed. TUNE: every number is balancing.md:185.
 */
export const FURY = {
  id: 'fury',
  displayName: 'Fury',
  polarity: 'buff',
  controlClass: 'none',
  durationSeconds: 8, // TUNE: balancing.md:185
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [
    { stat: 'attackSpeed', op: 'mul', value: 3 }, // TUNE: balancing.md:185 ("300%"), DEC-271
    { stat: 'damageDealt', op: 'mul', value: 1.5 }, // TUNE: balancing.md:185
  ],
  flags: [],
  periodic: null,
  onExpire: [],
  onHit: [{ kind: 'knockback', distance: 1, shape: { kind: 'hit' } }], // TUNE: balancing.md:185, metres
  grants: 'fury-dash',
} as const satisfies AuthoredStatusEffect;
