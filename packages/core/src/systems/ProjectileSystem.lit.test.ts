import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { ProjectileFlight } from '../components/ProjectileFlight';
import { ProjectilePayload } from '../components/ProjectilePayload';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadAbilities } from '../content/abilities/loadAbilities';
import { loadProjectiles } from '../content/projectiles/loadProjectiles';
import type { ProjectileDefinition } from '../content/projectiles/projectiles.types';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import type { RangedAttack } from '../content/units/units.types';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { Projectile } from '../entities/Projectile';
import { createDefaultAbilityRegistry } from '../abilities/defaultAbilityRegistry';
import { unitsWithWarriorKit } from '../abilities/__fixtures__/casterState';
import { HitEffects } from '../abilities/HitEffects';
import { NullLogger } from '../diagnostics/NullLogger';
import { CollisionResolver } from '../physics/CollisionResolver';
import type { StaticCollisionShape } from '../physics/StaticCollisionIndex.types';
import { StaticCollisionIndex } from '../physics/StaticCollisionIndex';
import type { StepRunner } from '../state/HitRunner.types';
import { GameState } from '../state/GameState';
import type { Polygon } from '../utils/geometry.types';
import { createDefaultProjectileImpacts } from './defaultProjectileImpacts';
import { MovementSystem } from './MovementSystem';
import { ProjectileSystem } from './ProjectileSystem';
import { StatusEffectSystem } from './StatusEffectSystem';

const PROJECTILES = loadProjectiles(30);
const STATUSES = loadStatusEffects(30, 2);
const REGISTRY = createDefaultAbilityRegistry(loadAbilities(30), 30);
const OPEN = { x: -1000, y: -1000, width: 2000, height: 2000 };

const rect = (x: number, y: number, width: number, height: number): Polygon => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];

/** A strip across the shot's way, 10 m to 20 m east of the archer, with the given flags. */
const strip = (flags: Partial<StaticCollisionShape>): StaticCollisionShape => ({
  id: 'strip',
  polygon: rect(10, -20, 10, 40),
  ...flags,
});

const LAVA = strip({ isLowGround: true, isFire: true });
const LAKE = strip({ isLowGround: true });
const MOUNTAIN = strip({});

const attackOf = (projectileId: string): RangedAttack => ({
  strategy: 'ranged-projectile',
  damage: 100,
  reach: 100,
  interval: 27,
  projectile: { projectileId, falloff: null },
});

/** A light archer at the origin, a dark Warrior 30 m east, real hit effects, statuses and damage. */
const setUp = (shape: StaticCollisionShape, hits?: StepRunner | null) => {
  const collisions = new CollisionResolver(new StaticCollisionIndex([shape]), OPEN);
  const state = new GameState(createDefaultGameConfig(), 1, null, { collisions });
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    unitsWithWarriorKit(),
    undefined,
    loadWeapons(30),
  );
  const archer = factory.create('warrior', 'warrior', { position: { x: 0, y: 0 }, team: 'light' });
  const target = factory.create('warrior', 'warrior', { position: { x: 30, y: 0 }, team: 'dark' });
  state.entities.add(archer);
  state.entities.add(target);
  const damage = new DamagePipeline();
  const statuses = new StatusEffectApplier(STATUSES);
  const effects = new HitEffects(REGISTRY, damage, statuses);
  const system = new ProjectileSystem(
    createDefaultProjectileImpacts(damage, effects),
    hits === undefined ? effects : hits,
  );
  const context = { state, logger: new NullLogger() };
  let counter = 0;
  const fire = (definition: ProjectileDefinition, by: number) => {
    counter += 1;
    const shot = new Projectile(`shot-${String(counter)}`, definition.id);
    shot.spawn({ definition, position: { x: 0, y: 0 }, team: 'light' });
    shot.addComponent(
      new ProjectilePayload({
        ownerId: archer.id,
        team: 'light',
        ownerLevel: 1,
        source: { attackerId: archer.id, kind: 'weapon', definitionId: 'bow' },
        targetId: null,
        impact: { kind: 'weapon', attack: attackOf(definition.id) },
        origin: { x: 0, y: 0 },
      }),
    );
    state.entities.add(shot);
    shot.getComponent(Transform).moveBy({ x: by, y: 0 });
    return shot;
  };
  const damaged: { targetId: string; amount: number; attackerId: string | null; kind: string }[] =
    [];
  state.events.on('damage-applied', ({ targetId, amount, source }) =>
    damaged.push({ targetId, amount, attackerId: source.attackerId, kind: source.kind }),
  );
  const burning = () =>
    target.getComponent(StatusEffects).active.some(({ definition }) => definition.id === 'burn');
  const status = new StatusEffectSystem(damage, statuses);
  return { state, archer, target, system, status, context, fire, damaged, burning };
};

const ARROW = PROJECTILES.get('arrow');

describe('ProjectileSystem with lakes, lava and lit arrows (HC-Q89, DEC-345)', () => {
  it('lets an arrow fly over lava, light it, and burn the body it lands on, credited to the shooter', () => {
    const { state, target, system, status, context, fire, damaged, burning } = setUp(LAVA);
    const shot = fire(ARROW, 45);

    system.update(context);

    expect(state.entities.has(shot.id)).toBe(false);
    expect(damaged).toHaveLength(1);
    expect(burning()).toBe(true);
    const health = target.getComponent(Health);
    const afterArrow = health.current;
    for (let tick = 0; tick < 40; tick += 1) {
      state.advanceTick();
      status.update(context);
    }
    expect(burning()).toBe(false);
    expect(health.current).toBeLessThan(afterArrow);
    const burns = damaged.filter(({ kind }) => kind === 'status');
    expect(burns.length).toBeGreaterThanOrEqual(5);
    expect(
      burns.every(({ amount, attackerId }) => amount === 12 && attackerId === 'entity-1'),
    ).toBe(true);
  });

  it('keeps an arrow lit over several ticks of real flight and burns on landing', () => {
    const { state, system, context, fire, burning } = setUp(LAVA);
    const shot = fire(ARROW, 0);
    shot.getComponent(Movement).steer({ x: 1, y: 0 });
    const movement = new MovementSystem();
    const litAt: boolean[] = [];

    for (let tick = 0; tick < 40 && state.entities.has(shot.id); tick += 1) {
      movement.update(context);
      system.update(context);
      if (state.entities.has(shot.id)) litAt.push(shot.getComponent(ProjectileFlight).isLit);
    }

    expect(litAt[0]).toBe(false);
    expect(litAt.at(-1)).toBe(true);
    expect(state.entities.has(shot.id)).toBe(false);
    expect(burning()).toBe(true);
  });

  it('flies an arrow over a lake with damage and no burn', () => {
    const { state, system, context, fire, damaged, burning } = setUp(LAKE);
    const shot = fire(ARROW, 45);

    system.update(context);

    expect(state.entities.has(shot.id)).toBe(false);
    expect(damaged).toHaveLength(1);
    expect(burning()).toBe(false);
  });

  it('flies a turret bolt and an orb over lava with damage and no burn', () => {
    for (const id of ['turret-bolt', 'magus-bolt']) {
      const { system, context, fire, damaged, burning } = setUp(LAVA);
      fire(PROJECTILES.get(id), 45);

      system.update(context);

      expect(damaged).toHaveLength(1);
      expect(burning()).toBe(false);
    }
  });

  it('stops a shot at a mountain, with no damage and no burn', () => {
    const { state, system, context, fire, damaged, burning } = setUp(MOUNTAIN);
    const shot = fire(ARROW, 45);

    system.update(context);

    expect(state.entities.has(shot.id)).toBe(false);
    expect(damaged).toEqual([]);
    expect(burning()).toBe(false);
  });

  it('does not light an arrow that never touched lava', () => {
    const { state, system, context, fire, burning } = setUp(LAVA);
    const shot = fire(ARROW, 5);

    system.update(context);

    expect(state.entities.has(shot.id)).toBe(true);
    expect(shot.getComponent(ProjectileFlight).isLit).toBe(false);
    expect(burning()).toBe(false);
  });

  it('runs the lit steps once, named after the arrow, from the owner, only for a hit that lands', () => {
    const calls: unknown[][] = [];
    const hits: StepRunner = {
      runSteps: (_state, attackerId, targetId, id, steps) =>
        calls.push([attackerId, targetId, id, steps]),
    };
    const { target, system, context, fire } = setUp(LAVA, hits);
    fire(ARROW, 45);

    system.update(context);

    expect(calls).toEqual([['entity-1', target.id, 'arrow', ARROW.litOnHit]]);
  });

  it('runs no lit steps for a hit that lands nothing (a mountain between, a body that takes no damage)', () => {
    const calls: unknown[] = [];
    const hits: StepRunner = {
      runSteps: () => calls.push(1),
    };
    const { system, context, fire } = setUp(MOUNTAIN, hits);
    fire(ARROW, 45);

    system.update(context);

    expect(calls).toEqual([]);
  });

  it('burns a building-like body with no StatusEffects: it takes the arrow and no burn', () => {
    const { state, target, system, context, fire, damaged } = setUp(LAVA);
    target.removeComponent(StatusEffects);
    fire(ARROW, 45);

    system.update(context);

    expect(damaged).toHaveLength(1);
    expect(state.entities.has(target.id)).toBe(true);
  });

  it('runs no lit steps on a body that takes no damage now (a closed gate)', () => {
    const calls: unknown[] = [];
    const hits: StepRunner = { runSteps: () => calls.push(1) };
    const { target, system, context, fire } = setUp(LAVA, hits);
    target.getComponent(Collider).setUnbreakable(true);
    fire(ARROW, 45);

    system.update(context);

    expect(calls).toEqual([]);
  });

  it('burns from the owner as it fired when the owner is gone before the arrow lands', () => {
    const { state, archer, system, context, fire, burning } = setUp(LAVA);
    fire(ARROW, 45);
    state.entities.remove(archer.id, 'died');

    system.update(context);

    expect(burning()).toBe(true);
  });
});
