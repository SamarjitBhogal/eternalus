import type { GameEvents } from '../../state/GameEvents';
import type { GameEventMap } from '../../state/GameEvents.types';
import { isPlayableTeam } from '../../teams/playableTeams';
import type { PendingChange, ScoringListener } from '../ScoringRule.types';

/**
 * A reached checkpoint (architecture 12 §5, DEC-214 (A1), DEC-223 (2)): a playable team whose push
 * reaches a capture point's checkpoint gets a `checkpointsReached` and team-only points, and each
 * of its Legends the event lists as present on the zone wins the checkpoint (a counter, no
 * points). `CaptureSystem` reads who is present when it emits the event (DEC-223 (4a)), so this
 * rule reads no entity. A neutral camp's push gives nothing.
 */
export class CheckpointRule implements ScoringListener {
  /** @param points - The team-only points for a reached checkpoint. */
  public constructor(private readonly points: number) {}

  /** Subscribes to `checkpoint-reached`. */
  public listen(events: GameEvents, defer: (change: PendingChange) => void): void {
    events.on('checkpoint-reached', (payload) => {
      this.onCheckpointReached(payload, defer);
    });
  }

  /**
   * Buffers the team's points and counter for a checkpoint a playable team's push reached, and the
   * checkpoint won by each listed Legend that has a row.
   */
  private onCheckpointReached(
    { team, presentLegendIds }: GameEventMap['checkpoint-reached'],
    defer: (change: PendingChange) => void,
  ): void {
    if (!isPlayableTeam(team)) {
      return;
    }
    const { points } = this;
    defer((book) => {
      book.awardTeam(team, { counter: 'checkpointsReached', by: 1, points });
      for (const legendId of presentLegendIds) {
        if (book.rowOf(legendId) !== undefined) {
          book.award(legendId, { counter: 'checkpointsWon', by: 1, points: 0 });
        }
      }
    });
  }
}
