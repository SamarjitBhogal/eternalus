/**
 * The bot difficulty each roster role plays (core `content/ai/difficulties/`): lane bots the
 * normal bot, the enemy Rover the Rover bot (architecture 11 §4.7, 18 §8). Ids, never renamed.
 */
export const BOT_DIFFICULTY = { laner: 'normal', rover: 'rover' } as const;
