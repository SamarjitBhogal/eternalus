/** How much checking runs: none, the light per-tick invariants, or light plus periodic ones. */
export type AssertLevel = 'off' | 'light' | 'heavy';

/** How the invariant runner behaves (architecture 15 §2, `SimulationOptions.debug`). */
export type DebugConfig = {
  readonly assertLevel: AssertLevel;
  /** With `heavy`, periodic invariants run every `heavyEvery` ticks; a whole number >= 1. */
  readonly heavyEvery: number;
  /** Tests throw on any violation; the browser logs and continues. */
  readonly throwOnViolation: boolean;
};
