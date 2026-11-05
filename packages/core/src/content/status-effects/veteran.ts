import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Veteran (minions): one permanent stack per minion level earned by kills (game doc "Minion XP",
 * MVP-if-time). TUNE: balancing.md (+10% damage per level, max level 3).
 */
export const VETERAN = {
  id: 'veteran',
  displayName: 'Veteran',
  durationSeconds: null,
  stacking: 'intensity',
  maxStacks: 3, // TUNE: balancing.md "max 3"
  modifiers: [{ stat: 'damageDealt', op: 'mul', value: 1.1 }], // TUNE: balancing.md +10%
  flags: [],
  periodic: null,
} as const satisfies AuthoredStatusEffect;
