import { Sovereign } from '../../entities/Sovereign';
import type { GameState } from '../../state/GameState';
import { isPlayableTeam } from '../../teams/playableTeams';
import type { PlayableTeam } from '../../teams/teams.types';
import type { Invariant, Violation } from '../Invariant.types';

/** Detects duplicate Sovereigns before they can create conflicting match objectives. */
export class OneSovereignPerTeamInvariant implements Invariant {
  public readonly id = 'one-sovereign-per-team';
  public readonly severity = 'error';
  public readonly cadence = 'periodic';

  /** Flags every Sovereign after the first for a playable team. */
  public check(state: GameState): readonly Violation[] {
    const seen = new Set<PlayableTeam>();
    const violations: Violation[] = [];
    state.entities.forEach((entity) => {
      if (!(entity instanceof Sovereign)) return;
      const team = state.entities.teamOf(entity.id);
      if (!isPlayableTeam(team)) return;
      if (seen.has(team)) {
        violations.push({
          invariantId: this.id,
          severity: this.severity,
          message: `Team "${team}" has more than one Sovereign.`,
          entityId: entity.id,
          details: { team },
        });
      }
      seen.add(team);
    });
    return violations;
  }
}
