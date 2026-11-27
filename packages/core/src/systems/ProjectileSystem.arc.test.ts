import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { ProjectileFlight } from '../components/ProjectileFlight';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { DamagePipeline } from '../combat/DamagePipeline';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadProjectiles } from '../content/projectiles/loadProjectiles';
import type { ProjectileSplash, RangedAttack } from '../content/units/units.types';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { Entity } from '../entities/Entity';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { Magus } from '../entities/legends/Magus';
import { RangedProjectileAttackStrategy } from '../entities/strategies/RangedProjectileAttackStrategy';
import { NullLogger } from '../diagnostics/NullLogger';
import { AreaHitQuery } from '../state/AreaHitQuery';
import type { HitRunner } from '../state/HitRunner.types';
import type { CollisionQuery } from '../state/CollisionQuery.types';
import { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import { IdGenerator } from '../utils/IdGenerator';
import type { Vec2 } from '../utils/geometry.types';
import { MovementSystem } from './MovementSystem';
import { createDefaultProjectileImpacts } from './defaultProjectileImpacts';
import { ProjectileSystem } from './ProjectileSystem';

const CONFIG = createDefaultGameConfig();
const WEAPONS = loadWeapons(30);
const UNITS = loadDefaultContent(30);
const DAMAGE = 100;
const SPLASH: ProjectileSplash = { radius: 4, edgeMultiplier: 0.5 };
const attackWith = (splash?: ProjectileSplash): RangedAttack => ({
  strategy: 'ranged-projectile',
  damage: DAMAGE,
  reach: 30,
  interval: 150,
  projectile: { projectileId: 'turret-bolt', falloff: null, ...(splash ? { splash } : {}) },
});

/** A body with health: a circle of `radius`, in a unit family or a structure family. */
class Body extends Entity {
  public readonly kind = 'dummy';
  public readonly family: 'unit' | 'structure';
  public constructor(id: string, family: 'unit' | 'structure') {
    super(id, 'dummy');
    this.family = family;
  }
  protected installComponents(context: unknown): void {
    const { at, radius, team } = context as { at: Vec2; radius: number; team: Team };
    this.addComponent(new Transform(at, radius));
    this.addComponent(new Health(1000));
    this.addComponent(new TeamMembership(team));
    this.addComponent(new Collider({ kind: 'circle', radius }, 'unit'));
  }
}

/** A Magus owner at the origin, a world with an optional wall, and the real systems. */
const setUp = (wallAtX: number | null = null) => {
  const collisions: CollisionQuery | null =
    wallAtX === null
      ? null
      : {
          lightsShot: () => {
            throw new Error('an arc shot cannot catch fire: it is never swept');
          },
          reach: () => {
            throw new Error('a shot is swept by the shot rule (`shotReach`), never the mover rule');
          },
          shotReach: (from, _dir, distance, radius) =>
            Math.max(0, Math.min(distance, wallAtX - radius - from.x)),
        };
  const state = new GameState(CONFIG, 1, null, collisions === null ? {} : { collisions });
  const owner = new Magus('owner', 'magus');
  owner.spawn({
    definition: UNITS.get('magus'),
    position: { x: 0, y: 0 },
    team: 'light',
    weapons: WEAPONS,
  });
  state.entities.add(owner);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadProjectiles(30),
    new IdGenerator(1000),
    WEAPONS,
  );
  const damage = new DamagePipeline();
  // Friendly fire is off in the pipeline, so the on-hit steps show who a blast really struck.
  const struck: string[] = [];
  const hits: HitRunner = { afterHit: (_state, _attacker, targetId) => struck.push(targetId) };
  const areas = new AreaHitQuery();
  const system = new ProjectileSystem(createDefaultProjectileImpacts(damage, hits, areas), areas);
  const movement = new MovementSystem();
  const context = { state, logger: new NullLogger() };
  let counter = 0;
  const add = (at: Vec2, team: Team, radius = 1, family: 'unit' | 'structure' = 'unit'): Body => {
    counter += 1;
    const body = new Body(`body-${String(counter)}`, family);
    body.spawn({ at, radius, team });
    state.entities.add(body);
    return body;
  };
  /** Fires from the owner at `point` (and at `targetId`, when given); returns the shot. */
  const fire = (point: Vec2, splash?: ProjectileSplash, targetId: string | null = null): Entity => {
    const length = Math.hypot(point.x, point.y);
    new RangedProjectileAttackStrategy().attack(
      owner,
      {
        targetId,
        point: targetId === null ? point : null,
        direction: { x: point.x / length, y: point.y / length },
      },
      attackWith(splash),
      { state, damage, hits: null, factory, areas: new AreaHitQuery() },
    );
    const shot = [...allEntities(state)].find((entity) => entity.family === 'projectile');
    if (shot === undefined) throw new Error('No shot was fired.');
    return shot;
  };
  const tick = (times = 1): void => {
    for (let i = 0; i < times; i += 1) {
      movement.update(context);
      system.update(context);
    }
  };
  const healthOf = (body: Entity): number => body.getComponent(Health).current;
  return { state, owner, add, fire, tick, healthOf, struck };
};

const allEntities = (state: GameState): Entity[] => {
  const all: Entity[] = [];
  state.entities.forEach((entity) => all.push(entity));
  return all;
};

describe('ProjectileSystem arc shots (DEC-342)', () => {
  it('flies over a wall and over a body in its path, and lands at its aim point', () => {
    const { state, add, fire, tick, healthOf } = setUp(5);
    const inPath = add({ x: 10, y: 0 }, 'dark');
    const shot = fire({ x: 20, y: 0 });

    tick(25);

    expect(healthOf(inPath)).toBe(1000);
    const flight = shot.getComponent(ProjectileFlight);
    expect(flight.isEnded).toBe(true);
    expect(shot.getComponent(Transform).position.x).toBeCloseTo(20, 6);
    expect(state.entities.has(shot.id)).toBe(true);
  });

  it('lands on the body under its aim point', () => {
    const { add, fire, tick, healthOf } = setUp();
    const under = add({ x: 20.5, y: 0 }, 'dark');
    const beside = add({ x: 20, y: 5 }, 'dark');

    fire({ x: 20, y: 0 });
    tick(25);

    expect(healthOf(under)).toBe(1000 - DAMAGE);
    expect(healthOf(beside)).toBe(1000);
  });

  it("gives a tie under the point to the shot's target, not the first in store order", () => {
    const { add, fire, tick, healthOf } = setUp();
    const first = add({ x: 20, y: 0 }, 'dark');
    const target = add({ x: 20, y: 0.5 }, 'dark');

    fire({ x: 20, y: 0 }, undefined, target.id);
    tick(25);

    expect(healthOf(target)).toBe(1000 - DAMAGE);
    expect(healthOf(first)).toBe(1000);
  });

  it('gives a tie with no target to the first body in store order', () => {
    const { add, fire, tick, healthOf } = setUp();
    const first = add({ x: 20, y: 0 }, 'dark');
    const second = add({ x: 20, y: 0.5 }, 'dark');

    fire({ x: 20, y: 0 });
    tick(25);

    expect(healthOf(first)).toBe(1000 - DAMAGE);
    expect(healthOf(second)).toBe(1000);
  });

  it('ends at a nearer aim point, not at the definition range', () => {
    const { fire, tick } = setUp();
    const shot = fire({ x: 6, y: 0 });

    tick(12);

    expect(shot.getComponent(ProjectileFlight).range).toBeCloseTo(6, 6);
    expect(shot.getComponent(ProjectileFlight).isEnded).toBe(true);
    expect(shot.getComponent(Transform).position.x).toBeCloseTo(6, 6);
  });

  it('lands a shot aimed closer than one tick of flight exactly on the aim point', () => {
    const { fire, tick } = setUp();
    const shot = fire({ x: 0.4, y: 0 });

    tick(3);

    expect(shot.getComponent(Transform).position.x).toBeCloseTo(0.4, 6);
    expect(shot.getComponent(ProjectileFlight).isEnded).toBe(true);
  });

  it('hits nothing once it lodges, and is removed after its end duration', () => {
    const { state, add, fire, tick, healthOf } = setUp();
    const shot = fire({ x: 20, y: 0 });
    tick(25);
    expect(shot.getComponent(ProjectileFlight).isEnded).toBe(true);

    const late = add({ x: 20, y: 0 }, 'dark');
    tick(5);
    expect(healthOf(late)).toBe(1000);
    tick(20);
    expect(state.entities.has(shot.id)).toBe(false);
    expect(healthOf(late)).toBe(1000);
  });

  it('does nothing on bare ground without a blast', () => {
    const { add, fire, tick, healthOf } = setUp();
    const near = add({ x: 22, y: 0 }, 'dark');

    fire({ x: 20, y: 0 });
    tick(25);

    expect(healthOf(near)).toBe(1000);
  });

  it('damages a unit in the blast on bare ground, and not one outside it', () => {
    const { add, fire, tick, healthOf } = setUp();
    const inside = add({ x: 22, y: 0 }, 'dark');
    const outside = add({ x: 20, y: 7 }, 'dark');

    fire({ x: 20, y: 0 }, SPLASH);
    tick(25);

    expect(healthOf(inside)).toBeLessThan(1000);
    expect(healthOf(outside)).toBe(1000);
  });

  it('takes the damage down to the edge multiplier at the blast edge, full at the centre', () => {
    const { add, fire, tick, healthOf } = setUp();
    const centre = add({ x: 20, y: 0 }, 'dark');
    const edge = add({ x: 20, y: 4 }, 'dark');

    fire({ x: 20, y: 0 }, SPLASH);
    tick(25);

    expect(1000 - healthOf(centre)).toBeCloseTo(DAMAGE);
    expect(1000 - healthOf(edge)).toBeCloseTo(DAMAGE * SPLASH.edgeMultiplier);
  });

  it('skips allies, the owner and structures in the blast', () => {
    const { owner, add, fire, tick, healthOf, struck } = setUp();
    const ally = add({ x: 20, y: 0 }, 'light');
    const structure = add({ x: 20, y: 1 }, 'dark', 1, 'structure');
    const enemy = add({ x: 20, y: -1 }, 'dark');
    owner.getComponent(Transform).moveTo({ x: 20, y: 2 });

    fire({ x: 20, y: 0 }, SPLASH);
    tick(25);

    expect(healthOf(ally)).toBe(1000);
    expect(healthOf(structure)).toBe(1000);
    expect(healthOf(owner)).toBe(owner.getComponent(Health).max);
    expect(healthOf(enemy)).toBeLessThan(1000);
    expect(struck).toEqual([enemy.id]);
  });
});
