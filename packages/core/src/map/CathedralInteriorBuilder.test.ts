import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { MapDefinition } from '../content/maps/maps.types';
import { CathedralInteriorBuilder } from './CathedralInteriorBuilder';
import { MapGenerator } from './MapGenerator';

const generate = (): MapDefinition => new MapGenerator().generate(createDefaultGameConfig(), 1);

describe('CathedralInteriorBuilder', () => {
  it('provides a rotunda interior with rooms, pews, columns and an entrance', () => {
    const interior = new CathedralInteriorBuilder().build(generate());
    const scenery = interior?.scenery ?? [];

    expect(interior?.map.id).toBe('grand-cathedral-interior');
    expect(interior?.map.width).toBe(1800);
    expect(interior?.map.height).toBe(2200);
    expect(
      interior?.map.features.map(({ id, kind, team, position }) => [id, kind, team, position]),
    ).toEqual([['cathedral-interior-capture', 'capture-point', 'neutral', { x: 900, y: 1100 }]]);
    expect(scenery.find((piece) => piece.id === 'rotunda-floor')?.shape).toHaveLength(64);
    for (const prefix of [
      'pew-',
      'column-',
      'west-window-',
      'east-window-',
      'west-chapel',
      'entry-door',
    ])
      expect(scenery.some((piece) => piece.id.startsWith(prefix))).toBe(true);
    for (const room of [
      'library',
      'sacristy',
      'vestry',
      'reliquary',
      'west-cloister',
      'east-cloister',
    ])
      expect(scenery.some((piece) => piece.id === `${room}-floor`)).toBe(true);
    expect(scenery.filter((piece) => piece.id.startsWith('room-doorway-'))).toHaveLength(8);
    // Pews and columns ring the capture court and leave it clear.
    expect(
      scenery
        .filter((piece) => piece.id.startsWith('pew-') || piece.id.startsWith('column-'))
        .every((piece) => piece.shape.every((p) => Math.hypot(p.x - 900, p.y - 1100) > 200)),
    ).toBe(true);
    expect(
      scenery.every((piece) =>
        piece.shape.every((p) => p.x >= 0 && p.y >= 0 && p.x <= 1800 && p.y <= 2200),
      ),
    ).toBe(true);
  });

  it('enters through the cathedral footprint, scaled with the world', () => {
    const map = generate();
    const cathedral = map.features.find((feature) => feature.kind === 'cathedral');
    const config = createDefaultGameConfig();
    const big = new MapGenerator().generate(
      { ...config, map: { ...config.map, worldWidth: 3200, worldHeight: 1800 } },
      1,
    );

    expect(new CathedralInteriorBuilder().build(map)?.entry).toEqual({
      center: cathedral?.position,
      halfWidth: 100,
      halfHeight: 118,
    });
    expect(new CathedralInteriorBuilder().build(big)?.entry).toMatchObject({
      halfWidth: 200,
      halfHeight: 236,
    });
  });

  it('returns null for a map without a cathedral', () => {
    const map = generate();
    const withoutCathedral = {
      ...map,
      features: map.features.filter((feature) => feature.kind !== 'cathedral'),
    };

    expect(new CathedralInteriorBuilder().build(withoutCathedral)).toBeNull();
  });
});
