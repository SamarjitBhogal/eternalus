import { describe, expect, it } from 'vitest';

import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { MapGenerator } from './map/MapGenerator';
import { Simulation } from './Simulation';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';
import type { MapDefinition } from './content/maps/maps.types';

/** A match on `map` whose countdown outlasts the test, so only the opening hordes march. */
const match = (map: MapDefinition, seed = 1) => {
  const logger = new MemoryLogger();
  const simulation = new Simulation({
    config: createDefaultGameConfig({ match: { initialHordesPerTeam: 2, countdownSeconds: 600 } }),
    seed,
    logger,
    debug: TEST_DEBUG_CONFIG,
    map,
  });
  return { simulation, logger };
};

const run = (simulation: Simulation, ticks: number): void => {
  for (let tick = 0; tick < ticks; tick += 1) {
    simulation.step();
  }
};

describe('Simulation with lane hordes (architecture 18, M1)', () => {
  it('walks every opening horde down its lane to the enemy end, invariants clean', () => {
    const { simulation, logger } = match(TWO_LANE_MAP);
    const spawned: string[] = [];
    simulation.on('horde-spawned', ({ team, lane }) => spawned.push(`${team} ${lane}`));

    // Lanes are 160 m long and light minions walk 3.5 m/s: about 46 s, so 60 s is plenty.
    run(simulation, 60 * 30);

    expect(spawned).toEqual(['light lane-0', 'light lane-1', 'dark lane-0', 'dark lane-1']);
    const minions = simulation.snapshot().entities.filter(({ family }) => family === 'mob');
    expect(minions).toHaveLength(64);
    const near = (x: number) => (minion: (typeof minions)[number]) =>
      Math.abs((minion.transform?.x ?? 0) - x) < 15;
    expect(minions.filter(({ team }) => team === 'light').every(near(180))).toBe(true);
    expect(minions.filter(({ team }) => team === 'dark').every(near(20))).toBe(true);
    expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
  });

  it('gives the same hash for the same seed and map, tick for tick', () => {
    const first = match(TWO_LANE_MAP).simulation;
    const second = match(TWO_LANE_MAP).simulation;
    for (let checkpoint = 0; checkpoint < 6; checkpoint += 1) {
      run(first, 100);
      run(second, 100);
      expect(first.hash()).toBe(second.hash());
    }
  });

  it('spawns the opening hordes of the generated map at its Strongholds', () => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, 1);
    const simulation = new Simulation({ config, seed: 1, logger: new MemoryLogger(), map });

    simulation.step();

    const minions = simulation.snapshot().entities.filter(({ family }) => family === 'mob');
    expect(minions).toHaveLength(
      2 * config.match.initialHordesPerTeam * config.match.hordeSizes.light,
    );
  });
});
