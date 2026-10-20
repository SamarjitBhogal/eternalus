import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { GameState } from '../state/GameState';
import type { Invariant, InvariantCadence, Violation } from './Invariant.types';
import { InvariantRunner } from './InvariantRunner';
import type { DebugConfig } from './InvariantRunner.types';
import { InvariantViolationError } from './InvariantViolationError';
import { MemoryLogger } from './MemoryLogger';

const VIOLATION: Violation = {
  invariantId: 'always-broken',
  severity: 'error',
  message: 'Something is wrong.',
  entityId: 'entity-9',
  details: { value: 3 },
};

const invariant = (
  cadence: InvariantCadence,
  broken: boolean,
  id = 'always-broken',
): Invariant => ({
  id,
  severity: 'error',
  cadence,
  check: () => (broken ? [{ ...VIOLATION, invariantId: id }] : []),
});

const config = (overrides: Partial<DebugConfig> = {}): DebugConfig => ({
  assertLevel: 'light',
  heavyEvery: 1,
  throwOnViolation: false,
  ...overrides,
});

const stateAtTick = (tick: number): GameState => {
  const state = new GameState(createDefaultGameConfig(), 42);
  for (let step = 0; step < tick; step += 1) {
    state.advanceTick();
  }
  return state;
};

describe('InvariantRunner', () => {
  it('checks nothing when the level is off', () => {
    const runner = new InvariantRunner(
      [invariant('tick', true)],
      config({ assertLevel: 'off' }),
      new MemoryLogger(),
    );

    expect(runner.run(stateAtTick(0))).toEqual([]);
  });

  it('runs only per-tick invariants at the light level', () => {
    const runner = new InvariantRunner(
      [invariant('tick', true, 'light-one'), invariant('periodic', true, 'heavy-one')],
      config(),
      new MemoryLogger(),
    );

    expect(runner.run(stateAtTick(0)).map((v) => v.invariantId)).toEqual(['light-one']);
  });

  it('adds periodic invariants every heavyEvery ticks at the heavy level', () => {
    const runner = new InvariantRunner(
      [invariant('periodic', true, 'heavy-one')],
      config({ assertLevel: 'heavy', heavyEvery: 30 }),
      new MemoryLogger(),
    );

    expect(runner.run(stateAtTick(29))).toEqual([]);
    expect(runner.run(stateAtTick(30)).map((v) => v.invariantId)).toEqual(['heavy-one']);
  });

  it('reports each violation as an event and an ERROR record with seed, tick and context', () => {
    const logger = new MemoryLogger();
    const state = stateAtTick(3);
    state.recordCommand({ type: 'stop' });
    const events: unknown[] = [];
    state.events.on('invariant-violated', (payload) => events.push(payload));

    new InvariantRunner([invariant('tick', true)], config(), logger).run(state);

    expect(events).toEqual([{ invariantId: 'always-broken', tick: 3, details: { value: 3 } }]);
    expect(logger.records).toHaveLength(1);
    expect(logger.records[0]).toMatchObject({
      severityText: 'ERROR',
      scope: 'core.invariants',
      body: 'Something is wrong.',
      eventName: 'invariant-violated',
      tick: 3,
      attributes: { invariantId: 'always-broken', entityId: 'entity-9', seed: 42, tick: 3 },
      context: { recentCommands: [{ tick: 3, command: { type: 'stop' } }] },
    });
  });

  it('logs warn and fatal violations at WARN and FATAL', () => {
    const logger = new MemoryLogger();
    const withSeverity = (severity: 'warn' | 'fatal'): Invariant => ({
      ...invariant('tick', false),
      check: () => [{ ...VIOLATION, severity }],
    });

    new InvariantRunner([withSeverity('warn'), withSeverity('fatal')], config(), logger).run(
      stateAtTick(0),
    );

    expect(logger.records.map((record) => record.severityText)).toEqual(['WARN', 'FATAL']);
  });

  it('throws InvariantViolationError with the seed and tick when told to', () => {
    const runner = new InvariantRunner(
      [invariant('tick', true)],
      config({ throwOnViolation: true }),
      new MemoryLogger(),
    );

    expect(() => runner.run(stateAtTick(5))).toThrow(InvariantViolationError);
    expect(() => runner.run(stateAtTick(5))).toThrow(
      'Invariant violated at tick 5 (seed 42): always-broken: Something is wrong.',
    );
  });

  it('changes level at runtime and refuses a bad heavyEvery', () => {
    const runner = new InvariantRunner([invariant('tick', true)], config(), new MemoryLogger());

    runner.setLevel('off');
    expect(runner.debug.assertLevel).toBe('off');
    expect(runner.run(stateAtTick(0))).toEqual([]);

    runner.setLevel('heavy', 10);
    expect(runner.debug).toEqual({ assertLevel: 'heavy', heavyEvery: 10, throwOnViolation: false });
    expect(() => {
      runner.setLevel('heavy', 0);
    }).toThrow('DebugConfig heavyEvery must be a whole number >= 1, got 0.');
    expect(() => new InvariantRunner([], config({ heavyEvery: 1.5 }), new MemoryLogger())).toThrow(
      RangeError,
    );
  });
});
