import { describe, expect, it } from 'vitest';

import { IdGenerator } from './IdGenerator';

describe('IdGenerator', () => {
  it('counts up from 1', () => {
    const ids = new IdGenerator();
    expect([ids.next(), ids.next(), ids.next()]).toEqual([1, 2, 3]);
  });

  it('continues after a restored last id, so a resumed match never reuses one', () => {
    const ids = new IdGenerator(41);
    expect(ids.next()).toBe(42);
  });

  it('gives two generators the same sequence', () => {
    const first = new IdGenerator();
    const second = new IdGenerator();
    expect([first.next(), first.next()]).toEqual([second.next(), second.next()]);
  });

  it.each([-1, 0.5])('rejects start %s', (start) => {
    expect(() => new IdGenerator(start)).toThrow(RangeError);
  });
});
