import { describe, expect, it } from 'vitest';

import { MARCHING_ONLY } from '../../__fixtures__/hordeMatches';
import type { MapObject } from '../../content/maps/mapObjects.types';
import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import { TWO_LANE_MAP } from '../../state/__fixtures__/twoLaneMap';
import { doesCircleOverlapPolygon } from '../../utils/circlePolygon';
import { abilityMatch } from '../__fixtures__/abilityMatch';

/**
 * A new Shield Wall pushes the units it covers out of the walls (DEC-363), and no push moves a
 * unit into a map object. The light Sentinel at (110, 54) casts east: its wall covers x 112.5 to
 * 113.5 and y 52 to 56, and with it the dark Sentinel at (113.1, 54.5). The shortest way out of
 * the wall is east, into the pocket between two rocks, which is narrower than the Sentinel.
 */
const rock = (id: string, x: number, y: number, width: number, height: number): MapObject => ({
  id,
  kind: 'rock',
  isBlocking: true,
  footprints: [
    [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ],
  ],
});
const ROCKS = [rock('rock-a', 114.8, 52.2, 3.3, 1.7), rock('rock-b', 115.7, 54.2, 3.5, 3.8)];
const EAST = { x: 130, y: 54 };

describe('Shield Wall push (scenario)', () => {
  it('pushes a covered unit toward a pocket of rocks without moving it into a rock', () => {
    // Every invariant is checked each tick and throws (`no-map-object-overlap` is one of them).
    const match = abilityMatch(
      [
        { kind: 'sentinel', team: 'light', at: { x: 110, y: 54 } },
        { kind: 'sentinel', team: 'dark', at: { x: 113.1, y: 54.5 } },
      ],
      {
        content: MARCHING_ONLY,
        world: { map: TWO_LANE_MAP, mapObjects: ROCKS },
        debug: TEST_DEBUG_CONFIG,
      },
    );
    const [light = '', dark = ''] = match.ids;

    match.cast(light, 'ability-3', EAST);
    match.run(1);

    const pushed = match.sim.snapshot().entities.find((entity) => entity.id === dark)?.transform;
    if (pushed === undefined || pushed === null) throw new Error('the dark Sentinel has no body');
    expect(pushed.x).toBeGreaterThan(113.1);
    for (const { footprints } of ROCKS)
      for (const footprint of footprints)
        expect(doesCircleOverlapPolygon(pushed, pushed.radius, footprint)).toBe(false);
    expect(() => {
      match.run(60);
    }).not.toThrow();
  });
});
