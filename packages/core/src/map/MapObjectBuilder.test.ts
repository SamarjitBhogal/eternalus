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
  it('lets shots cross lakes, lava rivers and camp fires, lets only lava rivers and camp fires light shots, and flags nothing else (DEC-345, DEC-373)', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const objects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const lakes = objects.filter((o) => /^lake-\d+(-mirror)?$/.test(o.id));
    const fires = objects.filter(
      (o) => /^lava-river-\d+(-mirror)?$/.test(o.id) || o.id.endsWith('-camp-fire'),
    );
    const rest = objects.filter((o) => !lakes.includes(o) && !fires.includes(o));

    expect(lakes.length).toBeGreaterThan(1);
    expect(fires.filter((o) => o.id.startsWith('lava-river-')).length).toBeGreaterThan(0);
    expect(fires.filter((o) => o.id.endsWith('-camp-fire')).length).toBeGreaterThan(1);
    expect(lakes.every((o) => o.canShotsCross === true && o.canLightShots === undefined)).toBe(
      true,
    );
    expect(fires.every((o) => o.canShotsCross === true && o.canLightShots === true)).toBe(true);
    expect(rest.some((o) => o.kind === 'rock' || o.kind === 'tree')).toBe(true);
    expect(rest.every((o) => o.canShotsCross === undefined && o.canLightShots === undefined)).toBe(
      true,
    );
  });
  it("makes only each Stronghold's outer walls and throne part of its body (HC-Q104, DEC-373 (1))", () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const objects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));

    for (const team of ['light', 'dark'] as const) {
      const stronghold = `${team}-stronghold`;
      const outer = objects.filter((o) => o.id.startsWith(`${stronghold}-outer-boundary-`));
      const inner = objects.filter((o) => o.id.startsWith(`${stronghold}-palace-boundary-`));
      const rooms = objects.filter((o) => /^[a-z]+-palace-interior-[a-z]+-wall-/.test(o.id));
      const throne = objects.find((o) => o.id === `${team}-palace-interior-throne`);
      const parts = objects.filter((o) => o.partOf === stronghold);

      expect(outer.length).toBeGreaterThan(40);
      expect(inner.length).toBeGreaterThan(40);
      expect(rooms.length).toBeGreaterThan(20);
      expect(throne?.isBlocking).toBe(true);
      expect(parts.map((o) => o.id).sort()).toEqual(
        [...outer.map((o) => o.id), `${team}-palace-interior-throne`].sort(),
      );
      expect([...inner, ...rooms].every((o) => o.partOf === undefined)).toBe(true);
    }
    // Nothing else on the map is part of a structure's body by `partOf`.
    expect(objects.filter((o) => o.partOf !== undefined).length).toBe(
      objects.filter((o) => o.partOf === 'light-stronghold' || o.partOf === 'dark-stronghold')
        .length,
    );
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
