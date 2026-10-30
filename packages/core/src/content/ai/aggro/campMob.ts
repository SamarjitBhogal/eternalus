import type { AggroRuleDefinition } from '../ai.types';

/**
 * The forest-camp mob's aggro rules (architecture 18 §7.1): the tower guard's, with a radius that
 * stays inside the camp's 6 m leash measured from the mob's post.
 */
export const CAMP_MOB_AGGRO = {
  id: 'camp-mob',
  // TUNE: balancing.md's 6 m camp leash less the 2 m post gap.
  acquisitionRadius: 4,
  priority: [
    'legend-attacking-ally-legend',
    'minion-attacking-ally-legend',
    'minion-attacking-ally-minion',
    'closest-minion',
    'closest-legend',
  ],
  leashRadius: 6, // TUNE: balancing.md camp leash (the guard plan's is the one camp mobs read)
  aggroDurationTicks: 69, // TUNE: as the lane minion (Dota 2.3 s)
  aggroCooldownTicks: 90, // TUNE: as the lane minion (Dota 3 s)
  ghostFirstWaveTicks: 0, // camps never ghost
  reformDistance: 1, // TUNE: no reference value; a mob settles close to its post
} as const satisfies AggroRuleDefinition;
