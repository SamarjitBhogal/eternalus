import type { Team } from '../../teams/teams.types';

/** Which units a perception query keeps (architecture 11 §3). Every field narrows. */
export type UnitFilter = {
  /** Keep only units on a team other than this one and not neutral. */
  readonly hostileTo?: Team;
  /** Keep only these entity kinds. */
  readonly kinds?: readonly string[];
  /** Keep only units with health left. */
  readonly aliveOnly?: boolean;
};
