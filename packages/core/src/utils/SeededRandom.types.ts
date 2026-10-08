/** A `SeededRandom` frozen in time: plain numbers, safe to hash, store in a replay or post to a Worker. */
export type SeededRandomState = {
  /** The seed the generator was created from (forks derive their seeds from it). */
  readonly seed: number;
  /** The four 32-bit sfc32 state words, as unsigned integers. */
  readonly words: readonly [number, number, number, number];
};
