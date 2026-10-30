import type { SessionPhase } from '../bridge/events';

/** The legal phase changes (architecture 13 §2). Any other pair is a bug and throws. */
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
