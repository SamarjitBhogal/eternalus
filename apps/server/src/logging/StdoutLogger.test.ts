import { makeLogRecord } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { StdoutLogger } from './StdoutLogger';

describe('StdoutLogger', () => {
  it('writes one JSON line per record', () => {
    const lines: string[] = [];
    const logger = new StdoutLogger({ write: (text) => lines.push(text) });
    const record = makeLogRecord('INFO', 'server.test', 'hello');
    logger.log(record);
    expect(lines).toEqual([`${JSON.stringify(record)}\n`]);
  });
});
