/**
 * The step a tick's aether regeneration is rounded down to: 2^-16. A power of two, so every amount
 * is exact in binary and a pool fed by many ticks adds up with no rounding error at all (values
 * stay far below 2^37). Precision, not tuning.
 */
export const AETHER_REGEN_QUANTUM = 1 / 65_536;
