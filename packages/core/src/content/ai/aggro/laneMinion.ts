import type { AggroRuleDefinition } from '../ai.types';

/**
 * The lane minion's aggro rules (architecture 11 §4.3): League's priority list, Dota's cooldown
 * and the owner's leash grace (DEC-144), as `TUNE` starting points. League and Dota measure in
 * their own units; the radii here scale their 500 / 700 units by minion speed (League 325
 * units/s, ours 3.5 m/s).
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
  leashGraceTicks: 90, // TUNE: owner DEC-144, "breaks after N time (e.g., 3 seconds)"
  aggroCooldownTicks: 90, // TUNE: Dota 3 s
  callForHelpRadius: 7.5, // TUNE: owner DEC-144; the leash, so a helper takes only what it may fight
} as const satisfies AggroRuleDefinition;
