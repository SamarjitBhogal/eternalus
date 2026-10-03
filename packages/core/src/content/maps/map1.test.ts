import { describe, expect, it } from 'vitest';

import type { Vec2 } from '../../utils/geometry.types';
import { MAP_1 } from './map1';

const isInsideMap = (point: Vec2): boolean =>
  point.x >= 0 && point.x <= MAP_1.width && point.y >= 0 && point.y <= MAP_1.height;

describe('MAP_1', () => {
  it('gives every lane, terrain shape and feature a unique id', () => {
    const ids = [...MAP_1.lanes, ...MAP_1.terrain, ...MAP_1.features].map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps every point inside the map', () => {
    const points = [
      ...MAP_1.lanes.flatMap((lane) => lane.path),
      ...MAP_1.terrain.flatMap((piece) => piece.shape),
      ...MAP_1.features.map((feature) => feature.position),
    ];

    expect(points.every(isInsideMap)).toBe(true);
  });

  it('has exactly one capital per team', () => {
    const capitals = MAP_1.features.filter((feature) => feature.kind === 'capital');

    expect(capitals.map((capital) => capital.owner).sort()).toEqual(['dark', 'light']);
  });

  it('mirrors every light structure onto a dark structure', () => {
    const structures = MAP_1.features.filter((feature) => feature.kind === 'team-structure');
    const light = structures.filter((feature) => feature.owner === 'light');
    const dark = structures.filter((feature) => feature.owner === 'dark');

    expect(light).toHaveLength(dark.length);
    for (const feature of light) {
      const mirrored = dark.find(
        (other) =>
          other.position.x === MAP_1.width - feature.position.x &&
          other.position.y === feature.position.y,
      );
      expect(mirrored).toBeDefined();
    }
  });

  it('only uses terrain polygons with at least three points', () => {
    expect(MAP_1.terrain.every((piece) => piece.shape.length >= 3)).toBe(true);
  });
});
