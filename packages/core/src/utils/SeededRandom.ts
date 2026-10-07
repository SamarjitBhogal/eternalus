import { fnv1a } from './fnv1a';
import { MAX_SEED, UINT32_RANGE, WARM_UP_DRAWS } from './SeededRandom.constants';
import type { SeededRandomState } from './SeededRandom.types';

const isUint32 = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_SEED;

/**
 * The simulation's only source of randomness: sfc32 (passes PractRand; research §1), seeded from a
 * 32-bit match seed through splitmix32. Same seed, same sequence, on every run. `fork(name)`
 * derives an independent stream (map generation, team assignment, AI) whose sequence depends only
 * on the seed and the name, never on how many numbers the parent has drawn.
 */
export class SeededRandom {
  private a = 0;
  private b = 0;
  private c = 0;
  private d = 0;

  /** @param seed - A whole number from 0 to 2^32 - 1. */
  public constructor(public readonly seed: number) {
    if (!isUint32(seed)) {
      throw new RangeError(
        `Seed must be a whole number from 0 to ${String(MAX_SEED)}, got ${String(seed)}.`,
      );
    }
    let mix = seed;
    const splitmix32 = (): number => {
      mix = (mix + 0x9e3779b9) | 0;
      let word = mix ^ (mix >>> 16);
      word = Math.imul(word, 0x21f0aaad);
      word ^= word >>> 15;
      word = Math.imul(word, 0x735a2d97);
      return word ^ (word >>> 15);
    };
    this.a = splitmix32();
    this.b = splitmix32();
    this.c = splitmix32();
    this.d = splitmix32();
    for (let draw = 0; draw < WARM_UP_DRAWS; draw += 1) {
      this.nextUint32();
    }
  }

  /** Recreates a generator exactly where `getState()` left it. */
  public static fromState(state: SeededRandomState): SeededRandom {
    if (!state.words.every(isUint32)) {
      throw new RangeError('SeededRandom state words must be unsigned 32-bit integers.');
    }
    const random = new SeededRandom(state.seed);
    const [a, b, c, d] = state.words;
    random.a = a | 0;
    random.b = b | 0;
    random.c = c | 0;
    random.d = d | 0;
    return random;
  }

  /** The full generator state as plain numbers. */
  public getState(): SeededRandomState {
    return { seed: this.seed, words: [this.a >>> 0, this.b >>> 0, this.c >>> 0, this.d >>> 0] };
  }

  /** The next number in `[0, 1)`. */
  public nextFloat(): number {
    return this.nextUint32() / UINT32_RANGE;
  }

  /** The next whole number from `min` to `max`, both inclusive. */
  public nextInt(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max || max - min > MAX_SEED) {
      throw new RangeError(
        `nextInt needs whole numbers min <= max, got ${String(min)}, ${String(max)}.`,
      );
    }
    return min + Math.floor(this.nextFloat() * (max - min + 1));
  }

  /** An independent generator for the stream `streamName`; draws nothing from this one. */
  public fork(streamName: string): SeededRandom {
    return new SeededRandom(fnv1a(`${String(this.seed)}/${streamName}`));
  }

  /** One sfc32 step: the next unsigned 32-bit integer. */
  private nextUint32(): number {
    const result = (((this.a + this.b) | 0) + this.d) | 0;
    this.d = (this.d + 1) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + result) | 0;
    return result >>> 0;
  }
}
