import type { StatusEffectDefinition } from './statusEffects.types';

/**
 * Enraged (minions): a permanent stack per structure lost on the lane. TUNE: balancing.md (+15%
 * damage, +10% attack and move speed per stack). `maxStacks` should be `spawnTowersPerLane +
 * buffTowersPerLane`; 2 is that sum in the default config.
 */
export const ENRAGED = {
  id: 'enraged',
  displayName: 'Enraged',
  duration: null,
  stacking: 'intensity',
  maxStacks: 2,
  modifiers: [
    { stat: 'damageDealt', perStack: 0.15 },
    { stat: 'attackSpeed', perStack: 0.1 },
    { stat: 'moveSpeed', perStack: 0.1 },
  ],
  flags: [],
  periodic: null,
} as const satisfies StatusEffectDefinition;
