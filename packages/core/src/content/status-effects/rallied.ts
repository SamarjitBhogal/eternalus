import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Rallied (minions): a veteran minion's aura on the friendly minions around it (game doc "Minion
 * XP": it "buffs nearby friendly minions"), refreshed while they stay near. TUNE: balancing.md
 * (+5% damage).
 */
export const RALLIED = {
  id: 'rallied',
  displayName: 'Rallied',
  // TUNE: no reference value, a little over the aura's refresh interval; DEC-165: a tuning default.
  durationSeconds: 1,
  stacking: 'refresh',
  maxStacks: 1,
  // TUNE: balancing.md +5%. DEC-219 (c): it multiplies the additive veteran bonus, as built:
  // stat = (1 + Σ add) × Π mul, so a rallied level-3 veteran deals ×1.3 × 1.05 = ×1.365.
  modifiers: [{ stat: 'damageDealt', op: 'mul', value: 1.05 }],
  flags: [],
  periodic: null,
} as const satisfies AuthoredStatusEffect;
