import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Rallied (minions): a veteran minion's aura on the friendly minions around it (game doc "Minion
 * XP": it "buffs nearby friendly minions"), refreshed while they stay near. TUNE: balancing.md
 * (+5% damage).
 */
export const RALLIED = {
  id: 'rallied',
  displayName: 'Rallied',
  durationSeconds: 1, // TUNE: no reference value; a little over the aura's refresh interval
  stacking: 'refresh',
  maxStacks: 1,
  modifiers: [{ stat: 'damageDealt', op: 'mul', value: 1.05 }], // TUNE: balancing.md +5%
  flags: [],
  periodic: null,
} as const satisfies AuthoredStatusEffect;
