import type { RoverTactics } from './ai.types';

/**
 * How the Rover hunts and mirrors the human (architecture 11 §4.7). No reference doc gives
 * these numbers yet (`INBOX.md`).
 */
export const ROVER_TACTICS = {
  senseRadius: 400, // TUNE: no reference value; the whole MVP map, until MatchState names the human
  huntRadius: 20, // TUNE: no reference value
  huntAdvantage: 0.2, // TUNE: no reference value; a fifth of a health bar ahead
  laneWeights: { pressure: 4.5, human: 1 }, // TUNE: no reference value; a lane pushed most of the way to its end outweighs the human (3 before DEC-89 dropped the constant damage-not-dealt term)
} as const satisfies RoverTactics;
