import { describe, expect, it } from 'vitest';

import { RingBuffer } from './RingBuffer';

describe('RingBuffer', () => {
  it('keeps items oldest first while below capacity', () => {
    const buffer = new RingBuffer<number>(3);
    buffer.push(1);
    buffer.push(2);
    expect(buffer.toArray()).toEqual([1, 2]);
  });

  it('overwrites the oldest item once full', () => {
    const buffer = new RingBuffer<number>(3);
    for (let item = 1; item <= 7; item += 1) {
      buffer.push(item);
    }
    expect(buffer.toArray()).toEqual([5, 6, 7]);
  });

  it('returns a copy the caller cannot use to change the buffer', () => {
    const buffer = new RingBuffer<number>(2);
    buffer.push(1);
    buffer.toArray().push(99);
    expect(buffer.toArray()).toEqual([1]);
  });

  it.each([0, -1, 2.5])('rejects capacity %s', (capacity) => {
    expect(() => new RingBuffer<number>(capacity)).toThrow(RangeError);
  });
});
