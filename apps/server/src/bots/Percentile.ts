/** Percentile maths for the load numbers. */
export class Percentile {
  /**
   * The nearest-rank percentile of `values` (`p` from 0 to 100); `null` when there are none.
   * The input need not be sorted and is not changed.
   */
  public of(values: readonly number[], p: number): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const rank = Math.max(1, Math.ceil((p / 100) * sorted.length));
    return sorted[rank - 1] ?? null;
  }
}
