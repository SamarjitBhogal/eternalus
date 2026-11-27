import type { SeededRandom } from '../../utils/SeededRandom';

/**
 * Picks an option by weighted considerations (architecture 11 §4.2): each option's score is the
 * sum of its considerations times their weights. Options come in id order and a tie keeps the
 * earlier one, so the pick never depends on anything but the numbers, the ids and, for `pick`, the
 * brain's own seeded stream.
 */
export class UtilityScorer<Consideration extends string> {
  /** @param weights - How much each consideration counts (a difficulty's `utilityWeights`). */
  public constructor(private readonly weights: Readonly<Record<Consideration, number>>) {}

  /** The best-scoring option, or `null` when there are none. */
  public best<Option extends string>(
    options: readonly Option[],
    rate: (option: Option) => Readonly<Record<Consideration, number>>,
  ): Option | null {
    let best: Option | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const option of options) {
      const score = this.score(rate(option));
      if (score > bestScore) {
        best = option;
        bestScore = score;
      }
    }
    return best;
  }

  /**
   * A seeded weighted pick (11 §4.6): each option's chance is its score's share of the total, so
   * a player cannot learn a fixed order, yet a replay picks the same. A negative score counts as
   * 0. If float rounding leaves the roll unspent, the last option that scores above 0. When no
   * option scores above 0, the first option; `null` when there are none.
   */
  public pick<Option extends string>(
    options: readonly Option[],
    rate: (option: Option) => Readonly<Record<Consideration, number>>,
    rng: SeededRandom,
  ): Option | null {
    const scores = options.map((option) => Math.max(0, this.score(rate(option))));
    let roll = rng.nextFloat() * scores.reduce((sum, score) => sum + score, 0);
    for (const [at, option] of options.entries()) {
      roll -= scores[at] ?? 0;
      if (roll < 0) {
        return option;
      }
    }
    return options[Math.max(0, scores.findLastIndex((score) => score > 0))] ?? null;
  }

  /** The weighted sum of one option's considerations. */
  private score(scores: Readonly<Record<Consideration, number>>): number {
    let score = 0;
    for (const name of Object.keys(this.weights) as Consideration[]) {
      score += this.weights[name] * scores[name];
    }
    return score;
  }
}
