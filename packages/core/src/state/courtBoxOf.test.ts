import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import type { MapObject } from '../content/maps/mapObjects.types';
import { fortBox } from '../map/__fixtures__/fortBody';
import { fortInWorld } from '../map/fortInWorld';
import { MapGenerator } from '../map/MapGenerator';
import { MapObjectBuilder } from '../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../map/MapPresentationBuilder';
import { courtBoxOf } from './courtBoxOf';

const wall = (x: number, y: number, width: number, height: number): MapObject => ({
  id: `wall-${String(x)}-${String(y)}`,
  kind: 'wall',
  isBlocking: true,
  partOf: 'fort',
  footprints: [
    [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ],
  ],
});

describe('courtBoxOf', () => {
  it.each([
    [1600, 900],
    [3200, 900],
  ])(
    "gives each lane tower fort's court as the box inside its wall band, per axis (DEC-324 (2); %i x %i world)",
    (width, height) => {
      const config = createDefaultGameConfig();
      const map = new MapGenerator().generate(
        { map: { ...config.map, worldWidth: width, worldHeight: height } },
        1,
      );
      const objects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
      const towers = map.features.filter(
        ({ definitionId }) => MAP_FEATURE_DEFINITIONS[definitionId]?.isCourt === true,
      );
      const { wallWidth, wallHeight } = fortInWorld(G.fort.laneTowerSize, { width, height });

      expect(towers.length).toBeGreaterThan(0);
      for (const { id } of towers) {
        const fort = fortBox(objects, id);
        const court = courtBoxOf(objects.filter(({ partOf }) => partOf === id));
        if (court === undefined) throw new Error(`No court for ${id}`);
        expect(court.x).toBeCloseTo(fort.x + wallWidth);
        expect(court.y).toBeCloseTo(fort.y + wallHeight);
        expect(court.width).toBeCloseTo(fort.width - 2 * wallWidth);
        expect(court.height).toBeCloseTo(fort.height - 2 * wallHeight);
      }
    },
  );

  it('moves no edge for a corner tower or a wall without a role: the box round the walls', () => {
    const tower = { ...wall(0, 0, 3, 3), fortWall: 'corner-tower' as const };
    expect(courtBoxOf([tower, wall(0, 9, 10, 1)])).toEqual({ x: 0, y: 0, width: 10, height: 10 });
  });

  it('is undefined for no walls', () => {
    expect(courtBoxOf([])).toBeUndefined();
  });
});
