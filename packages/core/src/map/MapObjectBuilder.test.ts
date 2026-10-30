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
});
