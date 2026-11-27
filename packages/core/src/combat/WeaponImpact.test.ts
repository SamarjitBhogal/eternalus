import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { ProjectileSplash, RangedAttack } from '../content/units/units.types';
import { Entity } from '../entities/Entity';
import type { EntityId } from '../state/EntityStore.types';
import type { DamageSource } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import { WeaponImpact } from './WeaponImpact';

const ATTACK: RangedAttack = {
  strategy: 'ranged-projectile',
  damage: 50,
  reach: 15,
  interval: 27,
  projectile: { projectileId: 'magus-bolt', falloff: { fullTo: 10, floorAt: 30, floor: 0.4 } },
};
const SPLASH: ProjectileSplash = { radius: 4, edgeMultiplier: 0.5 };
const BLAST: RangedAttack = {
  ...ATTACK,
  projectile: { projectileId: 'tower-orb', falloff: null, splash: SPLASH },
};
const SOURCE = { attackerId: 'owner', kind: 'weapon', definitionId: 'magus-staff' } as const;

/** A body with health and a team, of a unit family or a structure, as `spawn` describes it. */
class Body extends Entity {
  public readonly kind = 'dummy';
  public family = 'mob';
  protected installComponents(context: unknown): void {
    const { at, team, family } = context as { at: Vec2; team: Team; family: string };
    this.family = family;
    this.addComponent(new Transform(at, 1));
    this.addComponent(new Health(1000));
    this.addComponent(new TeamMembership(team));
    this.addComponent(new Collider({ kind: 'circle', radius: 1 }, 'unit'));
  }
}

/**
 * Lands one weapon shot of `attack`, fired at (0, 0) by the light `owner`, on `bodyId` at `point`,
 * after `place` adds bodies to the state; returns the calls in order and the ids it landed on.
 */
const landAt = (
  point: Vec2,
  {
    attack = ATTACK,
    bodyId = 'body-1',
    place = () => undefined,
  }: {
    attack?: RangedAttack;
    bodyId?: EntityId | null;
    place?: (add: (id: string, at: Vec2, team: Team, family?: string) => Body) => void;
  } = {},
) => {
  const state = new GameState(createDefaultGameConfig(), 1);
  place((id, at, team, family = 'mob') => {
    const body = new Body(id, 'dummy');
    body.spawn({ at, team, family });
    state.entities.add(body);
    return body;
  });
  const calls: (string | number | DamageSource)[][] = [];
  const impact = new WeaponImpact(
    {
      apply: (_state, targetId, amount, source) => {
        calls.push([targetId, amount, source]);
        return { applied: false, reason: 'blocked' } as const;
      },
    },
    {
      afterHit: (_state, attackerId, targetId, struck) =>
        calls.push(['after-hit', attackerId, targetId, struck === attack ? 'its attack' : 'other']),
    },
  );
  const landed = impact.land(state, {
    impact: { kind: 'weapon', attack },
    ownerId: 'owner',
    team: 'light',
    ownerLevel: 1,
    source: SOURCE,
    origin: { x: 0, y: 0 },
    bodyId,
    point,
  });
  return { calls, landed };
};

describe('WeaponImpact', () => {
  it("deals the full damage within the fall-off, credited to the source, then runs the on-hit effects of the shot's own attack", () => {
    expect(landAt({ x: 6, y: 8 }).calls).toEqual([
      ['body-1', 50, SOURCE],
      ['after-hit', 'owner', 'body-1', 'its attack'],
    ]);
  });

  it('scales the damage by the fall-off over the distance from the origin to the contact point', () => {
    // 20 m: half-way through the 10..30 m fall-off, so 1 - 0.6 * 0.5 = 0.7 of the damage.
    expect(landAt({ x: 12, y: 16 }).calls[0]?.[1]).toBeCloseTo(35);
    expect(landAt({ x: 300, y: 0 }).calls[0]?.[1]).toBeCloseTo(20);
  });

  it('returns the body a plain shot landed on, and nothing for bare ground', () => {
    expect(landAt({ x: 6, y: 8 }).landed).toEqual(['body-1']);
    expect(landAt({ x: 6, y: 8 }, { bodyId: null })).toEqual({ calls: [], landed: [] });
  });

  it('bursts on each enemy unit in the blast, in id order, scaled down to the edge multiplier by its distance from the hit point', () => {
    const { calls, landed } = landAt(
      { x: 20, y: 0 },
      {
        attack: BLAST,
        bodyId: null,
        place: (add) => {
          add('c-edge', { x: 24.5, y: 0 }, 'dark');
          add('a-centre', { x: 20, y: 0 }, 'dark');
          add('b-half', { x: 20, y: 2 }, 'neutral');
        },
      },
    );

    // Edge share 1 - (1 - 0.5) x min(1, d / 4): 1 at the centre, 0.75 at 2 m, 0.5 at 4.5 m (whose
    // circle still meets the blast).
    expect(landed).toEqual(['a-centre', 'b-half', 'c-edge']);
    expect(calls.filter(([id]) => id !== 'after-hit')).toEqual([
      ['a-centre', 50, SOURCE],
      ['b-half', 37.5, SOURCE],
      ['c-edge', 25, SOURCE],
    ]);
    expect(calls.filter(([id]) => id === 'after-hit').map(([, , target]) => target)).toEqual(
      landed,
    );
  });

  it('leaves the owner, an ally, a structure, a unit that takes no damage and a unit outside the blast alone, whatever body it landed on', () => {
    const { calls, landed } = landAt(
      { x: 20, y: 0 },
      {
        attack: BLAST,
        bodyId: 'tower',
        place: (add) => {
          add('owner', { x: 20, y: 1 }, 'light');
          add('ally', { x: 20, y: -1 }, 'light');
          add('tower', { x: 21, y: 0 }, 'dark', 'structure');
          add('camp', { x: 19, y: 0 }, 'dark').getComponent(Collider).setUnbreakable(true);
          add('outside', { x: 26, y: 0 }, 'dark');
          add('enemy', { x: 22, y: 0 }, 'dark');
        },
      },
    );

    expect(landed).toEqual(['enemy']);
    expect(calls.map(([id, , target]) => (id === 'after-hit' ? target : id))).toEqual([
      'enemy',
      'enemy',
    ]);
  });
});
