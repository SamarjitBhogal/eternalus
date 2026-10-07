import { describe, expect, it } from 'vitest';

import type { Logger } from './Logger.types';
import { makeLogRecord } from './makeLogRecord';
import { MemoryLogger } from './MemoryLogger';
import { NullLogger } from './NullLogger';

describe('MemoryLogger', () => {
  it('keeps records in order', () => {
    const logger = new MemoryLogger();
    const first = makeLogRecord('INFO', 'core.test', 'first', { tick: 1 });
    const second = makeLogRecord('ERROR', 'core.test', 'second', { tick: 2 });
    logger.log(first);
    logger.log(second);
    expect(logger.records).toEqual([first, second]);
  });
});

describe('NullLogger', () => {
  it('accepts records without keeping or throwing', () => {
    const logger: Logger = new NullLogger();
    expect(() => {
      logger.log(makeLogRecord('FATAL', 'core.test', 'ignored'));
    }).not.toThrow();
  });
});
