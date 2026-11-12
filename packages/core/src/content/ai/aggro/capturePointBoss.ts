import type { AggroRuleDefinition } from '../ai.types';

/**
 * The capture point mini-boss's aggro rules (architecture 18 §7.1): the tower guard's priority list,
 * with a radius that stays inside the zone plan's leash measured from the boss's post.
 */
export const CAPTURE_POINT_BOSS_AGGRO = {
  id: 'capture-point-boss',
  // TUNE: the zone plan's 35 m leash less its 25 m post gap.
  acquisitionRadius: 10,
  priority: [
    'legend-attacking-ally-legend',
    'minion-attacking-ally-legend',
    'minion-attacking-ally-minion',
    'closest-minion',
    'closest-legend',
  ],
  leashRadius: 35, // TUNE: the court's inscribed circle (the guard plan's is the one guards read)
  leashGraceTicks: 0, // as the tower guard (DEC-144 E): never chases past its circle
  aggroCooldownTicks: 0, // as the tower guard (DEC-144): no rest
  ghostFirstWaveTicks: 0, // bosses never ghost
  callForHelpRadius: 0, // unused: guard-post mobs answer a fellow anywhere in their circle
} as const satisfies AggroRuleDefinition;
