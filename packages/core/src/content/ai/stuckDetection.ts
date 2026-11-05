import type { StuckDetectionRule } from './ai.types';

/**
 * Stuck detection for chasing mobs and bot Legends (owner 2026-11-05, DEC-193: "if stuck, minions
 * and legends are permitted to find a path around to their target rather than shove against a
 * wall forever. detection on being \"stuck\""). DEC-217 (14): a unit is stuck when it moves less
 * than 1 m in 2 s, and a waypoint is reached within 1 m (owner: build this first, then research
 * how other games handle stuck units). No reference value exists for any of these.
 */
export const STUCK_DETECTION = {
  // TUNE: DEC-193, DEC-217 (14); over the 1 s a bot decision and a minion hit take.
  windowSeconds: 2,
  // TUNE: DEC-193, DEC-217 (14); about one stride, so pressing a wall or holding never counts.
  minProgress: 1,
  // TUNE: DEC-193, DEC-217 (14); over the 0.5 m slot arrival, so a mob re-plans before it stops.
  waypointRadius: 1,
  // TUNE: a cost cap, not a gameplay number (like `map.pathMaxExpansions`; 11 §6): half a light
  // horde (`match.hordeSizes.light`, 16) a tick, so a whole horde stuck at one wall plans in two.
  maxPlansPerTick: 8,
} as const satisfies StuckDetectionRule;
