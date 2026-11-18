import { describe, expect, it } from 'vitest';

import { matchTimeText } from './matchTimeText';

describe('matchTimeText', () => {
  it.each([
    [872, '14:32'],
    [0, '00:00'],
    [59.9, '00:59'],
    [6000, '100:00'],
    [-3, '00:00'],
  ])('shows %s s as %s', (seconds, text) => {
    expect(matchTimeText(seconds)).toBe(text);
  });
});
