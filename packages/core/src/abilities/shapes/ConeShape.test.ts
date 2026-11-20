import { describe, expect, it } from 'vitest';
import { ConeShape } from './ConeShape';

const shape = { kind: 'cone', radius: 3, angleDegrees: 90 } as const;
const placement = { from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, direction: { x: 1, y: 0 } };
describe('ConeShape', () => {
  const cone = new ConeShape();
  it('uses explicit aim even for a caster-centred placement and includes touching bodies', () => {
    expect(cone.overlaps(shape, placement, { x: 2, y: 0 }, 0.1)).toBe(true);
    expect(cone.overlaps(shape, placement, { x: -2, y: 0 }, 0.1)).toBe(false);
    expect(cone.overlaps(shape, placement, { x: 3.1, y: 0 }, 0.2)).toBe(true);
    expect(cone.centreFor(shape, placement)).toEqual(placement.from);
  });
  it('hits intersecting footprints without requiring their centres to lie in the cone', () => {
    expect(
      cone.overlapsPolygon(shape, placement, [
        { x: 2, y: -10 },
        { x: 2.1, y: -10 },
        { x: 2.1, y: 10 },
        { x: 2, y: 10 },
      ]),
    ).toBe(true);
    expect(
      cone.overlapsPolygon(shape, placement, [
        { x: -4, y: -1 },
        { x: -3, y: -1 },
        { x: -3, y: 1 },
      ]),
    ).toBe(false);
  });
  it('refuses invalid radius and angles', () => {
    expect(cone.validate(shape)).toEqual([]);
    expect(cone.validate({ ...shape, radius: 0, angleDegrees: 361 })).toHaveLength(2);
    expect(cone.validate({ ...shape, angleDegrees: Number.NaN })).not.toEqual([]);
  });
});
