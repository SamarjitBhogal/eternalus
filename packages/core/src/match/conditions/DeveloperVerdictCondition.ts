import type { GameState } from '../../state/GameState';
import type { Verdict } from '../../state/MatchResult.types';
import { opponentOf } from '../../teams/playableTeams';
import type { VictoryCondition } from '../VictoryCondition.types';

/** Ends a developer-controlled solo match through the ordinary result path. */
export class DeveloperVerdictCondition implements VictoryCondition {
  public readonly id = 'dev-forced';
  private verdict: Verdict | null = null;

  /** Keeps the first requested verdict for the director's pass. */
  public constructor(state: GameState) {
    state.events.on('dev-match-end-requested', ({ outcome }) => {
      this.verdict ??= {
        winner: outcome === 'win' ? state.match.playerTeam : opponentOf(state.match.playerTeam),
        condition: this.id,
      };
    });
  }

  /** Returns the developer's verdict, if requested this tick. */
  public check(): Verdict | null {
    return this.verdict;
  }
}
