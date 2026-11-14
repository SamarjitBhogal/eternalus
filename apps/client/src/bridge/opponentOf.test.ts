import { describe, expect, it } from 'vitest';

import { opponentOf } from './opponentOf';

describe('opponentOf', () => {
  it('gives the other playable team', () => {
    expect(opponentOf('light')).toBe('dark');
    expect(opponentOf('dark')).toBe('light');
  });
});
