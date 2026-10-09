import type { Team } from '../teams/teams.types';

/** Every team an entity can spawn on, used to check spawn contexts at runtime. */
export const SPAWNABLE_TEAMS: readonly Team[] = ['light', 'dark', 'neutral'];
