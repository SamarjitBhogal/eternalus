import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Command } from './commands/Command.types';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { NullLogger } from './diagnostics/NullLogger';
import { recordReplay, runReplay } from './diagnostics/replay';
import { Scoring } from './match/Scoring';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';
import type { GameState } from './state/GameState';
import type { Snapshot } from './state/Snapshot.types';
import { StateHasher } from './state/StateHasher';
import { Simulation } from './Simulation';
import type { ReplaySetup } from './Simulation.types';

/** The light Stronghold of the two-lane map, where the human's Legend (a Rover) spawns. */
const AT = { x: 10, y: 30 };
/** A 0 s countdown: step 0 is held, attacks land from step 1. */
const CONFIG = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
/** The two-lane map with a light warrior in the human's slot (light is the default player team). */
const SETUP: ReplaySetup = {
  config: CONFIG,
  seed: 3,
  map: TWO_LANE_MAP,
  roster: [{ pilot: 'human', team: 'light', definitionId: 'warrior', role: 'rover' }],
};
/** Far past the three hits a warrior needs for a training dummy. */
const TICKS = 120;

const SPAWN_DUMMY: Command = {
  type: 'dev-spawn',
  kind: 'light-mob',
  definitionId: 'training-dummy',
  team: 'dark',
  at: { x: AT.x + 1.2, y: AT.y },
  count: 1,
};

/** The human's Legend attacks the dummy once it is in the snapshot. */
const attackDummy = ({ match, entities }: Snapshot): Command[] => {
  const dummy = entities.find((entity) => entity.definitionId === 'training-dummy');
  return match.humanLegendId === null || dummy === undefined
    ? []
    : [{ type: 'attack-target', actorId: match.humanLegendId, targetId: dummy.id }];
};

/** The dummy spawns before step 0 and is attacked from step 1. */
const commandsFor = (tick: number, snapshot: Snapshot): readonly Command[] =>
  tick === 0 ? [SPAWN_DUMMY] : tick === 1 ? attackDummy(snapshot) : [];

const createTarget = (setup: ReplaySetup) => new Simulation({ ...setup, logger: new NullLogger() });

/**
 * A `Simulation` with a human and the state its director folds scoring into. `Simulation` keeps its
 * state private, so the test reads it from the first call of a spy on `Scoring.fold`.
 */
const build = () => {
  const fold = vi.spyOn(Scoring.prototype, 'fold');
  const sim = createTarget(SETUP);
  const foldedState = (): GameState => {
    const state = fold.mock.calls[0]?.[0].state;
    if (state === undefined) {
      throw new Error('Scoring.fold has not run yet.');
    }
    return state;
  };
  /** Steps to `TICKS`, enqueueing the dummy and the attack on their ticks. */
  const playOut = (): void => {
    while (sim.tick < TICKS) {
      for (const command of commandsFor(sim.tick, sim.snapshot())) {
        sim.enqueueCommand(command);
      }
      sim.step();
    }
  };
  return { sim, fold, foldedState, playOut };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Simulation: scoring', () => {
  it("gives the human's Legend a human row in the fold of tick 0 (the director is built first)", () => {
    const { sim, fold, foldedState } = build();

    sim.step();

    expect(fold).toHaveBeenCalledTimes(1);
    expect(foldedState().match.scoring.legends).toEqual([
      {
        entityId: sim.snapshot().match.humanLegendId,
        team: 'light',
        classId: 'warrior',
        controller: 'human',
        kills: 0,
        deaths: 0,
        assists: 0,
        minionKills: 0,
        neutralKills: 0,
        structureDamage: 0,
        score: 0,
      },
    ]);
  });

  it('gives a roster bot a bot row in the fold of tick 0 (the roster spawns after the director)', () => {
    const fold = vi.spyOn(Scoring.prototype, 'fold');
    const sim = new Simulation({
      config: createDefaultGameConfig({ match: { countdownSeconds: 0 } }),
      seed: 1,
      logger: new NullLogger(),
      map: TWO_LANE_MAP,
      roster: [
        {
          pilot: 'bot',
          team: 'dark',
          definitionId: 'warrior',
          role: 'laner',
          difficulty: 'normal',
        },
      ],
    });

    sim.step();

    const bot = sim.snapshot().entities.find((entity) => entity.family === 'legend');
    expect(bot).toBeDefined();
    expect(fold.mock.calls[0]?.[0].state.match.scoring.legends).toEqual([
      expect.objectContaining({
        entityId: bot?.id,
        team: 'dark',
        classId: 'warrior',
        controller: 'bot',
      }),
    ]);
  });

  it('counts a minion killed through full steps by its kind: a light mob is worth 1', () => {
    const { sim, foldedState, playOut } = build();

    playOut();

    const dummies = sim
      .snapshot()
      .entities.filter(({ definitionId }) => definitionId === 'training-dummy');
    expect(dummies).toEqual([]);
    expect(foldedState().match.scoring.legends[0]).toMatchObject({ minionKills: 1, score: 1 });
    expect(foldedState().match.scoring.teams).toEqual({ light: { score: 1 }, dark: { score: 0 } });
  });

  it('is deterministic with scoring in the hash: a replay reproduces every checkpoint', () => {
    const replay = recordReplay(
      SETUP,
      { ticks: TICKS, checkpointEvery: 10, commandsFor },
      createTarget,
    );

    expect(runReplay(replay, createTarget).firstDivergence).toBeNull();
  });

  it('hashes the scoring: a changed score changes the hash', () => {
    const { sim, foldedState, playOut } = build();
    playOut();
    const before = sim.hash();
    const [row] = foldedState().match.scoring.legends;

    expect(new StateHasher().hash(foldedState())).toBe(before);
    if (row !== undefined) {
      row.score += 1;
    }

    expect(row).toBeDefined();
    expect(sim.hash()).not.toBe(before);
  });
});
