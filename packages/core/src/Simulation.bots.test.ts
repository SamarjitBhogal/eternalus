import { describe, expect, it } from 'vitest';

import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';

const laners = (team: 'light' | 'dark', count: number): RosterSlot[] =>
  Array.from({ length: count }, () => ({
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
      match: { initialHordesPerTeam: 2, countdownSeconds: 600, legendsPerTeam },
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

  it('refuses a roster without a map, laners that do not fit, or a difficulty that does not exist', () => {
    expect(() => match(laners('light', 1), false)).toThrow('A roster needs a map');
    // Two lanes of `legendsPerLane` 3 hold six laners a team.
    expect(() => match(laners('dark', 7))).toThrow('7 bot laners do not fit');
    // Five laners fit on the lanes but not under a team cap of four.
    expect(() => match(laners('light', 5), true, 4)).toThrow('match.legendsPerTeam allows 4');
    expect(() =>
      match([{ team: 'light', definitionId: 'warrior', role: 'laner', difficulty: 'nightmare' }]),
    ).toThrow('AI profile "nightmare"');
  });

  it('spawns a Rover at its Stronghold with no lane, playing the Rover tree (M8)', () => {
    const simulation = match([
      { team: 'dark', definitionId: 'warrior', role: 'rover', difficulty: 'rover' },
    ]);

    const rover = simulation
      .snapshot()
      .entities.find(({ kind, team }) => kind === 'warrior' && team === 'dark');
    // The dark Stronghold of the two-lane map stands at (190, 30).
    expect(rover?.transform).toMatchObject({ x: 190, y: 30 });
    expect(() =>
      match([{ team: 'dark', definitionId: 'warrior', role: 'rover', difficulty: 'nightmare' }]),
    ).toThrow('AI profile "nightmare"');
  });

  it('plays laners and a Rover together with no warnings, the same way twice (M8)', () => {
    const roster: RosterSlot[] = [
      ...laners('light', 2),
      ...laners('dark', 2),
      { team: 'dark', definitionId: 'warrior', role: 'rover', difficulty: 'rover' },
    ];
    const runs = [1, 2].map(() => {
      const logger = new MemoryLogger();
      const simulation = new Simulation({
        config: createDefaultGameConfig({
          match: { initialHordesPerTeam: 2, countdownSeconds: 600 },
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
});
