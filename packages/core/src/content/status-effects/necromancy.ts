import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Necromancy (the Magus passive of the same id): permanent, put on at spawn. The lower the Magus's
 * health, the more damage it deals and the less it takes, with basic attacks and abilities alike:
 * nothing at full health, rising in a straight line to the full bonus at 15% health or less.
 * TUNE: DEC-330 N1 (owner, 2026-11-23). The straight line, the reach to basic attacks and the
 * shield rule are readings (DEC-338 (1), (2)).
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
    { stat: 'damageDealt', op: 'mul', value: 1.3, byLostHealth: { fullAt: 0.15 } }, // TUNE: DEC-330 N1, up to +30%, full at 15% health (DEC-338)
    { stat: 'damageTaken', op: 'mul', value: 0.85, byLostHealth: { fullAt: 0.15 } }, // TUNE: DEC-330 N1, up to 15% less, full at 15% health (DEC-338)
  ],
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
