import { describe, expect, it } from 'vitest';

import { CircleShape } from './CircleShape';

const DISC = { kind: 'circle', radius: 4 } as const;
/** A 10 m square footprint, its west wall at x = 5. */
const HOUSE = [
  { x: 5, y: -5 },
  { x: 15, y: -5 },
  { x: 15, y: 5 },
  { x: 5, y: 5 },
];
const ON_CASTER = { from: { x: 0, y: 0 }, to: { x: 10, y: 0 } };

describe('CircleShape', () => {
  it('is centred on the placement’s end point and counts a body that overlaps its edge', () => {
    const circle = new CircleShape();

    expect(circle.overlaps(DISC, ON_CASTER, { x: 14, y: 0 }, 0)).toBe(true);
    expect(circle.overlaps(DISC, ON_CASTER, { x: 14.9, y: 0 }, 1)).toBe(true);
    expect(circle.overlaps(DISC, ON_CASTER, { x: 15.1, y: 0 }, 1)).toBe(false);
    expect(circle.overlaps(DISC, ON_CASTER, { x: 0, y: 0 }, 1)).toBe(false);
  });

  it('pushes away from its centre, the placement’s end point', () => {
    const circle = new CircleShape();

    expect(circle.centreFor(DISC, ON_CASTER)).toEqual({ x: 10, y: 0 });
  });

  it('needs a positive radius', () => {
    const circle = new CircleShape();

    expect(circle.validate(DISC)).toEqual([]);
    expect(circle.validate({ kind: 'circle', radius: 0 })).toEqual([
      'circle radius must be positive',
    ]);
  });

  it('hits a footprint whose outline comes within its radius, however far its centre is', () => {
    const circle = new CircleShape();
    const at = (x: number) => ({ from: { x, y: 0 }, to: { x, y: 0 } });

    expect(circle.overlapsPolygon(DISC, at(1), HOUSE)).toBe(true); // the wall 4 m away
    expect(circle.overlapsPolygon(DISC, at(0.9), HOUSE)).toBe(false);
    expect(circle.overlapsPolygon(DISC, at(10), HOUSE)).toBe(true); // inside
  });
});
