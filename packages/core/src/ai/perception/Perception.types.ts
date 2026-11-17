import type { EntityId } from '../../state/EntityStore.types';
import type { Team } from '../../teams/teams.types';

/** Which units a perception query keeps (architecture 11 §3). Every field narrows. */
export type UnitFilter = {
  /** Keep only units on a team other than this one and not neutral. */
  readonly hostileTo?: Team;
  /**
   * With `hostileTo`, also keep a neutral unit whose attack target is this unit, so it fights back
   * against a camp mob that attacks it (DEC-166). Every other neutral unit stays out (no farming).
   */
  readonly neutralAttackersOf?: EntityId;
  /** Keep only these entity kinds. */
  readonly kinds?: readonly string[];
  /** Keep only units with health left. */
  readonly aliveOnly?: boolean;
};
