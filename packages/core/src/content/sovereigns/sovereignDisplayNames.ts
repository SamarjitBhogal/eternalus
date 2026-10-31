import type { PlayableTeam } from '../../teams/teams.types';

/**
 * Each team's sovereign (its win objective, ADR 0021) as players read it: "Emperor" by default,
 * set per team and changeable (DEC-74). The one place the name lives: the results screen's verdict
 * line fills it in (game-loop plan §4.5), and the sovereign's content definition (`monarch`, plan
 * task GL-3) takes its display name from here.
 */
export const SOVEREIGN_DISPLAY_NAMES = {
  light: 'Emperor',
  dark: 'Emperor',
} as const satisfies Readonly<Record<PlayableTeam, string>>;
