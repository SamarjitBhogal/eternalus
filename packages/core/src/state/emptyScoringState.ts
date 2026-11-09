import type { MutableScoringState } from './ScoreBook.types';

/**
 * A match's scoring before anything is counted: no rows, both teams at 0 and owning no capture
 * point. The `ScoreBook` starts with it, and `StateHasher` leaves scoring out of the hash while the
 * state still equals it.
 */
export const createEmptyScoringState = (): MutableScoringState => ({
  legends: [],
  teams: {
    light: { score: 0, structuresDestroyed: 0, capturesHeldTicks: 0 },
    dark: { score: 0, structuresDestroyed: 0, capturesHeldTicks: 0 },
  },
  recentHits: [],
  ownedPoints: { light: 0, dark: 0 },
});
