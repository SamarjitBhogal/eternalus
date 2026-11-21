import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { MapDefinition, MapFeature, MapFeatureKind } from '../content/maps/maps.types';
import { ZONE_PLACEMENTS } from '../content/zones/zoneCatalogue';
import type { Polygon } from '../utils/geometry.types';
import { MapGenerationError } from './MapGenerationError';
import { MapGenerator } from './MapGenerator';
import { MapPresentationBuilder } from './MapPresentationBuilder';
import { zoneAreaOf } from './zoneArea';

const CONFIG = createDefaultGameConfig();

/** The first feature of `kind` on `map`; fails the test when there is none. */
const featureOf = (map: MapDefinition, kind: MapFeatureKind): MapFeature => {
  const feature = map.features.find((candidate) => candidate.kind === kind);
  if (feature === undefined) {
    throw new Error(`The map has no ${kind} feature.`);
  }
  return feature;
};

const boundsOf = (shape: Polygon) => ({
  left: Math.min(...shape.map(({ x }) => x)),
  right: Math.max(...shape.map(({ x }) => x)),
  top: Math.min(...shape.map(({ y }) => y)),
  bottom: Math.max(...shape.map(({ y }) => y)),
});

describe('zoneAreaOf', () => {
  it('gives every zone-placing feature kind an area on the map (DEC-145 (a))', () => {
    const map = new MapGenerator().generate(CONFIG, 1);
    const kinds = Object.keys(ZONE_PLACEMENTS) as MapFeatureKind[];
    for (const kind of kinds) {
      const features = map.features.filter((feature) => feature.kind === kind);
      expect({ kind, count: features.length }).not.toEqual({ kind, count: 0 });
      for (const feature of features) {
        expect(zoneAreaOf(map, feature).length).toBeGreaterThan(0);
      }
    }
  });

  it("covers each fort's court inside its walls and the Cathedral's floor as drawn, at a stretched world size", () => {
    const map = new MapGenerator().generate(
      { ...CONFIG, map: { ...CONFIG.map, worldWidth: 2400, worldHeight: 1200 } },
      1,
    );
    const presentation = new MapPresentationBuilder().build(map);
    const forts = map.features.filter(({ kind }) => kind === 'capture-point');
    expect(forts.length).toBeGreaterThan(0);
    for (const fort of forts) {
      const wall = (side: string) =>
        boundsOf(
          presentation.scenery.find(({ id }) => id === `${fort.id}-fort-wall-${side}`)?.shape ?? [],
        );
      // The court ends at the walls' inner faces: a unit in a gateway counts once past them.
      const court = {
        left: wall('left').right,
        right: wall('right').left,
        top: wall('top').bottom,
        bottom: wall('bottom-left').top,
      };
      const [area, ...rest] = zoneAreaOf(map, fort);
      expect(rest).toEqual([]);
      const zone = boundsOf(area ?? []);
      for (const side of ['left', 'right', 'top', 'bottom'] as const) {
        expect(zone[side]).toBeCloseTo(court[side], 6);
      }
    }
    const cathedral = featureOf(map, 'cathedral');
    expect(zoneAreaOf(map, cathedral)).toEqual(
      presentation.buildings.find(({ id }) => id === cathedral.id)?.footprint,
    );
  });

  it('rejects a feature kind that places no zone', () => {
    const map = new MapGenerator().generate(CONFIG, 1);
    expect(() => zoneAreaOf(map, featureOf(map, 'gate'))).toThrow(MapGenerationError);
  });
});
