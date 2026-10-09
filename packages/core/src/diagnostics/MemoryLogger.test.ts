import { describe, expect, it } from 'vitest';

import { makeLogRecord } from './makeLogRecord';
import { MemoryLogger } from './MemoryLogger';

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
