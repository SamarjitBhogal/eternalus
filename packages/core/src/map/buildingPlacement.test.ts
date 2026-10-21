import { describe, expect, it } from 'vitest';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MapGenerator } from './MapGenerator';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { MapDecoration } from '../content/maps/maps.types';
import { placePalace } from './buildingPlacement';
describe('placePalace', () => {
  it('translates authored points to a generated anchor and reads scale from the supplied wall ring', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const feature = map.features[0];
    expect(feature).toBeDefined();
    if (feature === undefined) throw new Error('Fixture has no features');
    const pieces: readonly MapDecoration[] = [
      {
        id: 'floor',
        shape: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ],
        color: 'white',
        layer: 'detail',
        buildingId: feature.id,
        visibility: 'interior',
      },
    ];
    const ring = { ...DEFAULT_MAP_LAYOUT.wallRing, radius: 120 };
    const scale = (ring.radius - ring.thickness - G.stronghold.clearance) / G.stronghold.extent;
    const placed = placePalace(pieces, feature, ring, { x: 0, y: 0 });
    expect(placed[0]).toEqual({
      ...pieces[0],
      shape: [
        feature.position,
        { x: feature.position.x + scale, y: feature.position.y },
        { x: feature.position.x, y: feature.position.y + scale },
      ],
    });
    expect(pieces[0]?.shape[0]).toEqual({ x: 0, y: 0 });
  });
});
