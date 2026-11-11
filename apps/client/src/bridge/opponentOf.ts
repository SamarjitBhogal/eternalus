import type { PlayableTeam } from './domain.types';

/**
 * The other playable team: the enemy of `team`. The bridge's copy of core's `opponentOf`
 * (DEC-171), because `bridge/` imports only types from core (DEC-221 (3), B3).
 */
export const opponentOf = (team: PlayableTeam): PlayableTeam =>
  team === 'light' ? 'dark' : 'light';
