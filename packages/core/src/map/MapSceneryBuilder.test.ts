import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { MapDefinition } from '../content/maps/maps.types';
import { MapGenerator } from './MapGenerator';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { MapSceneryBuilder } from './MapSceneryBuilder';

const generate = (): MapDefinition => new MapGenerator().generate(createDefaultGameConfig(), 1);

const xSpan = (shape: readonly { readonly x: number }[]): number =>
  Math.max(...shape.map((point) => point.x)) - Math.min(...shape.map((point) => point.x));

describe('MapSceneryBuilder', () => {
  it('surrounds the battlefield with mountains and local, bridged biomes', () => {
    const map = generate();
    const scenery = new MapSceneryBuilder(map).build();
    for (const edge of ['north', 'south', 'west', 'east']) {
      const masses = scenery.filter(
        (piece) => piece.id.startsWith(`mountain-${edge}-`) && piece.id.endsWith('-mass'),
      );
      expect(masses.length).toBeGreaterThan(10);
      const axis = edge === 'north' || edge === 'south' ? 'x' : 'y';
      const coordinates = masses.flatMap((piece) => piece.shape.map((point) => point[axis]));
      expect(Math.min(...coordinates)).toBe(0);
      expect(Math.max(...coordinates)).toBe(axis === 'x' ? map.width : map.height);
      expect(new Set(masses.map((piece) => xSpan(piece.shape))).size).toBeGreaterThan(5);
    }
    for (const prefix of [
      'snow-pocket-',
      'lava-weathering-',
      'lava-river-',
      'lava-bridge-',
      'lake-deep-',
      'hill-',
      'tree-',
      'village-',
      'cathedral-nave-roof',
    ])
      expect(scenery.some((piece) => piece.id.startsWith(prefix))).toBe(true);
  });

  it('dresses each generated stronghold, camp and capture point at its anchor', () => {
    const map = generate();
    const scenery = new MapSceneryBuilder(map).build();
    const strongholds = map.features.filter((feature) => feature.kind === 'stronghold');
    expect(strongholds).toHaveLength(2);
    for (const { id } of strongholds) {
      const court = scenery.find((piece) => piece.id === `${id}-stronghold-court`);
      expect(court?.layer).toBe('ground');
      expect(xSpan(court?.shape ?? [])).toBeCloseTo(
        2 *
          (G.stronghold.radiusX - G.stronghold.wallThickness) *
          ((DEFAULT_MAP_LAYOUT.wallRing.radius -
            DEFAULT_MAP_LAYOUT.wallRing.thickness -
            G.stronghold.clearance) /
            G.stronghold.extent),
      );
    }
    const camps = map.features.filter((f) => f.kind === 'camp' || f.kind === 'corner-camp');
    expect(camps.length).toBeGreaterThan(0);
    for (const { id } of camps)
      expect(scenery.some((piece) => piece.id === `${id}-camp-clearing`)).toBe(true);
    const roofs = map.features
      .filter((feature) => feature.kind === 'capture-point')
      .map((feature) => scenery.find((piece) => piece.id === `${feature.id}-fort-keep-roof`));
    expect(roofs).toHaveLength(2);
    // The northern capture point is snowy, the southern one volcanic.
    expect(roofs[0]?.color).not.toBe(roofs[1]?.color);
  });

  it('is repeatable and keeps scenery inside the world with unique ids and valid polygons', () => {
    const map = generate();
    const scenery = new MapSceneryBuilder(map).build();
    expect(new MapSceneryBuilder(map).build()).toEqual(scenery);
    expect(scenery.length).toBeGreaterThan(1000);
    expect(new Set(scenery.map((piece) => piece.id)).size).toBe(scenery.length);
    for (const piece of scenery) {
      expect(piece.shape.length).toBeGreaterThanOrEqual(3);
      for (const point of piece.shape) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(map.width);
        expect(point.y).toBeLessThanOrEqual(map.height);
      }
    }
  });

  it('stretches the sketch-space scenery to a larger world', () => {
    const config = createDefaultGameConfig();
    const big = new MapGenerator().generate(
      { ...config, map: { ...config.map, worldWidth: 3200, worldHeight: 1800 } },
      1,
    );
    const nave = (map: MapDefinition): number =>
      xSpan(new MapSceneryBuilder(map).build().find((p) => p.id === 'cathedral-nave')?.shape ?? []);
    expect(nave(big)).toBeCloseTo(nave(generate()) * 2);
  });
});
