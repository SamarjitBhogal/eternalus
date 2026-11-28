import { describe, expect, it } from 'vitest';

import { ZoneArea } from './ZoneArea';

/** An L of two overlapping rectangles, like the Cathedral's nave and transept. */
const NAVE = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 40 },
  { x: 0, y: 40 },
];
const TRANSEPT = [
  { x: -20, y: 10 },
  { x: 30, y: 10 },
  { x: 30, y: 20 },
  { x: -20, y: 20 },
];

describe('ZoneArea', () => {
  it('holds a point inside any of its polygons and nothing between them', () => {
    const area = new ZoneArea([NAVE, TRANSEPT]);

    expect(area.contains({ x: 5, y: 35 })).toBe(true);
    expect(area.contains({ x: -15, y: 15 })).toBe(true);
    expect(area.contains({ x: -15, y: 35 })).toBe(false);
    expect(area.contains({ x: 40, y: 15 })).toBe(false);
  });

  it('reaches from a centre to its farthest corner', () => {
    expect(new ZoneArea([NAVE, TRANSEPT]).reachFrom({ x: 5, y: 15 })).toBeCloseTo(
      Math.hypot(25, 5),
    );
  });

  it('keeps the polygons it was given', () => {
    const polygons = [NAVE];
    expect(new ZoneArea(polygons).polygons).toBe(polygons);
  });

  it('rejects no polygon, a polygon of two points and a point that is not finite', () => {
    expect(() => new ZoneArea([])).toThrow(/at least 3 finite points/);
    expect(() => new ZoneArea([NAVE.slice(0, 2)])).toThrow(/at least 3 finite points/);
    expect(() => new ZoneArea([[...NAVE.slice(0, 3), { x: Number.NaN, y: 0 }]])).toThrow(
      /at least 3 finite points/,
    );
  });
});
