import type { Rating } from './Glicko2.types';

/** What the server keeps for one player: the Glicko-2 rating and the match record. */
export type PlayerRecord = Rating & {
  readonly wins: number;
  readonly losses: number;
  /** Consecutive results: positive for a win streak, negative for a loss streak, 0 after a draw. */
  readonly streak: number;
  /** Matches played, draws included. */
  readonly matches: number;
};
