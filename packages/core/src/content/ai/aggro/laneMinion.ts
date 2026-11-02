import type { AggroRuleDefinition } from '../ai.types';

/**
 * The lane minion's aggro rules (architecture 11 §4.3): League's priority list and Dota's aggro
 * duration and cooldown, as `TUNE` starting points. League and Dota measure in their own units;
 * the radii here scale their 500 / 700 units by minion speed (League 325 units/s, ours 3.5 m/s).
 */
export const LANE_MINION_AGGRO = {
  id: 'lane-minion',
  acquisitionRadius: 5.4, // TUNE: League/Dota 500 units, scaled by minion speed
  priority: [
    'legend-attacking-ally-legend',
    'minion-attacking-ally-legend',
    'minion-attacking-ally-minion',
    'turret-attacking-ally-minion',
    'closest-minion',
    'closest-legend',
    'lane-objective',
  ],
  leashRadius: 7.5, // TUNE: 11 §4.3's 700 units, scaled like the radius
  aggroDurationTicks: 69, // TUNE: Dota 2.3 s
  aggroCooldownTicks: 90, // TUNE: Dota 3 s
  reformDistance: 2, // TUNE: no reference value; one slot of the ranks formation
} as const satisfies AggroRuleDefinition;
