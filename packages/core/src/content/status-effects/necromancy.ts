import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Necromancy (the Magus passive of the same id): permanent, put on at spawn. The lower the Magus's
 * health, the more damage it deals and the less it takes, with basic attacks and abilities alike:
 * nothing at full health, rising in a straight line to the full bonus at 15% health or less.
 * TUNE: DEC-330 (owner, 2026-11-23).
 */
export const NECROMANCY = {
  id: 'necromancy',
  displayName: 'Necromancy',
  polarity: 'buff',
  controlClass: 'none',
  durationSeconds: null,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [
    { stat: 'damageDealt', op: 'mul', value: 1.3, byLostHealth: { fullAt: 0.15 } }, // TUNE: DEC-330, up to +30%, full at 15% health
    { stat: 'damageTaken', op: 'mul', value: 0.85, byLostHealth: { fullAt: 0.15 } }, // TUNE: DEC-330, up to 15% less, full at 15% health
  ],
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
