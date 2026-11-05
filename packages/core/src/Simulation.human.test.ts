import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import type { Logger } from './diagnostics/Logger.types';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { NullLogger } from './diagnostics/NullLogger';
import { recordReplay, runReplay } from './diagnostics/replay';
import type { MapDefinition } from './content/maps/maps.types';
import { Simulation } from './Simulation';
import type { ReplaySetup, RosterSlot } from './Simulation.types';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';
import type { PlayableTeam } from './teams/teams.types';

/** The dark Stronghold of the two-lane map. */
const DARK_STRONGHOLD = { x: 190, y: 30 };

/** The human's slot: the team's Rover (DISC-51), unless `role` says otherwise. */
const human = (
  definitionId = 'warrior',
  team: PlayableTeam = 'dark',
  role: RosterSlot['role'] = 'rover',
): RosterSlot => ({ pilot: 'human', team, definitionId, role });

const laner = (team: PlayableTeam): RosterSlot => ({
  pilot: 'bot',
  team,
  definitionId: 'warrior',
  role: 'laner',
  difficulty: 'normal',
});

const configFor = (playerTeam: PlayableTeam = 'dark') =>
  createDefaultGameConfig({ match: { playerTeam } });

const build = (
  roster: readonly RosterSlot[] = [human()],
  logger: Logger = new NullLogger(),
  withSystems = false,
) =>
  new Simulation({
    config: configFor(),
    seed: 5,
    logger,
    map: TWO_LANE_MAP,
    roster,
    ...(withSystems ? { systems: [] } : {}),
  });

/** The match's Legends (the map's structures left out). */
const legendsOf = (sim: Simulation) =>
  sim.snapshot().entities.filter(({ family }) => family === 'legend');

describe('Simulation: the human slot of the roster', () => {
  it.each([false, true])(
    "spawns the human's Legend on the player team at its Stronghold, at construction (custom systems: %s)",
    (withSystems) => {
      const sim = build([human()], new NullLogger(), withSystems);

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

  it('spawns the human slot in roster order, as any Rover: after the laners, at its own Stronghold', () => {
    const sim = new Simulation({
      config: configFor('light'),
      seed: 5,
      logger: new NullLogger(),
      map: TWO_LANE_MAP,
      roster: [laner('light'), human('warrior', 'light'), laner('dark')],
    });

    const { match, entities } = sim.snapshot();
    const legendIds = legendsOf(sim).map(({ id }) => id);
    const humanLegend = entities.find(({ id }) => id === match.humanLegendId);

    expect(legendIds).toHaveLength(3);
    // Entity ids count up, so the last Legend spawned last: Rovers spawn after every laner.
    expect(legendIds.at(-1)).toBe(match.humanLegendId);
    // The light Stronghold of the two-lane map stands at (10, 30).
    expect(humanLegend).toMatchObject({ team: 'light', transform: { x: 10, y: 30 } });
  });

  it('gives the human slot no controller: its Legend stands where it spawned while a bot of the same slot plays', () => {
    const run = (slot: RosterSlot) => {
      const sim = new Simulation({
        config: createDefaultGameConfig({ match: { playerTeam: 'dark', countdownSeconds: 0 } }),
        seed: 5,
        logger: new NullLogger(),
        map: TWO_LANE_MAP,
        roster: [slot],
      });
      for (let tick = 0; tick < 5 * 30; tick += 1) {
        sim.step();
      }
      return legendsOf(sim)[0]?.transform;
    };

    expect(run(human())).toMatchObject(DARK_STRONGHOLD);
    const botRover: RosterSlot = {
      pilot: 'bot',
      team: 'dark',
      definitionId: 'warrior',
      role: 'rover',
      difficulty: 'rover',
    };
    expect(run(botRover)).not.toMatchObject(DARK_STRONGHOLD);
  });

  it('puts a laner human on a lane like a bot laner, with no special case', () => {
    const at = (slot: RosterSlot) =>
      legendsOf(
        new Simulation({
          config: configFor(),
          seed: 5,
          logger: new NullLogger(),
          map: TWO_LANE_MAP,
          roster: [laner('dark'), slot],
        }),
      ).map(({ transform }) => transform);

    const withHuman = at(human('warrior', 'dark', 'laner'));

    expect(withHuman).toEqual(at(laner('dark')));
    expect(withHuman[1]).not.toMatchObject(DARK_STRONGHOLD);
  });

  it('has no human in sim mode: humanLegendId null without a roster and with a bots-only roster', () => {
    const empty = build([]);
    const botsOnly = build([laner('dark')]);

    expect(empty.snapshot().match.humanLegendId).toBeNull();
    expect(legendsOf(empty)).toEqual([]);
    expect(botsOnly.snapshot().match.humanLegendId).toBeNull();
    expect(legendsOf(botsOnly)).toHaveLength(1);
  });

  it.each([
    ['an unknown id', 'stale-class', 'unknown-definition'],
    ['a definition that is not a Legend', 'training-dummy', 'not-a-legend'],
  ])(
    'logs ERROR core.match naming the definition and the reason for %s, and runs on',
    (_case, definitionId, reason) => {
      const logger = new MemoryLogger();
      const sim = build([human(definitionId)], logger);

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

  it('spawns the bots of a roster whose human slot is refused, the laners on the lanes they would have had', () => {
    const roster = [laner('dark'), human('stale-class', 'dark', 'laner'), laner('dark')];
    const at = (slots: readonly RosterSlot[]) =>
      legendsOf(build(slots, new MemoryLogger())).map(({ transform }) => transform);

    expect(at(roster)).toEqual(at([laner('dark'), laner('dark')]));
  });

  it('logs nothing at ERROR when the human slot spawns', () => {
    const logger = new MemoryLogger();
    build([human()], logger);

    expect(logger.records.filter((record) => record.severityText === 'ERROR')).toEqual([]);
  });

  it('throws without a map, as any roster does, and when its team has no Stronghold, as a Rover does', () => {
    const noDarkStronghold: MapDefinition = {
      ...TWO_LANE_MAP,
      features: TWO_LANE_MAP.features.filter(({ id }) => id !== 'stronghold-dark'),
    };

    expect(
      () =>
        new Simulation({
          config: configFor(),
          seed: 5,
          logger: new NullLogger(),
          roster: [human()],
        }),
    ).toThrow('A roster needs a map');
    expect(
      () =>
        new Simulation({
          config: configFor(),
          seed: 5,
          logger: new NullLogger(),
          map: noDarkStronghold,
          roster: [human()],
        }),
    ).toThrow("The map has no dark Stronghold for the human's Legend.");
  });

  it('refuses a second human slot and a human slot off playerTeam, before anything spawns', () => {
    const logger = new MemoryLogger();
    const withRoster = (roster: readonly RosterSlot[]) => () => build(roster, logger);

    expect(withRoster([human(), human('magus')])).toThrow(
      'The roster has 2 human slots; a match has at most one human.',
    );
    expect(withRoster([human('warrior', 'light')])).toThrow(
      "The roster's human slot is on the light team; match.playerTeam is dark.",
    );
    // Refused before the human's definition is looked at: no ERROR for a stale class either.
    expect(withRoster([human('stale-class', 'light')])).toThrow('match.playerTeam is dark');
    expect(logger.records.filter((record) => record.severityText === 'ERROR')).toEqual([]);
  });

  it('counts the human slot in the roster’s legendsPerTeam and Unit cap checks, before anything spawns', () => {
    const roster = [laner('light'), laner('light'), human('warrior', 'light')];
    const withLimits = (limits: { legendsPerTeam?: number; maxUnitsPerTeam?: number }) =>
      new Simulation({
        config: createDefaultGameConfig({
          match: {
            playerTeam: 'light',
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

    // Two light laners fit under either cap of two, but not with the human on the light team.
    expect(() => withLimits({ legendsPerTeam: 2 })).toThrow(
      'The light roster has 3 Legends; match.legendsPerTeam allows 2.',
    );
    expect(() => withLimits({ maxUnitsPerTeam: 2 })).toThrow(
      'The light roster would make 3 Units; limits.maxUnitsPerTeam allows 2.',
    );
    // The human counts on its own team only: a dark human leaves the light count at two.
    expect(
      legendsOf(
        new Simulation({
          config: createDefaultGameConfig({ match: { playerTeam: 'dark', legendsPerTeam: 2 } }),
          seed: 5,
          logger: new NullLogger(),
          map: TWO_LANE_MAP,
          roster: [laner('light'), laner('light'), human()],
        }),
      ),
    ).toHaveLength(3);
  });

  it('reproduces its hashes in a replay of a roster with a human slot, which needs no recorded command', () => {
    const createTarget = ({ config, seed, roster }: ReplaySetup) =>
      new Simulation({
        config,
        seed,
        logger: new NullLogger(),
        map: TWO_LANE_MAP,
        ...(roster === undefined ? {} : { roster }),
      });
    const replay = recordReplay(
      { config: configFor(), seed: 5, roster: [human()] },
      { ticks: 40, checkpointEvery: 10, commandsFor: () => [] },
      createTarget,
    );

    expect(replay.commands).toEqual([]);
    expect(runReplay(replay, createTarget).firstDivergence).toBeNull();
    expect(build([human()]).exportReplay().roster).toEqual([human()]);
  });

  it('hashes a match with a human differently from one in sim mode (the Legend is in the entities)', () => {
    expect(build([human()]).hash()).not.toBe(build([]).hash());
  });
});
