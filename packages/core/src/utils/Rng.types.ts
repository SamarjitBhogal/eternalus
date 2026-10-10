/**
 * The randomness port (architecture 01 §3): everything in core that needs chance asks an `Rng`,
 * never `Math.random`. `SeededRandom` is the adapter.
 */
export interface Rng {
  /** The next number in `[0, 1)`. */
  nextFloat(): number;
  /** The next whole number from `min` to `max`, both inclusive. */
  nextInt(min: number, max: number): number;
  /** An independent stream named `streamName`. */
  fork(streamName: string): Rng;
}
