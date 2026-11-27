import type { EntityId } from '../state/EntityStore.types';
import type { Team } from '../teams/teams.types';

/**
 * The last Legend of each team whose hit landed on this entity (DEC-416). A boss whose kill pays a
 * last hitter (`teamKills` `lastHitterLevels`) keeps it, so when a minion or a tower lands the last
 * hit, its team's Legend that hit last gets the last hitter's levels. `KillCredit` adds it on the
 * first Legend hit and records each later one.
 */
export class LastLegendHits {
  private readonly byTeam = new Map<Team, EntityId>();

  /** The fields that change the match's future, for `StateHasher`, in team order. */
  public get fields(): readonly string[] {
    return [...this.byTeam].sort(([a], [b]) => a.localeCompare(b)).flat();
  }

  /** Records that the hit of `legendId`, a Legend of `team`, landed last for that team. */
  public record(team: Team, legendId: EntityId): void {
    this.byTeam.set(team, legendId);
  }

  /** The Legend of `team` whose hit landed last, or `undefined` when none of that team hit. */
  public of(team: Team): EntityId | undefined {
    return this.byTeam.get(team);
  }
}
