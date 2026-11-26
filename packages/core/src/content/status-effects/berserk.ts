import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Berserk (the Sentinel's ultimate): for 12 s the holder deals 1.5× damage, takes 0.7× damage, has
 * a 20% higher top speed, speeds up 20% faster (DEC-382 (R5 B)) and has a body 1.3× as wide, so its
 * reach and the area a click picks it by grow with it. Recast refreshes the 12 s. TUNE: every
 * number is balancing.md:189.
 */
export const BERSERK = {
  id: 'berserk',
  displayName: 'Berserk',
  polarity: 'buff',
  controlClass: 'none',
  durationSeconds: 12, // TUNE: balancing.md:189
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [
    { stat: 'damageDealt', op: 'mul', value: 1.5 }, // TUNE: balancing.md:189
    { stat: 'damageTaken', op: 'mul', value: 0.7 }, // TUNE: balancing.md:189 ("damage taken −30%")
    { stat: 'moveSpeed', op: 'mul', value: 1.2 }, // TUNE: balancing.md:189 ("speed +20%"); DEC-382 (R5 B)
    { stat: 'acceleration', op: 'mul', value: 1.2 }, // TUNE: DEC-382 (R5 B)
    { stat: 'size', op: 'mul', value: 1.3 }, // TUNE: balancing.md:189
  ],
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
