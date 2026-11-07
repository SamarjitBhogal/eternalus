import type { AiCadence } from './ai.types';

/** Controller cadences and the per-tick decision budget (architecture 11 §6). */
export const AI_CADENCE = {
  everyTicks: {
    player: 1, // TUNE: latency
    'bot-legend': 6, // TUNE: 5 Hz, behaviour-tree literature
    rover: 3, // TUNE:
    minion: 5, // TUNE: targets re-evaluated between windups
    guard: 10, // TUNE: mostly idle
    turret: 2, // TUNE: predictive aim wants fresh velocity
    boss: 3, // TUNE:
  },
  maxDecisionsPerTick: 96, // TUNE: Recommendation in 11 §6 (288 mobs / 5 plus Legends ≈ 70)
} as const satisfies AiCadence;
