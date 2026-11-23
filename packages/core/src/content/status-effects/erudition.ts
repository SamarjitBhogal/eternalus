import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Erudition (the Magus passive of the same id): permanent, put on at spawn. The statuses the
 * Magus's abilities apply last 20% longer, its ability damage is 10% higher and its ultimate meter
 * earns 25% more points (only from what earns points: kills, assists and objective damage, DISC-44).
 * Cooldowns and basic attacks do not change. TUNE: DEC-330 (owner, 2026-11-23).
 */
export const ERUDITION = {
  id: 'erudition',
  displayName: 'Erudition',
  polarity: 'buff',
  controlClass: 'none',
  durationSeconds: null,
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [
    { stat: 'abilityDuration', op: 'mul', value: 1.2 }, // TUNE: DEC-330, +20%
    { stat: 'abilityPotency', op: 'mul', value: 1.1 }, // TUNE: DEC-330, +10%
    { stat: 'ultimateGain', op: 'mul', value: 1.25 }, // TUNE: DEC-330, +25%
  ],
  flags: [],
  periodic: null,
  onExpire: [],
} as const satisfies AuthoredStatusEffect;
