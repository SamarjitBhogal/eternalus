import type { PlayableTeam } from './teams.types';

/**
 * The two playable teams, Light first (the order every per-team loop and hash uses).
 *
 * DEC-171 (C1): the one place the `'light'` / `'dark'` pair and the "other team" rule live, so
 * code that loops over teams, narrows a `Team` or looks for the enemy does not repeat them.
 */
export const PLAYABLE_TEAMS: readonly [PlayableTeam, PlayableTeam] = ['light', 'dark'];

/** Narrows any value, such as a `Team` (which may be `'neutral'`) or a config value, to a playable team. */
export const isPlayableTeam = (value: unknown): value is PlayableTeam =>
  value === 'light' || value === 'dark';

/** The other playable team: the enemy of `team`. */
export const opponentOf = (team: PlayableTeam): PlayableTeam =>
  team === 'light' ? 'dark' : 'light';
