import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { LANE_MINION_AGGRO } from '../content/ai/aggro/laneMinion';
import { engagingOn, setUp } from './__fixtures__/minionControllerSetup';

// Driven through MinionController's rules; GuardController.test.ts covers the guard's.
describe('LeashBehaviour', () => {
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
        fsm: 'marching',
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

  it('reads a memory saved as `returning` (merged into the resting state, DEC-144 G) and takes an enemy in reach (MS-36)', () => {
    const { add, decide } = setUp();
    const self = add('light', 50);
    const enemy = add('dark', 53);

    expect(decide(self, { fsm: 'returning' })).toMatchObject({
      commands: [{ type: 'attack-target', actorId: self, targetId: enemy }],
      memory: { fsm: 'engaging', targetId: enemy, leashX: 50 },
    });
  });
});
