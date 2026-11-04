import { describe, expect, it } from 'vitest';

import { classNames } from './classNames';

describe('classNames', () => {
  it('joins the set names and skips the rest', () => {
    expect(classNames('a', undefined, false, null, '', 'b')).toBe('a b');
  });

  it('keeps the order it is given and adds no space at either end', () => {
    expect(classNames(undefined, 'b', 'a', undefined)).toBe('b a');
  });

  it('is the empty string when no name is set', () => {
    expect(classNames()).toBe('');
    expect(classNames(undefined, false, null, '')).toBe('');
  });
});
