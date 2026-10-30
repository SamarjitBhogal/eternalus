import { describe, expect, it } from 'vitest';

import type { Command } from '../../commands/Command.types';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import {
  RELEASE_DEBUG_CONFIG,
  TEST_DEBUG_CONFIG,
} from '../../diagnostics/InvariantRunner.constants';
import { NullLogger } from '../../diagnostics/NullLogger';
import { Simulation } from '../../Simulation';

/** A 2 s countdown: 60 ticks at 30 ticks/s, so the countdown-over entry fires on tick 60. */
const COUNTDOWN_TICKS = 60;

const newMatch = (countdownSeconds = 2): Simulation =>
  new Simulation({
    config: createDefaultGameConfig({ match: { countdownSeconds } }),
    seed: 7,
    logger: new NullLogger(),
    debug: TEST_DEBUG_CONFIG,
  });

const SPAWN_WARRIOR: Command = {
  type: 'dev-spawn',
  kind: 'warrior',
  definitionId: 'warrior',
  team: 'light',
  at: { x: 0, y: 0 },
  count: 1,
};

/** Steps `sim` until it has completed `tick` ticks. */
const stepTo = (sim: Simulation, tick: number): void => {
  while (sim.tick < tick) {
    sim.step();
  }
};

const warriorX = (sim: Simulation): number => sim.snapshot().entities[0]?.transform?.x ?? NaN;

/**
 * The step (numbered from 0) in which a warrior that is spawned and told to move before step 0
 * first moves, or -1 if it has not moved by step `lastStep`.
 */
const firstMovingStep = (countdownSeconds: number, lastStep: number): number => {
  const sim = newMatch(countdownSeconds);
  sim.enqueueCommand(SPAWN_WARRIOR);
  sim.enqueueCommand({ type: 'move', actorId: 'entity-1', direction: { x: 1, y: 0 } });
  while (sim.tick <= lastStep) {
    const step = sim.tick;
    sim.step();
    if (warriorX(sim) !== 0) {
      return step;
    }
  }
  return -1;
};

describe('the countdown (scenario)', () => {
  it('lets nothing walk until the countdown is over, then lets the held move go', () => {
    const sim = newMatch();
    sim.enqueueCommand(SPAWN_WARRIOR);
    sim.step();
    sim.enqueueCommand({ type: 'move', actorId: 'entity-1', direction: { x: 1, y: 0 } });

    stepTo(sim, COUNTDOWN_TICKS + 1);
    expect(sim.snapshot().entities).toHaveLength(1);
    expect(warriorX(sim)).toBe(0);

    sim.step();
    expect(warriorX(sim)).toBeGreaterThan(0);
  });

  it.each([
    [2, COUNTDOWN_TICKS],
    [0, 0],
  ])(
    'with a %s s countdown (%s ticks), holds steps 0 to the countdown tick: a Legend first moves one step later',
    (countdownSeconds, countdownTicks) => {
      expect(firstMovingStep(countdownSeconds, COUNTDOWN_TICKS + 10)).toBe(countdownTicks + 1);
    },
  );

  it('holds attacks too: a warrior beside a dummy first hits it one step after the countdown', () => {
    const sim = newMatch();
    let hits = 0;
    sim.on('damage-applied', () => {
      hits += 1;
    });
    sim.enqueueCommand(SPAWN_WARRIOR);
    sim.enqueueCommand({
      ...SPAWN_WARRIOR,
      kind: 'light-mob',
      definitionId: 'training-dummy',
      team: 'dark',
      at: { x: 1, y: 0 },
    });
    sim.step();
    sim.enqueueCommand({ type: 'attack-target', actorId: 'entity-1', targetId: 'entity-2' });

    stepTo(sim, COUNTDOWN_TICKS + 1);
    expect(hits).toBe(0);

    sim.step();
    expect(hits).toBe(1);
  });

  it('emits phase-changed once, on the tick the default 10 s countdown ends', () => {
    const sim = new Simulation({
      config: createDefaultGameConfig(),
      seed: 7,
      logger: new NullLogger(),
      debug: RELEASE_DEBUG_CONFIG,
    });
    const changes: unknown[] = [];
    sim.on('phase-changed', (change) => {
      changes.push({ tick: sim.tick, ...change });
    });

    stepTo(sim, 2000);

    expect(changes).toEqual([{ tick: 300, from: 'countdown', to: 'early-game' }]);
  });

  it('lists the unfired timeline marks in the snapshot, before and after the countdown ends', () => {
    const sim = newMatch();
    const later = [
      { entryId: 'quarter-mark', tick: 13_500 },
      { entryId: 'mid-game', tick: 27_000 },
      { entryId: 'end-game', tick: 40_500 },
    ];

    expect(sim.snapshot().match).toEqual({
      phase: 'countdown',
      phaseEnteredTick: 0,
      upcoming: [{ entryId: 'countdown-over', tick: COUNTDOWN_TICKS }, ...later],
      humanLegendId: null,
    });
    stepTo(sim, COUNTDOWN_TICKS + 1);
    expect(sim.snapshot().match).toEqual({
      phase: 'early-game',
      phaseEnteredTick: COUNTDOWN_TICKS,
      upcoming: later,
      humanLegendId: null,
    });
  });

  it('is deterministic across the countdown end: two runs hash the same on every tick', () => {
    const run = (countdownSeconds = 2): number[] => {
      const sim = newMatch(countdownSeconds);
      sim.enqueueCommand(SPAWN_WARRIOR);
      const hashes: number[] = [];
      while (sim.tick <= COUNTDOWN_TICKS + 30) {
        if (sim.tick === 5) {
          sim.enqueueCommand({ type: 'move', actorId: 'entity-1', direction: { x: 0, y: 1 } });
        }
        sim.step();
        hashes.push(sim.hash());
      }
      return hashes;
    };

    const first = run();
    const longerCountdown = run(3);

    expect(run()).toEqual(first);
    // The hash covers the phase change: a longer countdown matches tick for tick until it.
    expect(longerCountdown.slice(0, COUNTDOWN_TICKS)).toEqual(first.slice(0, COUNTDOWN_TICKS));
    expect(longerCountdown[COUNTDOWN_TICKS]).not.toBe(first[COUNTDOWN_TICKS]);
  });
});
