import { SEVERITY } from '@eternalus/core';

/** Records at or above this severity go to `console.error`. */
export const CONSOLE_ERROR_FROM = SEVERITY.ERROR;

/** Records at or above this severity (and below error) go to `console.warn`. */
export const CONSOLE_WARN_FROM = SEVERITY.WARN;
