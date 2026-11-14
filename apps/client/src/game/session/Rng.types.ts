/**
 * Port: a seeded random stream for the team draw. `LcgRng` still stands in for core's
 * `SeededRandom` here (`LcgRng.ts` TODO); the swap is the `createRng` line in `main.tsx`. LOCK IN's
 * roster draw already uses `SeededRandom` (`createRosterRng`).
 */
export interface Rng {
  /** An integer in `[0, maxExclusive)`. */
  nextInt(maxExclusive: number): number;
}
