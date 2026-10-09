/**
 * Port: a seeded random stream. `LcgRng` stands in until core's `SeededRandom` is exported; the
 * swap is the `createRng` line in `main.tsx`.
 */
export interface Rng {
  /** An integer in `[0, maxExclusive)`. */
  nextInt(maxExclusive: number): number;
}
