import type { BotDifficultyDefinition } from '../ai.types';
import { NORMAL_BOT } from './normal';

/** Every bot difficulty by id (architecture 11 §4.2); a bot's AI profile names one. */
export const BOT_DIFFICULTIES: Readonly<Record<string, BotDifficultyDefinition>> = {
  [NORMAL_BOT.id]: NORMAL_BOT,
};
