import { describe, expect, it } from 'vitest';

import { TEST_KIT, unitsWithWarriorKit } from './abilities/__fixtures__/casterState';
import { testAbilityRegistry } from './abilities/__fixtures__/fakeAbilities';
import { RecordingEffect } from './abilities/__fixtures__/RecordingEffect';
import type { Command } from './commands/Command.types';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { NullLogger } from './diagnostics/NullLogger';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';

const SPAWN: readonly Command[] = [
  {
    type: 'dev-spawn',
    kind: 'warrior',
    definitionId: 'warrior',
    team: 'light',
    at: { x: 50, y: 50 },
    count: 1,
  },
  {
    type: 'dev-spawn',
    kind: 'warrior',
    definitionId: 'warrior',
    team: 'dark',
    at: { x: 60, y: 50 },
    count: 1,
  },
];

const castBy = (actorId: string, slot: 'ability-1' | 'ability-3' = 'ability-1'): Command => ({
  type: 'cast-ability',
  actorId,
  slot,
  aim: { point: { x: 55, y: 50 }, targetId: null },
});

/** Steps until the countdown is over: it holds every unit idle and refuses casts (DEC-88). */
const stepPastCountdown = (sim: Simulation): void => {
  do {
    sim.step();
  } while (sim.snapshot().match.phase === 'countdown');
};

/**
 * A match whose Warriors carry `TEST_KIT` and whose `fake-strike` effect records, with the two
 * Warriors spawned (`entity-1` light, `entity-2` dark), and what it emitted.
 */
const castingMatch = (seed = 3) => {
  const sim = new Simulation({
    config: createDefaultGameConfig(),
    seed,
    logger: new NullLogger(),
    content: unitsWithWarriorKit(TEST_KIT),
    abilities: testAbilityRegistry([new RecordingEffect('fake-strike')]),
  });
  const events: string[] = [];
  sim.on('ability-cast', ({ casterId, abilityId }) => events.push(`cast ${casterId} ${abilityId}`));
  sim.on('command-rejected', ({ reason }) => events.push(`rejected ${reason}`));
  for (const command of SPAWN) sim.enqueueCommand(command);
  stepPastCountdown(sim);
  const aetherOf = (id: string) =>
    sim.snapshot().entities.find((e) => e.id === id)?.aether?.current;
  return { sim, events, aetherOf };
};

/** Runs `ticks` steps, enqueueing `commands[tick]` before each. */
const play = (
  sim: Simulation,
  ticks: number,
  commands: Readonly<Record<number, readonly Command[]>>,
) => {
  for (let tick = 0; tick < ticks; tick += 1) {
    for (const command of commands[tick] ?? []) sim.enqueueCommand(command);
    sim.step();
  }
};

describe('Simulation: casting', () => {
  it('casts through the real command path, then blocks the slot until its cooldown ends', () => {
    const { sim, events } = castingMatch();

    play(sim, 92, { 0: [castBy('entity-1')], 1: [castBy('entity-1')], 90: [castBy('entity-1')] });

    // Cast on tick 1 (cooldown 90 ticks): refused on tick 2, accepted again on tick 91.
    expect(events).toEqual([
      'cast entity-1 fake-strike',
      'rejected on-cooldown',
      'cast entity-1 fake-strike',
    ]);
  });

  it('spends the aether at cast and refills it over the next ticks (4/s at base, DEC-201)', () => {
    const { sim, aetherOf } = castingMatch();

    play(sim, 1, { 0: [castBy('entity-1')] });
    const afterCast = aetherOf('entity-1') ?? 0;
    play(sim, 30, {});

    expect(afterCast).toBeCloseTo(70 + 4 / 30, 3); // 100 - 30, plus this tick's regeneration
    expect((aetherOf('entity-1') ?? 0) - afterCast).toBeCloseTo(4, 2);
  });

  it('is deterministic: the same seed and casts give the same hash, and a cast changes it', () => {
    const commands = { 0: [castBy('entity-1'), castBy('entity-2')], 40: [castBy('entity-2')] };
    const first = castingMatch();
    const second = castingMatch();
    const idle = castingMatch();

    play(first.sim, 60, commands);
    play(second.sim, 60, commands);
    play(idle.sim, 60, {});

    expect(second.sim.hash()).toBe(first.sim.hash());
    expect(idle.sim.hash()).not.toBe(first.sim.hash());
    expect(first.events).toEqual([
      'cast entity-1 fake-strike',
      'cast entity-2 fake-strike',
      'rejected on-cooldown',
    ]);
  });

  it('casts a shipped ability through the default registry (slice S3 registered its effects)', () => {
    const sim = new Simulation({
      config: createDefaultGameConfig(),
      seed: 1,
      logger: new NullLogger(),
    });
    const events: string[] = [];
    sim.on('ability-cast', ({ abilityId }) => events.push(`cast ${abilityId}`));
    sim.on('command-rejected', ({ reason }) => events.push(`rejected ${reason}`));
    sim.enqueueCommand(SPAWN[0] ?? castBy('entity-1'));
    stepPastCountdown(sim);

    play(sim, 1, { 0: [castBy('entity-1'), castBy('entity-1', 'ability-3')] });

    // Hamstring (effects: []) stays unavailable, refused as its command applies; Blade Runner casts
    // later in the tick, in AbilitySystem.
    expect(events).toEqual(['rejected unavailable', 'cast blade-runner']);
  });
});

describe('Simulation: the roster’s Legend spec (plan arch call 1)', () => {
  const rover = (specId: string): RosterSlot => ({
    pilot: 'human',
    team: 'dark',
    definitionId: 'warrior',
    role: 'rover',
    specId,
  });
  const build = (slot: RosterSlot) =>
    new Simulation({
      config: createDefaultGameConfig({ match: { playerTeam: 'dark' } }),
      seed: 5,
      logger: new NullLogger(),
      map: TWO_LANE_MAP,
      roster: [slot],
    });

  it('spawns a Legend with a spec of its class, and keeps the spec in the replay setup', () => {
    const sim = build(rover('knight'));

    expect(sim.snapshot().entities.filter(({ family }) => family === 'legend')).toHaveLength(1);
    expect(sim.exportReplay().roster).toEqual([rover('knight')]);
  });

  it('refuses a spec of another class at setup', () => {
    expect(() => build(rover('oracle'))).toThrow('cannot use the spec "oracle"');
  });
});

describe('Simulation.dashReach', () => {
  /** The two-lane map with a rift across it at x 100.2 to 100.8. */
  const riftMap = {
    ...TWO_LANE_MAP,
    terrain: [
      {
        id: 'rift',
        kind: 'rift' as const,
        shape: [
          { x: 100.2, y: 0 },
          { x: 100.8, y: 0 },
          { x: 100.8, y: 60 },
          { x: 100.2, y: 60 },
        ],
      },
    ],
  };
  const simOn = (map?: typeof riftMap) =>
    new Simulation({
      config: createDefaultGameConfig(),
      seed: 1,
      logger: new NullLogger(),
      ...(map === undefined ? {} : { map }),
    });

  it("stops a dash at the match's own wall and reports the whole distance elsewhere", () => {
    const sim = simOn(riftMap);

    expect(sim.dashReach({ x: 96, y: 30 }, { x: 1, y: 0 }, 8)).toBeLessThan(5);
    expect(sim.dashReach({ x: 96, y: 30 }, { x: 1, y: 0 }, 8)).toBeGreaterThan(3);
    expect(sim.dashReach({ x: 96, y: 30 }, { x: -1, y: 0 }, 8)).toBe(8);
  });

  it('is the whole distance in a match with no map, and changes nothing', () => {
    const sim = simOn();
    const before = sim.snapshot();

    expect(sim.dashReach({ x: 0, y: 0 }, { x: 1, y: 0 }, 8)).toBe(8);
    expect(sim.snapshot()).toEqual(before);
  });
});
