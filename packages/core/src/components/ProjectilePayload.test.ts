import { describe, expect, it } from 'vitest';

import type { RangedAttack } from '../content/units/units.types';
import { ProjectilePayload } from './ProjectilePayload';

const ATTACK: RangedAttack = {
  strategy: 'ranged-projectile',
  damage: 40,
  reach: 15,
  interval: 27,
  projectile: { projectileId: 'magus-bolt', falloff: null },
};

describe('ProjectilePayload', () => {
  it('keeps its origin when the shooter later moves the vector it was fired from', () => {
    const shooterPosition = { x: 3, y: 4 };
    const payload = new ProjectilePayload({
      ownerId: 'entity-1',
      team: 'light',
      ownerLevel: 1,
      source: { attackerId: 'entity-1', kind: 'weapon', definitionId: 'magus-staff' },
      targetId: 'entity-2',
      impact: { kind: 'weapon', attack: ATTACK },
      origin: shooterPosition,
    });

    shooterPosition.x = 30;
    shooterPosition.y = 40;

    expect(payload.origin).toEqual({ x: 3, y: 4 });
    expect(payload.targetId).toBe('entity-2');
    expect(payload.impact).toEqual({ kind: 'weapon', attack: ATTACK });
  });
});
