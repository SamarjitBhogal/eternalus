import { describe, expect, it } from 'vitest';

import type { AreaShape } from './AreaShape.types';
import { HitShape } from './HitShape';
import type { HitSpec } from './HitShape.types';

const HIT = { kind: 'hit' } as const;
/** An attacker at the origin that struck a body centred at (1.5, 0). */
const STRUCK = { from: { x: 0, y: 0 }, to: { x: 1.5, y: 0 } };
const SQUARE = [
  { x: 1, y: -1 },
  { x: 2, y: -1 },
  { x: 2, y: 1 },
  { x: 1, y: 1 },
];

describe('HitShape', () => {
  it('holds the struck body only: a body centred on the struck point, not a neighbour', () => {
    const hit: AreaShape<HitSpec> = new HitShape();

    expect(hit.overlaps(HIT, STRUCK, { x: 1.5, y: 0 }, 0.5)).toBe(true);
    expect(hit.overlaps(HIT, STRUCK, { x: 1.6, y: 0 }, 0.5)).toBe(false);
    expect(hit.overlaps(HIT, STRUCK, { x: 0, y: 0 }, 0.5)).toBe(false);
  });

  it('holds a struck map object by its position, whatever its footprint (DEC-269)', () => {
    const hit: AreaShape<HitSpec> = new HitShape();
    const { to } = STRUCK;

    expect(hit.overlapsPolygon(HIT, STRUCK, SQUARE, { x: to.x, y: to.y })).toBe(true);
    expect(hit.overlapsPolygon(HIT, STRUCK, SQUARE, { x: to.x + 0.1, y: to.y })).toBe(false);
  });

  it('pushes away from the attacker', () => {
    expect(new HitShape().centreFor(HIT, STRUCK)).toEqual({ x: 0, y: 0 });
  });

  it('has nothing to validate', () => {
    expect(new HitShape().validate()).toEqual([]);
  });
});
