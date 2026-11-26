import { describe, expect, it } from 'vitest';

import { ellipsePoints } from './ellipsePoints';

describe('ellipsePoints', () => {
  it('puts the corners on the ellipse, the first on the +x axis', () => {
    const points = ellipsePoints({ x: 10, y: 5 }, 4, 2, 4);

    expect(points).toHaveLength(4);
    expect(points[0]).toEqual({ x: 14, y: 5 });
    expect(points[1]?.x).toBeCloseTo(10);
    expect(points[1]?.y).toBeCloseTo(7);
    expect(points[2]?.x).toBeCloseTo(6);
  });

  it('gives a circle for equal radii', () => {
    for (const point of ellipsePoints({ x: 1, y: 1 }, 3, 3, 12)) {
      expect(Math.hypot(point.x - 1, point.y - 1)).toBeCloseTo(3);
    }
  });
});
