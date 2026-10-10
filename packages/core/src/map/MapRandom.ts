import type { Rng } from './Rng.types';

/**
 * A small seeded generator (mulberry32) for map generation. Never `Math.random`: the same seed
 * must give the same map in tests, in the client and in a Worker.
 *
 * TODO(sholtzman): replace with session B's `SeededRandom` once it lands on the phase branch.
 */
export class MapRandom implements Rng {
  private state: number;

  /** Creates a generator; equal seeds produce equal sequences. */
  public constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Returns the next number in `[0, 1)`. */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let mixed = this.state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  }
}
