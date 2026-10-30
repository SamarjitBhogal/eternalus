import type { EntityId } from '../../state/EntityStore.types';

/**
 * Picks the best option by weighted considerations (architecture 11 §4.2): each option's score is
 * the sum of its considerations times their weights. Options come in id order and a tie keeps the
 * earlier one, so the pick never depends on anything but the numbers and the ids.
 *
 * @remarks ponytail: no weighted-random pick yet; the brain's RNG stream joins when a difficulty
 * wants bots to err (11 §4.2).
 */
export class UtilityScorer<Consideration extends string> {
  /** @param weights - How much each consideration counts (a difficulty's `utilityWeights`). */
  public constructor(private readonly weights: Readonly<Record<Consideration, number>>) {}

  /** The best-scoring option, or `null` when there are none. */
  public best(
    options: readonly EntityId[],
    rate: (option: EntityId) => Readonly<Record<Consideration, number>>,
  ): EntityId | null {
    let best: EntityId | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const option of options) {
      const scores = rate(option);
      let score = 0;
      for (const name of Object.keys(this.weights) as Consideration[]) {
        score += this.weights[name] * scores[name];
      }
      if (score > bestScore) {
        best = option;
        bestScore = score;
      }
    }
    return best;
  }
}
