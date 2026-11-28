import { describe, expect, it } from 'vitest';

import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { scatterObstacles } from './obstacleScatter';
import type { ScatterArea } from './obstacleScatter';
import { MapRandom } from './MapRandom';
import { isInLaneFortKeepOut } from './fortInWorld';

const area = (overrides: Partial<ScatterArea>): ScatterArea => ({
  width: 3200,
  height: 1800,
  blocked: [],
  lanes: [],
  occupied: [],
  keepOut: { centre: { x: -1000, y: -1000 }, radius: 1 },
  fortKeepOuts: [],
  radiusOf: () => 10,
  ...overrides,
});

describe('scatterObstacles', () => {
  it('places obstacles when nothing is in the way', () => {
    const placed = scatterObstacles(new MapRandom(1), area({}), DEFAULT_MAP_LAYOUT.obstacles);

    expect(placed.length).toBeGreaterThan(0);
  });

  it('keeps every obstacle body off the ground round a lane tower fort (DEC-315)', () => {
    const fortKeepOuts = [{ x: 200, y: 200, width: 900, height: 900 }];
    const placed = scatterObstacles(
      new MapRandom(1),
      area({ fortKeepOuts }),
      DEFAULT_MAP_LAYOUT.obstacles,
    );

    expect(placed.length).toBeGreaterThan(0);
    for (const { position } of placed) {
      const body = { x: position.x - 10, y: position.y - 10, width: 20, height: 20 };
      expect(isInLaneFortKeepOut(body, fortKeepOuts)).toBe(false);
    }
  });
});
