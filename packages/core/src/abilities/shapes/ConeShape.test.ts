import { describe, expect, it } from 'vitest';

import type { AreaShape, ShapePlacement } from './AreaShape.types';
import { ConeShape } from './ConeShape';
import type { ConeSpec } from './ConeShape.types';

const cone: AreaShape<ConeSpec> = new ConeShape();
/** A 90-degree fan reaching 3 m past the body edge. */
const FAN = { kind: 'cone', reach: 3, arcDegrees: 90 } as const;
/** The whole circle of the same reach. */
const ROUND = { kind: 'cone', reach: 3, arcDegrees: 360 } as const;
const AT_ORIGIN = { x: 0, y: 0 };
/** A caster of radius 1 at the origin aiming east: the fan reaches 4 m from its centre. */
const EAST: ShapePlacement = {
  from: AT_ORIGIN,
  to: AT_ORIGIN,
  direction: { x: 1, y: 0 },
  casterRadius: 1,
};
/** The same caster with no direction (a cast aimed at itself). */
const NOWHERE: ShapePlacement = { from: AT_ORIGIN, to: AT_ORIGIN, casterRadius: 1 };
const bodyAt = (x: number, y: number) => ({ id: 'body', position: { x, y }, radius: 0.5 });
/** A 1 m square with its west edge at `west`, across the x axis. */
const squareAt = (west: number) => [
  { x: west, y: -0.5 },
  { x: west + 1, y: -0.5 },
  { x: west + 1, y: 0.5 },
  { x: west, y: 0.5 },
];

describe('ConeShape', () => {
  it('reaches its reach past the caster’s body edge along the aim (DEC-319), and no further', () => {
    expect(cone.overlaps(FAN, EAST, bodyAt(4.4, 0))).toBe(true);
    expect(cone.overlaps(FAN, EAST, bodyAt(4.6, 0))).toBe(false);
    expect(cone.overlaps(FAN, { ...EAST, casterRadius: 0 }, bodyAt(3.4, 0))).toBe(true);
    expect(cone.overlaps(FAN, { ...EAST, casterRadius: 0 }, bodyAt(3.6, 0))).toBe(false);
  });

  it('holds what its arc covers: not a body beside or behind the caster', () => {
    expect(cone.overlaps(FAN, EAST, bodyAt(2, 1.5))).toBe(true); // 37 degrees off the aim
    expect(cone.overlaps(FAN, EAST, bodyAt(0, 3))).toBe(false); // 90 degrees off
    expect(cone.overlaps(FAN, EAST, bodyAt(-2, 0))).toBe(false);
    expect(cone.overlaps(FAN, { ...EAST, direction: { x: -1, y: 0 } }, bodyAt(-2, 0))).toBe(true);
  });

  it('points nowhere with no direction: it holds only a body over its tip', () => {
    expect(cone.overlaps(FAN, NOWHERE, bodyAt(2, 0))).toBe(false);
    expect(cone.overlaps(FAN, NOWHERE, bodyAt(0.3, 0))).toBe(true);
  });

  it('is the whole circle of its reach around the caster at a full turn (DEC-206 (2))', () => {
    expect(cone.overlaps(ROUND, EAST, bodyAt(-4.4, 0))).toBe(true);
    expect(cone.overlaps(ROUND, EAST, bodyAt(0, 4.4))).toBe(true);
    expect(cone.overlaps(ROUND, EAST, bodyAt(-4.6, 0))).toBe(false);
    expect(cone.overlaps(ROUND, NOWHERE, bodyAt(-4.4, 0))).toBe(true);
  });

  it('reaches an outline in its arc, and one its tip stands in', () => {
    const { id } = bodyAt(0, 0);

    expect(cone.overlapsPolygon(FAN, EAST, squareAt(3.9), { id })).toBe(true);
    expect(cone.overlapsPolygon(FAN, EAST, squareAt(4.1), { id })).toBe(false);
    expect(cone.overlapsPolygon(FAN, EAST, squareAt(-3), { id })).toBe(false);
    expect(cone.overlapsPolygon(FAN, EAST, squareAt(-0.5), { id })).toBe(true);
    expect(cone.overlapsPolygon(ROUND, EAST, squareAt(-4.9), { id })).toBe(true);
    expect(cone.overlapsPolygon(ROUND, EAST, squareAt(-5.1), { id })).toBe(false);
  });

  it('pushes away from its tip, the caster', () => {
    expect(new ConeShape().centreFor(FAN, { ...EAST, to: { x: 2, y: 3 } })).toEqual({
      x: 2,
      y: 3,
    });
  });

  it('needs a positive reach and an arc above 0 and at most 180, or a full turn', () => {
    const shape = new ConeShape();
    const badArc = ['cone arcDegrees must be above 0 and at most 180, or 360 (the full circle)'];

    expect([90, 180, 360].map((arcDegrees) => shape.validate({ ...FAN, arcDegrees }))).toEqual([
      [],
      [],
      [],
    ]);
    expect(shape.validate({ ...FAN, arcDegrees: 0 })).toEqual(badArc);
    expect(shape.validate({ ...FAN, arcDegrees: 270 })).toEqual(badArc);
    expect(shape.validate({ ...FAN, reach: 0 })).toEqual(['cone reach must be positive']);
  });
});
