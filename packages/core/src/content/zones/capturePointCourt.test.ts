import { describe, expect, it } from 'vitest';

import { BUILDING_GEOMETRY } from '../maps/buildingGeometry';
import { CAPTURE_POINT_BOSS } from '../mobs/capturePointBoss';
import { CAPTURE_POINT_COURT } from './capturePointCourt';

describe('CAPTURE_POINT_COURT', () => {
  const {
    capturePointSize: size,
    wallDivisor,
    keepWidthDivisor,
    keepHeightDivisor,
  } = BUILDING_GEOMETRY.fort;
  const { leashRadius, postGap, acquisitionRadius } = CAPTURE_POINT_COURT;

  it("leashes to the court's inscribed circle, inside the walls", () => {
    expect(leashRadius).toBeCloseTo(size / 2 - size / wallDivisor);
  });

  it("puts the posts clear of the keep's corners and the walls, for the boss's whole body", () => {
    const keepCorner = Math.hypot(size / keepWidthDivisor / 2, size / keepHeightDivisor / 2);
    const body = CAPTURE_POINT_BOSS.footprintRadius;

    expect(postGap - body).toBeGreaterThan(keepCorner);
    expect(postGap + body).toBeLessThan(leashRadius);
    expect(acquisitionRadius).toBe(postGap + leashRadius);
  });
});
