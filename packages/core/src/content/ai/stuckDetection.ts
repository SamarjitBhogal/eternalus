import type { StuckDetectionRule } from './ai.types';

/**
 * Stuck detection for chasing mobs and bot Legends (owner 2026-11-05, DEC-193: "if stuck, minions
 * and legends are permitted to find a path around to their target rather than shove against a
 * wall forever. detection on being \"stuck\""). No reference value exists for any of these.
 */
export const STUCK_DETECTION = {
  windowSeconds: 2, // TUNE: DEC-193; over the 1 s a bot decision and a minion hit take
  minProgress: 1, // TUNE: DEC-193; about one stride, so pressing a wall or holding never counts
  waypointRadius: 1, // TUNE: DEC-193; over the 0.5 m slot arrival, so a mob re-plans before it stops
} as const satisfies StuckDetectionRule;
