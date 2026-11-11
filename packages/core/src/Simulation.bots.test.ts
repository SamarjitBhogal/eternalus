import { describe, expect, it, vi } from 'vitest';

import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { ContentCatalogue } from './content/ContentCatalogue';
import { loadDefaultContent } from './content/loadDefaultContent';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';
import { GameEvents } from './state/GameEvents';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';

const laners = (team: 'light' | 'dark', count: number): RosterSlot[] =>
  Array.from({ length: count }, () => ({
    pilot: 'bot',
    team,
    definitionId: 'warrior',
    role: 'laner',
    difficulty: 'normal',
  }));

const match = (
  roster: readonly RosterSlot[],
  withMap = true,
  legendsPerTeam = createDefaultGameConfig().match.legendsPerTeam,
) =>
  new Simulation({
    config: createDefaultGameConfig({
      match: { countdownSeconds: 0, legendsPerTeam },
    }),
    seed: 1,
    logger: new MemoryLogger(),
    debug: TEST_DEBUG_CONFIG,
    ...(withMap ? { map: TWO_LANE_MAP } : {}),
    roster,
  });

/** Each light bot's distance down its lane (x on the two-lane map) and its lane (by y). */
const lightBots = (simulation: Simulation) =>
  simulation
    .snapshot()
    .entities.filter(({ kind, team }) => kind === 'warrior' && team === 'light')
    .map(({ transform }) => ({ x: transform?.x ?? 0, lane: (transform?.y ?? 0) < 30 ? 0 : 1 }));

describe('Simulation with bot laners (minion plan M3)', () => {
  it('spawns the roster split evenly over the lanes, at its own end of them', () => {
    const simulation = match([...laners('light', 4), ...laners('dark', 4)]);

    const bots = lightBots(simulation);
    expect(bots).toHaveLength(4);
    expect(bots.filter(({ lane }) => lane === 0)).toHaveLength(2);
    expect(bots.every(({ x }) => x <= 20)).toBe(true);
  });

  it('pushes down the lane with its hordes, the same way twice', () => {
    const runs = [1, 2].map(() => {
      const simulation = match(laners('light', 2));
      for (let tick = 0; tick < 20 * 30; tick += 1) {
        simulation.step();
      }
      return { bots: lightBots(simulation), hash: simulation.hash() };
    });

    expect(runs[0]?.bots.every(({ x }) => x > 60)).toBe(true);
    expect(runs[0]?.hash).toBe(runs[1]?.hash);
  });

  it('hits the enemy structures on its lane once its horde reaches them (11 §4.2 Push)', () => {
    const simulation = match(laners('light', 2));
    const structures = new Set(
      simulation
        .snapshot()
        .entities.filter(({ family, team }) => family === 'structure' && team === 'dark')
        .map(({ id }) => id),
    );
    const bots = new Set(
      simulation
        .snapshot()
        .entities.filter(({ kind }) => kind === 'warrior')
        .map(({ id }) => id),
    );
    let botHits = 0;
    simulation.on('damage-applied', ({ targetId, source }) => {
      botHits += structures.has(targetId) && bots.has(source.attackerId ?? '') ? 1 : 0;
    });

    for (let tick = 0; tick < 90 * 30; tick += 1) {
      simulation.step();
    }

    expect(botHits).toBeGreaterThan(0);
  });

  it('refuses a roster without a map, laners that do not fit, or a difficulty that does not exist', () => {
    expect(() => match(laners('light', 1), false)).toThrow('A roster needs a map');
    // Two lanes of `legendsPerLane` 3 hold six laners a team.
    expect(() => match(laners('dark', 7))).toThrow('7 bot laners do not fit');
    // Five laners fit on the lanes but not under a team cap of four.
    expect(() => match(laners('light', 5), true, 4)).toThrow('match.legendsPerTeam allows 4');
    // Legends are Units: two laners do not fit under a Unit cap of one.
    expect(
      () =>
        new Simulation({
          config: createDefaultGameConfig({
            match: { hordeSizes: { light: 0 } },
            limits: { maxUnitsPerTeam: 1 },
          }),
          seed: 1,
          logger: new MemoryLogger(),
          debug: TEST_DEBUG_CONFIG,
          map: TWO_LANE_MAP,
          roster: laners('light', 2),
        }),
    ).toThrow('limits.maxUnitsPerTeam allows 1');
    expect(() =>
      match([
        {
          pilot: 'bot',
          team: 'light',
          definitionId: 'warrior',
          role: 'laner',
          difficulty: 'nightmare',
        },
      ]),
    ).toThrow('AI profile "nightmare"');
  });

  it.each([
    ['an unknown id', 'stale-class', 'unknown-definition'],
    ['a definition that is not a Legend', 'training-dummy', 'not-a-legend'],
  ])(
    'refuses a bot slot with %s, before any Legend spawns (DEC-173)',
    (_case, definitionId, reason) => {
      const emit = vi.spyOn(GameEvents.prototype, 'emit');
      const bad: RosterSlot = {
        pilot: 'bot',
        team: 'dark',
        definitionId,
        role: 'laner',
        difficulty: 'normal',
      };

      expect(() => match([...laners('light', 1), bad])).toThrow(
        `Roster slot 1 (a dark bot) cannot spawn "${definitionId}": ${reason}.`,
      );
      // The valid light laner before it did not spawn either.
      const spawned = emit.mock.calls.filter(([type]) => type === 'entity-spawned');
      expect(spawned.map(([, payload]) => payload)).not.toContainEqual(
        expect.objectContaining({ kind: 'warrior' }),
      );
      emit.mockRestore();
    },
  );

  it('builds the match director and the systems before the roster spawns, so they hear every bot (plan §4.4)', () => {
    const on = vi.spyOn(GameEvents.prototype, 'on');
    const emit = vi.spyOn(GameEvents.prototype, 'emit');
    match([...laners('light', 1), ...laners('dark', 1)]);
    const ordersOf = (spy: typeof on | typeof emit, type: string) =>
      spy.mock.calls.flatMap(([called], index) =>
        called === type ? [spy.mock.invocationCallOrder[index] ?? Number.NaN] : [],
      );

    // `GameState`, the director's `ObjectiveLostCondition` and some systems listen to deaths.
    const listeners = ordersOf(on, 'entity-died');
    const [firstSpawn] = ordersOf(emit, 'entity-spawned');

    expect(listeners.length).toBeGreaterThan(2);
    expect(Math.max(...listeners)).toBeLessThan(firstSpawn ?? Number.NaN);
  });

  it('spawns a Rover at its Stronghold with no lane, playing the Rover tree (M8)', () => {
    const simulation = match([
      { pilot: 'bot', team: 'dark', definitionId: 'warrior', role: 'rover', difficulty: 'rover' },
    ]);

    const rover = simulation
      .snapshot()
      .entities.find(({ kind, team }) => kind === 'warrior' && team === 'dark');
    // The dark Stronghold of the two-lane map stands at (190, 30).
    expect(rover?.transform).toMatchObject({ x: 190, y: 30 });
    expect(() =>
      match([
        {
          pilot: 'bot',
          team: 'dark',
          definitionId: 'warrior',
          role: 'rover',
          difficulty: 'nightmare',
        },
      ]),
    ).toThrow('AI profile "nightmare"');
  });

  it('plays laners and a Rover together with no warnings, the same way twice (M8)', () => {
    const roster: RosterSlot[] = [
      ...laners('light', 2),
      ...laners('dark', 2),
      { pilot: 'bot', team: 'dark', definitionId: 'warrior', role: 'rover', difficulty: 'rover' },
    ];
    const runs = [1, 2].map(() => {
      const logger = new MemoryLogger();
      const simulation = new Simulation({
        config: createDefaultGameConfig({
          match: { countdownSeconds: 0 },
        }),
        seed: 1,
        logger,
        debug: TEST_DEBUG_CONFIG,
        map: TWO_LANE_MAP,
        roster,
      });
      for (let tick = 0; tick < 20 * 30; tick += 1) {
        simulation.step();
      }
      return {
        hash: simulation.hash(),
        warnings: logger.records.filter(({ severityText }) => severityText !== 'INFO'),
      };
    });

    expect(runs[0]?.warnings).toEqual([]);
    expect(runs[0]?.hash).toBe(runs[1]?.hash);
  });

  it('spawns a roster Legend by its definition’s kind when the id differs from it', () => {
    const defaults = loadDefaultContent(30);
    const veteran = { ...defaults.get('warrior'), id: 'warrior-veteran' };
    const simulation = new Simulation({
      config: createDefaultGameConfig({
        match: { countdownSeconds: 0 },
      }),
      seed: 1,
      logger: new MemoryLogger(),
      debug: TEST_DEBUG_CONFIG,
      map: TWO_LANE_MAP,
      content: new ContentCatalogue([...defaults.all(), veteran]),
      roster: [
        {
          pilot: 'bot',
          team: 'light',
          definitionId: 'warrior-veteran',
          role: 'laner',
          difficulty: 'normal',
        },
      ],
    });

    expect(lightBots(simulation)).toHaveLength(1);
  });
});
