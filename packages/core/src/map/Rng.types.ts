/** A seeded source of random numbers. The same seed always gives the same sequence. */
export interface Rng {
  /** The next number in `[0, 1)`. */
  next(): number;
}
