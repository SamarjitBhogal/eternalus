import type { VictoryConditionId } from '../config/VictoryConditionId.types';
import type { Verdict } from '../state/MatchResult.types';
import type { DirectorContext } from './DirectorContext.types';

/**
 * One way a match can end (architecture 12 §6). The `MatchDirector` checks its conditions once per
 * tick in registry order (`defaultVictoryConditions.ts`); the first verdict ends the match.
 */
export interface VictoryCondition {
  readonly id: VictoryConditionId;
  /** The verdict if this condition ends the match on this tick, else `null`. */
  check(context: DirectorContext): Verdict | null;
}
