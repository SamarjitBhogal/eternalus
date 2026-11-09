import { expect, it, vi } from 'vitest';
import { createMatchSeed } from './createMatchSeed';

it('requests a new unsigned seed for each match rather than reusing a placeholder', () => {
  let seed = 41;
  vi.stubGlobal('crypto', {
    getRandomValues: (values: Uint32Array) => {
      values[0] = seed++;
      return values;
    },
  });
  try {
    expect(createMatchSeed()).toBe(41);
    expect(createMatchSeed()).toBe(42);
  } finally {
    vi.unstubAllGlobals();
  }
});
