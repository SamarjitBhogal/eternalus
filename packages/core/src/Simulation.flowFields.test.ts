import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import type { GameConfig } from './config/GameConfig.types';
import { MAP_FEATURE_DEFINITIONS } from './content/maps/mapFeatureDefinitions';
import type { MapDefinition } from './content/maps/maps.types';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { BLOCKED_LANE_MAP } from './map/__fixtures__/blockedLaneMap';
import { MapGenerator } from './map/MapGenerator';
import { WorldMap } from './map/WorldMap';
import { Simulation } from './Simulation';
import { GameState } from './state/GameState';
import { matchWorldOf } from './state/__fixtures__/matchWorld';
import { spawnMapStructures } from './state/__fixtures__/spawnMapStructures';
import { isMinion, MARCHING_ONLY, run } from './__fixtures__/hordeMatches';

/** The generated map's walkability grid, as the pipeline builds it. */
const gridOf = (map: MapDefinition, config: GameConfig): WorldMap =>
  WorldMap.fromDefinition(
    map,
    config.map.navCellSize,
    (definitionId) => MAP_FEATURE_DEFINITIONS[definitionId]?.isBlocking ?? false,
  );

/**
 * A match with one opening horde per lane and team at tick 0 and the DISC-10 waves from 180 s
 * after the countdown (DEC-87, DEC-127); with `isMarchingOnly`, minions never fight, so every mob is still
 * alive at the end of a march.
 */
const laneMatch = (map: MapDefinition, numLanes: number, isMarchingOnly = false) => {
  const config = createDefaultGameConfig({
    map: { numLanes, campsPerSide: numLanes === 1 ? 0 : 6 },
  });
  const logger = new MemoryLogger();
  const simulation = new Simulation({
    config,
    seed: 1,
    logger,
    map,
    ...(isMarchingOnly ? { content: MARCHING_ONLY } : {}),
  });
  return { config, logger, simulation };
};

/**
 * Runs `ticks` ticks and returns how many opening-horde mobs (those of tick 0) there are and how
 * far the farthest of them ends from its enemy end (later waves are still on their way), and the
 * share of samples (every 10 ticks) that found any mob on unwalkable ground after it first stood
 * on walkable ground.
 */
const march = (map: MapDefinition, numLanes: number, ticks: number) => {
  const { config, logger, simulation } = laneMatch(map, numLanes, true);
  const grid = gridOf(map, config);
  const hasLeft = new Set<string>();
  let samples = 0;
  let offGround = 0;
  let opening: ReadonlySet<string> = new Set();
  for (let tick = 0; tick < ticks; tick += 1) {
    simulation.step();
    if (tick === 0) {
      opening = new Set(simulation.snapshot().entities.map(({ id }) => id));
    }
    if (tick % 10 !== 0) {
      continue;
    }
    for (const { id, definitionId, transform } of simulation.snapshot().entities) {
      const cell = isMinion({ definitionId }) && transform !== null ? grid.cellAt(transform) : null;
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
  const mobs = simulation
    .snapshot()
    .entities.filter((entity) => isMinion(entity) && opening.has(entity.id));
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

/** How close (m) along its lane a mob must come to its objective's gather point to have arrived. */
const ARRIVAL_TOLERANCE = 15;
/** The longest wait (s) after the countdown for the last mob; seed 1's arrive by about 290 s. */
const MARCH_CAP_SECONDS = 330;

/**
 * Marches the opening hordes of a generated map (seed 1) until every one of their mobs has come
 * within `ARRIVAL_TOLERANCE` along its lane of its first enemy objective's gather point (18 §6.2),
 * or `MARCH_CAP_SECONDS` pass, and samples every second how often a mob that has stood on walkable
 * ground is off it. The gather points come from a fixture state with the same map's structures.
 */
const marchToObjectives = (numLanes: number) => {
  const config = createDefaultGameConfig({ map: { numLanes } });
  const map = new MapGenerator().generate(config, 1);
  const lanes = new GameState(config, 1, matchWorldOf(map));
  spawnMapStructures(lanes);
  const routes = lanes.world?.routes;
  if (routes === undefined) {
    throw new Error('the fixture state has no lane routes');
  }
  const logger = new MemoryLogger();
  const simulation = new Simulation({ config, seed: 1, logger, map, content: MARCHING_ONLY });
  simulation.step();
  const goals = new Map<string, { lane: string; team: 'light' | 'dark'; front: number }>();
  for (const { lane, team, memberIds } of simulation.snapshot().hordes) {
    const objective = lanes.laneStructures.objectiveFor(lane, team, lanes.entities);
    if (objective === null) {
      throw new Error(`${team} has no objective on ${lane}`);
    }
    for (const id of memberIds) {
      goals.set(id, { lane, team, front: objective.frontProgress });
    }
  }
  const grid = gridOf(map, config);
  const arrived = new Set<string>();
  const hasLeft = new Set<string>();
  let samples = 0;
  let offGround = 0;
  // The countdown holds every unit (DEC-88): the march starts when it ends.
  const ticks =
    Math.round(config.match.countdownSeconds * config.tickRate) +
    MARCH_CAP_SECONDS * config.tickRate;
  for (let tick = 1; tick < ticks && arrived.size < goals.size; tick += 1) {
    simulation.step();
    if (tick % config.tickRate !== 0) {
      continue;
    }
    for (const { id, definitionId, transform } of simulation.snapshot().entities) {
      const goal = goals.get(id);
      if (goal !== undefined && transform !== null) {
        const along = routes.distanceAlong(goal.lane, goal.team, transform);
        if (along >= goal.front - ARRIVAL_TOLERANCE) {
          arrived.add(id);
        }
      }
      const cell = isMinion({ definitionId }) && transform !== null ? grid.cellAt(transform) : null;
      if (cell === null) {
        continue;
      }
      const isWalkable = grid.isWalkable(cell.col, cell.row);
      if (isWalkable) {
        hasLeft.add(id);
      }
      if (hasLeft.has(id)) {
        samples += 1;
        offGround += isWalkable ? 0 : 1;
      }
    }
  }
  const warnings = logger.records.filter(({ severityText }) => severityText !== 'INFO');
  return {
    hordeSize: config.match.hordeSizes.light,
    mobs: goals.size,
    arrived: arrived.size,
    offGroundShare: offGround / samples,
    warnings,
  };
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

  it("walks hordes spawned at a tower's and the Stronghold's centre out of the footprint (MS-31)", () => {
    const map = new MapGenerator().generate(createDefaultGameConfig({ map: { numLanes: 3 } }), 1);
    const { config, simulation } = laneMatch(map, 3, true);
    const grid = gridOf(map, config);
    const light = (kind: string) =>
      map.features.find((feature) => feature.kind === kind && feature.team === 'light');
    const tower = light('spawner-tower');
    const stronghold = light('stronghold');
    if (tower === undefined || stronghold === undefined) {
      throw new Error('the generated map has no light spawner tower or Stronghold');
    }
    const spawned: string[] = [];
    simulation.on('horde-spawned', ({ memberIds }) => spawned.push(...memberIds));
    simulation.step();
    spawned.length = 0;
    simulation.enqueueCommand({
      type: 'dev-spawn-mobs',
      team: 'light',
      definitionId: 'light-minion',
      count: 16,
      origin: { kind: 'structure', structureId: tower.id },
    });
    simulation.enqueueCommand({
      type: 'dev-spawn-mobs',
      team: 'light',
      definitionId: 'heavy-minion',
      count: 4,
      origin: { kind: 'point', at: stronghold.position },
    });
    const isOnGround = (id: string): boolean => {
      const transform = simulation
        .snapshot()
        .entities.find((entity) => entity.id === id)?.transform;
      const cell = transform === undefined || transform === null ? null : grid.cellAt(transform);
      return cell !== null && grid.isWalkable(cell.col, cell.row);
    };
    simulation.step();
    const atSpawn = spawned.filter(isOnGround);
    run(simulation, 30 * 30);

    expect(spawned).toHaveLength(20);
    expect(atSpawn).toEqual([]);
    expect(spawned.filter((id) => !isOnGround(id))).toEqual([]);
  });

  // Phase 3 sprint 3.1's metric (hordes reach the enemy SpawnerTower with 0 stuck units), read for
  // the first enemy objective: since M2c a horde holds at it, and these cannot attack it. Only the
  // opening hordes march and the loop stops once every mob arrives: the old full 530 s march to
  // the enemy end was too slow for CI under coverage.
  it.each([3, 5])(
    'brings every opening mob to its first enemy objective with none stuck: %i lanes',
    (numLanes) => {
      const { hordeSize, mobs, arrived, offGroundShare, warnings } = marchToObjectives(numLanes);

      expect(mobs).toBe(2 * numLanes * hordeSize);
      expect(arrived).toBe(mobs);
      expect(offGroundShare).toBeLessThan(0.01);
      expect(warnings).toEqual([]);
    },
    120_000,
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
    // A 5-lane soak of 1,500 ticks per run; coverage instrumentation makes it slow (as in M8).
  }, 60_000);
});
