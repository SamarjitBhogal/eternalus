import { describe, expect, it } from 'vitest';

import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { StatusEffects } from '../../components/StatusEffects';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import type { MapDefinition } from '../../content/maps/maps.types';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import type { Entity } from '../../entities/Entity';
import { EntityFactory } from '../../entities/EntityFactory';
import { WorldMap } from '../../map/WorldMap';
import { GameState } from '../../state/GameState';
import { MatchWorld } from '../../state/MatchWorld';
import { unitsWithWarriorKit } from '../__fixtures__/casterState';
import { castSteps } from '../__fixtures__/castSteps';
import { DashEffect } from './DashEffect';

const PATH = { kind: 'path', width: 1 } as const;
const END = { kind: 'circle', radius: 1.5 } as const;
/** 8 m in 9 ticks: 40 damage to every enemy on the way, a 15-tick stun around the end. */
const DASH = {
  kind: 'dash',
  distance: 8,
  durationTicks: 9,
  onPath: [{ kind: 'damage', amount: 40, damageType: 'physical', shape: PATH }],
  onEnd: [{ kind: 'debuff', statusId: 'stun', durationTicks: 15, shape: END }],
} as const;

/** A 20 x 20 map with a rift filling x = 5 to 6, on a 1 m grid. */
const RIFT_MAP: MapDefinition = {
  id: 'dash-test',
  displayName: 'Test',
  width: 20,
  height: 20,
  seed: 1,
  features: [],
  lanes: [],
  terrain: [
    {
      id: 'rift',
      kind: 'rift',
      shape: [
        { x: 5.2, y: 0 },
        { x: 5.8, y: 0 },
        { x: 5.8, y: 20 },
        { x: 5.2, y: 20 },
      ],
    },
  ],
};

/** A light Warrior at (1, 10), on the rift map or on no map, and a spawner for dark dummies. */
const setUp = (hasMap = false) => {
  const world = hasMap
    ? new MatchWorld(
        RIFT_MAP,
        WorldMap.fromDefinition(RIFT_MAP, 1, () => false),
      )
    : null;
  const state = new GameState(createDefaultGameConfig(), 1, world);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    unitsWithWarriorKit(),
    undefined,
    loadWeapons(30),
  );
  const caster = factory.create('warrior', 'warrior', { position: { x: 1, y: 10 }, team: 'light' });
  state.entities.add(caster);
  const dummyAt = (x: number, y = 10) => {
    const dummy = factory.create('light-mob', 'training-dummy', {
      position: { x, y },
      team: 'dark',
    });
    state.entities.add(dummy);
    return dummy;
  };
  return { state, caster, dummyAt };
};

/** Where the caster's dash takes it: every forced step added up. */
const dashOf = (caster: Entity) => {
  const movement = caster.getComponent(Movement);
  const total = { x: 0, y: 0, ticks: 0 };
  while (movement.isForced) {
    const step = movement.takeForcedStep();
    total.x += step.x;
    total.y += step.y;
    total.ticks += 1;
  }
  return total;
};

const damageTaken = (entity: Entity) =>
  entity.getComponent(Health).max - entity.getComponent(Health).current;
const isStunned = (entity: Entity) => entity.getComponent(StatusEffects).has('cannot-move');

describe('DashEffect', () => {
  it('has the kind it is registered under', () => {
    expect(new DashEffect().kind).toBe('dash');
  });

  it('dashes the caster its distance along the aim, over its duration', () => {
    const { state, caster } = setUp();

    castSteps(state, caster.id, [DASH], { aim: { x: 1, y: 30 } });

    const dash = dashOf(caster);
    expect(dash.ticks).toBe(9);
    expect(dash.x).toBeCloseTo(0, 9);
    expect(dash.y).toBeCloseTo(8, 9);
  });

  it('hits each unit on the path once, and runs the end step around the end point', () => {
    const { state, caster, dummyAt } = setUp();
    const onPath = dummyAt(4);
    const nearEnd = dummyAt(9.5);
    const pastEnd = dummyAt(12);
    const beside = dummyAt(4, 12);

    castSteps(state, caster.id, [DASH], { aim: { x: 30, y: 10 } });

    expect([onPath, nearEnd, pastEnd, beside].map(damageTaken)).toEqual([40, 40, 0, 0]);
    expect([onPath, nearEnd, pastEnd, beside].map(isStunned)).toEqual([false, true, false, false]);
  });

  it('stops the path where the ground is first blocked (WorldMap.isLineClear)', () => {
    const { state, caster, dummyAt } = setUp(true);
    const behindRift = dummyAt(7);
    const atWall = dummyAt(4.6);

    castSteps(state, caster.id, [DASH], { aim: { x: 30, y: 10 } });

    expect(dashOf(caster).x).toBeCloseTo(4, 3); // from x = 1 to the blocked cell at x = 5
    expect(damageTaken(behindRift)).toBe(0);
    expect(isStunned(atWall)).toBe(true);
  });
});
