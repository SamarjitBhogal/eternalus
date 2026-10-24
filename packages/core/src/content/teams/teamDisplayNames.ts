import type { PlayableTeam } from '../../teams/teams.types';

/**
 * Each playable team's display name, as the selection screens' team badge and roster labels show
 * it (reference 14 §2: "which team you are on (Light or Dark)").
 */
export const TEAM_DISPLAY_NAMES = {
  light: 'Light',
  dark: 'Dark',
} as const satisfies Readonly<Record<PlayableTeam, string>>;
