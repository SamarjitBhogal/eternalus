// PROTOTYPE(PROTO-01) TEMPORARY: tests demo code; delete with `FollowLeaderController.ts`.
import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';
import { FollowLeaderController } from './FollowLeaderController';
import { loadWeapons } from '../content/weapons/loadWeapons';

const PROFILE = {
  followDistance: 2,
  separationRadius: 1,
  separationWeight: 1,
  minSteer: 0.25,
  decideEveryTicks: 5,
};

const setup = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(30),
    undefined,
    loadWeapons(30),
  );
  const add = (kind: string, definitionId: string, position: Vec2, team: 'light' | 'dark') => {
    const entity = factory.create(kind, definitionId, { position, team });
    state.entities.add(entity);
    return entity.id;
  };
  return {
    state,
    legend: (position: Vec2, team: 'light' | 'dark' = 'light') =>
      add('warrior', 'warrior', position, team),
    minion: (position: Vec2, team: 'light' | 'dark' = 'light') =>
      add('light-mob', 'light-minion', position, team),
    dummy: (position: Vec2) => add('light-mob', 'training-dummy', position, 'light'),
  };
};

const controller = new FollowLeaderController(PROFILE);

describe('FollowLeaderController', () => {
  it('moves toward the nearest Legend of its own team', () => {
    const { state, legend, minion } = setup();
    legend({ x: 10, y: 0 });
    legend({ x: -3, y: 0 }, 'dark');
    legend({ x: 0, y: 20 });
    const id = minion({ x: 0, y: 0 });

    expect(controller.decide(state, id)).toEqual([
      { type: 'move', actorId: id, direction: { x: 1, y: 0 } },
    ]);
  });

  it('steps back from a Legend that stands on top of it', () => {
    const { state, legend, minion } = setup();
    legend({ x: 0.5, y: 0 });
    const id = minion({ x: 0, y: 0 });

    expect(controller.decide(state, id)).toEqual([
      { type: 'move', actorId: id, direction: { x: -0.5, y: 0 } },
    ]);
  });

  it('stops once inside the follow distance, and only if it is still moving', () => {
    const { state, legend, minion } = setup();
    legend({ x: 1.5, y: 0 });
    const id = minion({ x: 0, y: 0 });

    expect(controller.decide(state, id)).toEqual([]);
    state.entities.steer(id, { x: 1, y: 0 });
    expect(controller.decide(state, id)).toEqual([{ type: 'stop', actorId: id }]);
  });

  it('stops when its team has no Legend', () => {
    const { state, legend, minion } = setup();
    legend({ x: 5, y: 0 }, 'dark');
    const id = minion({ x: 0, y: 0 });
    state.entities.steer(id, { x: 0, y: 1 });

    expect(controller.decide(state, id)).toEqual([{ type: 'stop', actorId: id }]);
  });

  it('decides at the cadence of its profile', () => {
    expect(controller.cadenceTicks).toBe(PROFILE.decideEveryTicks);
  });

  it('pushes away from a crowding follower, but not from other mobs', () => {
    const { state, legend, minion, dummy } = setup();
    legend({ x: 0, y: 1.5 });
    const id = minion({ x: 0, y: 0 });
    dummy({ x: -0.2, y: 0 });
    minion({ x: 0.5, y: 0 });

    expect(controller.decide(state, id)).toEqual([
      { type: 'move', actorId: id, direction: { x: -0.5, y: 0 } },
    ]);
  });

  it('decides nothing for an entity without a position or team', () => {
    const { state } = setup();

    expect(controller.decide(state, 'missing')).toEqual([]);
  });
});
