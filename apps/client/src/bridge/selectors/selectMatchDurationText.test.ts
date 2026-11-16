import { describe, expect, it } from 'vitest';

import { matchSlice } from '../slices/matchSlice';
import { selectMatchDurationText } from './selectMatchDurationText';

const after = (durationSeconds: number | null) =>
  selectMatchDurationText({
    // The clock ran on after the end (DEC-92); the length comes from the result alone.
    match: {
      ...matchSlice.getInitialState(),
      clock: { tick: 99_000, seconds: 3300 },
      durationSeconds,
    },
  });

describe('selectMatchDurationText', () => {
  it.each([
    [872, '14:32'],
    [119.9, '01:59'],
    [6000, '100:00'],
  ])('shows a %s s match as %s', (seconds, text) => {
    expect(after(seconds)).toBe(text);
  });

  it('is null before the match ends', () => {
    expect(after(null)).toBeNull();
  });
});
