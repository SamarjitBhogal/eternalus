import { describe, expect, it } from 'vitest';

import { matchSlice } from '../slices/matchSlice';
import { selectMatchClockText } from './selectMatchClockText';

const at = (seconds: number | null) =>
  selectMatchClockText({
    match: {
      ...matchSlice.getInitialState(),
      clock: seconds === null ? null : { tick: Math.floor(seconds * 30), seconds },
    },
  });

describe('selectMatchClockText', () => {
  it.each([
    [872, '14:32'],
    [0, '00:00'],
    [59.9, '00:59'],
    [6000, '100:00'],
  ])('shows %s s as %s', (seconds, text) => {
    expect(at(seconds)).toBe(text);
  });

  it('is null before the first match clock', () => {
    expect(at(null)).toBeNull();
  });
});
