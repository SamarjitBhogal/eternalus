import { describe, expect, it } from 'vitest';

import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { AGGRO_RULES } from '../content/ai/aggro/aggroRules';
import { TOWER_GUARD_AGGRO } from '../content/ai/aggro/towerGuard';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { SpaceIndex } from '../physics/SpaceIndex';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import type { AiMemory } from '../state/AiState.types';
import { GameState } from '../state/GameState';
import { GuardController } from './GuardController';
import { Perception } from './perception/Perception';

const controller = new GuardController({
  aggro: AGGRO_RULES,
  classOf: (kind) => (kind.endsWith('-mob') ? 'minion' : null),
});

/** A light guard posted at (60, 20) by a home of radius 10 at (50, 20), leash 8. */
const setUp = () => {
  const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
  const state = new GameState(createDefaultGameConfig(), 1, TWO_LANE_MAP, space);
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
  const perception = new Perception(state);
  const add = (team: 'light' | 'dark', x: number, definitionId = 'light-minion') => {
    const entity = factory.create('light-mob', definitionId, { team, position: { x, y: 20 } });
    state.entities.add(entity);
    return entity.id;
  };
  const guard = add('light', 60, 'light-guard');
  state.guards.add({
    id: 'home:0',
    homeId: 'home',
    team: 'light',
    mobId: 'light-guard',
    row: 0,
    indexInRow: 0,
    postX: 60,
    postY: 20,
    homeX: 50,
    homeY: 20,
    homeRadius: 10,
    leashRadius: 8,
    leashTolerance: 2,
    respawnTicks: 3600,
  });
  state.guards.fill(0, guard);
  const moveGuardTo = (x: number) => {
    const transform = state.entities.get(guard)?.getComponent(Transform);
    transform?.moveBy({ x: x - transform.position.x, y: 0 });
  };
  const decide = (memory: AiMemory = {}) => {
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      const { x, y } = entity.getComponent(Transform).position;
      space.add(entity.id, x, y);
    });
    space.commit();
    return controller.decide({
      state,
      entityId: guard,
      perception,
      brain: {
        controllerId: 'guard',
        profileId: 'tower-guard',
        memory,
        rngState: { seed: 1, words: [1, 2, 3, 4] as const },
      },
    });
  };
  return { state, guard, add, decide, moveGuardTo };
};

describe('GuardController', () => {
  it('holding: attacks the nearest enemy that comes in range, and does nothing otherwise', () => {
    const { guard, add, decide } = setUp();
    expect(decide()).toMatchObject({ commands: [], memory: { fsm: 'holding' } });

    const enemy = add('dark', 64);

    expect(decide()).toMatchObject({
      commands: [{ type: 'attack-target', actorId: guard, targetId: enemy }],
      memory: { fsm: 'engaging', targetId: enemy },
    });
  });

  it('engaging: stops and returns once it is past its leash from the structure’s edge', () => {
    const { guard, add, decide, moveGuardTo } = setUp();
    const enemy = add('dark', 70);
    const engaging = { fsm: 'engaging', targetId: enemy, aggroUntilTick: 1000 };

    moveGuardTo(68); // 8 past the edge at 60: still inside
    expect(decide(engaging).commands).toEqual([]);

    moveGuardTo(69);
    expect(decide(engaging)).toMatchObject({
      commands: [{ type: 'stop', actorId: guard }],
      memory: { fsm: 'returning', targetId: null },
    });
  });

  it('returning: holds again at its post, with a cooldown before it acquires', () => {
    const { state, add, decide, moveGuardTo } = setUp();
    moveGuardTo(63);
    expect(decide({ fsm: 'returning' }).memory).toMatchObject({ fsm: 'returning' });

    moveGuardTo(60.5);
    expect(decide({ fsm: 'returning' }).memory).toEqual(
      expect.objectContaining({
        fsm: 'holding',
        cooldownUntilTick: state.tick + TOWER_GUARD_AGGRO.aggroCooldownTicks,
      }),
    );
    add('dark', 62);
    expect(decide({ fsm: 'holding', cooldownUntilTick: 10 }).commands).toEqual([]);
  });

  it('does nothing for an entity on no post, and knows its profiles', () => {
    const { state, add } = setUp();
    const stray = add('light', 30);
    const decision = controller.decide({
      state,
      entityId: stray,
      perception: new Perception(state),
      brain: {
        controllerId: 'guard',
        profileId: 'tower-guard',
        memory: {},
        rngState: { seed: 1, words: [1, 2, 3, 4] as const },
      },
    });

    expect(decision.commands).toEqual([]);
    expect(controller.hasProfile('tower-guard')).toBe(true);
    expect(controller.hasProfile('nope')).toBe(false);
  });

  it('throws on an aggro profile that does not exist', () => {
    const { state, guard } = setUp();

    expect(() =>
      controller.decide({
        state,
        entityId: guard,
        perception: new Perception(state),
        brain: {
          controllerId: 'guard',
          profileId: 'nope',
          memory: {},
          rngState: { seed: 1, words: [1, 2, 3, 4] as const },
        },
      }),
    ).toThrow('names aggro profile "nope"');
  });

  it('holds a neutral camp mob at its camp: it attacks either team and returns past its leash', () => {
    const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
    const state = new GameState(createDefaultGameConfig(), 1, TWO_LANE_MAP, space);
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    const add = (team: 'light' | 'dark' | 'neutral', x: number, definitionId: string) => {
      const entity = factory.create('light-mob', definitionId, { team, position: { x, y: 20 } });
      state.entities.add(entity);
      return entity;
    };
    // A camp of radius 1 at (100, 20), post 3 out, leash 6 from its edge.
    const mob = add('neutral', 103, 'light-camp-mob');
    state.guards.add({
      id: 'camp:0',
      homeId: 'camp',
      team: 'neutral',
      mobId: 'light-camp-mob',
      row: 0,
      indexInRow: 0,
      postX: 103,
      postY: 20,
      homeX: 100,
      homeY: 20,
      homeRadius: 1,
      leashRadius: 6,
      leashTolerance: 2,
      respawnTicks: 3600,
    });
    state.guards.fill(0, mob.id);
    const decide = (memory: AiMemory = {}) => {
      space.begin(state.entities.size);
      state.entities.forEach((entity) => {
        const { x, y } = entity.getComponent(Transform).position;
        space.add(entity.id, x, y);
      });
      space.commit();
      return controller.decide({
        state,
        entityId: mob.id,
        perception: new Perception(state),
        brain: {
          controllerId: 'guard',
          profileId: 'camp-mob',
          memory,
          rngState: { seed: 1, words: [1, 2, 3, 4] as const },
        },
      });
    };
    const intruder = add('light', 106, 'light-minion');

    expect(decide().commands).toEqual([
      { type: 'attack-target', actorId: mob.id, targetId: intruder.id },
    ]);

    // Dragged 7.5 past the camp's edge, past its 6 m leash: it stops and returns.
    mob.getComponent(Transform).moveBy({ x: 5.5, y: 0 });
    const engaging = { fsm: 'engaging', targetId: intruder.id, aggroUntilTick: 1000 };
    expect(decide(engaging)).toMatchObject({
      commands: [{ type: 'stop', actorId: mob.id }],
      memory: { fsm: 'returning' },
    });
    mob.getComponent(Transform).moveBy({ x: -5.5, y: 0 });
    expect(decide({ fsm: 'returning' }).memory).toMatchObject({ fsm: 'holding' });
  });
});
