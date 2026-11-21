import { describe, expect, it } from 'vitest';

import { colorWithAlpha } from './colorWithAlpha';

describe('colorWithAlpha', () => {
  it('appends the opacity as a hex byte', () => {
    expect(colorWithAlpha('#6db9bc', 1)).toBe('#6db9bcff');
    expect(colorWithAlpha('#6db9bc', 0)).toBe('#6db9bc00');
    expect(colorWithAlpha('#6db9bc', 0.5)).toBe('#6db9bc80');
  });

  it('clamps an opacity outside 0 to 1', () => {
    expect(colorWithAlpha('#000000', 2)).toBe('#000000ff');
    expect(colorWithAlpha('#000000', -1)).toBe('#00000000');
  });
});
