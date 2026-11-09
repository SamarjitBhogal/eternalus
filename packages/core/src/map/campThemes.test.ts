import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MapGenerator } from './MapGenerator';
import { laneCampThemes } from './campThemes';
import { distance } from '../utils/geometry';

describe('laneCampThemes', () => {
  it.each([1, 7, 42])(
    'themes both teams by home distance without changing gameplay for seed %s',
    (seed) => {
      const config = createDefaultGameConfig();
      const map = new MapGenerator().generate(config, seed);
      const before = structuredClone(map);
      const themes = laneCampThemes(map);
      for (const home of map.features.filter((feature) => feature.kind === 'stronghold')) {
        for (const lane of map.lanes) {
          const towers = map.features
            .filter(
              (feature) =>
                feature.team === home.team &&
                feature.laneId === lane.id &&
                (feature.kind === 'spawner-tower' || feature.kind === 'buff-tower'),
            )
            .sort(
              (a, b) => distance(a.position, home.position) - distance(b.position, home.position),
            );
          expect(towers.map((tower) => themes.get(tower.id))).toEqual(['heavy', 'medium']);
        }
      }
      expect(map).toEqual(before);
      expect(
        map.features
          .filter((feature) => feature.team === 'neutral')
          .every((feature) => !themes.has(feature.id)),
      ).toBe(true);
    },
  );

  it('uses the light theme for additional distant structures and supports empty maps', () => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(
      { ...config, map: { ...config.map, spawnTowersPerLane: 2 } },
      1,
    );
    expect([...laneCampThemes(map).values()].filter((theme) => theme === 'light')).toHaveLength(
      config.map.numLanes * 2,
    );
    expect(laneCampThemes({ ...map, features: [] }).size).toBe(0);
  });
});
