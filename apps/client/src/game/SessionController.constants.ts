import type { SessionPhase } from '../bridge/events';

/**
 * The legal phase changes (architecture 13 §2). Any other pair is a bug and throws.
 * `pre-launch` → `menu` exists for a screen crash only (DEC-141, INBOX HC-Q30 item 5): the
 * reveal has no cancel, and `PreLaunchState` handles no intent, so no player intent takes it.
 */
export const SESSION_TRANSITIONS: Readonly<Record<SessionPhase, readonly SessionPhase[]>> = {
  boot: ['menu'],
  menu: ['loading'],
  loading: ['character-select', 'menu'],
  'character-select': ['pre-launch', 'menu'],
  'pre-launch': ['match-loading', 'menu'], // DEC-141 (owner, 2026-11-02; INBOX HC-Q30 item 5)
  'match-loading': ['match', 'menu'],
  match: ['results', 'menu'],
  results: ['menu', 'loading'],
};
