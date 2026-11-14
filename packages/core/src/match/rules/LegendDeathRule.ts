import type { ScoringWeights } from '../../content/match/scoring.types';
import type { ScoreBook } from '../../state/ScoreBook';
import type { DeathRule, ScoredDeath } from '../ScoringRule.types';

/**
 * A Legend's death (architecture 12 §5, DEC-79): the victim's death, the killer's kill and every
 * other recent hitter's assist.
 *
 * - Kills: only a Legend killer (one with a row) on another team earns one. A hit names its
 *   attacker (05 §9), so a projectile's kill counts for the Legend that fired it, even after that
 *   Legend died. Killing a Legend of its own team, itself included, counts for nothing (DEC-130).
 * - Assists: every other Legend that hit the victim inside the window earns one, also when a
 *   non-Legend landed the last hit. The victim's recent hits go at its death.
 */
export class LegendDeathRule implements DeathRule {
  /**
   * @param weights - The points for a death, a kill and an assist.
   * @param assistWindowTicks - How long a hit still earns an assist, in ticks.
   */
  public constructor(
    private readonly weights: Pick<ScoringWeights, 'death' | 'legendKill' | 'legendKillAssist'>,
    private readonly assistWindowTicks: number,
  ) {}

  /** Awards the victim's death, the killer's kill on an enemy and the other hitters' assists. */
  public score(book: ScoreBook, { victimId, team, killerId, tick }: ScoredDeath): void {
    const { weights } = this;
    if (book.rowOf(victimId) !== undefined) {
      book.award(victimId, { counter: 'deaths', by: 1, points: weights.death });
    }
    const killer = killerId === null ? undefined : book.rowOf(killerId);
    if (killer !== undefined && killer.team !== team) {
      book.award(killer.entityId, { counter: 'kills', by: 1, points: weights.legendKill });
    }
    for (const helperId of book.takeAssists(victimId, tick, this.assistWindowTicks)) {
      if (helperId !== killerId) {
        book.award(helperId, { counter: 'assists', by: 1, points: weights.legendKillAssist });
      }
    }
  }
}
