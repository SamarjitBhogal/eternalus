import type { DebugConfig } from './InvariantRunner.types';

/** The release setting (architecture 15 §2): light checks every tick, log and continue. */
export const RELEASE_DEBUG_CONFIG: DebugConfig = {
  assertLevel: 'light',
  heavyEvery: 30, // TUNE: once a second at 30 ticks/s
  throwOnViolation: false,
};

/** How many recent commands a violation report carries (architecture 15 §5, TUNE). */
export const REPORTED_COMMANDS = 32;

/** How many recent events a violation report carries (architecture 15 §5, TUNE). */
export const REPORTED_EVENTS = 128;
