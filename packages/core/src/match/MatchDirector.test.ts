import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { GameConfig } from '../config/GameConfig.types';
import type { MatchPhase } from '../config/matchPhases';
import { MATCH_PHASES } from '../config/matchPhases';
import { MemoryLogger } from '../diagnostics/MemoryLogger';
import type { GameEventMap } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import type { Verdict } from '../state/MatchResult.types';
import { StateHasher } from '../state/StateHasher';
import { createDefaultTimelineActions } from './defaultTimelineActions';
import type { DirectorContext } from './DirectorContext.types';
import { MatchDirector } from './MatchDirector';
import type { MatchPhaseRegistry, MatchPhaseState } from './MatchPhaseState.types';
import { MatchTimeline } from './MatchTimeline';
import type { ResolvedTimelineEntry } from './MatchTimeline.types';
import type { VictoryCondition } from './VictoryCondition.types';

/** A phase double: records every call as `"<call> <phase>"`. */
class RecordingPhase implements MatchPhaseState {
  public constructor(
    public readonly phase: MatchPhase,
    private readonly log: string[],
  ) {}

  public enter(): void {
    this.log.push(`enter ${this.phase}`);
  }

  public update(): void {
    this.log.push(`update ${this.phase}`);
  }

  public exit(): void {
    this.log.push(`exit ${this.phase}`);
  }
}

/** A condition double: returns `verdict` from tick `fromTick` on, counting its checks. */
class ScriptedCondition implements VictoryCondition {
  public readonly id = 'objective-lost';
  public checks = 0;
  /** The state's hash when it last returned a verdict. */
  public hashAtVerdict: number | null = null;

  public constructor(
    private readonly verdict: Verdict | null,
    private readonly fromTick = 12,
  ) {}

  public check({ state }: DirectorContext): Verdict | null {
    this.checks += 1;
    if (this.verdict === null || state.tick < this.fromTick) {
      return null;
    }
    this.hashAtVerdict = new StateHasher().hash(state);
    return this.verdict;
  }
}

const LIGHT_WINS: Verdict = { winner: 'light', condition: 'objective-lost' };

const enter = (id: string, tick: number, phase: MatchPhase): ResolvedTimelineEntry => ({
  id,
  tick,
  action: { kind: 'enter-phase', phase },
});

/** The 12 §12 fake timeline: tick 10 → early-game, tick 20 → quarter-mark. */
const FAKE_TIMELINE = [enter('go', 10, 'early-game'), enter('quarter', 20, 'quarter-mark')];

const setUp = (
  entries: readonly ResolvedTimelineEntry[] = FAKE_TIMELINE,
  throwOnViolation = true,
  {
    conditions = [],
    config = createDefaultGameConfig(),
  }: { readonly conditions?: readonly VictoryCondition[]; readonly config?: GameConfig } = {},
) => {
  const log: string[] = [];
  const record = (phase: MatchPhase) => new RecordingPhase(phase, log);
  const phases: MatchPhaseRegistry = {
    countdown: record('countdown'),
    'early-game': record('early-game'),
    'quarter-mark': record('quarter-mark'),
    'mid-game': record('mid-game'),
    'end-game': record('end-game'),
    victory: record('victory'),
    defeat: record('defeat'),
  };
  const timeline = new MatchTimeline(entries);
  const state = new GameState(config, 1, timeline.schedule());
  const logger = new MemoryLogger();
  const director = new MatchDirector({
    phases,
    timeline,
    actions: createDefaultTimelineActions(),
    order: MATCH_PHASES,
    debug: { throwOnViolation },
    logger,
    conditions,
  });
  const changes: string[] = [];
  state.events.on('phase-changed', ({ from, to }) => {
    changes.push(`${String(state.tick)}: ${from} -> ${to}`);
  });
  const ended: GameEventMap['match-ended'][] = [];
  state.events.on('match-ended', (payload) => {
    ended.push(payload);
    changes.push(`${String(state.tick)}: match-ended`);
  });
  /** Runs the director once per tick up to and including `lastTick`. */
  const stepTo = (lastTick: number): void => {
    while (state.tick <= lastTick) {
      director.update(state);
      state.advanceTick();
    }
  };
  return { log, state, director, changes, ended, stepTo, logger };
};

describe('MatchDirector', () => {
  it('enters the starting phase on start, without a phase-changed event', () => {
    const { log, state, director, changes } = setUp();

    director.start(state);

    expect(log).toEqual(['enter countdown']);
    expect(changes).toEqual([]);
    expect(state.match.phase).toBe('countdown');
  });

  it('moves through the fake timeline in order, each entry on its tick', () => {
    const { state, changes, stepTo } = setUp();

    stepTo(25);

    expect(changes).toEqual(['10: countdown -> early-game', '20: early-game -> quarter-mark']);
    expect(state.match.phase).toBe('quarter-mark');
    expect(state.match.phaseEnteredTick).toBe(20);
  });

  it('exits the old phase, then enters the new one, then updates it, within the tick', () => {
    const { log, stepTo } = setUp();

    stepTo(10);

    expect(log.slice(-4)).toEqual([
      'update countdown',
      'exit countdown',
      'enter early-game',
      'update early-game',
    ]);
  });

  it('moves the cursor past each fired entry and never fires one twice', () => {
    const { state, changes, stepTo } = setUp();

    stepTo(9);
    expect(state.match.timelineCursor).toBe(0);
    stepTo(15);
    expect(state.match.timelineCursor).toBe(1);
    stepTo(100);
    expect(state.match.timelineCursor).toBe(2);
    expect(changes).toHaveLength(2);
  });

  it('fires every due entry in timeline order when it runs late, and same-tick entries together', () => {
    const { state, director, changes } = setUp([
      enter('a', 5, 'early-game'),
      enter('b', 5, 'quarter-mark'),
      enter('c', 7, 'mid-game'),
    ]);
    for (let tick = 0; tick < 8; tick += 1) {
      state.advanceTick();
    }

    director.update(state);

    expect(changes).toEqual([
      '8: countdown -> early-game',
      '8: early-game -> quarter-mark',
      '8: quarter-mark -> mid-game',
    ]);
  });

  it.each<[string, MatchPhase]>([
    ['back to an earlier phase', 'early-game'],
    ['into the phase it is in', 'quarter-mark'],
  ])('throws on a move %s, and leaves the phase as it was', (_case, target) => {
    const { log, state, stepTo } = setUp([
      enter('quarter', 1, 'quarter-mark'),
      enter('wrong', 2, target),
    ]);
    stepTo(1);

    expect(() => {
      stepTo(2);
    }).toThrow(`The match cannot move from phase "quarter-mark" to "${target}"`);
    expect(state.match.phase).toBe('quarter-mark');
    expect(state.match.timelineCursor).toBe(2);
    expect(log).not.toContain('exit quarter-mark');
  });

  it.each<[string, MatchPhase]>([
    ['back to an earlier phase', 'early-game'],
    ['into the phase it is in', 'quarter-mark'],
  ])('with throwOnViolation off (the browser), logs a move %s and skips it', (_case, target) => {
    const { log, state, changes, stepTo, logger } = setUp(
      [enter('quarter', 1, 'quarter-mark'), enter('wrong', 2, target)],
      false,
    );
    stepTo(1);

    stepTo(3);

    expect(state.match.phase).toBe('quarter-mark');
    expect(state.match.phaseEnteredTick).toBe(1);
    expect(state.match.timelineCursor).toBe(2);
    expect(changes).toEqual(['1: countdown -> quarter-mark']);
    expect(log).not.toContain('exit quarter-mark');
    expect(log.slice(-2)).toEqual(['update quarter-mark', 'update quarter-mark']);
    expect(logger.records).toEqual([
      {
        severityNumber: 17,
        severityText: 'ERROR',
        body: `The match cannot move from phase "quarter-mark" to "${target}": phases only move forward.`,
        scope: 'core.match',
        tick: 2,
        attributes: { from: 'quarter-mark', to: target },
      },
    ]);
  });

  it('logs nothing on forward moves', () => {
    const { logger, stepTo } = setUp(FAKE_TIMELINE, false);

    stepTo(25);

    expect(logger.records).toEqual([]);
  });

  describe('the end of the match (12 §6)', () => {
    it.each<[string, Verdict, GameConfig['match']['playerTeam'], MatchPhase]>([
      ['the player team wins', LIGHT_WINS, 'light', 'victory'],
      ['the other team wins', LIGHT_WINS, 'dark', 'defeat'],
      ['a draw', { winner: null, condition: 'objective-lost' }, 'light', 'defeat'],
    ])(
      'on %s, stores the result and enters the right terminal phase',
      (_c, verdict, team, phase) => {
        const config = createDefaultGameConfig({ match: { playerTeam: team } });
        const { state, changes, stepTo } = setUp(FAKE_TIMELINE, true, {
          conditions: [new ScriptedCondition(verdict)],
          config,
        });

        stepTo(12);

        expect(state.match.phase).toBe(phase);
        expect(changes.slice(-2)).toEqual([`12: early-game -> ${phase}`, '12: match-ended']);
        expect(state.match.result).toMatchObject({ ...verdict, playerTeam: team, hadHuman: false });
      },
    );

    it('fills the result: seed, duration (ticks run, ending tick included) and the hashes', () => {
      const condition = new ScriptedCondition(LIGHT_WINS);
      const { state, stepTo } = setUp(FAKE_TIMELINE, true, { conditions: [condition] });

      stepTo(12);

      expect(state.match.result).toEqual({
        ...LIGHT_WINS,
        playerTeam: 'light',
        hadHuman: false,
        durationTicks: 13,
        seed: 1,
        configHash: expect.any(Number) as number,
        finalHash: condition.hashAtVerdict,
      });
      // Taken before the result is stored and the terminal phase entered: the hash moved since.
      expect(state.match.result?.finalHash).not.toBe(new StateHasher().hash(state));
      expect(state.match.result?.durationTicks).toBe(state.tick);
    });

    it('marks a match with a human Legend as hadHuman', () => {
      const { state, stepTo } = setUp(FAKE_TIMELINE, true, {
        conditions: [new ScriptedCondition(LIGHT_WINS)],
      });
      state.match.humanLegendId = 'entity-1';

      stepTo(12);

      expect(state.match.result?.hadHuman).toBe(true);
    });

    it('hashes the config by content, not by key order', () => {
      const configHashOf = (config: GameConfig): number | undefined => {
        const { state, stepTo } = setUp(FAKE_TIMELINE, true, {
          conditions: [new ScriptedCondition(LIGHT_WINS, 0)],
          config,
        });
        stepTo(0);
        return state.match.result?.configHash;
      };
      const config = createDefaultGameConfig();
      // Safe: the same fields as `config`, only inserted in the reverse order at two depths.
      const reordered = Object.fromEntries(
        Object.entries({
          ...config,
          match: Object.fromEntries(Object.entries(config.match).reverse()),
        }).reverse(),
      ) as GameConfig;

      expect(JSON.stringify(reordered)).not.toBe(JSON.stringify(config));
      expect(configHashOf(reordered)).toBe(configHashOf(config));
      expect(configHashOf(createDefaultGameConfig({ match: { countdownSeconds: 9 } }))).not.toBe(
        configHashOf(config),
      );
    });

    it('takes the first verdict in registry order and asks no later condition', () => {
      const silent = new ScriptedCondition(null);
      const later = new ScriptedCondition({ winner: 'dark', condition: 'forfeit' }, 0);
      const { state, stepTo } = setUp(FAKE_TIMELINE, true, {
        conditions: [silent, new ScriptedCondition(LIGHT_WINS, 0), later],
      });

      stepTo(0);

      expect(state.match.result?.winner).toBe('light');
      expect(silent.checks).toBe(1);
      expect(later.checks).toBe(0);
    });

    it('emits match-ended once, with the stored result, and is inert after the end', () => {
      const condition = new ScriptedCondition(LIGHT_WINS);
      const { log, state, ended, changes, stepTo } = setUp(FAKE_TIMELINE, true, {
        conditions: [condition],
      });
      stepTo(12);
      const logLength = log.length;
      const checksAtEnd = condition.checks;

      // The quarter-mark entry falls due at tick 20; the director must not fire it.
      stepTo(30);

      expect(ended).toHaveLength(1);
      expect(ended[0]?.result).toBe(state.match.result);
      expect(changes.at(-1)).toBe('12: match-ended');
      expect(state.match.phase).toBe('victory');
      expect(state.match.timelineCursor).toBe(1);
      expect(condition.checks).toBe(checksAtEnd);
      expect(log).toHaveLength(logLength);
    });

    it.each<MatchPhase>(['victory', 'defeat'])(
      'throws on any move out of %s, even one forward in the phase order',
      (terminal) => {
        const { log, state, stepTo } = setUp([enter('after', 1, 'defeat')]);
        state.setPhase(terminal);

        expect(() => {
          stepTo(1);
        }).toThrow(
          `The match cannot move from phase "${terminal}" to "defeat": "${terminal}" is terminal.`,
        );
        expect(state.match.phase).toBe(terminal);
        expect(log).not.toContain(`exit ${terminal}`);
      },
    );

    it('with throwOnViolation off, logs a move out of a terminal phase and skips it', () => {
      const { state, stepTo, logger } = setUp([enter('after', 1, 'defeat')], false);
      state.setPhase('victory');

      stepTo(2);

      expect(state.match.phase).toBe('victory');
      expect(logger.records).toMatchObject([
        {
          severityText: 'ERROR',
          body: 'The match cannot move from phase "victory" to "defeat": "victory" is terminal.',
          tick: 1,
          attributes: { from: 'victory', to: 'defeat' },
        },
      ]);
    });
  });
});
