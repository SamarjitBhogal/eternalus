import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { ZoneDefinition } from '../content/zones/zones.types';
import { Zone } from './Zone';

class FakeCapturePoint extends Zone {
  public readonly kind = 'capture-point';
}

const DEFINITION: ZoneDefinition = {
  id: 'fake-capture-point',
  kind: 'capture-point',
  displayName: 'Fake Capture Point',
  radius: 12,
};

describe('Zone', () => {
  it('is abstract and belongs to the zone family', () => {
    expect(() => {
      Reflect.construct(Zone, ['entity-1', 'fake-capture-point']);
    }).toThrow('Zone is abstract and cannot be instantiated directly.');
    expect(new FakeCapturePoint('entity-1', 'fake-capture-point').family).toBe('zone');
  });

  it('has a position, a radius and an owner, but no collider', () => {
    const point = new FakeCapturePoint('entity-1', 'fake-capture-point');

    point.spawn({ definition: DEFINITION, position: { x: 800, y: 450 }, team: 'neutral' });

    expect(point.get(Transform).radius).toBe(12);
    expect(point.get(TeamMembership).team).toBe('neutral');
    expect(point.has(Collider)).toBe(false);
  });
});
