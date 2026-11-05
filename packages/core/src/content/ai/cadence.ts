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
  // TUNE: 11 §6's Recommendation, sized for 288 mobs (288 / 5 plus Legends ≈ 70). At the 300-unit
  // cap (DEC-137) about 120 minion brains fall due per tick, so some wait: the queue is first in,
  // first out, so a brain waits at most floor((brains - 1) / 96) ticks (AiSystem.test.ts).
  maxDecisionsPerTick: 96,
} as const satisfies AiCadence;
