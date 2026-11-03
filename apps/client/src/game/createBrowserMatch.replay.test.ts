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
import { botRosterSlots } from './session/botRosterSlots';
import { buildMatchSetup } from './session/buildMatchSetup';
import { createRosterRng } from './session/createRosterRng';
import { fillRosters } from './session/fillRosters';
import { LcgRng } from './session/LcgRng';

const SEED = 7;
const PLAYER_CLASS = 'warrior';
/** One checkpoint interval (`REPLAY_CHECKPOINT_EVERY`, 300 ticks), plus a few ticks. */
const TICKS = 310;
const config = createDefaultGameConfig();
const catalogue = shippedCatalogue().load();

/** Builds the match the way `createBrowserMatch` does: world, then the setup's bots as roster. */
function buildBrowserMatch(): { simulation: Simulation; spawn: Command } {
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
    config,
    seed: SEED,
    logger: new NullLogger(),
    map: world.map,
    mapObjects: world.mapObjects,
    roster: botRosterSlots(setup, catalogue.botRoster.difficulties),
  });
  const at = world.map.features.find(
    (feature) => feature.kind === 'stronghold' && feature.team === draft.playerTeam,
  )?.position;
  if (at === undefined) throw new Error('The map has no stronghold for the player team.');
  const spawn: Command = {
    type: 'dev-spawn',
    kind: PLAYER_CLASS,
    definitionId: PLAYER_CLASS,
    team: draft.playerTeam,
    at,
    count: 1,
  };
  return { simulation, spawn };
}

describe('replay of a browser-built match', () => {
  it('reproduces the match from the crash report alone (JSON round trip)', () => {
    const { simulation, spawn } = buildBrowserMatch();
    simulation.enqueueCommand(spawn);
    for (let tick = 0; tick < TICKS; tick += 1) simulation.step();

    const report = JSON.parse(JSON.stringify(simulation.exportReplay())) as Replay;
    const outcome = runReplay(
      report,
      (setup) => new Simulation({ ...setup, logger: new NullLogger() }),
    );

    expect(report.roster?.length).toBeGreaterThan(0);
    expect(report.checkpoints.length).toBeGreaterThan(1);
    expect(outcome.firstDivergence).toBeNull();
    expect(outcome.finalHash).toBe(report.checkpoints.at(-1)?.hash);
    expect(report.checkpoints.at(-1)?.tick).toBe(300);
    // A whole match, recorded and replayed: under 1 s locally, over 6 s on the Windows CI runner
    // under coverage; core's `testTimeout` gives its whole-match tests the same 60 s.
  }, 60_000);
});
