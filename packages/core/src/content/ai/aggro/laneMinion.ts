import type { HordeAggroRuleDefinition } from '../ai.types';

// TUNE: 11 §4.3's 700 units, scaled like the radius (7.5 m); owner 2026-11-05, +15% lane minions
// only (DEC-193).
const LEASH = 8.625;

/**
 * The lane minion's aggro rules (architecture 11 §4.3): League's priority list, Dota's cooldown
 * and the owner's leash grace (DEC-144), as `TUNE` starting points. League and Dota measure in
 * their own units; the radii here scale their 500 / 700 units by minion speed (League 325
 * units/s, ours 3.5 m/s).
 */
export const LANE_MINION_AGGRO = {
  id: 'lane-minion',
  controller: 'minion',
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
  leashRadius: LEASH,
  leashGraceSeconds: 3, // TUNE: owner DEC-144, "breaks after N time (e.g., 3 seconds)"
  aggroCooldownSeconds: 3, // TUNE: Dota 3 s
  ghostFirstWaveTicks: 0, // TUNE: 11 §4.3 ships it off; League ghosts the first wave for 18–28 s
  callForHelpRadius: LEASH, // owner DEC-144 D: the leash, so a helper takes only what it may fight
} as const satisfies HordeAggroRuleDefinition;
