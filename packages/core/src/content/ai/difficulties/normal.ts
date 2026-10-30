import type { BotDifficultyDefinition } from '../ai.types';

/**
 * The default bot difficulty (architecture 11 §4.2). No reference doc gives these numbers yet;
 * all are starting points for playtests (`INBOX.md`).
 */
export const NORMAL_BOT = {
  id: 'normal',
  retreatHealthFraction: 0.3, // TUNE: no reference value
  rejoinHealthFraction: 0.8, // TUNE: no reference value
  engageRadius: 12, // TUNE: no reference value; about half a Legend's 25 m vision
  arrivalDistance: 2, // TUNE: no reference value; one formation slot
  utilityWeights: { closeness: 1, weakness: 1 }, // TUNE: no reference value
  abilityUseChance: 0.3, // TUNE: no reference value
  castIntervalTicks: 90, // TUNE: no reference value; 3 s at 30 ticks a second
} as const satisfies BotDifficultyDefinition;
