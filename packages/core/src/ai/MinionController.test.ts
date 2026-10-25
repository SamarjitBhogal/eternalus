import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { AGGRO_RULES } from '../content/ai/aggro/aggroRules';
import { LANE_MINION_AGGRO } from '../content/ai/aggro/laneMinion';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { RANKS_FORMATION } from '../content/mobs/formations/ranks';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { SpaceIndex } from '../physics/SpaceIndex';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import type { AiMemory } from '../state/AiState.types';
import { GameState } from '../state/GameState';
import { MinionController } from './MinionController';
import { Perception } from './perception/Perception';

const CLASS_OF = (kind: string) =>
  kind === 'warrior' ? ('legend' as const) : kind.endsWith('-mob') ? ('minion' as const) : null;

const controller = new MinionController({
  aggro: AGGRO_RULES,
  formations: { ranks: RANKS_FORMATION },
  classOf: CLASS_OF,
});

const setUp = () => {
  const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
  const state = new GameState(createDefaultGameConfig(), 1, TWO_LANE_MAP, space);
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
  const perception = new Perception(state);
  const add = (
    team: 'light' | 'dark',
    x: number,
    y = 20,
    kind = 'light-mob',
    id = 'light-minion',
  ) => {
    const entity = factory.create(kind, id, { team, position: { x, y } });
    state.entities.add(entity);
    return entity.id;
  };
  /** Refills the index the way `SpaceSystem` does: every unit, in store order. */
  const index = () => {
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      const { x, y } = entity.getComponent(Transform).position;
      space.add(entity.id, x, y);
    });
    space.commit();
  };
  const decide = (entityId: string, memory: AiMemory = {}, profileId = 'lane-minion') => {
    index();
    return controller.decide({
      state,
      entityId,
      perception,
      brain: {
        controllerId: 'minion',
        profileId,
        memory,
        rngState: { seed: 1, words: [1, 2, 3, 4] as const },
      },
    });
  };
  const advance = (ticks: number) => {
    for (let tick = 0; tick < ticks; tick += 1) {
      state.advanceTick();
    }
  };
  return { state, add, decide, advance };
};

const engagingOn = (targetId: string, overrides: Partial<Record<string, number>> = {}) => ({
  fsm: 'engaging',
  targetId,
  aggroUntilTick: 1000,
  cooldownUntilTick: 0,
  leashX: 50,
  leashY: 20,
  ...overrides,
});

describe('MinionController', () => {
  it('marching: acquires the nearest enemy in range and attacks it, keeping its RNG', () => {
    const { add, decide } = setUp();
    const self = add('light', 50);
    const near = add('dark', 53);
    add('dark', 54);
    add('light', 51);

    const decision = decide(self);

    expect(decision.commands).toEqual([{ type: 'attack-target', actorId: self, targetId: near }]);
    expect(decision.memory).toMatchObject({
      fsm: 'engaging',
      targetId: near,
      aggroUntilTick: LANE_MINION_AGGRO.aggroDurationTicks,
      leashX: 50,
      leashY: 20,
    });
    expect(decision.rngState).toEqual({ seed: 1, words: [1, 2, 3, 4] as const });
  });

  it('marching: does nothing with no enemy in range, or while its cooldown runs', () => {
    const { add, decide } = setUp();
    const self = add('light', 50);
    add('dark', 50 + LANE_MINION_AGGRO.acquisitionRadius + 1);

    expect(decide(self).commands).toEqual([]);
    expect(decide(self).memory).toMatchObject({ fsm: 'marching' });

    add('dark', 52);
    expect(decide(self, { fsm: 'marching', cooldownUntilTick: 5 }).commands).toEqual([]);
  });

  it('ranks by the priority list before distance: an enemy hitting an allied Legend goes first', () => {
    const { state, add, decide } = setUp();
    const self = add('light', 50);
    add('dark', 51);
    const legend = add('light', 58, 20, 'warrior', 'warrior');
    const attacker = add('dark', 54);
    state.entities.setAttackTarget(attacker, legend);

    expect(decide(self).commands).toEqual([
      { type: 'attack-target', actorId: self, targetId: attacker },
    ]);
  });

  it('engaging: switches only to a strictly better-ranked enemy', () => {
    const { state, add, decide } = setUp();
    const self = add('light', 50);
    const target = add('dark', 54);
    const closer = add('dark', 51);

    expect(decide(self, engagingOn(target)).commands).toEqual([]);

    const legend = add('light', 49, 20, 'warrior', 'warrior');
    state.entities.setAttackTarget(closer, legend);
    const decision = decide(self, engagingOn(target));
    expect(decision.commands).toEqual([{ type: 'attack-target', actorId: self, targetId: closer }]);
    expect(decision.memory).toMatchObject({ targetId: closer });
  });

  it('engaging: stops and returns when the target dies, the leash breaks or aggro runs out', () => {
    const { state, add, decide, advance } = setUp();
    const self = add('light', 50);
    const target = add('dark', 52);
    const returning = { fsm: 'returning', targetId: null };
    const stop = [{ type: 'stop', actorId: self }];

    expect(decide(self, engagingOn(target, { leashX: 30 }))).toMatchObject({
      commands: stop,
      memory: returning,
    });
    advance(10);
    expect(decide(self, engagingOn(target, { aggroUntilTick: 10 })).commands).toEqual(stop);
    state.entities.get(target)?.getComponent(Health).applyDamage(1e6);
    expect(decide(self, engagingOn(target)).commands).toEqual(stop);
  });

  it('returning: marches again at its slot, with a cooldown, and keeps returning until then', () => {
    const { state, add, decide, advance } = setUp();
    const leader = add('light', 60);
    const loner = add('light', 70);
    // The anchor 40 m in is (60, 20): the leader stands on its slot.
    state.hordes.add({
      id: 'horde-1',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [leader, loner],
      progress: 40,
    });
    advance(3);

    expect(decide(leader, { fsm: 'returning' }).memory).toMatchObject({
      fsm: 'marching',
      cooldownUntilTick: 3 + LANE_MINION_AGGRO.aggroCooldownTicks,
    });
    expect(decide(loner, { fsm: 'returning' }).memory).toMatchObject({ fsm: 'returning' });
    const stray = add('light', 100);
    expect(decide(stray, { fsm: 'returning' }).memory).toMatchObject({ fsm: 'marching' });
  });

  it('reads a fresh memory from anything it does not recognise, and waits without an index', () => {
    const { add, decide } = setUp();
    const self = add('light', 50);

    expect(decide(self, { fsm: 'dancing', targetId: 7 }).memory).toEqual({
      fsm: 'marching',
      targetId: null,
      aggroUntilTick: 0,
      cooldownUntilTick: 0,
      leashX: 0,
      leashY: 0,
    });
    const offMap = new GameState(createDefaultGameConfig(), 1);
    const decision = controller.decide({
      state: offMap,
      entityId: self,
      perception: new Perception(offMap),
      brain: {
        controllerId: 'minion',
        profileId: 'lane-minion',
        memory: {},
        rngState: { seed: 0, words: [0, 0, 0, 0] as const },
      },
    });
    expect(decision.commands).toEqual([]);
  });

  it('throws on an aggro profile that does not exist', () => {
    const { add, decide } = setUp();
    const self = add('light', 50);

    expect(() => decide(self, {}, 'no-such-profile')).toThrow('aggro profile "no-such-profile"');
  });
});
