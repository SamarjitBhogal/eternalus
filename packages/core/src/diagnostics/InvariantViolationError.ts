import type { Violation } from './Invariant.types';

/** Thrown in tests when an invariant breaks: prints every violation with the seed and tick. */
export class InvariantViolationError extends Error {
  /** Creates the error for the `violations` found on `tick` of the match with `seed`. */
  public constructor(
    public readonly violations: readonly Violation[],
    public readonly tick: number,
    public readonly seed: number,
  ) {
    super(
      `Invariant violated at tick ${String(tick)} (seed ${String(seed)}): ` +
        violations.map((v) => `${v.invariantId}: ${v.message}`).join('; '),
    );
    this.name = 'InvariantViolationError';
  }
}
