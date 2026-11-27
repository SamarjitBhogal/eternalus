import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { ProjectilePayload } from '../components/ProjectilePayload';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { Entity } from '../entities/Entity';
import { EntityStore } from '../state/EntityStore';
import type { Team } from '../teams/teams.types';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import { ArcLanding } from './ArcLanding';
import type { ShotBody } from './ProjectileSystem.types';

/** Where the shot lands, and its circle's radius there. */
const POINT: Vec2 = { x: 20, y: 0 };
const SHOT_RADIUS = 0.5;
/** A walk-on floor (a palace's, a gate's passage) that holds the landing point. */
const FLOOR: Polygon = [
  { x: 15, y: -5 },
  { x: 25, y: -5 },
  { x: 25, y: 5 },
  { x: 15, y: 5 },
];

type BodySpec = { readonly at: Vec2; readonly team: Team; readonly floor?: Polygon };

/** A body with health and a collider circle of radius 1, or a walk-on outline when `floor` is set. */
class Body extends Entity {
  public readonly kind = 'dummy';
  public readonly family = 'structure';
  protected installComponents(context: unknown): void {
    const { at, team, floor } = context as BodySpec;
    this.addComponent(new Transform(at, 1));
    this.addComponent(new Health(100));
    this.addComponent(new TeamMembership(team));
    this.addComponent(new Collider({ kind: 'circle', radius: 1 }, 'unit'));
    if (floor !== undefined) this.addComponent(new Footprint([floor], { isWalkOn: true }));
  }
}

/** A store of bodies, the shot bodies `ProjectileSystem` would gather from it, and a landing. */
const setUp = () => {
  const entities = new EntityStore();
  const add = (id: string, spec: BodySpec): Body => {
    const body = new Body(id, 'dummy');
    body.spawn(spec);
    entities.add(body);
    return body;
  };
  /** The id of the body a light shot aimed at `targetId` lands on at `POINT`, or `null`. */
  const landOn = (targetId: string | null = null): string | null => {
    const bodies: ShotBody[] = [];
    entities.forEach((entity) => {
      bodies.push({
        entity,
        transform: entity.getComponent(Transform),
        health: entity.getComponent(Health),
        membership: entity.findComponent(TeamMembership),
        outline: entities.outlineOf(entity.id) ?? null,
        collider: entity.findComponent(Collider),
      });
    });
    const payload = new ProjectilePayload({
      ownerId: 'owner',
      team: 'light',
      ownerLevel: 1,
      source: { attackerId: 'owner', kind: 'weapon', definitionId: 'turret' },
      targetId,
      impact: {
        kind: 'weapon',
        attack: {
          strategy: 'ranged-projectile',
          damage: 1,
          reach: 1,
          interval: 1,
          projectile: { projectileId: 'turret-bolt', falloff: null },
        },
      },
      origin: { x: 0, y: 0 },
    });
    return (
      new ArcLanding().bodyUnder(entities, payload, bodies, POINT, SHOT_RADIUS)?.entity.id ?? null
    );
  };
  return { add, landOn };
};

describe('ArcLanding', () => {
  it('never lands on a body that takes no damage now: the unit beside it under the point takes the hit', () => {
    const { add, landOn } = setUp();
    // First in store order, right under the point, as a forest camp or a gate before its rule.
    add('camp', { at: POINT, team: 'dark' }).getComponent(Collider).setUnbreakable(true);
    add('unit', { at: { x: 20, y: 1 }, team: 'dark' });

    expect(landOn()).toBe('unit');
    expect(landOn('camp')).toBe('unit');
  });

  it('lands on a walk-on outline under the point only when the shot aims at it', () => {
    const { add, landOn } = setUp();
    add('palace', { at: { x: 0, y: 0 }, team: 'dark', floor: FLOOR });

    expect(landOn()).toBeNull();
    expect(landOn('someone-else')).toBeNull();
    expect(landOn('palace')).toBe('palace');
  });
});
