import type { Verdict } from '../../state/MatchResult.types';
import type { DirectorContext } from '../DirectorContext.types';
import type { VictoryCondition } from '../VictoryCondition.types';

/**
 * A Duel ends when a team reaches the kill target (ADR 0016, DEC-36). `DuelRoundSystem` counts the
 * kills in `state.match.duel`; this only judges them. Both teams reaching it on one tick is a
 * draw. Outside a Duel it never gives a verdict.
 */
export class KillCountCondition implements VictoryCondition {
  public readonly id = 'kill-count';

  /** The verdict once a team has `killTarget` kills, else `null`. */
  public check({ state }: DirectorContext): Verdict | null {
    const { duel } = state.match;
    if (duel === null) {
      return null;
    }
    const isLight = duel.kills.light >= duel.killTarget;
    const isDark = duel.kills.dark >= duel.killTarget;
    if (!isLight && !isDark) {
      return null;
    }
    return { winner: isLight && isDark ? null : isLight ? 'light' : 'dark', condition: this.id };
  }
}
