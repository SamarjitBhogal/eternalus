import { describe, expect, it, vi } from 'vitest';

import { Collider } from '../components/Collider';
import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { Entity } from '../entities/Entity';
import type { Team } from '../teams/teams.types';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import { AreaHitQuery } from './AreaHitQuery';
import type { AreaAim, HitArea } from './AreaHitQuery.types';
import { EntityStore } from './EntityStore';

/** How a test body is built: its place, team, family, outline and whether it takes damage. */
type BodySpec = {
  readonly at: Vec2;
  readonly team?: Team;
  readonly family?: string;
  readonly radius?: number;
  readonly outline?: readonly Polygon[];
  readonly isWalkOn?: boolean;
  readonly isUnbreakable?: boolean;
  readonly hasHealth?: boolean;
};

/** A body with a position, health, an optional team, collider and outline; a structure unless told. */
class Body extends Entity {
  public readonly kind = 'body';
  public family = 'structure';

  protected installComponents(context: unknown): void {
    const spec = context as BodySpec;
    const radius = spec.radius ?? 1;
    this.family = spec.family ?? 'structure';
    this.addComponent(new Transform(spec.at, radius));
    if (spec.hasHealth !== false) this.addComponent(new Health(100));
    if (spec.team !== undefined) this.addComponent(new TeamMembership(spec.team));
    const collider = new Collider({ kind: 'circle', radius }, 'unit');
    collider.setUnbreakable(spec.isUnbreakable === true);
    this.addComponent(collider);
    if (spec.outline !== undefined) {
      this.addComponent(new Footprint(spec.outline, { isWalkOn: spec.isWalkOn === true }));
    }
  }
}

const square = (x: number, y: number, size: number): Polygon => [
  { x, y },
  { x: x + size, y },
  { x: x + size, y: y + size },
  { x, y: y + size },
];

/** A palace floor (walk-on), 10 m square from (0, -5); the attacker is light. */
const FLOOR = square(0, -5, 10);
const NO_AIM: AreaAim = { targetId: null, point: null };

/** An area that holds exactly the bodies with the given ids. */
const holding = (...ids: string[]): HitArea => ({
  overlapsBody: ({ id }) => ids.includes(id),
  overlapsOutline: (_polygon, { id }) => ids.includes(id),
});

const setUp = (attackerAt: Vec2 = { x: -2, y: 0 }) => {
  const entities = new EntityStore();
  const add = (id: string, spec: BodySpec): Body => {
    const body = new Body(id, 'body');
    body.spawn(spec);
    entities.add(body);
    return body;
  };
  const attacker = add('attacker', { at: attackerAt, team: 'light', family: 'legend' });
  const query = new AreaHitQuery();
  const find = (area: HitArea, aim: AreaAim = NO_AIM) =>
    query.find(entities, attacker.id, area, aim, { team: 'enemies' });
  return { entities, add, attacker, query, find };
};

describe('AreaHitQuery.find', () => {
  it('asks a circle body by its circle and an outline body by each polygon, with the body id', () => {
    const { add, find } = setUp();
    add('round', { at: { x: 3, y: 4 }, team: 'dark', radius: 0.5 });
    const wall = add('wall', {
      at: { x: 20, y: 0 },
      team: 'dark',
      outline: [square(20, 0, 1), square(22, 0, 1)],
    });
    const overlapsBody = vi.fn(() => true);
    const overlapsOutline = vi.fn(() => false);

    const hits = find({ overlapsBody, overlapsOutline });

    expect(hits).toEqual(['round']);
    expect(overlapsBody).toHaveBeenCalledWith({
      id: 'round',
      position: { x: 3, y: 4 },
      radius: 0.5,
    });
    expect(overlapsOutline).toHaveBeenCalledTimes(2);
    expect(overlapsOutline).toHaveBeenNthCalledWith(1, square(20, 0, 1), {
      id: wall.id,
      position: { x: 20, y: 0 },
    });
    expect(overlapsOutline).toHaveBeenNthCalledWith(2, square(22, 0, 1), {
      id: wall.id,
      position: { x: 20, y: 0 },
    });
  });

  it('returns the bodies the area touches in id order, filtered by team relative to the attacker', () => {
    const { entities, add, attacker, query } = setUp();
    add('b-enemy', { at: { x: 1, y: 0 }, team: 'dark' });
    add('a-ally', { at: { x: 1, y: 1 }, team: 'light' });
    add('c-teamless', { at: { x: 1, y: 2 } });
    add('d-untouched', { at: { x: 1, y: 3 }, team: 'dark' });
    const area = holding('a-ally', 'b-enemy', 'c-teamless', attacker.id);
    const run = (team: 'enemies' | 'allies' | 'all', includeSelf?: boolean) =>
      query.find(entities, attacker.id, area, NO_AIM, {
        team,
        ...(includeSelf === undefined ? {} : { includeSelf }),
      });

    // A body with no team is nobody's ally, so it counts as an enemy.
    expect(run('enemies')).toEqual(['b-enemy', 'c-teamless']);
    expect(run('allies')).toEqual(['a-ally']);
    expect(run('all')).toEqual(['a-ally', 'b-enemy', 'c-teamless']);
    expect(run('allies', true)).toEqual(['a-ally', attacker.id]);
  });

  it('hits only units (Legends, mobs, bosses) when the filter asks for units only (a blast, DEC-342)', () => {
    const { entities, add, attacker, query } = setUp();
    for (const family of ['legend', 'mob', 'boss', 'structure', 'obstacle']) {
      add(family, { at: { x: 1, y: 0 }, team: 'dark', family });
    }
    const area = holding('legend', 'mob', 'boss', 'structure', 'obstacle');
    const run = (isUnitsOnly?: boolean) =>
      query.find(entities, attacker.id, area, NO_AIM, {
        team: 'enemies',
        ...(isUnitsOnly === undefined ? {} : { isUnitsOnly }),
      });

    expect(run(true)).toEqual(['boss', 'legend', 'mob']);
    expect(run(false)).toEqual(['boss', 'legend', 'mob', 'obstacle', 'structure']);
    expect(run()).toEqual(run(false));
  });

  it('skips a dead body and a body without health', () => {
    const { add, find } = setUp();
    const dead = add('dead', { at: { x: 1, y: 0 }, team: 'dark' });
    dead.getComponent(Health).applyDamage(1000);
    add('scenery', { at: { x: 1, y: 1 }, team: 'dark', hasHealth: false });

    expect(find(holding('dead', 'scenery'))).toEqual([]);
  });

  it('never returns a body that takes no damage now, not even the locked target (rule 2)', () => {
    const { add, find } = setUp();
    const gate = add('gate', { at: { x: 1, y: 0 }, team: 'dark', isUnbreakable: true });

    expect(find(holding('gate'))).toEqual([]);
    expect(find(holding('gate'), { targetId: 'gate', point: null })).toEqual([]);

    gate.getComponent(Collider).setUnbreakable(false);
    expect(find(holding('gate'))).toEqual(['gate']);
  });

  it('hits a solid outline the area touches with no aim at all', () => {
    const { add, find } = setUp();
    add('fort', { at: { x: 5, y: 0 }, team: 'dark', outline: [FLOOR] });

    expect(find(holding('fort'))).toEqual(['fort']);
  });

  it('hits a walk-on outline only when aimed at: locked, or the aim point on it from outside (rule 1)', () => {
    const { add, find } = setUp();
    add('floor', { at: { x: 5, y: 0 }, team: 'dark', outline: [FLOOR], isWalkOn: true });
    const area = holding('floor');

    expect(find(area)).toEqual([]);
    expect(find(area, { targetId: 'floor', point: null })).toEqual(['floor']);
    expect(find(area, { targetId: null, point: { x: 5, y: 0 } })).toEqual(['floor']);
    expect(find(area, { targetId: null, point: { x: -5, y: 0 } })).toEqual([]);
    // The area must still reach it: aiming at it is not enough.
    expect(find(holding(), { targetId: null, point: { x: 5, y: 0 } })).toEqual([]);
  });

  it('does not hit a walk-on outline aimed at from inside it, unless it is the locked target', () => {
    const { add, find } = setUp({ x: 2, y: 0 });
    add('floor', { at: { x: 5, y: 0 }, team: 'dark', outline: [FLOOR], isWalkOn: true });
    const area = holding('floor');

    expect(find(area, { targetId: null, point: { x: 5, y: 0 } })).toEqual([]);
    expect(find(area, { targetId: 'floor', point: null })).toEqual(['floor']);
  });

  it('does not take the aim point for the floor when a living enemy unit covers it (findUnitAt)', () => {
    const covered = setUp();
    covered.add('floor', { at: { x: 5, y: 0 }, team: 'dark', outline: [FLOOR], isWalkOn: true });
    covered.add('defender', { at: { x: 5, y: 0.5 }, team: 'dark', family: 'legend' });

    expect(
      covered.find(holding('floor', 'defender'), { targetId: null, point: { x: 5, y: 0 } }),
    ).toEqual(['defender']);

    // An ally, a dead enemy, a structure or an enemy unit beside the point leave the aim on the floor.
    const open = setUp();
    open.add('floor', { at: { x: 5, y: 0 }, team: 'dark', outline: [FLOOR], isWalkOn: true });
    open.add('ally', { at: { x: 5, y: 0 }, team: 'light', family: 'mob' });
    open
      .add('corpse', { at: { x: 5, y: 0 }, team: 'dark', family: 'mob' })
      .getComponent(Health)
      .applyDamage(1000);
    open.add('tower', { at: { x: 5, y: 0 }, team: 'dark', family: 'structure' });
    open.add('beside', { at: { x: 5, y: 1.5 }, team: 'dark', family: 'mob' });

    expect(open.find(holding('floor'), { targetId: null, point: { x: 5, y: 0 } })).toEqual([
      'floor',
    ]);
  });
});

describe('AreaHitQuery.aimedBodyOf', () => {
  it('names the enemy walk-on outline the aim point is on, from outside it', () => {
    const { entities, add, attacker, query } = setUp();
    add('floor', { at: { x: 5, y: 0 }, team: 'dark', outline: [FLOOR], isWalkOn: true });

    expect(query.aimedBodyOf(entities, attacker.id, { x: 5, y: 0 })).toBe('floor');
    expect(query.aimedBodyOf(entities, attacker.id, { x: -5, y: 0 })).toBeNull();
    expect(query.aimedBodyOf(entities, 'nobody', { x: 5, y: 0 })).toBeNull();
  });

  it('names nothing from inside the outline or with an enemy unit under the point', () => {
    const inside = setUp({ x: 2, y: 0 });
    inside.add('floor', { at: { x: 5, y: 0 }, team: 'dark', outline: [FLOOR], isWalkOn: true });
    expect(
      inside.query.aimedBodyOf(inside.entities, inside.attacker.id, { x: 5, y: 0 }),
    ).toBeNull();

    const covered = setUp();
    covered.add('floor', { at: { x: 5, y: 0 }, team: 'dark', outline: [FLOOR], isWalkOn: true });
    covered.add('defender', { at: { x: 5, y: 0 }, team: 'dark', family: 'mob' });
    expect(
      covered.query.aimedBodyOf(covered.entities, covered.attacker.id, { x: 5, y: 0 }),
    ).toBeNull();
  });

  it('names the structure before a map object that holds the same point, whatever their ids (B8)', () => {
    const { entities, add, attacker, query } = setUp();
    const palace = { at: { x: 5, y: 0 }, team: 'dark', outline: [FLOOR], isWalkOn: true } as const;
    add('a-palace-object', { ...palace, family: 'obstacle' });
    add('b-stronghold', palace);
    add('c-gate-object', { ...palace, family: 'obstacle' });

    expect(query.aimedBodyOf(entities, attacker.id, { x: 5, y: 0 })).toBe('b-stronghold');
  });

  it('skips an allied floor, a solid outline and a dead floor', () => {
    const { entities, add, attacker, query } = setUp();
    add('own', { at: { x: 5, y: 0 }, team: 'light', outline: [FLOOR], isWalkOn: true });
    add('fort', { at: { x: 5, y: 0 }, team: 'dark', outline: [FLOOR] });
    add('ruin', { at: { x: 5, y: 0 }, team: 'dark', outline: [FLOOR], isWalkOn: true })
      .getComponent(Health)
      .applyDamage(1000);

    expect(query.aimedBodyOf(entities, attacker.id, { x: 5, y: 0 })).toBeNull();
  });

  it('names a gate passage that takes no damage now, so the shot stops there (rule 2)', () => {
    const { entities, add, attacker, query } = setUp();
    add('gate', {
      at: { x: 5, y: 0 },
      team: 'dark',
      outline: [FLOOR],
      isWalkOn: true,
      isUnbreakable: true,
    });

    expect(query.aimedBodyOf(entities, attacker.id, { x: 5, y: 0 })).toBe('gate');
  });

  it('names the first by id when two walk-on outlines hold the point', () => {
    const { entities, add, attacker, query } = setUp();
    add('palace-object', { at: { x: 5, y: 0 }, outline: [FLOOR], isWalkOn: true });
    add('entity-9', { at: { x: 5, y: 0 }, team: 'dark', outline: [FLOOR], isWalkOn: true });

    expect(query.aimedBodyOf(entities, attacker.id, { x: 5, y: 0 })).toBe('entity-9');
  });
});

describe('AreaHitQuery.stopsShot', () => {
  const shotAt = (targetId: string | null = null) =>
    ({ ownerId: 'attacker', team: 'light', targetId }) as const;
  const stops = (
    { entities, add }: ReturnType<typeof setUp>,
    id: string,
    spec: BodySpec,
    targetId: string | null = null,
  ): boolean => {
    const entity = add(id, spec);
    return AreaHitQuery.stopsShot(entities, shotAt(targetId), {
      entity,
      health: entity.getComponent(Health),
      membership: entity.findComponent(TeamMembership),
      outline: entities.outlineOf(id) ?? null,
    });
  };

  it('stops a shot on a live enemy or teamless body, one that takes no damage too, and not on its owner or an ally (DEC-317 addendum)', () => {
    const scene = setUp();
    const at = { x: 3, y: 0 };

    expect(stops(scene, 'enemy', { at, team: 'dark' })).toBe(true);
    expect(stops(scene, 'teamless', { at })).toBe(true);
    expect(stops(scene, 'camp', { at, team: 'neutral', isUnbreakable: true })).toBe(true);
    expect(stops(scene, 'ally', { at, team: 'light' })).toBe(false);
    const owner = scene.attacker;
    expect(
      AreaHitQuery.stopsShot(
        scene.entities,
        { ...shotAt(), team: 'dark' },
        {
          entity: owner,
          health: owner.getComponent(Health),
          membership: undefined,
          outline: null,
        },
      ),
    ).toBe(false);
  });

  it('stops a shot on a walk-on outline only when the shot aims at it, and never on a dead or removed body (DEC-322 (1))', () => {
    const scene = setUp();
    const floor = { at: { x: 5, y: 0 }, team: 'dark', outline: [FLOOR], isWalkOn: true } as const;

    expect(stops(scene, 'floor', floor)).toBe(false);
    expect(stops(scene, 'aimed-floor', floor, 'aimed-floor')).toBe(true);
    const dead = scene.add('dead', { at: { x: 3, y: 0 }, team: 'dark' });
    dead.getComponent(Health).applyDamage(1000);
    const body = {
      entity: dead,
      health: dead.getComponent(Health),
      membership: undefined,
      outline: null,
    };
    expect(AreaHitQuery.stopsShot(scene.entities, shotAt(), body)).toBe(false);
    const removed = scene.add('removed', { at: { x: 3, y: 0 }, team: 'dark' });
    const removedBody = {
      entity: removed,
      health: removed.getComponent(Health),
      membership: undefined,
      outline: null,
    };
    scene.entities.remove(removed.id, 'dev-removed');
    expect(AreaHitQuery.stopsShot(scene.entities, shotAt(), removedBody)).toBe(false);
  });
});
