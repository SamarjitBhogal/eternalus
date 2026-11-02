import type { Team } from '../teams/teams.types';

/** The progress of each locking state (architecture 07 §7): fully Light, fully Dark, neutral. */
export const LOCKING_PROGRESS: Readonly<Record<Team, number>> = {
  light: 1,
  dark: -1,
  neutral: 0,
};
