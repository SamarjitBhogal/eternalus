import type { PlayableTeam } from '../../teams/teams.types';

/**
 * Each team's sovereign (its win objective, ADR 0021) as players read it: "Emperor" by default,
 * set per team and changeable (DEC-74). The results screen's verdict line fills it in (game-loop
 * plan §4.5).
 * ponytail: stands in for the per-team display name on the `monarch` content definition (plan
 * §4.3), which plan task GL-3 adds; GL-3 moves the names there so they live in one place.
 */
export const SOVEREIGN_DISPLAY_NAMES = {
  light: 'Emperor',
  dark: 'Emperor',
} as const satisfies Readonly<Record<PlayableTeam, string>>;
