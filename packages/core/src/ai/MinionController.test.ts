import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { AGGRO_RULES } from '../content/ai/aggro/aggroRules';
import { LANE_MINION_AGGRO } from '../content/ai/aggro/laneMinion';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { RANKS_FORMATION } from '../content/mobs/formations/ranks';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { SpaceIndex } from '../physics/SpaceIndex';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import type { AiMemory } from '../state/AiState.types';
import { GameState } from '../state/GameState';
import { Collider } from '../components/Collider';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { IdGenerator } from '../utils/IdGenerator';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
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
  const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP), { space });
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(30),
    undefined,
    loadWeapons(30),
  );
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
  const moveTo = (entityId: string, x: number) => {
    const transform = state.entities.get(entityId)?.getComponent(Transform);
    transform?.moveBy({ x: x - transform.position.x, y: 0 });
  };
  const advance = (ticks: number) => {
    for (let tick = 0; tick < ticks; tick += 1) {
      state.advanceTick();
    }
  };
  const structures = new EntityFactory(
    createDefaultEntityRegistry(),
    STRUCTURE_DEFINITIONS,
    new IdGenerator(1000),
  );
  /** Adds a dark structure on lane-0, indexes the structures and puts `memberId` in a light horde. */
  const objective = (definitionId: string, x: number, memberId: string, progress = 0) => {
    const entity = structures.create(STRUCTURE_DEFINITIONS.get(definitionId).kind, definitionId, {
      team: 'dark',
      position: { x, y: 20 },
      laneId: 'lane-0',
    });
    state.entities.add(entity);
    state.indexStructures();
    state.hordes.add({
      id: state.hordes.nextId(),
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [memberId],
      progress,
    });
    return entity;
  };
  return { state, add, decide, advance, moveTo, objective };
};

const engagingOn = (targetId: string, overrides: Partial<Record<string, number>> = {}) => ({
  fsm: 'engaging',
  targetId,
  breakAtTick: 0,
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
      breakAtTick: 0,
      leashX: 50,
      leashY: 20,
    });
    expect(decision.rngState).toEqual({ seed: 1, words: [1, 2, 3, 4] as const });
  });

  it('marching: does nothing with no enemy in range, or in its cooldown with only the enemy that escaped there', () => {
    const { add, decide } = setUp();
    const self = add('light', 50);
    add('dark', 50 + LANE_MINION_AGGRO.acquisitionRadius + 1);

    expect(decide(self).commands).toEqual([]);
    expect(decide(self).memory).toMatchObject({ fsm: 'marching' });

    const escaped = add('dark', 52, 20, 'warrior', 'warrior');
    expect(
      decide(self, { fsm: 'marching', cooldownUntilTick: 5, escapedId: escaped }).commands,
    ).toEqual([]);
  });

  it('marching in its cooldown: leaves alone only the enemy that escaped, a minion too (DEC-144 F)', () => {
    const { add, decide } = setUp();
    const self = add('light', 50);
    const legend = add('dark', 52, 20, 'warrior', 'warrior');
    const escaped = add('dark', 53);
    const cooling = { fsm: 'marching', cooldownUntilTick: 5 };

    expect(decide(self, { ...cooling, escapedId: escaped }).commands).toEqual([
      { type: 'attack-target', actorId: self, targetId: legend },
    ]);
    expect(decide(self, { ...cooling, escapedId: legend }).commands).toEqual([
      { type: 'attack-target', actorId: self, targetId: escaped },
    ]);
  });

  it('marching after its cooldown: fights the enemy that escaped again (DEC-144 F)', () => {
    const { add, decide, advance } = setUp();
    const self = add('light', 50);
    const escaped = add('dark', 52, 20, 'warrior', 'warrior');
    const cooling = { fsm: 'marching', cooldownUntilTick: 5, escapedId: escaped };

    advance(4);
    expect(decide(self, cooling).commands).toEqual([]);
    advance(1);
    expect(decide(self, cooling).commands).toEqual([
      { type: 'attack-target', actorId: self, targetId: escaped },
    ]);
  });

  it('marching in its cooldown: still fights a minion in range, so it never walks past one (MS-36)', () => {
    const { add, decide } = setUp();
    const self = add('light', 50);
    const escaped = add('dark', 51, 20, 'warrior', 'warrior');
    const minion = add('dark', 53);

    expect(
      decide(self, { fsm: 'marching', cooldownUntilTick: 5, escapedId: escaped }).commands,
    ).toEqual([{ type: 'attack-target', actorId: self, targetId: minion }]);
  });

  it('marching in its cooldown: turns on the escaped Legend when it attacks, cornered at its slot (MS-36)', () => {
    const { state, add, decide } = setUp();
    const self = add('light', 50);
    const attacker = add('dark', 53, 20, 'warrior', 'warrior');
    state.entities.setAttackTarget(attacker, self);

    const decision = decide(self, { fsm: 'marching', cooldownUntilTick: 5, escapedId: attacker });

    expect(decision.commands).toEqual([
      { type: 'attack-target', actorId: self, targetId: attacker },
    ]);
    expect(decision.memory).toMatchObject({ fsm: 'engaging', targetId: attacker, leashX: 50 });
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

  it('engaging: fights a target inside the leash with no time limit, a Legend too (MS-36)', () => {
    for (const [kind, definitionId] of [
      ['light-mob', 'light-minion'],
      ['warrior', 'warrior'],
    ] as const) {
      const { add, decide, advance } = setUp();
      const self = add('light', 50);
      const target = add('dark', 53, 20, kind, definitionId);
      advance(200);

      expect(decide(self, engagingOn(target))).toMatchObject({
        commands: [],
        memory: { fsm: 'engaging', targetId: target, breakAtTick: 0 },
      });
    }
  });

  it('engaging: chases a target that leaves the leash for the grace, then breaks (DEC-144 E: distance, then time)', () => {
    const { add, decide, advance, moveTo } = setUp();
    const self = add('light', 50);
    // 10 from where it was taken: outside the 7.5 leash, and out of reach.
    const target = add('dark', 60);
    advance(5);

    const left = decide(self, engagingOn(target));
    expect(left).toMatchObject({
      commands: [],
      memory: {
        fsm: 'engaging',
        targetId: target,
        breakAtTick: 5 + LANE_MINION_AGGRO.leashGraceTicks,
      },
    });
    expect(decide(self, left.memory).commands).toEqual([]);

    moveTo(target, 52);
    expect(decide(self, left.memory)).toMatchObject({
      commands: [],
      memory: { fsm: 'engaging', targetId: target, breakAtTick: 0 },
    });

    moveTo(target, 60);
    advance(LANE_MINION_AGGRO.leashGraceTicks);
    expect(decide(self, left.memory)).toMatchObject({
      commands: [{ type: 'stop', actorId: self }],
      memory: {
        fsm: 'returning',
        targetId: null,
        breakAtTick: 0,
        cooldownUntilTick: 95 + LANE_MINION_AGGRO.aggroCooldownTicks,
        escapedId: target,
      },
    });
  });

  it('engaging: in the grace, takes another enemy in reach at once', () => {
    const { add, decide } = setUp();
    const self = add('light', 50);
    const escaped = add('dark', 60);
    const next = add('dark', 53);

    expect(decide(self, engagingOn(escaped, { breakAtTick: 50 }))).toMatchObject({
      commands: [{ type: 'attack-target', actorId: self, targetId: next }],
      memory: { fsm: 'engaging', targetId: next, breakAtTick: 0, leashX: 50 },
    });
  });

  it('engaging: re-anchors on the Legend that escaped its leash only when it attacks the mob', () => {
    const { state, add, decide } = setUp();
    const self = add('light', 50);
    // In reach of where the mob stands, but 12 from where it took the Legend.
    const legend = add('dark', 52, 20, 'warrior', 'warrior');
    const grace = engagingOn(legend, { leashX: 40, breakAtTick: 50 });

    expect(decide(self, grace)).toMatchObject({ commands: [], memory: grace });

    state.entities.setAttackTarget(legend, self);
    // Still chasing it in the grace, it needs no new command.
    expect(decide(self, grace)).toMatchObject({
      commands: [],
      memory: { fsm: 'engaging', targetId: legend, breakAtTick: 0, leashX: 50 },
    });
  });

  it('answers a call for help: takes an enemy beyond its reach that attacks a horde-mate', () => {
    const { state, add, decide } = setUp();
    const self = add('light', 50);
    const mate = add('light', 56);
    const outsider = add('light', 58);
    // 7 away: past the 5.4 reach, inside the 7.5 call for help.
    const enemy = add('dark', 57);
    state.hordes.add({
      id: 'horde-1',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [self, mate],
      progress: 40,
    });

    state.entities.setAttackTarget(enemy, outsider);
    expect(decide(self).commands).toEqual([]);

    state.entities.setAttackTarget(enemy, mate);
    expect(decide(self).commands).toEqual([
      { type: 'attack-target', actorId: self, targetId: enemy },
    ]);
  });

  it('answers a call for help from a Legend it would leave alone: escaped, or in the cooldown (DEC-144 D)', () => {
    const { state, add, decide } = setUp();
    const self = add('light', 50);
    const mate = add('light', 53);
    // In reach of where the mob stands, but 12 from where it took the Legend.
    const legend = add('dark', 52, 20, 'warrior', 'warrior');
    state.hordes.add({
      id: 'horde-1',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [self, mate],
      progress: 40,
    });
    state.entities.setAttackTarget(legend, mate);

    expect(decide(self, engagingOn(legend, { leashX: 40, breakAtTick: 50 }))).toMatchObject({
      commands: [],
      memory: { fsm: 'engaging', targetId: legend, breakAtTick: 0, leashX: 50 },
    });
    expect(
      decide(self, { fsm: 'marching', cooldownUntilTick: 5, escapedId: legend }).commands,
    ).toEqual([{ type: 'attack-target', actorId: self, targetId: legend }]);
  });

  it('engaging: takes the next enemy in range at once when its target dies (MS-36)', () => {
    const { state, add, decide } = setUp();
    const self = add('light', 50);
    const target = add('dark', 52);
    const next = add('dark', 54);
    state.entities.get(target)?.getComponent(Health).applyDamage(1e6);

    const decision = decide(self, engagingOn(target));

    expect(decision.commands).toEqual([{ type: 'attack-target', actorId: self, targetId: next }]);
    expect(decision.memory).toMatchObject({ fsm: 'engaging', targetId: next, leashX: 50 });
  });

  it('engaging: rests with no cooldown when its last enemy in range dies, so it fights the next at once (MS-36)', () => {
    const { state, add, decide } = setUp();
    const self = add('light', 50);
    const target = add('dark', 52);
    state.entities.get(target)?.getComponent(Health).applyDamage(1e6);

    const rested = decide(self, engagingOn(target));

    expect(rested).toMatchObject({
      commands: [{ type: 'stop', actorId: self }],
      memory: { fsm: 'marching', targetId: null, cooldownUntilTick: 0 },
    });
    // Chasing in the grace, it stops there too.
    expect(decide(self, engagingOn(target, { breakAtTick: 50 }))).toMatchObject({
      commands: [{ type: 'stop', actorId: self }],
      memory: { fsm: 'marching', targetId: null, breakAtTick: 0 },
    });
    const arrival = add('dark', 53);
    expect(decide(self, rested.memory).commands).toEqual([
      { type: 'attack-target', actorId: self, targetId: arrival },
    ]);
  });

  it('engaging: when its target dies far from where it took it, takes the next enemy in reach here', () => {
    const { state, add, decide } = setUp();
    const self = add('light', 50);
    const target = add('dark', 52);
    const next = add('dark', 54);
    state.entities.get(target)?.getComponent(Health).applyDamage(1e6);

    expect(decide(self, engagingOn(target, { leashX: 30 }))).toMatchObject({
      commands: [{ type: 'attack-target', actorId: self, targetId: next }],
      memory: { fsm: 'engaging', targetId: next, leashX: 50 },
    });
  });

  it('returning: takes an enemy in reach on the way back (MS-36)', () => {
    const { add, decide } = setUp();
    const self = add('light', 50);
    const enemy = add('dark', 53);

    expect(decide(self, { fsm: 'returning' })).toMatchObject({
      commands: [{ type: 'attack-target', actorId: self, targetId: enemy }],
      memory: { fsm: 'engaging', targetId: enemy, leashX: 50 },
    });
  });

  it('returning: marches again at its slot, keeping the cooldown its leash break started', () => {
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

    expect(
      decide(leader, { fsm: 'returning', cooldownUntilTick: 7, escapedId: 'escaped' }).memory,
    ).toMatchObject({ fsm: 'marching', cooldownUntilTick: 7, escapedId: 'escaped' });
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
      breakAtTick: 0,
      cooldownUntilTick: 0,
      escapedId: null,
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

  it('attacks its horde’s next objective when its edge is in range and no unit outranks it', () => {
    const { add, decide, objective } = setUp();
    // The SpawnerTower's radius is 14, so a minion at 124 stands 2 from its edge.
    const self = add('light', 124);
    const tower = objective('spawner-tower', 140, self);

    expect(decide(self).commands).toEqual([
      { type: 'attack-target', actorId: self, targetId: tower.id },
    ]);

    const enemy = add('dark', 122);
    expect(decide(self).commands).toEqual([
      { type: 'attack-target', actorId: self, targetId: enemy },
    ]);
  });

  it('attacks the objective from a rear rank once its horde has gathered at it', () => {
    const { add, decide, objective } = setUp();
    // 16 from the tower's edge, out of reach alone; the tower's front is 106 along lane-0.
    const self = add('light', 110);
    const tower = objective('spawner-tower', 140, self, 105);

    expect(decide(self).commands).toEqual([
      { type: 'attack-target', actorId: self, targetId: tower.id },
    ]);
  });

  it('holds at a gate that is not breakable yet, and attacks it once it is', () => {
    const { add, decide, objective } = setUp();
    const self = add('light', 134);
    const gate = objective('gate', 140, self);

    expect(decide(self).commands).toEqual([]);

    gate.getComponent(Collider).setUnbreakable(false);
    expect(decide(self).commands).toEqual([
      { type: 'attack-target', actorId: self, targetId: gate.id },
    ]);
  });

  it('keeps hitting its objective, though it stands past the leash: a structure cannot drag a mob away', () => {
    const { add, decide, objective } = setUp();
    const self = add('light', 124);
    const tower = objective('spawner-tower', 140, self);

    const decision = decide(self, engagingOn(tower.id, { leashX: 124 }));

    expect(decision.commands).toEqual([]);
    expect(decision.memory).toMatchObject({ fsm: 'engaging', targetId: tower.id });
  });

  it('knows its aggro profiles', () => {
    expect(controller.hasProfile('lane-minion')).toBe(true);
    expect(controller.hasProfile('minion')).toBe(false);
  });

  it('throws on an aggro profile that does not exist', () => {
    const { add, decide } = setUp();
    const self = add('light', 50);

    expect(() => decide(self, {}, 'no-such-profile')).toThrow('aggro profile "no-such-profile"');
  });
});
