import type { GameEvents } from '../../state/GameEvents';
import type { GameEventMap } from '../../state/GameEvents.types';
import { isPlayableTeam, opponentOf } from '../../teams/playableTeams';
import type { PendingChange, ScoringListener } from '../ScoringRule.types';

/**
 * A fallen structure (architecture 12 §5): a structure of a playable team that falls gives the
 * opposing team a `structuresDestroyed` and team-only points, whoever landed the last hit, as for
 * structure XP (DEC-212, DEC-186). A neutral camp gives nothing.
 */
export class StructureDestroyedRule implements ScoringListener {
  /** @param points - The team-only points for a destroyed structure. */
  public constructor(private readonly points: number) {}

  /** Subscribes to `structure-destroyed`. */
  public listen(events: GameEvents, defer: (change: PendingChange) => void): void {
    events.on('structure-destroyed', (payload) => {
      this.onStructureDestroyed(payload, defer);
    });
  }

  /** Buffers the opposing team's points for a fallen structure of a playable team (DEC-212). */
  private onStructureDestroyed(
    { team }: GameEventMap['structure-destroyed'],
    defer: (change: PendingChange) => void,
  ): void {
    if (!isPlayableTeam(team)) {
      return;
    }
    const destroyer = opponentOf(team);
    const { points } = this;
    defer((book) => {
      book.awardTeam(destroyer, { counter: 'structuresDestroyed', by: 1, points });
    });
  }
}
