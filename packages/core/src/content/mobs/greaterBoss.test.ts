import { expect, it } from 'vitest';

import { isPointInPolygon } from '../../utils/geometry';
import { GREATER_BOSS } from './greaterBoss';

/**
 * Where #161's idle colossus art is drawn round the boss, in local metres: 48 m wide, centred on
 * it, from 24 m above it to 8 m below (768 × 512 px at 16 px a metre). Source: #161's
 * `ColossusView` (b130ec95): `COLOSSUS_SPRITE.worldWidth` 48, the idle top at `size * 0.5` above.
 */
const ART = { left: -24, right: 24, top: -24, bottom: 8 } as const;

it('keeps the body and head outlines on the art the player sees, and the head on the body (DEC-381)', () => {
  const { outline, head } = GREATER_BOSS.bodyShape;
  for (const { x, y } of [...outline, ...head]) {
    expect(x).toBeGreaterThanOrEqual(ART.left);
    expect(x).toBeLessThanOrEqual(ART.right);
    expect(y).toBeGreaterThanOrEqual(ART.top);
    expect(y).toBeLessThanOrEqual(ART.bottom);
  }
  for (const point of head) {
    expect(isPointInPolygon(point, outline)).toBe(true);
  }
});
