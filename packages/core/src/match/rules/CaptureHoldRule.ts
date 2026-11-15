import { Capturable } from '../../components/Capturable';
import type { GameState } from '../../state/GameState';
import type { ScoreBook } from '../../state/ScoreBook';
import { isPlayableTeam, PLAYABLE_TEAMS } from '../../teams/playableTeams';
import type { PlayableTeam } from '../../teams/teams.types';
import type { TickScorer } from '../ScoringRule.types';

/**
 * Held capture points (architecture 12 §5, DEC-214 (A2), DEC-223 (2), (4b)): each fold, every
 * capture point a playable team owns adds one tick to its pooled held time, and each full minute
 * of it gives team-only points. A lost point stops adding but takes nothing back. Who owns a point
 * is read from its `Capturable` at the fold, the one source of truth; `CaptureSystem` runs before
 * the director, so the tick a capture completes counts as held.
 */
export class CaptureHoldRule implements TickScorer {
  /**
   * @param holdPerMinute - The team-only points for each full minute of held time.
   * @param minuteTicks - One minute in ticks: hold points come per full minute of held time.
   */
  public constructor(
    private readonly holdPerMinute: number,
    private readonly minuteTicks: number,
  ) {}

  /**
   * Adds one tick per owned capture point to each playable team's pooled held time, and the hold
   * points for each full minute that tick completes.
   */
  public scoreTick(book: ScoreBook, state: GameState): void {
    const owned = CaptureHoldRule.ownedPoints(state);
    for (const team of PLAYABLE_TEAMS) {
      const count = owned[team];
      if (count === 0) {
        continue;
      }
      const before = book.view.teams[team].capturesHeldTicks;
      const minutes =
        Math.floor((before + count) / this.minuteTicks) - Math.floor(before / this.minuteTicks);
      book.awardTeam(team, {
        counter: 'capturesHeldTicks',
        by: count,
        points: minutes * this.holdPerMinute,
      });
    }
  }

  /**
   * How many capture points each playable team owns now, from each `Capturable`'s owner: one scan
   * of the store, as `CaptureSystem` makes each tick.
   */
  private static ownedPoints(state: GameState): Record<PlayableTeam, number> {
    const owned: Record<PlayableTeam, number> = { light: 0, dark: 0 };
    state.entities.forEach((entity) => {
      const owner = entity.findComponent(Capturable)?.owner;
      if (isPlayableTeam(owner)) {
        owned[owner] += 1;
      }
    });
    return owned;
  }
}
