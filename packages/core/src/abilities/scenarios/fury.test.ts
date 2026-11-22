import { describe, expect, it } from 'vitest';

import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import type { DefinitionSource } from '../../entities/EntityFactory.types';
import type { GameEventMap } from '../../state/GameEvents.types';
import type { Vec2 } from '../../utils/geometry.types';
import { abilityMatch } from '../__fixtures__/abilityMatch';
import { unitsWithWarriorKit } from '../__fixtures__/casterState';

/**
 * Fury (balancing.md:185, DEC-270, DEC-271): for 8 s (240 ticks) the Vanguard attacks three times
 * as fast for 1.5x damage, each basic hit knocks the struck body back 1 m (less for a heavier one,
 * DEC-208) and staggers it, and Space (the `granted` slot) dashes 3 m the way the Vanguard moves,
 * or the way it faces when still, once a second. The Vanguard stands at (50, 50) and fills its
 * meter by killing four one-health enemy Magi (a Legend kill gives 25, DEC-272); a dark Sentinel
 * (mass 6) stands east and a dark Vanguard (mass 1) north, both in reach. Every invariant runs
 * each tick and throws.
 */
const SELF = { x: 50, y: 50 };
/** The four Magi, 2.2 m out: west, south-west, south, north-west (the last one killed is west). */
const MAGI: readonly Vec2[] = [
  { x: 48.444, y: 51.556 },
  { x: 48.444, y: 48.444 },
  { x: 50, y: 47.8 },
  { x: 47.8, y: 50 },
];

const shipped = unitsWithWarriorKit();
/** The shipped content with a one-health Magus, so one basic hit kills it. */
const CONTENT: DefinitionSource = {
  has: (id) => shipped.has(id),
  get: (id) => (id === 'magus' ? { ...shipped.get(id), baseHealth: 1 } : shipped.get(id)),
};

const match = () => {
  const scenario = abilityMatch(
    [
      { kind: 'warrior', team: 'light', at: SELF },
      { kind: 'sentinel', team: 'dark', at: { x: 51.95, y: 50 } },
      { kind: 'warrior', team: 'dark', at: { x: 50, y: 51.2 } },
      ...MAGI.map((at) => ({ kind: 'magus', team: 'dark' as const, at })),
    ],
    { content: CONTENT, debug: TEST_DEBUG_CONFIG },
  );
  const [vanguard = '', sentinel = '', warrior = '', ...magi] = scenario.ids;
  const charged: GameEventMap['ultimate-charged'][] = [];
  const hits: string[] = [];
  scenario.sim.on('ultimate-charged', (change) => charged.push(change));
  scenario.sim.on('damage-applied', ({ targetId, amount, source }) => {
    if (source.attackerId === vanguard && targetId !== '') {
      hits.push(`${String(scenario.sim.tick)} ${targetId} ${String(amount)}`);
    }
  });
  /** Queues an attack on `targetId`, applied in the next step. */
  const attack = (targetId: string): void => {
    scenario.sim.enqueueCommand({ type: 'attack-target', actorId: vanguard, targetId });
  };
  /** Queues a stop (no target, no heading), applied in the next step. */
  const stop = (): void => {
    scenario.sim.enqueueCommand({ type: 'stop', actorId: vanguard });
  };
  /** Kills the four Magi one by one: the meter is then full. */
  const fillMeter = (): void => {
    for (const magus of magi) {
      // A sweep (DEC-184) can kill the next Magus too: attack only the ones still standing.
      if (scenario.entity(magus) === undefined) continue;
      attack(magus);
      scenario.run(25);
    }
  };
  /** Fills the meter and casts Fury: the cast lands in the next step. */
  const startFury = (): void => {
    fillMeter();
    scenario.cast(vanguard, 'ability-4', SELF);
    scenario.run(1);
  };
  /** Each landed hit's tick and amount on `targetId`, in order. */
  const hitsOn = (targetId: string) =>
    hits
      .filter((line) => line.split(' ')[1] === targetId)
      .map((line) => {
        const [tick, , amount] = line.split(' ');
        return { tick: Number(tick), amount: Number(amount) };
      });
  return {
    ...scenario,
    vanguard,
    sentinel,
    warrior,
    magi,
    charged,
    attack,
    stop,
    fillMeter,
    startFury,
    hitsOn,
  };
};

describe('Fury (scenario)', () => {
  it('casts once the meter is full, empties it, lasts 8 s, and the next kill fills it again', () => {
    const { vanguard, log, charged, cast, run, fillMeter, attack, warrior } = match();

    cast(vanguard, 'ability-4', SELF);
    run(1);
    fillMeter();
    const full = charged.at(-1)?.charge;
    cast(vanguard, 'ability-4', SELF);
    run(1);
    const castTick = log.find((line) => line.endsWith(`cast ${vanguard} fury`))?.split(' ')[0];
    run(240);

    expect(full).toBe(1);
    expect(log[0]).toBe(`1 rejected ${vanguard} not-charged`);
    expect(log.filter((line) => line.includes('fury'))).toEqual([
      `${castTick ?? ''} cast ${vanguard} fury`,
      `${castTick ?? ''} fury on ${vanguard}`,
      `${String(Number(castTick) + 240)} fury off ${vanguard}`,
    ]);

    // The next kill fills from empty: the cast emptied the meter.
    const before = charged.length;
    attack(warrior);
    run(400);
    expect(charged.slice(before).map(({ cause, charge }) => `${cause} ${String(charge)}`)).toEqual([
      'legend-kill 0.25',
    ]);
  });

  it('attacks three times as fast for 1.5x damage while it lasts', () => {
    const { sentinel, attack, run, startFury, hitsOn } = match();

    startFury();
    const furyStart = hitsOn(sentinel).length;
    attack(sentinel);
    run(30);
    const during = hitsOn(sentinel).slice(furyStart, furyStart + 3);

    const normal = match();
    normal.fillMeter();
    normal.attack(normal.sentinel);
    normal.run(60);
    const before = normal.hitsOn(normal.sentinel).slice(0, 3);

    expect(before.map(({ tick }, index) => tick - (before[index - 1]?.tick ?? tick))).toEqual([
      0, 21, 21,
    ]);
    expect(during.map(({ tick }, index) => tick - (during[index - 1]?.tick ?? tick))).toEqual([
      0, 7, 7,
    ]);
    expect(during[0]?.amount).toBeCloseTo((before[0]?.amount ?? Number.NaN) * 1.5, 5);
  });

  it('knocks the struck body 1 m away, a heavier one less, and staggers it', () => {
    const { sentinel, warrior, attack, stop, run, at, log, startFury, hitsOn } = match();

    startFury();
    // The sweeps that killed the Magi (DEC-184) also hit the bodies near them: count from here.
    const hitsBefore = [hitsOn(warrior).length, hitsOn(sentinel).length];
    const warriorFrom = at(warrior);
    const sentinelFrom = at(sentinel);
    attack(warrior); // one hit, then stop: the push takes 0.25 s (8 ticks)
    run(1);
    stop();
    run(9);
    attack(sentinel);
    run(1);
    stop();
    run(9);

    expect([
      hitsOn(warrior).length - (hitsBefore[0] ?? 0),
      hitsOn(sentinel).length - (hitsBefore[1] ?? 0),
    ]).toEqual([1, 1]);
    expect(at(warrior).x - warriorFrom.x).toBeCloseTo(0, 5); // straight away from the Vanguard
    expect(at(warrior).y - warriorFrom.y).toBeCloseTo(1, 5);
    expect(at(sentinel).x - sentinelFrom.x).toBeCloseTo(1 / 6, 5); // mass 6: 1 m x 1 / 6
    expect(at(sentinel).y - sentinelFrom.y).toBeCloseTo(0, 5);
    expect(log.filter((line) => line.includes('staggered on'))).toEqual([
      expect.stringMatching(new RegExp(`staggered on ${warrior}$`)),
      expect.stringMatching(new RegExp(`staggered on ${sentinel}$`)),
    ]);
  });

  it('refuses the dash outside Fury, and dashes 3 m the way it faces when still, once a second', () => {
    const { vanguard, cast, run, at, entity, log, startFury } = match();

    cast(vanguard, 'granted', SELF);
    run(1);
    startFury();
    const facing = entity(vanguard)?.transform?.facing ?? { x: Number.NaN, y: Number.NaN };
    const from = at(vanguard);
    cast(vanguard, 'granted', { x: from.x + 10, y: from.y + 10 }); // the aim is ignored
    run(1);
    cast(vanguard, 'granted', SELF);
    run(28);
    const landed = at(vanguard);
    cast(vanguard, 'granted', SELF); // 29 ticks after the dash: still cooling down
    run(1);
    cast(vanguard, 'granted', SELF); // 30 ticks after: ready
    run(1);
    run(240);
    cast(vanguard, 'granted', SELF); // Fury is over: the slot is empty again
    run(1);

    expect(landed.x - from.x).toBeCloseTo(3 * facing.x, 5);
    expect(landed.y - from.y).toBeCloseTo(3 * facing.y, 5);
    expect(
      log
        .filter((line) => line.includes('fury-dash') || line.includes('rejected'))
        .map((line) => line.split(' ').slice(1).join(' ')),
    ).toEqual([
      `rejected ${vanguard} empty-slot`,
      `cast ${vanguard} fury-dash`,
      `rejected ${vanguard} on-cooldown`,
      `rejected ${vanguard} on-cooldown`,
      `cast ${vanguard} fury-dash`,
      `rejected ${vanguard} empty-slot`,
    ]);
  });

  it('winds up 0.3 s standing still and attacking, then dashes 3 m in 0.3 s the way it moved at the press (DEC-283)', () => {
    const { vanguard, sentinel, sim, cast, run, at, entity, log, attack, stop, startFury, hitsOn } =
      match();
    startFury();
    attack(sentinel); // east
    sim.enqueueCommand({ type: 'move', actorId: vanguard, direction: { x: 0, y: -1 } });
    run(1); // walking south while it attacks the Sentinel
    const facing = entity(vanguard)?.transform?.facing;
    const before = at(vanguard);
    const hitsBefore = hitsOn(sentinel).length;

    cast(vanguard, 'granted', SELF);
    run(1); // the press: the wind-up starts and the way is fixed
    const pressTick = Number(log.find((line) => line.endsWith('fury-dash'))?.split(' ')[0]);
    run(8); // the rest of the wind-up, still told to walk south
    const woundUp = at(vanguard);
    const hitsInWindup = hitsOn(sentinel).length - hitsBefore;
    stop(); // no heading and no target from the dash's first tick: the dash keeps its way
    run(1); // 9 ticks after the press, the dash starts
    const firstStep = at(vanguard);
    run(8);
    const landed = at(vanguard);
    run(5);

    expect(facing?.x).toBeCloseTo(1, 2); // it faces the Sentinel, east
    expect(woundUp.x).toBeCloseTo(before.x, 9);
    expect(woundUp.y).toBeCloseTo(before.y, 9);
    expect(hitsInWindup).toBeGreaterThan(0); // the wind-up holds the feet, not the weapon
    expect(firstStep.x - woundUp.x).toBeCloseTo(0, 5);
    expect(firstStep.y - woundUp.y).toBeCloseTo(-1 / 3, 5);
    expect(landed.x - woundUp.x).toBeCloseTo(0, 5);
    expect(landed.y - woundUp.y).toBeCloseTo(-3, 5);
    expect(at(vanguard)).toEqual(landed);
    expect(log.filter((line) => line.includes('fury-'))).toEqual([
      `${String(pressTick)} cast ${vanguard} fury-dash`,
      `${String(pressTick)} fury-windup on ${vanguard}`,
      `${String(pressTick + 9)} fury-windup off ${vanguard}`,
    ]);
  });

  it('dashes after its wind-up when Fury ends during it, the slot then empty', () => {
    const { vanguard, cast, run, at, entity, log, startFury } = match();
    startFury();
    run(235);
    const facing = entity(vanguard)?.transform?.facing ?? { x: Number.NaN, y: Number.NaN };
    const from = at(vanguard);

    cast(vanguard, 'granted', SELF); // 5 ticks before Fury ends
    run(18);
    cast(vanguard, 'granted', SELF);
    run(1);

    const furyOff = Number(log.find((line) => line.includes('fury off'))?.split(' ')[0]);
    const windupOff = Number(log.find((line) => line.includes('fury-windup off'))?.split(' ')[0]);
    expect(windupOff - furyOff).toBe(5);
    expect(at(vanguard).x - from.x).toBeCloseTo(3 * facing.x, 5);
    expect(at(vanguard).y - from.y).toBeCloseTo(3 * facing.y, 5);
    expect(log.at(-1)).toMatch(new RegExp(`rejected ${vanguard} empty-slot$`));
  });

  it('holds every invariant for a dash in Fury’s last tick, which empties the slot it cast from', () => {
    const { vanguard, cast, run, log, startFury } = match();

    startFury();
    run(239);
    cast(vanguard, 'granted', SELF);
    run(1); // the dash and the end of Fury in one tick

    const dash = log.find((line) => line.endsWith(`cast ${vanguard} fury-dash`));
    expect(dash).toBeDefined();
    expect(log).toContain(`${dash?.split(' ')[0] ?? ''} fury off ${vanguard}`);
  });

  it('gives the same hash for the same seed', () => {
    const [first, second] = [match(), match()];
    for (const scenario of [first, second]) {
      scenario.startFury();
      scenario.attack(scenario.sentinel);
      scenario.cast(scenario.vanguard, 'granted', SELF);
      scenario.run(60);
    }

    expect(first.log.filter((line) => line.includes(' cast '))).toHaveLength(2); // Fury, the dash
    expect(first.hitsOn(first.sentinel).length).toBeGreaterThan(0);
    expect(second.sim.hash()).toBe(first.sim.hash());
  });

  it('hashes two equal matches equal in the middle of a wind-up (StateHasher.test pins the cast fields)', () => {
    const [first, second] = [match(), match()];
    for (const scenario of [first, second]) {
      scenario.startFury();
      scenario.cast(scenario.vanguard, 'granted', SELF);
      scenario.run(5);
    }

    const windup = (state: string) =>
      first.log.some((line) => line.includes(`fury-windup ${state}`));
    expect([windup('on'), windup('off')]).toEqual([true, false]);
    expect(second.sim.hash()).toBe(first.sim.hash());
  });
});
