import type { AggroRuleDefinition } from '../ai.types';

/**
 * The tower guard's aggro rules (architecture 18 §7, 11 §4.4): the lane minion's priority list
 * without the lane objective, and a radius that stays inside the guard's leash, measured from
 * its post. Its leash is the structure's guard plan, so `leashRadius` here is unused by guards.
 */
export const TOWER_GUARD_AGGRO = {
  id: 'tower-guard',
  // TUNE: the 8 m leash less the 2 m post gap, so a guard acquires only what it may chase.
  acquisitionRadius: 6,
  priority: [
    'legend-attacking-ally-legend',
    'minion-attacking-ally-legend',
    'minion-attacking-ally-minion',
    'closest-minion',
    'closest-legend',
  ],
  leashRadius: 8, // TUNE: balancing.md guard leash (the guard plan's is the one guards read)
  aggroDurationTicks: 69, // TUNE: as the lane minion (Dota 2.3 s)
  aggroCooldownTicks: 90, // TUNE: as the lane minion (Dota 3 s)
  ghostFirstWaveTicks: 0, // guards never ghost
  reformDistance: 1, // TUNE: no reference value; a guard settles close to its post
} as const satisfies AggroRuleDefinition;
