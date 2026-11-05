import { describe, expect, it } from 'vitest';

import type { GameConfig } from './config/GameConfig.types';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import type { Logger } from './diagnostics/Logger.types';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { NullLogger } from './diagnostics/NullLogger';
import { recordReplay, runReplay } from './diagnostics/replay';
import type { MapDefinition } from './content/maps/maps.types';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';
import type { PlayableTeam } from './teams/teams.types';

/** The dark Stronghold of the two-lane map. */
const DARK_STRONGHOLD = { x: 190, y: 30 };

const seatedConfig = (definitionId = 'warrior', team: PlayableTeam = 'dark') =>
  createDefaultGameConfig({ match: { playerTeam: team, seat: { definitionId } } });

const build = (config = seatedConfig(), logger: Logger = new NullLogger(), withSystems = false) =>
  new Simulation({
    config,
    seed: 5,
    logger,
    map: TWO_LANE_MAP,
    ...(withSystems ? { systems: [] } : {}),
  });

/** The match's Legends (the map's structures left out). */
const legendsOf = (sim: Simulation) =>
  sim.snapshot().entities.filter(({ family }) => family === 'legend');

const laner = (team: PlayableTeam): RosterSlot => ({
  team,
  definitionId: 'warrior',
  role: 'laner',
  difficulty: 'normal',
});

describe('Simulation: the human seat', () => {
  it.each([false, true])(
    "spawns the seat's Legend on the player team at its Stronghold, at construction (custom systems: %s)",
    (withSystems) => {
      const sim = build(seatedConfig(), new NullLogger(), withSystems);

      const legends = legendsOf(sim);

      expect(sim.tick).toBe(0);
      expect(legends).toHaveLength(1);
      expect(sim.snapshot().match.humanLegendId).toBe(legends[0]?.id);
      expect(legends[0]).toMatchObject({
        kind: 'warrior',
        team: 'dark',
        transform: DARK_STRONGHOLD,
      });
    },
  );

  it('spawns the seat after the roster, at the Stronghold of its own team', () => {
    const sim = new Simulation({
      config: seatedConfig('warrior', 'light'),
      seed: 5,
      logger: new NullLogger(),
      map: TWO_LANE_MAP,
      roster: [laner('light'), laner('dark')],
    });

    const { match, entities } = sim.snapshot();
    const legendIds = legendsOf(sim).map(({ id }) => id);
    const human = entities.find(({ id }) => id === match.humanLegendId);

    expect(legendIds).toHaveLength(3);
    // Entity ids count up, so the last Legend spawned last.
    expect(legendIds.at(-1)).toBe(match.humanLegendId);
    // The light Stronghold of the two-lane map stands at (10, 30).
    expect(human).toMatchObject({ team: 'light', transform: { x: 10, y: 30 } });
  });

  it('has no human in sim mode: no seat, no Legend, humanLegendId null', () => {
    const sim = build(createDefaultGameConfig());

    expect(sim.snapshot().match.humanLegendId).toBeNull();
    expect(legendsOf(sim)).toEqual([]);
  });

  it.each([
    ['an unknown id', 'stale-class', 'unknown-definition'],
    ['a definition that is not a Legend', 'training-dummy', 'not-a-legend'],
  ])(
    'logs ERROR core.match naming the definition and the reason for %s, and runs on',
    (_case, definitionId, reason) => {
      const logger = new MemoryLogger();
      const sim = build(seatedConfig(definitionId), logger);

      sim.step();

      expect(sim.snapshot().match.humanLegendId).toBeNull();
      expect(legendsOf(sim)).toEqual([]);
      expect(sim.snapshot().entities.some((entity) => entity.definitionId === definitionId)).toBe(
        false,
      );
      expect(sim.tick).toBe(1);
      const errors = logger.records.filter((record) => record.severityText === 'ERROR');
      expect(errors.map(({ scope, attributes }) => [scope, attributes])).toEqual([
        ['core.match', { definitionId, reason }],
      ]);
      expect(errors[0]?.body).toBe(
        `The human's Legend "${definitionId}" did not spawn: ${reason}.`,
      );
    },
  );

  it('logs nothing at ERROR when the seat spawns', () => {
    const logger = new MemoryLogger();
    build(seatedConfig(), logger);

    expect(logger.records.filter((record) => record.severityText === 'ERROR')).toEqual([]);
  });

  it('throws without a map, as a roster does, and when its team has no Stronghold, as a Rover does', () => {
    const noDarkStronghold: MapDefinition = {
      ...TWO_LANE_MAP,
      features: TWO_LANE_MAP.features.filter(({ id }) => id !== 'stronghold-dark'),
    };

    expect(
      () => new Simulation({ config: seatedConfig(), seed: 5, logger: new NullLogger() }),
    ).toThrow("A seat needs a map: the human's Legend spawns at its team's Stronghold.");
    expect(
      () =>
        new Simulation({
          config: seatedConfig(),
          seed: 5,
          logger: new NullLogger(),
          map: noDarkStronghold,
        }),
    ).toThrow("The map has no dark Stronghold for the human's Legend.");
  });

  it('counts the seat in the roster’s legendsPerTeam and Unit cap checks, before anything spawns', () => {
    const roster = [laner('light'), laner('light')];
    const withSeat = (limits: { legendsPerTeam?: number; maxUnitsPerTeam?: number }) =>
      new Simulation({
        config: createDefaultGameConfig({
          match: {
            playerTeam: 'light',
            seat: { definitionId: 'warrior' },
            hordeSizes: { light: 0 },
            ...(limits.legendsPerTeam === undefined
              ? {}
              : { legendsPerTeam: limits.legendsPerTeam }),
          },
          ...(limits.maxUnitsPerTeam === undefined
            ? {}
            : { limits: { maxUnitsPerTeam: limits.maxUnitsPerTeam } }),
        }),
        seed: 5,
        logger: new NullLogger(),
        map: TWO_LANE_MAP,
        roster,
      });

    // Two light laners fit under either cap of two, but not with the seat on the light team.
    expect(() => withSeat({ legendsPerTeam: 2 })).toThrow(
      'The light roster has 3 Legends with the seat; match.legendsPerTeam allows 2.',
    );
    expect(() => withSeat({ maxUnitsPerTeam: 2 })).toThrow(
      'The light roster would make 3 Units; limits.maxUnitsPerTeam allows 2.',
    );
    // The seat sits on the light team only: a dark seat leaves the light count at two.
    expect(
      legendsOf(
        new Simulation({
          config: createDefaultGameConfig({
            match: { playerTeam: 'dark', seat: { definitionId: 'warrior' }, legendsPerTeam: 2 },
          }),
          seed: 5,
          logger: new NullLogger(),
          map: TWO_LANE_MAP,
          roster,
        }),
      ),
    ).toHaveLength(3);
  });

  it('reproduces its hashes in a replay of a config with a seat, which needs no recorded command', () => {
    const createTarget = ({ config, seed }: { config: GameConfig; seed: number }) =>
      new Simulation({ config, seed, logger: new NullLogger(), map: TWO_LANE_MAP });
    const replay = recordReplay(
      { config: seatedConfig(), seed: 5 },
      { ticks: 40, checkpointEvery: 10, commandsFor: () => [] },
      createTarget,
    );

    expect(replay.commands).toEqual([]);
    expect(runReplay(replay, createTarget).firstDivergence).toBeNull();
  });

  it('hashes a seated match differently from an unseated one (the Legend is in the entities)', () => {
    expect(build(seatedConfig()).hash()).not.toBe(build(createDefaultGameConfig()).hash());
  });
});
