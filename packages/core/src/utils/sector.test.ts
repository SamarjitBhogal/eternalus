import { describe, expect, it } from 'vitest';

import { cos } from './deterministicMath';
import { RADIANS_PER_DEGREE } from './geometry';
import type { Polygon } from './geometry.types';
import { doesSectorReachDisc, doesSectorReachPolygon, isPointInSector } from './sector';

const ORIGIN = { x: 0, y: 0 };
const EAST = { x: 1, y: 0 };
const RADIUS = 10;
/** Half of a 90 degree wedge facing east. */
const COS_45 = cos(45 * RADIANS_PER_DEGREE);
/** Half of a 180 degree wedge (a half disc) facing east. */
const COS_90 = cos(90 * RADIANS_PER_DEGREE);

const disc = (x: number, y: number, r: number, cosHalf = COS_45) =>
  doesSectorReachDisc(ORIGIN, EAST, RADIUS, cosHalf, { x, y }, r);
const polygon = (shape: Polygon, cosHalf = COS_45) =>
  doesSectorReachPolygon(ORIGIN, EAST, RADIUS, cosHalf, shape);

const rect = (x0: number, y0: number, x1: number, y1: number): Polygon => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];

describe('isPointInSector', () => {
  it('holds points inside the radius and the angle, edges included', () => {
    expect(isPointInSector(ORIGIN, EAST, RADIUS, COS_45, { x: 5, y: 0 })).toBe(true);
    expect(isPointInSector(ORIGIN, EAST, RADIUS, COS_45, { x: 10, y: 0 })).toBe(true);
    expect(isPointInSector(ORIGIN, EAST, RADIUS, COS_45, { x: 3, y: 2.9 })).toBe(true);
    expect(isPointInSector(ORIGIN, EAST, RADIUS, COS_45, ORIGIN)).toBe(true);
  });

  it('rejects points beyond the radius or outside the angle', () => {
    expect(isPointInSector(ORIGIN, EAST, RADIUS, COS_45, { x: 10.01, y: 0 })).toBe(false);
    expect(isPointInSector(ORIGIN, EAST, RADIUS, COS_45, { x: 3, y: 3.1 })).toBe(false);
    expect(isPointInSector(ORIGIN, EAST, RADIUS, COS_45, { x: -1, y: 0 })).toBe(false);
  });
});

describe('doesSectorReachDisc', () => {
  it('reaches a disc whose edge is just inside the radius, not one just outside', () => {
    expect(disc(10.99, 0, 1)).toBe(true);
    expect(disc(11.01, 0, 1)).toBe(false);
  });

  it('reaches a disc just outside the angle that touches an edge, not one clear of it', () => {
    // The upper edge is the line y = x. The centre (5, 6) is outside the angle and 0.707 from it.
    expect(disc(5, 6, 0.75)).toBe(true);
    expect(disc(5, 6, 0.7)).toBe(false);
  });

  it('reaches a disc that holds the tip, even when its centre is behind the attacker', () => {
    expect(disc(-0.5, 0, 1)).toBe(true);
    expect(disc(-1.5, 0, 1)).toBe(false);
  });

  it('follows the direction it is given', () => {
    const north = { x: 0, y: 1 };
    expect(doesSectorReachDisc(ORIGIN, north, RADIUS, COS_45, { x: 0, y: 5 }, 0.5)).toBe(true);
    expect(doesSectorReachDisc(ORIGIN, north, RADIUS, COS_45, { x: 5, y: 0 }, 0.5)).toBe(false);
  });

  it('treats 180 degrees as the front half disc', () => {
    expect(disc(1, 5, 0.5, COS_90)).toBe(true);
    expect(disc(-3, 5, 0.5, COS_90)).toBe(false);
    expect(disc(-0.4, 0, 0.5, COS_90)).toBe(true);
  });
});

describe('doesSectorReachPolygon', () => {
  it('reaches a polygon with a corner inside the sector', () => {
    expect(polygon(rect(5, -1, 7, 1))).toBe(true);
  });

  it('reaches a polygon whose edge crosses the wedge with no corner inside it', () => {
    // A thin wall at x = 4 from y = -50 to 50: every corner is far outside, its edge crosses.
    expect(polygon(rect(4, -50, 4.5, 50))).toBe(true);
  });

  it('does not reach a wall beyond the radius or behind the attacker', () => {
    expect(polygon(rect(12, -50, 13, 50))).toBe(false);
    expect(polygon(rect(-4, -50, -3, 50))).toBe(false);
  });

  it('does not reach a polygon beside the wedge', () => {
    expect(polygon(rect(2, 5, 4, 7))).toBe(false);
  });

  it('does not report a sector that lies wholly inside a polygon (the caller tests the tip)', () => {
    expect(polygon(rect(-100, -100, 100, 100))).toBe(false);
  });
});
