import { describe, expect, it } from 'vitest';

import type { GameConfig } from './config/GameConfig.types';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import type { Logger } from './diagnostics/Logger.types';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { NullLogger } from './diagnostics/NullLogger';
import { recordReplay, runReplay } from './diagnostics/replay';
import { Simulation } from './Simulation';
import type { PlayableTeam } from './teams/teams.types';

const AT = { x: 40, y: 50 };

const seatedConfig = (definitionId = 'warrior', team: PlayableTeam = 'dark') =>
  createDefaultGameConfig({ match: { playerTeam: team, seat: { definitionId, at: AT } } });

const build = (config = seatedConfig(), logger: Logger = new NullLogger(), withSystems = false) =>
  new Simulation({ config, seed: 5, logger, ...(withSystems ? { systems: [] } : {}) });

describe('Simulation: the human seat', () => {
  it.each([false, true])(
    "spawns the seat's Legend on the player team at the seat point, at construction (custom systems: %s)",
    (withSystems) => {
      const sim = build(seatedConfig(), new NullLogger(), withSystems);

      const { match, entities } = sim.snapshot();

      expect(sim.tick).toBe(0);
      expect(entities).toHaveLength(1);
      expect(match.humanLegendId).toBe(entities[0]?.id);
      expect(entities[0]).toMatchObject({
        kind: 'warrior',
        family: 'legend',
        team: 'dark',
        transform: { x: AT.x, y: AT.y },
      });
    },
  );

  it('has no human in sim mode: no seat, no Legend, humanLegendId null', () => {
    const sim = build(createDefaultGameConfig());

    expect(sim.snapshot().match.humanLegendId).toBeNull();
    expect(sim.snapshot().entities).toEqual([]);
  });

  it('logs ERROR core.match naming the Legend and the reason for an unknown id, and runs on', () => {
    const logger = new MemoryLogger();
    const sim = build(seatedConfig('stale-class'), logger);

    sim.step();

    expect(sim.snapshot().match.humanLegendId).toBeNull();
    expect(sim.snapshot().entities).toEqual([]);
    expect(sim.tick).toBe(1);
    const errors = logger.records.filter((record) => record.severityText === 'ERROR');
    expect(errors.map(({ scope, attributes }) => [scope, attributes])).toEqual([
      ['core.match', { definitionId: 'stale-class', reason: 'unknown-kind' }],
    ]);
    expect(errors[0]?.body).toContain('"stale-class"');
    expect(errors[0]?.body).toContain('unknown-kind');
  });

  it('logs nothing at ERROR when the seat spawns', () => {
    const logger = new MemoryLogger();
    build(seatedConfig(), logger);

    expect(logger.records.filter((record) => record.severityText === 'ERROR')).toEqual([]);
  });

  it('reproduces its hashes in a replay of a config with a seat, which needs no recorded command', () => {
    const createTarget = (config: GameConfig, seed: number) =>
      new Simulation({ config, seed, logger: new NullLogger() });
    const replay = recordReplay(
      { config: seatedConfig(), seed: 5, ticks: 40, checkpointEvery: 10, commandsFor: () => [] },
      createTarget,
    );

    expect(replay.commands).toEqual([]);
    expect(runReplay(replay, createTarget).firstDivergence).toBeNull();
  });

  it('hashes a seated match differently from an unseated one (the Legend is in the entities)', () => {
    expect(build(seatedConfig()).hash()).not.toBe(build(createDefaultGameConfig()).hash());
  });
});
