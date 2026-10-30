import { Health } from '../../components/Health';
import { TeamMembership } from '../../components/TeamMembership';
import { WinObjective } from '../../components/WinObjective';
import type { GameState } from '../../state/GameState';
import type { Verdict } from '../../state/MatchResult.types';
import type { PlayableTeam } from '../../teams/teams.types';
import type { DirectorContext } from '../DirectorContext.types';
import type { VictoryCondition } from '../VictoryCondition.types';

/**
 * A team loses when its last live win objective dies (ADR 0021, DEC-71, architecture 12 §6). It
 * names no entity kind: anything that carries `WinObjective` counts. It listens to `entity-died`
 * and records the victim's team while the victim is still in the store; `check` judges those
 * teams after `DeathSystem`. One team out of objectives: the other team wins. Both on one tick: a
 * draw.
 */
export class ObjectiveLostCondition implements VictoryCondition {
  public readonly id = 'objective-lost';

  /** Teams that lost an objective since the last check, in event order. */
  private readonly lostObjectiveTeams: PlayableTeam[] = [];

  /** @param state - The match whose `entity-died` events this condition listens to. */
  public constructor(state: GameState) {
    state.events.on('entity-died', ({ entityId }) => {
      const victim = state.entities.get(entityId);
      const team = victim?.findComponent(TeamMembership)?.team;
      if (victim?.hasComponent(WinObjective) === true && (team === 'light' || team === 'dark')) {
        this.lostObjectiveTeams.push(team);
      }
    });
  }

  /**
   * Drains the recorded teams (always, verdict or not) and returns the verdict when a recorded
   * team has no live objective left in the store: the other team wins, or a draw when both have
   * none. An objective without `Health` counts as alive.
   */
  public check({ state }: DirectorContext): Verdict | null {
    const recorded = new Set(this.lostObjectiveTeams.splice(0));
    const lost = [...recorded].filter(
      (team) => !ObjectiveLostCondition.hasLiveObjective(state, team),
    );
    const [loser] = lost;
    if (loser === undefined) {
      return null;
    }
    const winner = lost.length > 1 ? null : ObjectiveLostCondition.opponentOf(loser);
    return { winner, condition: this.id };
  }

  private static hasLiveObjective(state: GameState, team: PlayableTeam): boolean {
    let isFound = false;
    state.entities.forEach((entity) => {
      isFound ||=
        entity.hasComponent(WinObjective) &&
        entity.findComponent(TeamMembership)?.team === team &&
        entity.findComponent(Health)?.isDead !== true;
    });
    return isFound;
  }

  private static opponentOf(team: PlayableTeam): PlayableTeam {
    return team === 'light' ? 'dark' : 'light';
  }
}
