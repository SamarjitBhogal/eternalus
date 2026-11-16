import type { ScoreBook } from '../../state/ScoreBook';
import type { HitRule, ScoredHit } from '../ScoringRule.types';

/**
 * A hit on an enemy structure (architecture 12 §5): the attacker's `structureDamage` goes up by the
 * damage, the part its shield bars absorbed included (DEC-123), with no points.
 */
export class StructureHitRule implements HitRule {
  /** Raises the attacker's `structureDamage` by the hit's damage. */
  public score(book: ScoreBook, { attackerId, amount }: ScoredHit): void {
    book.award(attackerId, { counter: 'structureDamage', by: amount, points: 0 });
  }
}
