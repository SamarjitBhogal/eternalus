/** The only tick rate the simulation supports (decided, D9). */
export const SUPPORTED_TICK_RATE = 30;

/** Requirements doc (developer menu): at most 10 Legends per team. */
export const MAX_LEGENDS_PER_TEAM = 10;

/**
 * At most 300 units per team, the default and the validator's ceiling (DEC-137: raised from the
 * requirements doc's 144 so the guards and the horde timeline fit; NFR-007 soaks at 300).
 */
export const MAX_UNITS_PER_TEAM = 300;
