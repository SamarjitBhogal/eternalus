/** The random source `createMatchSeed` draws from: `crypto.getRandomValues`' shape. */
type FillRandom = (values: Uint32Array<ArrayBuffer>) => ArrayLike<number>;

/**
 * Chooses a fresh unsigned 32-bit match seed at the browser boundary, before deterministic
 * generation (`SessionControllerDeps.seedSource`). Restored from `ef42d3c`, with the random
 * source injectable so it is testable.
 *
 * @param fillRandom - The random source; the browser's `crypto.getRandomValues` by default.
 * @returns A whole number in `0..2^32-1`; `0` if the source returns no value.
 */
export function createMatchSeed(
  fillRandom: FillRandom = (values) => crypto.getRandomValues(values),
): number {
  return fillRandom(new Uint32Array(1))[0] ?? 0;
}
