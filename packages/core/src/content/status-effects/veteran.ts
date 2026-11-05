import { MINION_VETERANCY } from '../mobs/minionVeterancy';
import type { AuthoredStatusEffect } from './statusEffects.types';

/**
 * Veteran (minions): one permanent stack per minion level (game doc "Minion XP", MVP-if-time).
 * TUNE: balancing.md (+10% damage per level, max level 3). DEC-164: the bonus adds, it does not
 * compound, so level 3 deals ×1.3.
 */
export const VETERAN = {
  id: 'veteran',
  displayName: 'Veteran',
  durationSeconds: null,
  stacking: 'intensity',
  maxStacks: MINION_VETERANCY.maxLevel, // one stack per minion level, so the levels' cap
  modifiers: [{ stat: 'damageDealt', op: 'add', value: 0.1 }], // TUNE: balancing.md +10%; DEC-164 additive
  flags: [],
  periodic: null,
} as const satisfies AuthoredStatusEffect;
