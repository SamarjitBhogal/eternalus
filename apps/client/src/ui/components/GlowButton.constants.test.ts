import { describe, expect, it } from 'vitest';

import { BRACE_MIRRORED_UNIT_PATH, BRACE_UNIT_PATH } from './GlowButton.constants';

describe('GlowButton braces', () => {
  /** 58:322 (node space, `use_figma`): the LOCK IN left brace, 16.114 × 43.279. */
  const FIGMA_BRACE: readonly (readonly [number, number])[] = [
    [16.114368438720703, 0],
    [13.351905277797155, 1.3812316326384848],
    [8.74780000959124, 0],
    [8.74780000959124, 13.812316326384849],
    [0, 22.099706122215757],
    [8.74780000959124, 28.085043196982525],
    [8.74780000959124, 42.81818061179303],
    [13.351905277797155, 41.43694897915454],
    [16.114368438720703, 43.27859115600586],
  ];
  const WIDTH = 16.114368438720703;
  const HEIGHT = 43.27859115600586;
  const pointsOf = (path: string): number[][] =>
    [...path.matchAll(/[ML] (\S+) (\S+)/g)].map(([, x = '', y = '']) => [Number(x), Number(y)]);

  it('scaled to 58:322 reproduces it within 0.001 px, and its mirror within the same', () => {
    const left = pointsOf(BRACE_UNIT_PATH);
    const right = pointsOf(BRACE_MIRRORED_UNIT_PATH);

    expect(left).toHaveLength(FIGMA_BRACE.length);
    expect(right).toHaveLength(FIGMA_BRACE.length);
    FIGMA_BRACE.forEach(([x, y], i) => {
      const [lx = Number.NaN, ly = Number.NaN] = left[i] ?? [];
      const [rx = Number.NaN, ry = Number.NaN] = right[i] ?? [];
      expect(Math.abs(lx * WIDTH - x)).toBeLessThan(0.001);
      expect(Math.abs(ly * HEIGHT - y)).toBeLessThan(0.001);
      expect(Math.abs((1 - rx) * WIDTH - x)).toBeLessThan(0.001);
      expect(Math.abs(ry * HEIGHT - y)).toBeLessThan(0.001);
    });
  });
});
