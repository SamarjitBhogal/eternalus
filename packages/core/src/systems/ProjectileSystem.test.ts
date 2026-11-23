import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Combat } from '../components/Combat';
import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { ProjectileFlight } from '../components/ProjectileFlight';
import { ProjectilePayload } from '../components/ProjectilePayload';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { DamagePipeline } from '../combat/DamagePipeline';
import type { HitRunner } from '../state/HitRunner.types';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MAGUS_BOLT } from '../content/projectiles/magusBolt';
import { loadProjectiles } from '../content/projectiles/loadProjectiles';
import type { ProjectileDefinition } from '../content/projectiles/projectiles.types';
import type { RangedAttack } from '../content/units/units.types';
import { Entity } from '../entities/Entity';
import { Projectile } from '../entities/Projectile';
import { NullLogger } from '../diagnostics/NullLogger';
import { GameState } from '../state/GameState';
import type { CollisionQuery } from '../state/CollisionQuery.types';
import type { GameEventMap } from '../state/GameEvents.types';
import type { Team } from '../teams/teams.types';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import { MovementSystem } from './MovementSystem';
import { createDefaultProjectileImpacts } from './defaultProjectileImpacts';
import { ProjectileSystem } from './ProjectileSystem';

const CONFIG = createDefaultGameConfig();
const ATTACK: RangedAttack = {
  strategy: 'ranged-projectile',
  damage: 100,
  reach: 15,
  interval: 27,
  projectile: { projectileId: 'magus-bolt', falloff: null },
};
const BOLT: ProjectileDefinition = { ...MAGUS_BOLT, range: 1000 };

/** The system with the weapon impact on a fresh damage pipeline; `hits` runs on-hit effects. */
const projectileSystem = (hits: HitRunner | null = null): ProjectileSystem =>
  new ProjectileSystem(createDefaultProjectileImpacts(new DamagePipeline(), hits));

/** A body with health: a circle, or an outline when given polygons. */
class Body extends Entity {
  public readonly kind = 'dummy';
  public readonly family = 'unit';
  protected installComponents(context: unknown): void {
    const { at, radius, team, outline } = context as {
      at: Vec2;
      radius: number;
      team: Team;
      outline?: readonly Polygon[];
    };
    this.addComponent(new Transform(at, radius));
    this.addComponent(new Health(1000));
    this.addComponent(new TeamMembership(team));
    this.addComponent(new Collider({ kind: 'circle', radius }, 'unit'));
    if (outline !== undefined) this.addComponent(new Footprint(outline));
  }
}

const square = (x: number, y: number, size: number): Polygon => [
  { x, y },
  { x: x + size, y },
  { x: x + size, y: y + size },
  { x, y: y + size },
];

const setUp = (wallAtX: number | null = null) => {
  const collisions: CollisionQuery | null =
    wallAtX === null
      ? null
      : {
          lightsShot: () => false,
          reach: () => {
            throw new Error('a shot is swept by the shot rule (`shotReach`), never the mover rule');
          },
          shotReach: (from, _dir, distance, radius) =>
            Math.max(0, Math.min(distance, wallAtX - radius - from.x)),
        };
  const state = new GameState(CONFIG, 1, null, collisions === null ? {} : { collisions });
  const events: GameEventMap['entity-removed'][] = [];
  state.events.on('entity-removed', (payload) => events.push(payload));
  const system = projectileSystem();
  const context = { state, logger: new NullLogger() };
  let counter = 0;
  const addBody = (at: Vec2, team: Team, radius = 1, outline?: readonly Polygon[]) => {
    counter += 1;
    const body = new Body(`body-${String(counter)}`, 'dummy');
    body.spawn({ at, radius, team, outline });
    state.entities.add(body);
    return body;
  };
  /** A bolt from `origin` that has just moved `by` metres east, owned by `owner`. */
  const fire = (
    origin: Vec2,
    by: number,
    team: Team = 'light',
    attack: RangedAttack = ATTACK,
    definition: ProjectileDefinition = BOLT,
    ownerId = 'owner',
    targetId: string | null = null,
  ) => {
    counter += 1;
    const shot = new Projectile(`shot-${String(counter)}`, definition.id);
    shot.spawn({ definition, position: origin, team });
    shot.addComponent(
      new ProjectilePayload({
        ownerId,
        team,
        ownerLevel: 1,
        source: { attackerId: ownerId, kind: 'weapon', definitionId: 'magus-staff' },
        targetId,
        impact: { kind: 'weapon', attack },
        origin,
      }),
    );
    state.entities.add(shot);
    shot.getComponent(Transform).moveBy({ x: by, y: 0 });
    return shot;
  };
  const healthOf = (body: Entity) => body.getComponent(Health).current;
  return { state, events, system, context, addBody, fire, healthOf };
};

describe('ProjectileSystem', () => {
  it('lands on a circle body and removes the shot as consumed', () => {
    const { state, events, system, context, addBody, fire, healthOf } = setUp();
    const target = addBody({ x: 10, y: 0 }, 'dark');
    const shot = fire({ x: 0, y: 0 }, 20);

    system.update(context);

    expect(healthOf(target)).toBe(900);
    expect(state.entities.has(shot.id)).toBe(false);
    expect(events).toEqual([{ entityId: shot.id, cause: 'consumed' }]);
  });

  it('keeps flying while nothing is in its path', () => {
    const { state, events, system, context, addBody, fire, healthOf } = setUp();
    const target = addBody({ x: 50, y: 0 }, 'dark');
    const shot = fire({ x: 0, y: 0 }, 20);

    system.update(context);

    expect(healthOf(target)).toBe(1000);
    expect(state.entities.has(shot.id)).toBe(true);
    expect(events).toEqual([]);
  });

  it('lands on the nearest body when the move crosses two', () => {
    const { system, context, addBody, fire, healthOf } = setUp();
    const far = addBody({ x: 15, y: 0 }, 'dark');
    const near = addBody({ x: 8, y: 0 }, 'dark');
    fire({ x: 0, y: 0 }, 20);

    system.update(context);

    expect(healthOf(near)).toBe(900);
    expect(healthOf(far)).toBe(1000);
  });

  it('lands on the nearest body whichever is first in the store', () => {
    const { system, context, addBody, fire, healthOf } = setUp();
    const near = addBody({ x: 8, y: 0 }, 'dark');
    const far = addBody({ x: 15, y: 0 }, 'dark');
    fire({ x: 0, y: 0 }, 20);

    system.update(context);

    expect(healthOf(near)).toBe(900);
    expect(healthOf(far)).toBe(1000);
  });

  it('gives a tie between bodies to the first in store order', () => {
    const { system, context, addBody, fire, healthOf } = setUp();
    const first = addBody({ x: 8, y: 0 }, 'dark');
    const second = addBody({ x: 8, y: 0 }, 'dark');
    fire({ x: 0, y: 0 }, 20);

    system.update(context);

    expect(healthOf(first)).toBe(900);
    expect(healthOf(second)).toBe(1000);
  });

  it('lands on an outline body, a structure, by its walls and not its circle', () => {
    const { state, system, context, addBody, fire, healthOf } = setUp();
    // A 2 m square at x 10..12 with a 14 m collider circle around it, like a tower.
    const tower = addBody({ x: 11, y: 1 }, 'dark', 14, [square(10, 0, 2)]);
    const missed = fire({ x: 0, y: 6 }, 20);
    const hit = fire({ x: 0, y: 1 }, 20);

    system.update(context);

    expect(healthOf(tower)).toBe(900);
    expect(state.entities.has(hit.id)).toBe(false);
    // The 14 m circle would have been hit at y 6; the outline is not.
    expect(state.entities.has(missed.id)).toBe(true);
  });

  it('lands at once when the shot already overlaps the body at the start of its move', () => {
    const { state, system, context, addBody, fire, healthOf } = setUp();
    const target = addBody({ x: 0.5, y: 0 }, 'dark');
    const inside = addBody({ x: 50, y: 0 }, 'dark', 1, [square(49, -1, 2)]);
    const shot = fire({ x: 0, y: 0 }, 5);
    const insideShot = fire({ x: 50, y: 0 }, 0.1);

    system.update(context);

    expect(healthOf(target)).toBe(900);
    expect(healthOf(inside)).toBe(900);
    expect(state.entities.has(shot.id)).toBe(false);
    expect(state.entities.has(insideShot.id)).toBe(false);
  });

  it('passes through allies and its owner', () => {
    const { state, system, context, addBody, fire, healthOf } = setUp();
    const owner = addBody({ x: 5, y: 0 }, 'light');
    const ally = addBody({ x: 8, y: 0 }, 'light');
    const shot = fire({ x: 0, y: 0 }, 20, 'light', ATTACK, BOLT, owner.id);

    system.update(context);

    expect(healthOf(owner)).toBe(1000);
    expect(healthOf(ally)).toBe(1000);
    expect(state.entities.has(shot.id)).toBe(true);
  });

  it('never hits its owner, even one that now stands on another team', () => {
    const { state, system, context, addBody, fire, healthOf } = setUp();
    const owner = addBody({ x: 5, y: 0 }, 'dark');
    const shot = fire({ x: 0, y: 0 }, 20, 'light', ATTACK, BOLT, owner.id);

    system.update(context);

    expect(healthOf(owner)).toBe(1000);
    expect(state.entities.has(shot.id)).toBe(true);
  });

  it('hits a neutral body, which counts as an enemy', () => {
    const { system, context, addBody, fire, healthOf } = setUp();
    const target = addBody({ x: 10, y: 0 }, 'neutral');
    fire({ x: 0, y: 0 }, 20);

    system.update(context);

    expect(healthOf(target)).toBe(900);
  });

  it('ignores a dead body', () => {
    const { state, system, context, addBody, fire } = setUp();
    const corpse = addBody({ x: 10, y: 0 }, 'dark');
    corpse.getComponent(Health).applyDamage(1000);
    const shot = fire({ x: 0, y: 0 }, 20);

    system.update(context);

    expect(state.entities.has(shot.id)).toBe(true);
  });

  it('stops at a body that takes no damage now (a forest camp), with no damage and no on-hit step (DEC-317 addendum)', () => {
    const { state, events, context, addBody, fire, healthOf } = setUp();
    const onHit: string[] = [];
    const system = projectileSystem({ afterHit: (_state, _owner, id) => onHit.push(id) });
    const damaged: string[] = [];
    state.events.on('damage-applied', ({ targetId }) => damaged.push(targetId));
    const camp = addBody({ x: 10, y: 0 }, 'neutral');
    camp.getComponent(Collider).setUnbreakable(true);
    const target = addBody({ x: 15, y: 0 }, 'dark');
    const shot = fire({ x: 0, y: 0 }, 20);

    system.update(context);

    expect(state.entities.has(shot.id)).toBe(false);
    expect(events).toEqual([{ entityId: shot.id, cause: 'consumed' }]);
    expect(healthOf(camp)).toBe(1000);
    expect(healthOf(target)).toBe(1000);
    expect(damaged).toEqual([]);
    expect(onHit).toEqual([]);
  });

  it('stops at a body that takes no damage now when it was fired at that body (a closed gate)', () => {
    const { state, context, addBody, fire, healthOf } = setUp();
    const onHit: string[] = [];
    const system = projectileSystem({ afterHit: (_state, _owner, id) => onHit.push(id) });
    const gate = addBody({ x: 10, y: 0 }, 'dark');
    gate.getComponent(Collider).setUnbreakable(true);
    const behind = addBody({ x: 15, y: 0 }, 'dark');
    const shot = fire({ x: 0, y: 0 }, 20, 'light', ATTACK, BOLT, 'owner', gate.id);

    system.update(context);

    expect(state.entities.has(shot.id)).toBe(false);
    expect(healthOf(gate)).toBe(1000);
    expect(healthOf(behind)).toBe(1000);
    expect(onHit).toEqual([]);
  });

  it("records the body it lands on as its living owner's hit at the landing tick, and none on a body that takes no damage (DEC-322 (2), DEC-333 (1))", () => {
    const { state, context, system, addBody, fire } = setUp();
    const owner = addBody({ x: -50, y: 0 }, 'light');
    owner.addComponent(new Combat({ basic: ATTACK }));
    const combat = owner.getComponent(Combat);
    const camp = addBody({ x: 10, y: 0 }, 'neutral');
    camp.getComponent(Collider).setUnbreakable(true);
    fire({ x: 0, y: 0 }, 20, 'light', ATTACK, BOLT, owner.id);

    system.update(context);
    expect(combat.hitIds).toEqual([]);

    camp.getComponent(Collider).setUnbreakable(false);
    for (let tick = 0; tick <= ATTACK.interval; tick += 1) state.advanceTick();
    const landedAt = state.tick;
    fire({ x: 0, y: 0 }, 20, 'light', ATTACK, BOLT, owner.id);
    system.update(context);
    expect(combat.hitsAt(state.tick)).toEqual([camp.id]);
    expect(combat.hitsUntilTick).toBe(landedAt + ATTACK.interval);

    state.advanceTick();
    owner.getComponent(Health).applyDamage(owner.getComponent(Health).current);
    fire({ x: 0, y: 0 }, 20, 'light', ATTACK, BOLT, owner.id);
    system.update(context);
    expect(combat.hitsAt(state.tick)).toEqual([camp.id]);
    expect(combat.hitsUntilTick).toBe(landedAt + ATTACK.interval);
  });

  it('stops at a wall in front of a body, with no damage', () => {
    const { state, events, system, context, addBody, fire, healthOf } = setUp(5);
    const target = addBody({ x: 10, y: 0 }, 'dark');
    const shot = fire({ x: 0, y: 0 }, 20);

    system.update(context);

    expect(healthOf(target)).toBe(1000);
    expect(state.entities.has(shot.id)).toBe(false);
    expect(events).toEqual([{ entityId: shot.id, cause: 'consumed' }]);
  });

  it('is spent at a wall with nothing behind it', () => {
    const { state, system, context, fire } = setUp(5);
    const shot = fire({ x: 0, y: 0 }, 20);

    system.update(context);

    expect(state.entities.has(shot.id)).toBe(false);
  });

  it('hits a body that is also a wall, a fort, before its own wall stops the shot', () => {
    // The wall is at the fort's edge (x 10 less the shot radius); the outline is touched there.
    const { state, system, context, addBody, fire, healthOf } = setUp(10 - 5e-8);
    const fort = addBody({ x: 11, y: 0 }, 'dark', 1, [square(10, -1, 2)]);
    const shot = fire({ x: 0, y: 0 }, 20);

    system.update(context);

    expect(healthOf(fort)).toBe(900);
    expect(state.entities.has(shot.id)).toBe(false);
  });

  it('still hits a body that stands before the wall', () => {
    const { system, context, addBody, fire, healthOf } = setUp(30);
    const target = addBody({ x: 10, y: 0 }, 'dark');
    fire({ x: 0, y: 0 }, 40);

    system.update(context);

    expect(healthOf(target)).toBe(900);
  });

  it('ends a shot that has flown its range: it stays, is told to stop and hits nothing', () => {
    const { state, events, system, context, addBody, fire, healthOf } = setUp();
    const near = addBody({ x: 50, y: 0 }, 'dark');
    const shortBolt = { ...BOLT, range: 5, slowFrom: 5, endDuration: 3 };
    const shot = fire({ x: 0, y: 0 }, 5, 'light', ATTACK, shortBolt);
    shot.getComponent(Movement).steer({ x: 1, y: 0 });

    system.update(context);

    expect(shot.getComponent(ProjectileFlight).isEnded).toBe(true);
    expect(shot.getComponent(Movement).heading).toEqual({ x: 0, y: 0 });
    expect(state.entities.has(shot.id)).toBe(true);
    expect(events).toEqual([]);
    expect(healthOf(near)).toBe(1000);
  });

  it('removes an ended shot as consumed once its end duration is over', () => {
    const { state, events, system, context, fire } = setUp();
    const shortBolt = { ...BOLT, range: 5, slowFrom: 5, endDuration: 3 };
    const shot = fire({ x: 0, y: 0 }, 5, 'light', ATTACK, shortBolt);
    const present: boolean[] = [];

    for (let tick = 0; tick < 4; tick += 1) {
      system.update(context);
      present.push(state.entities.has(shot.id));
    }

    // Tick 1 ends it; ticks 2 and 3 count down; tick 4 removes it.
    expect(present).toEqual([true, true, true, false]);
    expect(events).toEqual([{ entityId: shot.id, cause: 'consumed' }]);
  });

  it('hits nothing with an ended shot, even a body it touches', () => {
    const { state, system, context, addBody, fire, healthOf } = setUp();
    const shortBolt = { ...BOLT, range: 5, slowFrom: 5, endDuration: 3 };
    const shot = fire({ x: 0, y: 0 }, 5, 'light', ATTACK, shortBolt);
    system.update(context);
    const target = addBody({ x: 5.5, y: 0 }, 'dark');
    shot.getComponent(Transform).moveBy({ x: 1, y: 0 });

    system.update(context);

    expect(healthOf(target)).toBe(1000);
    expect(state.entities.has(shot.id)).toBe(true);
  });

  it('limits the speed of a shot in its slow zone, and not before it', () => {
    const { system, context, fire } = setUp();
    const arrow = {
      ...BOLT,
      range: 100,
      slowFrom: 80,
      movementProfile: { maxSpeed: 2, acceleration: 2, mass: 1 },
    };
    const early = fire({ x: 0, y: 0 }, 50, 'light', ATTACK, arrow);
    const late = fire({ x: 0, y: 0 }, 95, 'light', ATTACK, arrow);
    for (const shot of [early, late]) shot.getComponent(Movement).steer({ x: 1, y: 0 });

    system.update(context);
    early.getComponent(Movement).advance();
    late.getComponent(Movement).advance();

    expect(early.getComponent(Movement).speed).toBe(2);
    // A quarter of the 20 m slow zone left: half speed.
    expect(late.getComponent(Movement).speed).toBeCloseTo(1);
  });

  describe('with the shipped projectiles over a whole flight', () => {
    const SHIPPED = loadProjectiles(30);
    const flyOn = (id: string, ticks: number, wallAtX: number | null = null) => {
      const scene = setUp(wallAtX);
      const definition = SHIPPED.get(id);
      const shot = scene.fire({ x: 0, y: 0 }, 0, 'light', ATTACK, definition);
      shot.getComponent(Movement).steer({ x: 1, y: 0 });
      const movement = new MovementSystem();
      const xs: number[] = [];
      const speeds: number[] = [];
      for (let tick = 0; tick < ticks; tick += 1) {
        movement.update(scene.context);
        scene.system.update(scene.context);
        const at = shot.findComponent(Transform);
        if (at === undefined) continue;
        xs.push(at.position.x);
        speeds.push(shot.getComponent(Movement).speed);
      }
      return { ...scene, shot, definition, xs, speeds };
    };

    it('stops a bolt at exactly 100 m at full speed, keeps it for its end duration, then removes it', () => {
      const { state, shot, definition, xs, speeds } = flyOn('magus-bolt', 70);

      const stoppedAt = xs.findIndex((x) => x >= 100 - 1e-6);
      expect(xs[stoppedAt]).toBeCloseTo(100, 6);
      expect(speeds.slice(0, stoppedAt + 1).every((speed) => speed === 2)).toBe(true);
      expect(xs.slice(stoppedAt).every((x) => Math.abs(x - 100) < 1e-6)).toBe(true);
      // Ended on tick stoppedAt + 1, then endDuration ticks later it is gone.
      expect(state.entities.has(shot.id)).toBe(false);
      expect(stoppedAt).toBe(49);
      expect(definition.endDuration).toBe(12);
    });

    it('keeps a bolt in the world until the end duration has passed', () => {
      // Flight ends on tick 50; endDuration (12) ticks later, on tick 62, it is removed.
      expect(flyOn('magus-bolt', 61).state.entities.has('shot-1')).toBe(true);
      expect(flyOn('magus-bolt', 62).state.entities.has('shot-1')).toBe(false);
    });

    it('slows an arrow from 80 m and stops it at exactly 100 m', () => {
      const { shot, xs, speeds } = flyOn('arrow', 75);

      expect(speeds[40]).toBe(2);
      expect(xs[39]).toBeCloseTo(80, 6);
      expect(speeds[41]).toBeCloseTo(2 * Math.sqrt(18 / 20));
      expect(speeds[45] ?? 0).toBeLessThan(speeds[41] ?? 0);
      expect(xs.at(-1)).toBeCloseTo(100, 6);
      expect(shot.getComponent(ProjectileFlight).isEnded).toBe(true);
      expect(shot.getComponent(Movement).speed).toBe(0);
    });

    it('still hits a target at 90 m with an arrow, for the fall-off floor damage', () => {
      const falloff = { fullTo: 50, floorAt: 80, floor: 0.4 };
      const attack: RangedAttack = {
        ...ATTACK,
        damage: 45,
        projectile: { projectileId: 'arrow', falloff },
      };
      const scene = setUp();
      // Contact is the target's near edge less the shot radius: 91.15 - 1 - 0.15 = 90 m flown.
      const target = scene.addBody({ x: 91.15, y: 0 }, 'dark');
      const shot = scene.fire({ x: 0, y: 0 }, 0, 'light', attack, SHIPPED.get('arrow'));
      shot.getComponent(Movement).steer({ x: 1, y: 0 });
      const movement = new MovementSystem();

      for (let tick = 0; tick < 70; tick += 1) {
        movement.update(scene.context);
        scene.system.update(scene.context);
      }

      expect(1000 - scene.healthOf(target)).toBeCloseTo(45 * 0.4);
      expect(scene.state.entities.has(shot.id)).toBe(false);
    });

    it('lands an arrow on an enemy under the end of its range and damages it; the move that ends there touches it (DEC-322 (2))', () => {
      const falloff = { fullTo: 50, floorAt: 80, floor: 0.4 };
      const landOn = (id: string) => {
        const attack: RangedAttack = {
          ...ATTACK,
          damage: 45,
          projectile: { projectileId: id, falloff },
        };
        const scene = setUp();
        // A minion-sized body whose circle holds the 100 m end point (99.8 m to 100.8 m).
        const target = scene.addBody({ x: 100.3, y: 0 }, 'dark', 0.5);
        const shot = scene.fire({ x: 0, y: 0 }, 0, 'light', attack, SHIPPED.get(id));
        shot.getComponent(Movement).steer({ x: 1, y: 0 });
        const movement = new MovementSystem();
        let hasEnded = false;
        for (let tick = 0; tick < 80; tick += 1) {
          movement.update(scene.context);
          scene.system.update(scene.context);
          hasEnded ||= shot.findComponent(ProjectileFlight)?.isEnded === true;
        }
        return {
          damage: 1000 - scene.healthOf(target),
          hasEnded,
          isPresent: scene.state.entities.has(shot.id),
        };
      };

      // The arrow takes the floor damage and is spent on the body, never lying on the ground.
      expect(landOn('arrow')).toEqual({
        damage: expect.closeTo(45 * 0.4) as number,
        hasEnded: false,
        isPresent: false,
      });
      // The bolt flies the same 100 m: it touches the body before its end too, so it hits it.
      expect(landOn('magus-bolt')).toEqual({
        damage: expect.closeTo(45 * 0.4) as number,
        hasEnded: false,
        isPresent: false,
      });
    });
  });

  it('scales the damage by the fall-off over the distance flown', () => {
    const falloff = { fullTo: 10, floorAt: 30, floor: 0.4 };
    const attack: RangedAttack = { ...ATTACK, projectile: { projectileId: 'magus-bolt', falloff } };
    // Targets at 5, 20 and 100 m from a shot fired at 0 m: contact is the target's near edge
    // less the shot radius, so flown = x - 1 - 0.15.
    const damageAt = (x: number): number => {
      const { system, context, addBody, fire, healthOf } = setUp();
      const target = addBody({ x, y: 0 }, 'dark');
      fire({ x: 0, y: 0 }, x + 5, 'light', attack);
      system.update(context);
      return 1000 - healthOf(target);
    };

    expect(damageAt(5)).toBe(100);
    expect(damageAt(21.15)).toBeCloseTo(70);
    expect(damageAt(200)).toBeCloseTo(40);
  });

  it('runs the owner on-hit effects after the hit', () => {
    const { system, context, addBody, fire } = setUp();
    const target = addBody({ x: 10, y: 0 }, 'dark');
    const calls: string[] = [];
    const hooked = projectileSystem({
      afterHit: (_state, attackerId, targetId) => calls.push(`${attackerId}>${targetId}`),
    });
    fire({ x: 0, y: 0 }, 20);

    hooked.update(context);
    system.update(context);

    expect(calls).toEqual([`owner>${target.id}`]);
  });

  it('flies a shot into a body over several ticks with the real movement system', () => {
    const { state, system, context, addBody, fire, healthOf } = setUp();
    const target = addBody({ x: 10, y: 0 }, 'dark');
    // Per tick a shot flies maxSpeed metres: 4 here, so it needs three ticks to reach x 8.85.
    const slow = { ...BOLT, movementProfile: { maxSpeed: 4, acceleration: 4, mass: 1 } };
    const shot = fire({ x: 0, y: 0 }, 0, 'light', ATTACK, slow);
    shot.getComponent(Movement).steer({ x: 1, y: 0 });
    const movement = new MovementSystem();
    const landed: boolean[] = [];

    for (let tick = 0; tick < 4; tick += 1) {
      movement.update(context);
      system.update(context);
      landed.push(!state.entities.has(shot.id));
    }

    expect(landed).toEqual([false, false, true, true]);
    expect(healthOf(target)).toBe(900);
  });

  it('holds a shot in place and unlanded while the match holds units idle', () => {
    const { state, system, context, addBody, fire, healthOf } = setUp();
    // Touching the shot where it stands: only the hold keeps it from landing.
    const target = addBody({ x: 0.5, y: 0 }, 'dark');
    const shot = fire({ x: 0, y: 0 }, 0);
    shot.getComponent(Movement).steer({ x: 1, y: 0 });
    state.match.holdIdle(true);
    const movement = new MovementSystem();

    for (let tick = 0; tick < 5; tick += 1) {
      movement.update(context);
      system.update(context);
    }

    expect(shot.getComponent(Transform).position).toEqual({ x: 0, y: 0 });
    expect(healthOf(target)).toBe(1000);
    expect(state.entities.has(shot.id)).toBe(true);
  });
});
