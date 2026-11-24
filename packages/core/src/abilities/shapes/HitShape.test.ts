import { describe, expect, it } from 'vitest';

import type { AreaShape } from './AreaShape.types';
import { HitShape } from './HitShape';
import type { HitSpec } from './HitShape.types';

const HIT = { kind: 'hit' } as const;
/** An attacker at the origin that struck the body `struck`, centred at (1.5, 0). */
const STRUCK = { from: { x: 0, y: 0 }, to: { x: 1.5, y: 0 }, targetId: 'struck' };
const SQUARE = [
  { x: 1, y: -1 },
  { x: 2, y: -1 },
  { x: 2, y: 1 },
  { x: 1, y: 1 },
];

describe('HitShape', () => {
  it('holds the struck body only, not another body on the very same point', () => {
    const hit: AreaShape<HitSpec> = new HitShape();
    const at = STRUCK.to;

    expect(hit.overlaps(HIT, STRUCK, { id: 'struck', position: at, radius: 0.5 })).toBe(true);
    expect(hit.overlaps(HIT, STRUCK, { id: 'other', position: at, radius: 0.5 })).toBe(false);
  });

  it('holds a struck map object, whatever its footprint (DEC-269), and no other', () => {
    const hit: AreaShape<HitSpec> = new HitShape();

    expect(hit.overlapsPolygon(HIT, STRUCK, SQUARE, { id: 'struck' })).toBe(true);
    expect(hit.overlapsPolygon(HIT, STRUCK, SQUARE, { id: 'other' })).toBe(false);
  });

  it('holds nothing when no body was struck', () => {
    const { from, to } = STRUCK;

    expect(
      new HitShape().overlaps(HIT, { from, to }, { id: 'struck', position: to, radius: 1 }),
    ).toBe(false);
  });

  it('pushes away from the attacker', () => {
    expect(new HitShape().centreFor(HIT, STRUCK)).toEqual({ x: 0, y: 0 });
  });

  it('is valid only in an onHit list, the one list placed on a struck body (HC-B26 (5))', () => {
    expect(new HitShape().validate(HIT, { isOnHit: true })).toEqual([]);
    expect(new HitShape().validate(HIT, { isOnHit: false })).toEqual([
      'a "hit" shape holds a body only in an onHit list (a shot\'s or a status\'s)',
    ]);
  });
});
