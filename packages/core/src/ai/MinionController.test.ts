import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { GameState } from '../state/GameState';
import { controller, engagingOn, setUp } from './__fixtures__/minionControllerSetup';
import { Perception } from './perception/Perception';

// The acquire and engage rules a minion shares with a guard: LeashBehaviour.test.ts.
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

  it('reads a memory saved as `returning` (merged into marching, DEC-144 G) as marching on or off its slot, keeping the cooldown its leash break started', () => {
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
    expect(decide(loner, { fsm: 'returning' }).memory).toMatchObject({ fsm: 'marching' });
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
