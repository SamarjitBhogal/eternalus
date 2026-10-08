import type { LogRecord } from '@eternalus/core';

import { CONSOLE_ERROR_FROM, CONSOLE_WARN_FROM } from './ConsoleSink.constants';
import type { LogSink } from './LogSink.types';

/**
 * Writes records to the browser console: errors and fatals as errors, warnings as warnings,
 * everything else as info. The only file in the app that calls `console`.
 */
export class ConsoleSink implements LogSink {
  /** Writes `record` with its scope, tick and body, plus the full record for inspection. */
  public write(record: LogRecord): void {
    const line = `[${record.scope}] tick ${String(record.tick ?? '-')}: ${record.body}`;
    if (record.severityNumber >= CONSOLE_ERROR_FROM) {
      // eslint-disable-next-line no-console -- ConsoleSink is the one place logs reach the console
      console.error(line, record);
    } else if (record.severityNumber >= CONSOLE_WARN_FROM) {
      // eslint-disable-next-line no-console -- ConsoleSink is the one place logs reach the console
      console.warn(line, record);
    } else {
      // eslint-disable-next-line no-console -- ConsoleSink is the one place logs reach the console
      console.info(line, record);
    }
  }
}
