/**
 * The match-setup rule shared by `game/` (the session) and the selectors: one definition for both
 * sides (13 §10).
 */
import type { MatchMode } from './events';

/**
 * A rematch repeats only a local match's setup (13 §2, DEC-250); a Duel's seat and seed are the
 * server's (ADR 0016).
 */
export function canRepeatSetup(mode: MatchMode | null): boolean {
  return mode === 'local';
}
