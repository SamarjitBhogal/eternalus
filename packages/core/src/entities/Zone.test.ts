import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { MapFeatureLink } from '../components/MapFeatureLink';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import type { ZoneDefinition } from '../content/zones/zones.types';
import { Zone } from './Zone';

class FakeCapturePoint extends Zone {
  public readonly kind = 'capture-point';
}

/** A 24 x 10 floor around (800, 450): its far corners are 13 from the centre. */
const AREA = [
  [
    { x: 788, y: 445 },
    { x: 812, y: 445 },
    { x: 812, y: 455 },
    { x: 788, y: 455 },
  ],
];

const DEFINITION: ZoneDefinition = {
  id: 'fake-capture-point',
  kind: 'capture-point',
  displayName: 'Fake Capture Point',
  minimapGlyph: { shape: 'ring', size: 5, colourRole: 'objective' },
};

describe('Zone', () => {
  it('is abstract and belongs to the zone family', () => {
    expect(() => {
      Reflect.construct(Zone, ['entity-1', 'fake-capture-point']);
    }).toThrow('Zone is abstract and cannot be instantiated directly.');
    expect(new FakeCapturePoint('entity-1', 'fake-capture-point').family).toBe('zone');
  });

  it("has its area, a position with the area's reach as radius and an owner, but no collider", () => {
    const point = new FakeCapturePoint('entity-1', 'fake-capture-point');

    point.spawn({
      definition: DEFINITION,
      position: { x: 800, y: 450 },
      team: 'neutral',
      area: AREA,
    });

    expect(point.getComponent(ZoneArea).polygons).toBe(AREA);
    expect(point.getComponent(Transform).radius).toBe(13);
    expect(point.getComponent(TeamMembership).team).toBe('neutral');
    expect(point.hasComponent(Collider)).toBe(false);
  });

  it('links the map feature it was built from, and has no link without one', () => {
    const built = new FakeCapturePoint('entity-1', 'fake-capture-point');
    const loose = new FakeCapturePoint('entity-2', 'fake-capture-point');
    const placement = { definition: DEFINITION, position: { x: 800, y: 450 }, team: 'neutral' };

    built.spawn({ ...placement, area: AREA, mapFeatureId: 'capture-point-lane-1' });
    loose.spawn({ ...placement, area: AREA });

    expect(built.getComponent(MapFeatureLink).featureId).toBe('capture-point-lane-1');
    expect(loose.hasComponent(MapFeatureLink)).toBe(false);
  });

  it('refuses a spawn context without an area, or with polygons that are not point lists', () => {
    const spawnWith = (area: unknown) => () => {
      new FakeCapturePoint('entity-1', 'fake-capture-point').spawn({
        definition: DEFINITION,
        position: { x: 800, y: 450 },
        team: 'neutral',
        area,
      });
    };

    expect(spawnWith(undefined)).toThrow('Entity "entity-1" needs a spawn context with an area.');
    expect(spawnWith([[1, 2, 3]])).toThrow('needs a spawn context with an area');
    expect(spawnWith([AREA[0]?.slice(0, 2)])).toThrow(/at least 3 finite points/);
  });
});
