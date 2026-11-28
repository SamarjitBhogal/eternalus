/**
 * Every match phase in forward order (architecture 12 §2): the single phase order. A match starts
 * in the first; a transition only ever moves right; `victory` and `defeat` are terminal.
 */
export const MATCH_PHASES = [
  'countdown',
  'early-game',
  'quarter-mark',
  'mid-game',
  'end-game',
  'victory',
  'defeat',
] as const;

/** Where a match is in its timeline (architecture 12 §2). */
export type MatchPhase = (typeof MATCH_PHASES)[number];

/**
 * The terminal phases (architecture 12 §2): only a verdict enters them, never a timeline entry,
 * and the match never leaves them.
 */
export const TERMINAL_MATCH_PHASES: readonly MatchPhase[] = ['victory', 'defeat'];
