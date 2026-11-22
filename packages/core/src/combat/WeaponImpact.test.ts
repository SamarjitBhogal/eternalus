import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { RangedAttack } from '../content/units/units.types';
import type { DamageSource } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { WeaponImpact } from './WeaponImpact';

const ATTACK: RangedAttack = {
  strategy: 'ranged-projectile',
  damage: 50,
  reach: 15,
  interval: 27,
  projectile: { projectileId: 'magus-bolt', falloff: { fullTo: 10, floorAt: 30, floor: 0.4 } },
};
const SOURCE = { attackerId: 'owner', kind: 'weapon', definitionId: 'magus-staff' } as const;

/** Lands one weapon shot fired at (0, 0) on `body-1` at `point`; returns the calls, in order. */
const landAt = (point: { x: number; y: number }): (string | number | DamageSource)[][] => {
  const calls: (string | number | DamageSource)[][] = [];
  const impact = new WeaponImpact(
    {
      apply: (_state, targetId, amount, source) => {
        calls.push([targetId, amount, source]);
        return { applied: false, reason: 'blocked' } as const;
      },
    },
    {
      afterHit: (_state, attackerId, targetId, attack) =>
        calls.push(['after-hit', attackerId, targetId, attack === ATTACK ? 'its attack' : 'other']),
    },
  );
  impact.land(new GameState(createDefaultGameConfig(), 1), {
    impact: { kind: 'weapon', attack: ATTACK },
    ownerId: 'owner',
    source: SOURCE,
    origin: { x: 0, y: 0 },
    bodyId: 'body-1',
    point,
  });
  return calls;
};

describe('WeaponImpact', () => {
  it("deals the full damage within the fall-off, credited to the source, then runs the on-hit effects of the shot's own attack", () => {
    expect(landAt({ x: 6, y: 8 })).toEqual([
      ['body-1', 50, SOURCE],
      ['after-hit', 'owner', 'body-1', 'its attack'],
    ]);
  });

  it('scales the damage by the fall-off over the distance from the origin to the contact point', () => {
    // 20 m: half-way through the 10..30 m fall-off, so 1 - 0.6 * 0.5 = 0.7 of the damage.
    expect(landAt({ x: 12, y: 16 })[0]?.[1]).toBeCloseTo(35);
    expect(landAt({ x: 300, y: 0 })[0]?.[1]).toBeCloseTo(20);
  });
});
