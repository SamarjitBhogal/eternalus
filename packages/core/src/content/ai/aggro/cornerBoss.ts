import { CORNER_CAMP_RING } from '../../structures/cornerCampRing';
import type { AggroRuleDefinition } from '../ai.types';

/**
 * The corner camp boss's aggro rules: the camp mob's, with a far wider radius, so the boss goes
 * for an enemy the moment it steps inside the camp's ring instead of only one at its feet. The
 * guard plan's leash still keeps it from chasing anyone outside the ring.
 */
export const CORNER_BOSS_AGGRO = {
  id: 'corner-boss',
  acquisitionRadius: CORNER_CAMP_RING.acquisitionRadius, // anywhere inside the ring
  priority: [
    'legend-attacking-ally-legend',
    'minion-attacking-ally-legend',
    'minion-attacking-ally-minion',
    'closest-minion',
    'closest-legend',
  ],
  leashRadius: CORNER_CAMP_RING.leashRadius, // the guard plan's is the one guards read
  leashGraceTicks: 0, // as the camp mob (DEC-144 E): never chases past its circle
  aggroCooldownTicks: 0, // as the camp mob (DEC-144): no rest
  ghostFirstWaveTicks: 0, // camps never ghost
  callForHelpRadius: 0, // unused: guard-post mobs answer a fellow anywhere in their circle
} as const satisfies AggroRuleDefinition;
