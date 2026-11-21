import { describe, expect, it } from 'vitest';

import { cssVars } from './cssVars';

describe('cssVars', () => {
  it('passes typed custom properties through unchanged as a style object', () => {
    const vars = {
      '--segmented-bar-fill': '42%',
      '--accent': 'var(--class-magus-accent)',
    } as const;

    const style = cssVars(vars);

    expect(style).toBe(vars);
    expect(style).toEqual({
      '--segmented-bar-fill': '42%',
      '--accent': 'var(--class-magus-accent)',
    });
  });

  it('gives an empty style for no properties', () => {
    expect(cssVars({})).toEqual({});
  });
});
