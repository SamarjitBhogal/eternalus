import { describe, expect, it } from 'vitest';

import { lavaBridge } from '../__fixtures__/lavaBridge';
import { DamagePipeline } from '../combat/DamagePipeline';
import { Combat } from '../components/Combat';
import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { Movement } from '../components/Movement';
import { ProjectilePayload } from '../components/ProjectilePayload';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadProjectiles } from '../content/projectiles/loadProjectiles';
import type { RangedAttack } from '../content/units/units.types';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { Projectile } from '../entities/Projectile';
import { CollisionResolver } from '../physics/CollisionResolver';
import { StaticCollisionIndex } from '../physics/StaticCollisionIndex';
import { GameState } from '../state/GameState';
import { cos, sin } from '../utils/deterministicMath';
import type { Team } from '../teams/teams.types';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import { CombatSystem } from './CombatSystem';
import { MovementSystem } from './MovementSystem';
import { createDefaultProjectileImpacts } from './defaultProjectileImpacts';
import { ProjectileSystem } from './ProjectileSystem';
import { AreaHitQuery } from '../state/AreaHitQuery';
import { ReachQuery } from '../state/ReachQuery';

/*
 * Shots against the match's real collision rule: `CollisionResolver.reach` on a
 * `StaticCollisionIndex`, as `Simulation` builds them (architecture 10 §7, §11), not a stub.
 */

const CONFIG = createDefaultGameConfig();
const PROJECTILES = loadProjectiles(CONFIG.tickRate);
/** The shipped bolt (2 m per tick, radius 0.15 m), flying far enough never to end here. */
const BOLT = { ...PROJECTILES.get('magus-bolt'), range: 1000, slowFrom: 1000 };
const ATTACK: RangedAttack = {
  strategy: 'ranged-projectile',
  damage: 100,
  reach: 15,
  interval: 27,
  projectile: { projectileId: 'magus-bolt', falloff: null },
};
const BOUNDS = { x: -500, y: -500, width: 1000, height: 1000 };
const FULL_HEALTH = 1000;

/** A box `width` by `height` with its lower-left corner at (`x`, `y`). */
const box = (x: number, y: number, width: number, height: number): Polygon => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];

type BodySpec = {
  readonly at: Vec2;
  readonly team: Team;
  readonly radius: number;
  /** A structure's outline (`Footprint`). */
  readonly outline?: readonly Polygon[];
  /** A map object's outline (`MapObjectBody`) instead. */
  readonly object?: readonly Polygon[];
  readonly isWalkOn: boolean;
};

/** A body with health: a circle, a structure outline or a map object outline. */
class Body extends Entity {
  public readonly kind = 'dummy';
  public readonly family = 'mob';
  protected installComponents(context: unknown): void {
    const { at, team, radius, outline, object, isWalkOn } = context as BodySpec;
    this.addComponent(new Transform(at, radius));
    this.addComponent(new Health(FULL_HEALTH));
    this.addComponent(new TeamMembership(team));
    if (outline !== undefined) this.addComponent(new Footprint(outline, { isWalkOn }));
    if (object !== undefined) {
      const kind = isWalkOn ? 'stronghold' : 'fort';
      this.addComponent(
        new MapObjectBody({ id: this.id, kind, footprints: object, isBlocking: !isWalkOn }),
      );
    }
  }
}

/**
 * A world whose walls are `walls`, or whose collision rule is `collisions`, with a projectile
 * system and movement for whole flights.
 */
const world = (
  walls: readonly Polygon[],
  collisions = new CollisionResolver(
    new StaticCollisionIndex(walls.map((polygon, i) => ({ id: `wall-${String(i)}`, polygon }))),
    BOUNDS,
  ),
) => {
  const state = new GameState(CONFIG, 1, null, { collisions });
  const context = { state, logger: new NullLogger() };
  const areas = new AreaHitQuery();
  const projectiles = new ProjectileSystem(
    createDefaultProjectileImpacts(new DamagePipeline(), null),
    areas,
  );
  const movement = new MovementSystem();
  let counter = 0;
  const addBody = (spec: Partial<BodySpec> & Pick<BodySpec, 'at'>): Body => {
    counter += 1;
    const body = new Body(`body-${String(counter)}`, 'dummy');
    body.spawn({ team: 'dark', radius: 1, isWalkOn: false, ...spec });
    state.entities.add(body);
    return body;
  };
  /** A light bolt at `from`, steered along `direction`, fired at `targetId`. */
  const shoot = (from: Vec2, direction: Vec2, targetId: string | null = null): Projectile => {
    counter += 1;
    const shot = new Projectile(`shot-${String(counter)}`, BOLT.id);
    shot.spawn({ definition: BOLT, position: from, team: 'light' });
    shot.addComponent(
      new ProjectilePayload({
        ownerId: 'owner',
        team: 'light',
        ownerLevel: 1,
        source: { attackerId: 'owner', kind: 'weapon', definitionId: 'magus-staff' },
        targetId,
        impact: { kind: 'weapon', attack: ATTACK },
        origin: from,
      }),
    );
    shot.getComponent(Movement).steer(direction);
    state.entities.add(shot);
    return shot;
  };
  /** Runs `ticks` ticks of movement then flight; returns each tick's x of `shot` while it lives. */
  const fly = (ticks: number, shot?: Projectile): number[] => {
    const xs: number[] = [];
    for (let tick = 0; tick < ticks; tick += 1) {
      movement.update(context);
      projectiles.update(context);
      const at = shot?.findComponent(Transform)?.position;
      if (shot !== undefined && state.entities.has(shot.id) && at !== undefined) xs.push(at.x);
    }
    return xs;
  };
  const healthOf = (body: Entity): number => body.getComponent(Health).current;
  /** One tick of flight only, for a shot moved by hand. */
  const land = (): void => {
    projectiles.update(context);
  };
  return { state, context, addBody, shoot, fly, land, healthOf };
};

describe('ProjectileSystem on real geometry', () => {
  it('never lets a 2 m-per-tick bolt cross a 0.5 m wall, whatever its phase (10 §11)', () => {
    for (let step = 0; step < 40; step += 1) {
      // The wall spans x 1..1.5. Starts from -1.1 to 0.85: every phase of a 2 m move against it.
      const scene = world([box(1, -5, 0.5, 10)]);
      const behind = scene.addBody({ at: { x: 5, y: 0 } });
      const shot = scene.shoot({ x: -1.1 + step * 0.05, y: 0 }, { x: 1, y: 0 });

      const xs = scene.fly(6, shot);

      expect(scene.state.entities.has(shot.id)).toBe(false);
      expect(xs.every((x) => x < 1)).toBe(true);
      expect(scene.healthOf(behind)).toBe(FULL_HEALTH);
    }
  });

  it('hits a body that is also the wall (a fort, a tree) or misses it, never spends a shot on it without damage', () => {
    let hits = 0;
    for (let i = 0; i < 200; i += 1) {
      // The critic's probe: a block that is both a wall and the body's outline, crossed by one
      // 20 m move at an angle. Wall and body contact then differ by rounding alone.
      const block = box(10 + i * 0.013, -1 + i * 0.0071, 2.3, 2.1);
      const scene = world([block]);
      const fort = scene.addBody({ at: { x: 11 + i * 0.013, y: 0 }, outline: [block] });
      const angle = (i % 17) * 0.02 - 0.16;
      const shot = scene.shoot({ x: 0.003 * i, y: 0.1 }, { x: cos(angle), y: sin(angle) });
      shot.getComponent(Transform).moveBy({ x: 20 * cos(angle), y: 20 * sin(angle) });

      scene.land();

      const isHit = scene.healthOf(fort) < FULL_HEALTH;
      if (isHit) hits += 1;
      // Spent means it touched something; the only thing here is the fort, so it took the hit.
      expect(isHit || scene.state.entities.has(shot.id)).toBe(true);
    }
    expect(hits).toBeGreaterThan(100);
  });

  /**
   * A Magus hugging a wall attacks a dummy behind it, in reach, for 40 ticks; returns the shots it
   * fired, its attack interval and the damage the dummy took.
   */
  const hugWallAndAttack = () => {
    const units = loadDefaultContent(CONFIG.tickRate);
    const factory = new EntityFactory(
      createDefaultEntityRegistry(),
      {
        has: (id) => PROJECTILES.has(id) || units.has(id),
        get: (id) => (PROJECTILES.has(id) ? PROJECTILES.get(id) : units.get(id)),
      },
      undefined,
      loadWeapons(CONFIG.tickRate),
    );
    const scene = world([box(1, -5, 0.5, 10)]);
    // The Magus (radius 0.75) stands against the wall's face at x 1, as CollisionSystem keeps it.
    const magus = factory.create('magus', 'magus', {
      position: { x: 0.25 - 1e-6, y: 0 },
      team: 'light',
    });
    const dummy = factory.create('light-mob', 'training-dummy', {
      position: { x: 4, y: 0 },
      team: 'dark',
    });
    scene.state.entities.add(magus);
    scene.state.entities.add(dummy);
    let shots = 0;
    scene.state.events.on('entity-spawned', ({ kind }) => {
      if (kind === 'projectile') shots += 1;
    });
    const combat = new CombatSystem({
      damage: new DamagePipeline(),
      factory,
      areas: new AreaHitQuery(),
      reach: new ReachQuery(),
    });
    expect(scene.state.entities.setAttackTarget(magus.id, dummy.id)).toBe(true);

    for (let tick = 0; tick < 40; tick += 1) {
      scene.fly(1);
      combat.update(scene.context);
      scene.state.advanceTick();
    }
    const health = dummy.getComponent(Health);
    const { interval } = magus.getComponent(Combat).attack;
    return { shots, interval, damage: health.max - health.current };
  };

  it('stops at the wall a shot fired by a unit hugging that wall, with a target behind it in reach', () => {
    const { shots, damage } = hugWallAndAttack();

    expect(shots).toBeGreaterThan(0);
    expect(damage).toBe(0);
  });

  it('fires every interval from a unit hugging a wall at a target behind it: no line-of-fire gate (DEC-317 addendum)', () => {
    const { shots, interval } = hugWallAndAttack();

    // Ticks 0, interval, 2 x interval, ... below 40.
    expect(shots).toBe(Math.ceil(40 / interval));
  });

  describe('from inside a fort court, ringed by its walls', () => {
    const walls = [box(-1, -1, 12, 1), box(-1, 10, 12, 1), box(-1, 0, 1, 10), box(10, 0, 1, 10)];

    it('hits an enemy fort on its wall, not the unit outside', () => {
      const scene = world(walls);
      const fort = scene.addBody({ at: { x: 5, y: 5 }, radius: 7, outline: walls });
      const outside = scene.addBody({ at: { x: 15, y: 5 } });
      const shot = scene.shoot({ x: 5, y: 5 }, { x: 1, y: 0 }, outside.id);

      scene.fly(6);

      expect(scene.healthOf(fort)).toBe(FULL_HEALTH - ATTACK.damage);
      expect(scene.healthOf(outside)).toBe(FULL_HEALTH);
      expect(scene.state.entities.has(shot.id)).toBe(false);
    });

    it('is spent on the wall of a friendly fort, with no damage to anyone', () => {
      const scene = world(walls);
      const fort = scene.addBody({ at: { x: 5, y: 5 }, team: 'light', radius: 7, outline: walls });
      const outside = scene.addBody({ at: { x: 15, y: 5 } });
      const shot = scene.shoot({ x: 5, y: 5 }, { x: 1, y: 0 }, outside.id);

      scene.fly(6);

      expect(scene.healthOf(fort)).toBe(FULL_HEALTH);
      expect(scene.healthOf(outside)).toBe(FULL_HEALTH);
      expect(scene.state.entities.has(shot.id)).toBe(false);
    });
  });

  describe('over a walk-on floor (a Stronghold palace, a gate passage)', () => {
    const floor = box(0, 0, 20, 20);
    /** The palace structure (`Footprint`) and the palace map object (`MapObjectBody`). */
    const palace = (scene: ReturnType<typeof world>) => ({
      structure: scene.addBody({
        at: { x: 10, y: 10 },
        radius: 10,
        outline: [floor],
        isWalkOn: true,
      }),
      object: scene.addBody({ at: { x: 10, y: 10 }, radius: 10, object: [floor], isWalkOn: true }),
    });

    it('hits the unit it was fired at from the floor, not the floor', () => {
      const scene = world([]);
      const { structure, object } = palace(scene);
      const unit = scene.addBody({ at: { x: 11, y: 5 } });
      scene.shoot({ x: 5, y: 5 }, { x: 1, y: 0 }, unit.id);

      scene.fly(5);

      expect(scene.healthOf(unit)).toBe(FULL_HEALTH - ATTACK.damage);
      expect(scene.healthOf(structure)).toBe(FULL_HEALTH);
      expect(scene.healthOf(object)).toBe(FULL_HEALTH);
    });

    it('flies over the floor from outside to the unit standing on it', () => {
      const scene = world([]);
      const { structure, object } = palace(scene);
      const unit = scene.addBody({ at: { x: 6, y: 5 } });
      scene.shoot({ x: -10, y: 5 }, { x: 1, y: 0 }, unit.id);

      scene.fly(12);

      expect(scene.healthOf(unit)).toBe(FULL_HEALTH - ATTACK.damage);
      expect(scene.healthOf(structure)).toBe(FULL_HEALTH);
      expect(scene.healthOf(object)).toBe(FULL_HEALTH);
    });

    it('hits the floor structure or object it was fired at, at once from on it', () => {
      const scene = world([]);
      const { structure, object } = palace(scene);
      const atStructure = scene.shoot({ x: 5, y: 5 }, { x: 1, y: 0 }, structure.id);
      const atObject = scene.shoot({ x: 5, y: 6 }, { x: 1, y: 0 }, object.id);

      scene.fly(1);

      expect(scene.healthOf(structure)).toBe(FULL_HEALTH - ATTACK.damage);
      expect(scene.healthOf(object)).toBe(FULL_HEALTH - ATTACK.damage);
      expect(scene.state.entities.has(atStructure.id)).toBe(false);
      expect(scene.state.entities.has(atObject.id)).toBe(false);
    });

    it('gives the shot to the floor it was fired at, not a palace wall on its edge (DEC-317 (8))', () => {
      // A palace wall is both a wall and a body. Its face lies on the floor's edge, here a rounding
      // step nearer the shooter. LineOfFire reads the floor as reached, so the shot lands on it.
      const wallBlock = box(-1e-9, 2, 1, 6);
      const scene = world([wallBlock]);
      const { structure } = palace(scene);
      const wall = scene.addBody({ at: { x: 0.5, y: 5 }, object: [wallBlock] });
      const shot = scene.shoot({ x: -10, y: 5 }, { x: 1, y: 0 }, structure.id);

      scene.fly(8);

      expect(scene.healthOf(structure)).toBe(FULL_HEALTH - ATTACK.damage);
      expect(scene.healthOf(wall)).toBe(FULL_HEALTH);
      expect(scene.state.entities.has(shot.id)).toBe(false);
    });

    it('flies over it with a shot fired at no one', () => {
      const scene = world([]);
      const { structure, object } = palace(scene);
      const shot = scene.shoot({ x: -10, y: 5 }, { x: 1, y: 0 });

      scene.fly(20);

      expect(scene.healthOf(structure)).toBe(FULL_HEALTH);
      expect(scene.healthOf(object)).toBe(FULL_HEALTH);
      expect(scene.state.entities.has(shot.id)).toBe(true);
    });
  });

  it('hits a body that only grazes the side of the move: the first test keeps the shot width', () => {
    const scene = world([]);
    // 1.14 m off the line: inside the 1 m body plus the 0.15 m shot, though its box misses the line.
    const circle = scene.addBody({ at: { x: 3, y: 2.14 } });
    const outline = scene.addBody({ at: { x: 4, y: -2 }, outline: [box(3, -3.1, 2, 2.96)] });
    const above = scene.shoot({ x: 0, y: 1 }, { x: 1, y: 0 });
    const below = scene.shoot({ x: 0, y: 0 }, { x: 1, y: 0 });

    scene.fly(3);

    expect(scene.healthOf(circle)).toBe(FULL_HEALTH - ATTACK.damage);
    expect(scene.healthOf(outline)).toBe(FULL_HEALTH - ATTACK.damage);
    expect(scene.state.entities.has(above.id)).toBe(false);
    expect(scene.state.entities.has(below.id)).toBe(false);
  });

  describe('the launch-shape rule (DEC-334)', () => {
    it('lets a bolt launched inside its pylon and wall leave both and hit a body outside', () => {
      // A wall turret's pylon on its wall: the launch point is inside both shapes, near the wall's
      // end, so the first move goes deeper into the wall.
      const scene = world([box(-2.5, -2, 4, 4), box(-1, -1, 10, 2)]);
      const target = scene.addBody({ at: { x: 14, y: 0 } });
      const bolt = scene.shoot({ x: -0.5, y: 0 }, { x: 1, y: 0 }, target.id);

      scene.fly(10);

      expect(scene.healthOf(target)).toBe(FULL_HEALTH - ATTACK.damage);
      expect(scene.state.entities.has(bolt.id)).toBe(false);
    });

    it('still ends a shot at a wall its circle, but not its launch point, overlaps at launch', () => {
      const scene = world([box(1, -5, 10, 10)]);
      const behind = scene.addBody({ at: { x: 13, y: 0 } });
      const shot = scene.shoot(
        { x: 1 - BOLT.footprintRadius / 3, y: 0 },
        { x: 1, y: 0 },
        behind.id,
      );

      expect(scene.fly(10, shot)).toEqual([]);
      expect(scene.healthOf(behind)).toBe(FULL_HEALTH);
    });

    it("still ends a shot fired from the seed 1 map's lava bridge at the lava, short of a body past it", () => {
      const { collisions, onBridge, offTheSide } = lavaBridge();
      const scene = world([], collisions);
      const past = scene.addBody({
        at: { x: onBridge.x + offTheSide.x * 6, y: onBridge.y + offTheSide.y * 6 },
      });
      const shot = scene.shoot(onBridge, offTheSide, past.id);

      // 2 m per tick: one whole move, then the lava 3.46 m out.
      expect(scene.fly(10, shot)).toHaveLength(1);
      expect(scene.healthOf(past)).toBe(FULL_HEALTH);
    });
  });
});
