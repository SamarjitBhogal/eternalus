import {
  createDefaultGameConfig,
  NullLogger,
  runReplay,
  Simulation,
  type Command,
  type Replay,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { shippedCatalogue } from './content/__fixtures__/shippedCatalogue';
import { prepareMatchWorld } from './prepareMatchWorld';
import { seatedConfig } from './seatedConfig';
import { buildMatchSetup } from './session/buildMatchSetup';
import { createRosterRng } from './session/createRosterRng';
import { fillRosters } from './session/fillRosters';
import { LcgRng } from './session/LcgRng';
import { rosterSlots } from './session/rosterSlots';

const SEED = 7;
const PLAYER_CLASS = 'warrior';
/** One checkpoint interval (`REPLAY_CHECKPOINT_EVERY`, 300 ticks), plus a few ticks. */
const TICKS = 310;
const config = createDefaultGameConfig();
const catalogue = shippedCatalogue().load();

/**
 * Builds the match the way `createBrowserMatch` does: world, then the config played for the
 * player's team and the setup's rosters (the player as its human slot) as roster.
 */
function buildBrowserMatch(): { simulation: Simulation; move: Command } {
  const draft = buildMatchSetup({
    seed: SEED,
    rng: new LcgRng(SEED),
    legendClasses: catalogue.legendClasses,
    botRoster: catalogue.botRoster,
    legendsPerTeam: config.match.legendsPerTeam,
    playerName: 'P',
  });
  const setup = fillRosters({
    draft,
    selection: { classId: PLAYER_CLASS, specId: null },
    legendClasses: catalogue.legendClasses,
    enemyRover: catalogue.botRoster.enemyRover,
    rng: createRosterRng(SEED),
  });
  const world = prepareMatchWorld(config, SEED);
  const simulation = new Simulation({
    config: seatedConfig(config, { team: draft.playerTeam }),
    seed: SEED,
    logger: new NullLogger(),
    map: world.map,
    mapObjects: world.mapObjects,
    roster: rosterSlots(setup, catalogue.botRoster.difficulties),
  });
  const actorId = simulation.snapshot().match.humanLegendId;
  if (actorId === null) throw new Error("The human slot's Legend did not spawn.");
  return { simulation, move: { type: 'move', actorId, direction: { x: 1, y: 0 } } };
}

describe('replay of a browser-built match', () => {
  it('reproduces the match, its human slot included, from the crash report alone (JSON round trip)', () => {
    const { simulation, move } = buildBrowserMatch();
    simulation.enqueueCommand(move);
    for (let tick = 0; tick < TICKS; tick += 1) simulation.step();

    const report = JSON.parse(JSON.stringify(simulation.exportReplay())) as Replay;
    const outcome = runReplay(
      report,
      (setup) => new Simulation({ ...setup, logger: new NullLogger() }),
    );

    expect(report.roster?.filter(({ pilot }) => pilot === 'human')).toEqual([
      {
        pilot: 'human',
        team: report.config.match.playerTeam,
        definitionId: PLAYER_CLASS,
        role: 'rover',
      },
    ]);
    expect(report.roster?.length).toBe(2 * config.match.legendsPerTeam);
    expect(report.commands).toEqual([{ tick: 0, command: move }]);
    expect(report.checkpoints.length).toBeGreaterThan(1);
    expect(outcome.firstDivergence).toBeNull();
    expect(outcome.finalHash).toBe(report.checkpoints.at(-1)?.hash);
    expect(report.checkpoints.at(-1)?.tick).toBe(300);
  });
});
