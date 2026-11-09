import type { ScoreBook } from '../../state/ScoreBook';
import type { HitRule, ScoredHit } from '../ScoringRule.types';

/**
 * A hit on an enemy Legend (architecture 12 §5): no points, but the hit is remembered, so its
 * attacker can earn an assist if the Legend dies inside the assist window (DEC-132).
 */
export class LegendHitRule implements HitRule {
  /** Records the attacker's latest hit on the target (`ScoreBook.recordHit`). */
  public score(book: ScoreBook, { targetId, attackerId, tick }: ScoredHit): void {
    book.recordHit(targetId, attackerId, tick);
  }
}
