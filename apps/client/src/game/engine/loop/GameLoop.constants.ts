/**
 * Slack, in milliseconds, when deciding whether the accumulator holds a whole tick. Tick lengths
 * such as 1000 / 30 are not exact in floating point, so 100 ms would otherwise give 2 ticks, not 3.
 */
export const TICK_EPSILON_MS = 1e-9;
