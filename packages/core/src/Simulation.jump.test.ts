import { describe, expect, it } from 'vitest';

import type { Command } from './commands/Command.types';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { NullLogger } from './diagnostics/NullLogger';
import { recordReplay, runReplay } from './diagnostics/replay';
import { Simulation } from './Simulation';
import type { ReplaySetup, RosterSlot } from './Simulation.types';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';

/** The human plays the dark Rover; no countdown, so the Legend may move and jump at once. */
const ROSTER: readonly RosterSlot[] = [
  { pilot: 'human', team: 'dark', definitionId: 'warrior', role: 'rover' },
];
const config = () =>
  createDefaultGameConfig({ match: { playerTeam: 'dark', countdownSeconds: 0 } });
const createTarget = ({ config: setupConfig, seed, roster }: ReplaySetup) =>
  new Simulation({
    config: setupConfig,
    seed,
    logger: new NullLogger(),
    map: TWO_LANE_MAP,
    ...(roster === undefined ? {} : { roster }),
  });
const build = () => createTarget({ config: config(), seed: 5, roster: ROSTER });
const legendOf = (sim: Simulation) =>
  sim.snapshot().entities.find(({ id }) => id === sim.snapshot().match.humanLegendId);

/** Walks up, holds jump from tick 10, turns down at tick 12 and releases jump at tick 30. */
const script = (actorId: string, tick: number): readonly Command[] => {
  switch (tick) {
    case 0:
      return [{ type: 'move', actorId, direction: { x: 0, y: -1 } }];
    case 10:
      return [{ type: 'jump', actorId, isHeld: true }];
    case 12:
      return [{ type: 'move', actorId, direction: { x: 0, y: 1 } }];
    case 30:
      return [{ type: 'jump', actorId, isHeld: false }];
    default:
      return [];
  }
};

const run = (ticks: number, withJump = true) => {
  const sim = build();
  const actorId = sim.snapshot().match.humanLegendId ?? '';
  for (let tick = 0; tick < ticks; tick += 1) {
    script(actorId, tick)
      .filter(({ type }) => withJump || type !== 'jump')
      .forEach((command) => {
        sim.enqueueCommand(command);
      });
    sim.step();
  }
  return sim;
};

describe('Simulation: the Legend jump (DEC-390)', () => {
  it('lifts the human Legend and keeps its takeoff direction after the input turns', () => {
    const sim = build();
    const actorId = sim.snapshot().match.humanLegendId ?? '';
    for (let tick = 0; tick < 12; tick += 1) {
      script(actorId, tick).forEach((command) => {
        sim.enqueueCommand(command);
      });
      sim.step();
    }
    const before = legendOf(sim)?.transform?.y ?? Number.NaN;

    sim.enqueueCommand({ type: 'move', actorId, direction: { x: 0, y: 1 } });
    sim.step();
    sim.step();

    expect(legendOf(sim)?.elevation?.height).toBeGreaterThan(0);
    // Still moving up (−y), the takeoff direction, though the input now points down.
    expect(legendOf(sim)?.transform?.y).toBeLessThan(before);
  });

  it('is back on the ground once the key is released and the last jump lands', () => {
    expect(legendOf(run(60))?.elevation).toEqual({ height: 0 });
  });

  it('gives the same hash for the same seed and jump commands, and another without the jump', () => {
    expect(run(40).hash()).toBe(run(40).hash());
    expect(run(40).hash()).not.toBe(run(40, false).hash());
  });

  it('replays a match with jump commands without divergence', () => {
    const actorId = build().snapshot().match.humanLegendId ?? '';
    const replay = recordReplay(
      { config: config(), seed: 5, roster: ROSTER },
      { ticks: 60, checkpointEvery: 5, commandsFor: (tick) => script(actorId, tick) },
      createTarget,
    );

    expect(replay.commands.filter(({ command }) => command.type === 'jump')).toHaveLength(2);
    expect(runReplay(replay, createTarget).firstDivergence).toBeNull();
  });
});
