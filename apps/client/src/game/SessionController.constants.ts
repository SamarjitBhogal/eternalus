import type { SessionPhase } from '../bridge/events';

/**
 * The legal phase changes (architecture 13 §2). Any other pair is a bug and throws.
 * A screen crash leaves every phase except `menu` and `match` through
 * `SessionController.crashToMenu`, outside this table (DEC-149); `match` leaves by its table edge
 * with `'match-crashed'`. `menu` reaches `match-loading` only for an online Duel, which the server
 * pairs and which has no selection (ADR 0016); a Duel the server ends during `match-loading` goes straight to `results`. The reveal has no cancel (DEC-141), so `pre-launch` has no edge to `menu`.
 */
export const SESSION_TRANSITIONS: Readonly<Record<SessionPhase, readonly SessionPhase[]>> = {
  boot: ['menu'],
  menu: ['loading', 'match-loading'],
  loading: ['character-select', 'menu'],
  'character-select': ['pre-launch', 'menu'],
  'pre-launch': ['match-loading'],
  'match-loading': ['match', 'results', 'menu'],
  match: ['results', 'menu'],
  results: ['menu', 'loading'],
};
