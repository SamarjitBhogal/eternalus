/** Largest seed: seeds are unsigned 32-bit, so larger values would alias smaller ones. */
export const MAX_SEED = 0xffff_ffff;

/** 2^32: turns an unsigned 32-bit draw into a float in `[0, 1)`. */
export const UINT32_RANGE = 0x1_0000_0000;

/** Draws discarded after seeding so nearby seeds do not start with correlated output. */
export const WARM_UP_DRAWS = 12;
