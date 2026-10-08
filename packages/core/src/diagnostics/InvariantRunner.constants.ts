import type { InvariantSeverity } from './Invariant.types';
import type { DebugConfig } from './InvariantRunner.types';
import type { SeverityText } from './Logger.types';

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

/** The setting for unit and scenario tests (architecture 15 §2): every check, every tick, throw. */
export const TEST_DEBUG_CONFIG: DebugConfig = {
  assertLevel: 'heavy',
  heavyEvery: 1,
  throwOnViolation: true,
};

/** The log level each invariant severity is reported at (architecture 15 §5). */
export const LOG_LEVEL_OF: Readonly<Record<InvariantSeverity, SeverityText>> = {
  warn: 'WARN',
  error: 'ERROR',
  fatal: 'FATAL',
};

/** Rounding slack when comparing a velocity's length with `maxSpeed` (float error, not gameplay). */
export const SPEED_TOLERANCE = 1e-9;
