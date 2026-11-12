import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { LANE_MINION_AGGRO } from '../content/ai/aggro/laneMinion';
import type { SpaceIndex } from '../physics/SpaceIndex';
import { GameState } from '../state/GameState';
import { AiSystem } from './AiSystem';
import { CLASS_OF, controller, engagingOn, setUp } from './__fixtures__/minionControllerSetup';
import { MinionController } from './MinionController';
import { Perception } from './perception/Perception';

/** A lane minion whose first wave ghosts for 30 ticks. */
const ghosting = new MinionController({
  aggro: { ghost: { ...LANE_MINION_AGGRO, id: 'ghost', ghostFirstWaveTicks: 30 } },
  classOf: CLASS_OF,
});

/** `self`'s commands from `ghosting`, after indexing every unit. */
const decideAsGhost = (state: GameState, space: SpaceIndex, self: string) => {
  space.begin(state.entities.size);
  state.entities.forEach((entity) => {
    const { x, y } = entity.getComponent(Transform).position;
    space.add(entity.id, x, y);
  });
  space.commit();
  return ghosting.decide({
    state,
    entityId: self,
    perception: new Perception(state),
    brain: {
      controllerId: 'minion',
      profileId: 'ghost',
      memory: {},
      rngState: { seed: 1, words: [1, 2, 3, 4] as const },
    },
  }).commands;
};

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
    // Alive, and out of reach: a brain drops an escaped enemy that is no longer alive (AI56-F3).
    const escaped = add('dark', 200);

    expect(
      decide(leader, { fsm: 'returning', cooldownUntilTick: 7, escapedId: escaped }).memory,
    ).toMatchObject({ fsm: 'marching', cooldownUntilTick: 7, escapedId: escaped });
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

  it.each([
    // The countdown ends on a whole tick (DEC-170): 10 s = 300 ticks, 0.01 s rounds to 0, 0.25 s to 8.
    [10, 330],
    [0.01, 30],
    [0.25, 38],
  ])(
    'ignores Legends during a ghosted first wave, and only then (countdown %s s: until tick %s)',
    (countdownSeconds, until) => {
      const { state, space, add, advance } = setUp(
        createDefaultGameConfig({ match: { countdownSeconds } }),
      );
      const self = add('light', 50);
      const legend = add('dark', 52, 20, 'warrior', 'warrior');
      const decide = () => decideAsGhost(state, space, self);

      advance(until - 1);
      expect(decide()).toEqual([]);
      advance(1);
      expect(decide()).toEqual([{ type: 'attack-target', actorId: self, targetId: legend }]);
    },
  );

  it('counts the ghosted first wave from the countdown’s end rounded to a tick, as the wave clocks do (X57-F7)', () => {
    const config = createDefaultGameConfig();
    // 0.04 s is 1.2 ticks: the wave clocks start at tick 1, so a 30-tick ghost ends at tick 31.
    const { state, space, add, advance } = setUp({
      ...config,
      match: { ...config.match, countdownSeconds: 0.04 },
    });
    const self = add('light', 50);
    const legend = add('dark', 52, 20, 'warrior', 'warrior');

    advance(30);
    expect(decideAsGhost(state, space, self)).toEqual([]);
    advance(1);
    expect(decideAsGhost(state, space, self)).toEqual([
      { type: 'attack-target', actorId: self, targetId: legend },
    ]);
  });

  it('knows its aggro profiles, and only its own: a minion naming a guard profile fails validation (AI56-F9)', () => {
    expect(controller.hasProfile('lane-minion')).toBe(true);
    expect(controller.hasProfile('minion')).toBe(false);
    expect(controller.hasProfile('tower-guard')).toBe(false);
    expect(() => {
      AiSystem.assertRegistered(
        [{ id: 'confused-minion', controller: 'minion', aiProfile: 'tower-guard' }],
        { minion: controller },
      );
    }).toThrow('names AI profile "tower-guard", which controller "minion" does not have');
  });

  it('throws on an aggro profile that does not exist, or is a guard’s', () => {
    const { add, decide } = setUp();
    const self = add('light', 50);

    expect(() => decide(self, {}, 'no-such-profile')).toThrow('aggro profile "no-such-profile"');
    expect(() => decide(self, {}, 'camp-mob')).toThrow(
      'names aggro profile "camp-mob", which controller "minion" does not have',
    );
  });
});
