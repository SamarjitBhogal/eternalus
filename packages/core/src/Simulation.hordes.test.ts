import { describe, expect, it } from 'vitest';

import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { MapGenerator } from './map/MapGenerator';
import { Simulation } from './Simulation';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';
import type { MapDefinition } from './content/maps/maps.types';
import { ContentCatalogue } from './content/ContentCatalogue';
import { loadDefaultContent } from './content/loadDefaultContent';
import type { UnitDefinition } from './content/units/units.types';

/** The shipped content with every minion's controller and attack taken away, so hordes only march. */
const MARCHING_ONLY = new ContentCatalogue<UnitDefinition>(
  loadDefaultContent(30)
    .all()
    .map((definition) => {
      if (definition.controller !== 'minion') {
        return definition;
      }
      const { id, kind, displayName, baseHealth, footprintRadius, visionRadius, movement } =
        definition;
      const marcher: UnitDefinition = {
        id,
        kind,
        displayName,
        baseHealth,
        footprintRadius,
        visionRadius,
        movement,
        ...(definition.movementStrategy === undefined
          ? {}
          : { movementStrategy: definition.movementStrategy }),
      };
      return marcher;
    }),
);

/**
 * A match on `map` whose countdown outlasts the test, so only the opening hordes march; with
 * `isMarchingOnly`, minions never fight.
 */
const match = (map: MapDefinition, seed = 1, isMarchingOnly = false) => {
  const logger = new MemoryLogger();
  const simulation = new Simulation({
    config: createDefaultGameConfig({ match: { initialHordesPerTeam: 2, countdownSeconds: 600 } }),
    seed,
    logger,
    debug: TEST_DEBUG_CONFIG,
    map,
    ...(isMarchingOnly ? { content: MARCHING_ONLY } : {}),
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
    const { simulation, logger } = match(TWO_LANE_MAP, 1, true);
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
    const { simulation } = match(TWO_LANE_MAP, 1, true);
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

  it('spawns a developer-menu horde on the named lane, clipped to the unit cap', () => {
    const { simulation } = match(TWO_LANE_MAP);
    const spawned: string[] = [];
    simulation.on('horde-spawned', ({ team, lane, memberIds }) =>
      spawned.push(`${team} ${lane} ${String(memberIds.length)}`),
    );
    simulation.step();
    const cap = createDefaultGameConfig().limits.maxUnitsPerTeam;

    simulation.enqueueCommand({
      type: 'dev-spawn-mobs',
      team: 'light',
      definitionId: 'heavy-minion',
      count: cap,
      origin: { kind: 'lane', lane: 'lane-1', t: 0.5 },
    });
    simulation.step();

    // The two opening hordes hold 32 of the cap; the heavy horde gets the rest.
    expect(spawned.slice(4)).toEqual([`light lane-1 ${String(cap - 32)}`]);
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

  it('fights when opposing hordes meet: kills on both sides, invariants clean (M2b)', () => {
    const { simulation, logger } = match(TWO_LANE_MAP);
    const alive = (team: string) =>
      simulation
        .snapshot()
        .entities.filter((entity) => entity.family === 'mob' && entity.team === team).length;

    run(simulation, 60 * 30);

    // Each team opened with two hordes of 16.
    expect(alive('light')).toBeLessThan(32);
    expect(alive('dark')).toBeLessThan(32);
    expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
  });

  it('fights the same way twice: the same seed gives the same hash, tick for tick (M2b)', () => {
    const hashes = [1, 2].map(() => {
      const { simulation } = match(TWO_LANE_MAP);
      const seen: number[] = [];
      for (let tick = 0; tick < 60 * 30; tick += 100) {
        run(simulation, 100);
        seen.push(simulation.hash());
      }
      return seen;
    });

    expect(hashes[0]).toEqual(hashes[1]);
  });
});
