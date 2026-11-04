import type { BotDifficultyDefinition } from '../ai.types';

/**
 * The Rover's difficulty, the hard bot (architecture 11 §4.7: "highest weights"). No reference
 * doc gives these numbers yet; all are starting points for playtests (`INBOX.md`).
 */
export const ROVER_BOT = {
  id: 'rover',
  retreatHealthFraction: 0.2, // TUNE: no reference value; holds on longer than `normal`
  rejoinHealthFraction: 0.8, // TUNE: no reference value
  engageRadius: 16, // TUNE: no reference value
  arrivalDistance: 2, // TUNE: no reference value; one formation slot
  utilityWeights: { closeness: 1, weakness: 2 }, // TUNE: no reference value; finishes the weak
  abilityUseChance: 0.6, // TUNE: no reference value
  castIntervalTicks: 60, // TUNE: no reference value; 2 s at 30 ticks a second
} as const satisfies BotDifficultyDefinition;
