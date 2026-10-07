import { describe, expect, it } from 'vitest';

import type { Logger } from './Logger.types';
import { makeLogRecord } from './makeLogRecord';
import { NullLogger } from './NullLogger';

describe('NullLogger', () => {
  it('accepts records without keeping or throwing', () => {
    const logger: Logger = new NullLogger();
    expect(() => {
      logger.log(makeLogRecord('FATAL', 'core.test', 'ignored'));
    }).not.toThrow();
  });
});
