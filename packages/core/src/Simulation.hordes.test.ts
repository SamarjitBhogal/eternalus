import { describe, expect, it } from 'vitest';

import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import type { GameConfig } from './config/GameConfig.types';
import { MAP_FEATURE_DEFINITIONS } from './content/maps/mapFeatureDefinitions';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { BLOCKED_LANE_MAP } from './map/__fixtures__/blockedLaneMap';
import { MapGenerator } from './map/MapGenerator';
import { WorldMap } from './map/WorldMap';
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

  it('marches in formation with no overlap beyond a tolerance', () => {
    const { simulation } = match(TWO_LANE_MAP);
    // Light minions are 0.8 m across; forming up outside the gate may squeeze them by 0.2 m.
    const diameter = 0.8;
    const closest = (): number => {
      const minions = simulation
        .snapshot()
        .entities.filter(({ family, team }) => family === 'mob' && team === 'light');
      let best = Number.POSITIVE_INFINITY;
      minions.forEach(({ transform: a }, index) => {
        for (const { transform: b } of minions.slice(index + 1)) {
          best = Math.min(best, Math.hypot((a?.x ?? 0) - (b?.x ?? 0), (a?.y ?? 0) - (b?.y ?? 0)));
        }
      });
      return best;
    };

    const forming = [1, 2].map(() => {
      run(simulation, 300);
      return closest();
    });
    const marching = [3, 4, 5, 6].map(() => {
      run(simulation, 300);
      return closest();
    });

    expect(Math.min(...forming)).toBeGreaterThan(diameter - 0.2);
    expect(Math.min(...marching)).toBeGreaterThan(diameter);
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

/** The generated map's walkability grid, as the pipeline builds it. */
const gridOf = (map: MapDefinition, config: GameConfig): WorldMap =>
  WorldMap.fromDefinition(
    map,
    config.map.navCellSize,
    (definitionId) => MAP_FEATURE_DEFINITIONS[definitionId]?.isBlocking ?? false,
  );

/** A match with one opening horde per lane and team, and no later waves. */
const laneMatch = (map: MapDefinition, numLanes: number) => {
  const config = createDefaultGameConfig({
    map: { numLanes, campsPerSide: numLanes === 1 ? 0 : 6 },
    match: { initialHordesPerTeam: numLanes, countdownSeconds: 6000 },
  });
  const logger = new MemoryLogger();
  return { config, logger, simulation: new Simulation({ config, seed: 1, logger, map }) };
};

/**
 * Runs `ticks` ticks and returns how far the farthest mob ends from its enemy end, and the share
 * of samples (every 10 ticks) that found a mob on unwalkable ground after it first stood on
 * walkable ground (the Stronghold hordes spawn inside the Stronghold's footprint).
 */
const march = (map: MapDefinition, numLanes: number, ticks: number) => {
  const { config, logger, simulation } = laneMatch(map, numLanes);
  const grid = gridOf(map, config);
  const hasLeft = new Set<string>();
  let samples = 0;
  let offGround = 0;
  for (let tick = 0; tick < ticks; tick += 1) {
    simulation.step();
    if (tick % 10 !== 0) {
      continue;
    }
    for (const { id, family, transform } of simulation.snapshot().entities) {
      const cell = family === 'mob' && transform !== null ? grid.cellAt(transform) : null;
      if (cell === null) {
        continue;
      }
      if (grid.isWalkable(cell.col, cell.row)) {
        hasLeft.add(id);
      }
      if (hasLeft.has(id)) {
        samples += 1;
        offGround += grid.isWalkable(cell.col, cell.row) ? 0 : 1;
      }
    }
  }
  const mobs = simulation.snapshot().entities.filter(({ family }) => family === 'mob');
  const farthest = Math.max(
    ...mobs.map(({ team, transform }) =>
      Math.min(
        ...map.lanes.map(({ path }) => {
          const end = (team === 'light' ? path[path.length - 1] : path[0]) ?? { x: 0, y: 0 };
          return Math.hypot((transform?.x ?? 0) - end.x, (transform?.y ?? 0) - end.y);
        }),
      ),
    ),
  );
  const warnings = logger.records.filter(({ severityText }) => severityText !== 'INFO');
  return { mobs: mobs.length, farthest, offGroundShare: offGround / samples, warnings };
};

describe('Simulation with lane flow fields (architecture 10 §9, minion plan M4)', () => {
  it('routes a horde around a block across its lane to the enemy end', () => {
    const { mobs, farthest, offGroundShare, warnings } = march(BLOCKED_LANE_MAP, 1, 60 * 30);

    expect(mobs).toBe(2 * 16);
    expect(farthest).toBeLessThan(15);
    // Without collision a mob can still clip a corner; without the field half the march is in it.
    expect(offGroundShare).toBeLessThan(0.1);
    expect(warnings).toEqual([]);
  });

  it.each([3, 5])(
    'brings every opening horde to its enemy end with no stuck mob: %i lanes',
    (numLanes) => {
      const map = new MapGenerator().generate(createDefaultGameConfig({ map: { numLanes } }), 1);
      // The longest lane is about 1.5 km; light minions march it in under 500 s.
      const { mobs, farthest, offGroundShare, warnings } = march(map, numLanes, 530 * 30);

      expect(mobs).toBe(2 * numLanes * 16);
      expect(farthest).toBeLessThan(15);
      expect(offGroundShare).toBeLessThan(0.01);
      expect(warnings).toEqual([]);
    },
    60_000,
  );

  it('gives the same hash on the generated map for the same seed, tick for tick', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig({ map: { numLanes: 5 } }), 1);
    const first = laneMatch(map, 5).simulation;
    const second = laneMatch(map, 5).simulation;
    for (let checkpoint = 0; checkpoint < 5; checkpoint += 1) {
      run(first, 300);
      run(second, 300);
      expect(first.hash()).toBe(second.hash());
    }
  });
});
