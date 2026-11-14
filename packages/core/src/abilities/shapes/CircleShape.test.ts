import { describe, expect, it } from 'vitest';

import { CircleShape } from './CircleShape';

const DISC = { kind: 'circle', radius: 4 } as const;
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
});
