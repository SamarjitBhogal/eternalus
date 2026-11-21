import { describe, expect, it } from 'vitest';

import { Capturable } from '../../components/Capturable';
import { Collider } from '../../components/Collider';
import { TeamMembership } from '../../components/TeamMembership';
import { Transform } from '../../components/Transform';
import { CATHEDRAL_CAPTURE_POINT } from '../../content/zones/cathedralCapturePoint';
import { CapturePoint } from './CapturePoint';

describe('CapturePoint', () => {
  it("is a zone with a neutral Capturable, its area's reach as radius and no collider", () => {
    const point = new CapturePoint('entity-1', CATHEDRAL_CAPTURE_POINT.id);

    point.spawn({
      definition: CATHEDRAL_CAPTURE_POINT,
      position: { x: 800, y: 450 },
      team: 'neutral',
      area: [
        [
          { x: 765, y: 450 },
          { x: 835, y: 450 },
          { x: 800, y: 485 },
        ],
      ],
    });

    expect(point.kind).toBe('capture-point');
    expect(point.family).toBe('zone');
    expect(point.getComponent(Transform).radius).toBe(35);
    expect(point.getComponent(TeamMembership).team).toBe('neutral');
    expect(point.getComponent(Capturable).owner).toBe('neutral');
    expect(point.hasComponent(Collider)).toBe(false);
  });
});
