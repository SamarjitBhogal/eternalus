import { describe, expect, it } from 'vitest';

import { Movement } from '../../components/Movement';
import { StatusEffects } from '../../components/StatusEffects';
import { KNOCKBACK } from '../../content/abilities/knockback';
import type { Entity } from '../../entities/Entity';
import { TickRate } from '../../utils/TickRate';
import { casterState } from '../__fixtures__/casterState';
import { castSteps } from '../__fixtures__/castSteps';
import { KnockbackEffect } from './KnockbackEffect';

const AREA = { kind: 'circle', radius: 4 } as const;
const PUSH = { kind: 'knockback', distance: 3, shape: AREA } as const;
/** 0.25 s at 30 ticks per second, rounded: 8 ticks. */
const TRAVEL_TICKS = new TickRate(30).toTicks(KNOCKBACK.travelSeconds);

const setUp = () => {
  const { state, factory, caster } = casterState();
  const spawn = (definitionId: string, x: number, y = 0, team: 'light' | 'dark' = 'dark') => {
    const kind = definitionId === 'training-dummy' ? 'light-mob' : definitionId;
    const entity = factory.create(kind, definitionId, { position: { x, y }, team });
    state.entities.add(entity);
    return entity;
  };
  return { state, caster, spawn };
};

/** Every forced step the entity takes from now on, added up, and how many ticks they took. */
const travel = (entity: Entity) => {
  const movement = entity.getComponent(Movement);
  const total = { x: 0, y: 0 };
  let ticks = 0;
  while (movement.isForced) {
    const step = movement.takeForcedStep();
    total.x += step.x;
    total.y += step.y;
    ticks += 1;
  }
  return { ...total, ticks };
};

const statusesOf = (entity: Entity) =>
  entity.getComponent(StatusEffects).active.map(({ definition }) => definition.id);

describe('KnockbackEffect', () => {
  it('has the kind it is registered under', () => {
    expect(new KnockbackEffect(KNOCKBACK).kind).toBe('knockback');
  });

  it('pushes a base-mass target the full distance away from the centre, over the travel time', () => {
    const { state, caster, spawn } = setUp();
    const warrior = spawn('warrior', 0, 2); // mass 1 = KNOCKBACK.baseMass

    castSteps(state, caster.id, [PUSH]);

    const moved = travel(warrior);
    expect(moved.ticks).toBe(TRAVEL_TICKS);
    expect(moved.x).toBeCloseTo(0, 9);
    expect(moved.y).toBeCloseTo(3, 9);
  });

  it('moves a heavier target less (distance × baseMass / mass) and a lighter one no further', () => {
    const { state, caster, spawn } = setUp();
    const sentinel = spawn('sentinel', 3, 0); // mass 6
    const magus = spawn('magus', -3, 0); // mass 2
    const dummy = spawn('training-dummy', 0, -3); // mass 0.5

    castSteps(state, caster.id, [PUSH]);

    expect(travel(sentinel).x).toBeCloseTo(0.5, 9);
    expect(travel(magus).x).toBeCloseTo(-1.5, 9);
    expect(travel(dummy).y).toBeCloseTo(-3, 9);
  });

  it('adds knock-backs that reach one target in the same tick as vectors (DEC-208)', () => {
    const { state, caster, spawn } = setUp();
    const target = spawn('warrior', 2, 0);
    const second = spawn('warrior', 2, -2, 'light');

    castSteps(state, caster.id, [PUSH]); // from (0, 0): east
    castSteps(state, second.id, [PUSH]); // from (2, -2): south to north

    const moved = travel(target);
    expect(moved.x).toBeCloseTo(3, 9);
    expect(moved.y).toBeCloseTo(3, 9);
  });

  it('pushes a target on the exact centre along the cast’s direction, and not at all with none', () => {
    const along = setUp();
    const onCentre = along.spawn('warrior', 0, 0);
    castSteps(along.state, along.caster.id, [PUSH], { aim: { x: 0, y: -10 } });
    const moved = travel(onCentre);
    expect([moved.x, moved.y]).toEqual([0, -3]);

    const still = setUp();
    const unmoved = still.spawn('warrior', 0, 0);
    castSteps(still.state, still.caster.id, [PUSH], { aim: { x: 0, y: 0 } });
    expect(unmoved.getComponent(Movement).isForced).toBe(false);
    expect(statusesOf(unmoved)).toEqual(['staggered']);
  });

  it('staggers every target it reaches, knocks it up too when the step says so, never allies', () => {
    const { state, caster, spawn } = setUp();
    const enemy = spawn('warrior', 2, 0);
    const ally = spawn('warrior', -2, 0, 'light');

    castSteps(state, caster.id, [{ ...PUSH, knockup: true }]);

    expect(statusesOf(enemy)).toEqual(['staggered', 'knockup']);
    expect(statusesOf(ally)).toEqual([]);
    expect(ally.getComponent(Movement).isForced).toBe(false);
  });

  it('leaves a target with no Movement (a structure) where it is', () => {
    const { state, caster, spawn } = setUp();
    const tower = spawn('spawner-tower', 3, 0);

    expect(() => {
      castSteps(state, caster.id, [PUSH]);
    }).not.toThrow();
    expect(tower.hasComponent(Movement)).toBe(false);
  });

  it('checks its own fields: a positive distance', () => {
    const knockback = new KnockbackEffect(KNOCKBACK);

    expect(knockback.validate(PUSH)).toEqual([]);
    expect(knockback.validate({ ...PUSH, distance: 0 })).toEqual([
      'knockback distance must be positive',
    ]);
  });

  it('shows its area on the aim overlay', () => {
    expect(new KnockbackEffect(KNOCKBACK).describe(PUSH)).toEqual([
      { kind: 'knockback', shape: AREA },
    ]);
  });
});
