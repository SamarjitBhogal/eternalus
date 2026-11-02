import type { SessionPhase } from '../bridge/events';

/**
 * The legal phase changes (architecture 13 §2). Any other pair is a bug and throws.
 * A screen crash leaves every phase except `menu` and `match` through
 * `SessionController.crashToMenu`, outside this table (DEC-149); `match` leaves by its table edge
 * with `'match-crashed'`. The reveal has no cancel (DEC-141), so `pre-launch` has no edge to `menu`.
 */
export const SESSION_TRANSITIONS: Readonly<Record<SessionPhase, readonly SessionPhase[]>> = {
  boot: ['menu'],
  menu: ['loading'],
  loading: ['character-select', 'menu'],
  'character-select': ['pre-launch', 'menu'],
  'pre-launch': ['match-loading'],
  'match-loading': ['match', 'menu'],
  match: ['results', 'menu'],
  results: ['menu', 'loading'],
};
