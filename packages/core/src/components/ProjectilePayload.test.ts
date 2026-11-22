import { describe, expect, it } from 'vitest';

import type { RangedAttack } from '../content/units/units.types';
import { ProjectilePayload } from './ProjectilePayload';
import type { ProjectilePayloadData } from './ProjectilePayload.types';

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

  it('lists its hashed fields in a fixed order; an ability shot adds its cast level', () => {
    const shot = (impact: ProjectilePayloadData['impact']): ProjectilePayload =>
      new ProjectilePayload({
        ownerId: 'entity-1',
        team: 'light',
        source: { attackerId: 'entity-1', kind: impact.kind, definitionId: 'source-1' },
        targetId: 'entity-2',
        impact,
        origin: { x: 3, y: 4 },
      });
    const ability = {
      kind: 'ability',
      abilityId: 'hamstring',
      slot: 'ability-3',
      onHit: [],
      scaling: {},
      casterLevel: 5,
    } as const;

    expect(shot({ kind: 'weapon', attack: ATTACK }).fields).toEqual([
      'entity-1',
      'entity-2',
      'weapon',
      'source-1',
      3,
      4,
    ]);
    expect(shot(ability).fields).toEqual(['entity-1', 'entity-2', 'ability', 'source-1', 3, 4, 5]);
  });
});
