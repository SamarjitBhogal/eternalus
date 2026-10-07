import type { Team } from '../teams/teams.types';

/**
 * Which side an entity fights for. Team is a component, not a class (DEC-03 / D10), because it
 * can change during a match (a revived or ascended unit). Neutral units (camps, bosses) are
 * enemies of both playable teams.
 */
export class TeamMembership {
  /** @param currentTeam - The team at spawn. */
  public constructor(private currentTeam: Team) {}

  /** The current team. */
  public get team(): Team {
    return this.currentTeam;
  }

  /** Changes team and returns the previous one, so the caller can emit `team-changed`. */
  public setTeam(next: Team): Team {
    const previous = this.currentTeam;
    this.currentTeam = next;
    return previous;
  }

  /** Whether `other` is on the same team. */
  public isAlly(other: TeamMembership): boolean {
    return this.currentTeam === other.currentTeam;
  }

  /** Whether `other` is on a different team. */
  public isEnemy(other: TeamMembership): boolean {
    return !this.isAlly(other);
  }
}
