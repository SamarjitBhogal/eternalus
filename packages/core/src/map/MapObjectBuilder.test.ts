import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MapGenerator } from './MapGenerator';
import { MapPresentationBuilder } from './MapPresentationBuilder';
import { MapObjectBuilder } from './MapObjectBuilder';
import { MAP_OBJECT_HEALTH } from '../content/maps/mapObjectDefinitions';

describe('MapObjectBuilder', () => {
  it('uses explicit solid footprints, with distinct mirrored owners and indestructible terrain', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const presentation = new MapPresentationBuilder().build(map);
    const objects = new MapObjectBuilder().build(map, presentation);
    expect(objects.length).toBeGreaterThan(200);
    expect(new Set(objects.map((o) => o.id)).size).toBe(objects.length);
    for (const kind of [
      'house',
      'tree',
      'rock',
      'wall',
      'furniture',
      'camp',
      'terrain',
      'stronghold',
      'cathedral',
    ] as const)
      expect(objects.some((o) => o.kind === kind)).toBe(true);
    expect(MAP_OBJECT_HEALTH.house).toBe(100);
    expect(MAP_OBJECT_HEALTH.terrain).toBeNull();
    expect(objects.find((o) => o.id === 'light-stronghold')?.isBlocking).toBe(false);
    const tree = objects.find((o) => o.kind === 'tree' && !o.id.endsWith('-mirror'));
    expect(tree).toBeDefined();
    const mirror = objects.find((o) => o.id === `${tree?.id ?? ''}-mirror`);
    expect(mirror?.footprints).toEqual(
      tree?.footprints.map((shape) => shape.map((p) => ({ x: map.width - p.x, y: p.y }))),
    );
    expect(objects.some((o) => o.id.includes('shadow'))).toBe(false);
  });
  it('gives what a side built its team and leaves scenery teamless (DEC-121 (a))', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const objects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const teamOf = (id: string) => objects.find((o) => o.id === id)?.team;
    expect(teamOf('dark-stronghold')).toBe('dark');
    expect(teamOf('dark-palace-interior-throne')).toBe('dark');
    expect(teamOf('light-turret-0')).toBe('light');
    expect(teamOf('light-spawner-tower-lane-0-0')).toBe('light');
    expect(teamOf('cathedral-lane-1')).toBeUndefined();
    expect(teamOf('capture-point-lane-0')).toBeUndefined();
    expect(objects.filter((o) => o.kind === 'tree').every((o) => o.team === undefined)).toBe(true);
  });
  it("makes each of a lane tower's 11 fort pieces its own wall object, part of the tower, and keeps a capture point's fort one object (DEC-217 (12), DEC-227 (Q-C))", () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const objects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const tower = 'light-spawner-tower-lane-0-0';
    const walls = objects.filter(({ partOf }) => partOf === tower);
    // The tower's own object keeps only its keep.
    expect(objects.find(({ id }) => id === tower)).toMatchObject({ kind: 'spawner-tower' });
    expect(objects.find(({ id }) => id === tower)?.footprints).toHaveLength(1);
    // 4 walls, cut by the west, east and south doorways into 7, then the 4 corner towers.
    expect(walls.map(({ id }) => id).slice(0, 7)).toEqual([
      `${tower}-fort-wall-top`,
      `${tower}-fort-wall-left`,
      `${tower}-fort-wall-left-lower`,
      `${tower}-fort-wall-right`,
      `${tower}-fort-wall-right-lower`,
      `${tower}-fort-wall-bottom-left`,
      `${tower}-fort-wall-bottom-right`,
    ]);
    expect(walls.slice(7).map(({ id }) => id.startsWith(`${tower}-fort-tower-`))).toEqual([
      true,
      true,
      true,
      true,
    ]);
    for (const wall of walls) {
      expect(wall).toMatchObject({ kind: 'wall', isBlocking: true });
      expect(wall.footprints).toHaveLength(1);
      // Scenery once its tower falls: either side may break it (DEC-121 (a)).
      expect(wall.team).toBeUndefined();
    }
    expect(objects.filter(({ partOf }) => partOf === 'capture-point-lane-0')).toEqual([]);
    expect(objects.find(({ id }) => id === 'capture-point-lane-0')?.footprints).toHaveLength(12);
  });
  it('refuses a footprint with fewer than 3 points', () => {
    const map = { ...new MapGenerator().generate(createDefaultGameConfig(), 1), features: [] };
    const presentation = {
      buildings: [],
      scenery: [
        {
          id: 'sliver',
          shape: [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
          ],
          layer: 'detail' as const,
          color: 'stone',
          object: { id: 'sliver', kind: 'rock' as const, isFootprint: true },
        },
      ],
    };
    expect(() => new MapObjectBuilder().build(map, presentation)).toThrow(
      'Map object sliver has a footprint with fewer than 3 points.',
    );
  });
});
