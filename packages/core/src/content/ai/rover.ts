import type { RoverTactics } from './ai.types';

/**
 * How the Rover hunts and mirrors the human (architecture 11 §4.7). No reference doc gives
 * these numbers yet (`INBOX.md`).
 */
export const ROVER_TACTICS = {
  senseRadius: 400, // TUNE: no reference value; the whole MVP map, until MatchState names the human
  huntRadius: 20, // TUNE: no reference value
  huntAdvantage: 0.2, // TUNE: no reference value; a fifth of a health bar ahead
} as const satisfies RoverTactics;
