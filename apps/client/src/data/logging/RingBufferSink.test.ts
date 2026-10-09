import { makeLogRecord } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RingBufferSink } from './RingBufferSink';

describe('RingBufferSink', () => {
  it('keeps only the last records, oldest first', () => {
    const sink = new RingBufferSink(3);

    for (const body of ['a', 'b', 'c', 'd', 'e']) {
      sink.write(makeLogRecord('INFO', 'client.test', body));
    }

    expect(sink.tail(10).map((record) => record.body)).toEqual(['c', 'd', 'e']);
    expect(sink.tail(2).map((record) => record.body)).toEqual(['d', 'e']);
    expect(sink.tail(0)).toEqual([]);
  });

  it('refuses a capacity that is not a whole number >= 1', () => {
    expect(() => new RingBufferSink(0)).toThrow(RangeError);
    expect(() => new RingBufferSink(2.5)).toThrow('RingBufferSink capacity must be a whole number');
  });
});
