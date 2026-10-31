import type { ScoringState } from './ScoringState.types';

/**
 * A match's scoring before anything is counted: no rows, both teams at 0. `GameState` starts with
 * it, and `StateHasher` leaves scoring out of the hash while the state still equals it.
 */
export const createEmptyScoringState = (): ScoringState => ({
  legends: [],
  teams: { light: { score: 0 }, dark: { score: 0 } },
  recentHits: [],
});
