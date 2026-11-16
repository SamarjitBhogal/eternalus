import type { UltimateChargeDefinition } from './progression.types';

/**
 * The ultimate meter's fill table (architecture 05 §6): balancing.md's table (DEC-272), with
 * camps and capture checkpoints added by the owner (DEC-273). Boss damage (1 point for each 1%)
 * joins with the bosses.
 */
export const ULTIMATE_CHARGE: UltimateChargeDefinition = {
  fullMeter: 100, // TUNE: DEC-272
  legendKill: 25, // TUNE: DEC-272
  assist: 12, // TUNE: DEC-272
  // TUNE: DEC-272 (a minion kill gives 1) and DEC-273 (a camp mob gives what a minion of its weight
  // gives).
  mobKill: { 'light-mob': 1, 'medium-mob': 1, 'heavy-mob': 1 },
  structureDamagePerPercent: 0.5, // TUNE: DEC-272 (1 point for each 2% of base health)
  checkpointReached: 5, // TUNE: DEC-273 (5% to each Legend present)
  deathLoss: 15, // TUNE: DEC-272
};
