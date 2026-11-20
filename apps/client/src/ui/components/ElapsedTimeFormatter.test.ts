import { describe, expect, it } from 'vitest';

import { ElapsedTimeFormatter } from './ElapsedTimeFormatter';

describe('ElapsedTimeFormatter', () => {
  const formatter = new ElapsedTimeFormatter();

  it('pads minutes and seconds', () => {
    expect(formatter.format(0)).toBe('00:00');
    expect(formatter.format(65)).toBe('01:05');
  });

  it('keeps counting minutes past an hour', () => {
    expect(formatter.format(3725)).toBe('62:05');
  });

  it('clamps negative values and drops fractions', () => {
    expect(formatter.format(-3)).toBe('00:00');
    expect(formatter.format(9.9)).toBe('00:09');
  });
});
