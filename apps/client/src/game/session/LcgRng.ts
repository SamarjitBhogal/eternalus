import type { Rng } from './Rng.types';

// TODO(sam): replace with SeededRandom from @eternalus/core when session B lands.
// ponytail: a 32-bit LCG is fine for one team draw per match; core's sfc32 replaces it.
/** A tiny seeded linear congruential generator (Numerical Recipes constants). */
export class LcgRng implements Rng {
  private static readonly MULTIPLIER = 1664525;
  private static readonly INCREMENT = 1013904223;
  private static readonly RANGE = 2 ** 32;
  // murmur3 fmix32 constants: decorrelate consecutive seeds before the first draw.
  private static readonly MIX_1 = 0x85ebca6b;
  private static readonly MIX_2 = 0xc2b2ae35;
  private state: number;

  /** Same seed, same stream. The seed is mixed first so nearby seeds give unrelated streams. */
  public constructor(seed: number) {
    let mixed = seed >>> 0;
    mixed = Math.imul(mixed ^ (mixed >>> 16), LcgRng.MIX_1);
    mixed = Math.imul(mixed ^ (mixed >>> 13), LcgRng.MIX_2);
    this.state = (mixed ^ (mixed >>> 16)) >>> 0;
  }

  /** An integer in `[0, maxExclusive)` from the high bits of the next state. */
  public nextInt(maxExclusive: number): number {
    this.state = (Math.imul(this.state, LcgRng.MULTIPLIER) + LcgRng.INCREMENT) >>> 0;
    return Math.floor((this.state / LcgRng.RANGE) * maxExclusive);
  }
}
