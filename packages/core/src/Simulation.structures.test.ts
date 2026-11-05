import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { ContentCatalogue } from './content/ContentCatalogue';
import { GUARD_PLANS } from './content/structures/guardPlans';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import type { StructureDefinition } from './content/structures/structures.types';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { MapGenerator } from './map/MapGenerator';
import { Simulation } from './Simulation';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';
import { isMinion, match, run, STRONGHOLDS_ONLY } from './__fixtures__/hordeMatches';

describe('Simulation structures', () => {
  it('fills the generated map’s forest camps when the countdown ends (18 §7.1)', () => {
    const config = createDefaultGameConfig({ match: { countdownSeconds: 1 } });
    const map = new MapGenerator().generate(config, 1);
    const logger = new MemoryLogger();
    const simulation = new Simulation({ config, seed: 1, logger, debug: TEST_DEBUG_CONFIG, map });
    const campMobs = () =>
      simulation
        .snapshot()
        .entities.filter(({ definitionId }) => definitionId.endsWith('-camp-mob'));

    run(simulation, config.tickRate);
    expect(campMobs()).toEqual([]);

    run(simulation, 2);
    const smallestCamp = Math.min(
      ...Object.entries(GUARD_PLANS)
        .filter(([id]) => id.startsWith('forest-camp-'))
        .map(([, { table }]) => table.reduce((sum, { count }) => sum + count, 0)),
    );
    expect(campMobs().length).toBeGreaterThanOrEqual(2 * config.map.campsPerSide * smallestCamp);
    expect(campMobs().every(({ team }) => team === 'neutral')).toBe(true);
    expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
  });

  it('sends tower guards after an enemy that walks in, then back to their posts (18 §7)', () => {
    const { simulation, logger } = match(STRONGHOLDS_ONLY);
    simulation.step();
    const guardsOf = (team: string) =>
      simulation
        .snapshot()
        .entities.filter(
          ({ definitionId, team: owner }) => definitionId.endsWith('-guard') && owner === team,
        );
    const posts = new Map(guardsOf('light').map(({ id, transform }) => [id, transform]));
    // A dark minion appears just outside the light Stronghold's guard ring (radius 40, posts at 42),
    // beside its on-map post at (52, 30); the map is 60 tall, so a post above it moves on the map.
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'light-mob',
      definitionId: 'training-dummy',
      team: 'dark',
      at: { x: 10 + 47, y: 30 },
      count: 1,
    });
    run(simulation, 30);
    const moved = guardsOf('light').filter(({ id, transform }) => {
      const post = posts.get(id);
      return (
        Math.hypot((transform?.x ?? 0) - (post?.x ?? 0), (transform?.y ?? 0) - (post?.y ?? 0)) > 1
      );
    });
    expect(moved.length).toBeGreaterThan(0);

    run(simulation, 30 * 30);

    for (const { id, transform } of guardsOf('light')) {
      const post = posts.get(id);
      expect(
        Math.hypot((transform?.x ?? 0) - (post?.x ?? 0), (transform?.y ?? 0) - (post?.y ?? 0)),
      ).toBeLessThan(3);
    }
    expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
  });

  // One more entity before the first wave shifts every id after it, so the lane-0 leader meets
  // a light guard head-on on the lane's centre line; it must step round it, not stall (10 §9).
  it.each([0, 1])(
    'holds a horde that cannot fight in front of the first enemy tower on its lane, with %i extra entities (18 §6.2)',
    (extra) => {
      const { simulation } = match(TWO_LANE_MAP, 1, true);
      if (extra > 0) {
        simulation.enqueueCommand({
          type: 'dev-spawn',
          kind: 'light-mob',
          definitionId: 'training-dummy',
          team: 'dark',
          at: { x: 100, y: 55 },
          count: extra,
        });
      }

      run(simulation, 60 * 30);

      // Dark's lane-0 SpawnerTower stands at x 140 with radius 14: Light's lane-0 horde gathers
      // in front of x 126, in ranks no deeper than 8.
      const lightLane0 = simulation
        .snapshot()
        .entities.filter((entity) => isMinion(entity) && entity.team === 'light')
        .filter(({ transform }) => (transform?.y ?? 0) < 30)
        .map(({ transform }) => transform?.x ?? 0);
      expect(lightLane0.length).toBeGreaterThan(0);
      expect(Math.max(...lightLane0)).toBeLessThan(126);
      expect(Math.min(...lightLane0)).toBeGreaterThan(126 - 15);
    },
  );

  it('builds every lane structure of the map before anything else spawns', () => {
    const { simulation } = match(TWO_LANE_MAP);

    const structures = simulation
      .snapshot()
      .entities.filter(({ family }) => family === 'structure')
      .map(({ id, kind, team }) => ({ id, kind, team }));

    // Feature id order: buff towers, spawner towers, then strongholds; the cathedral stays map data.
    expect(structures).toEqual([
      { id: 'entity-1', kind: 'buff-tower', team: 'dark' },
      { id: 'entity-2', kind: 'buff-tower', team: 'light' },
      { id: 'entity-3', kind: 'spawner-tower', team: 'dark' },
      { id: 'entity-4', kind: 'spawner-tower', team: 'light' },
      { id: 'entity-5', kind: 'stronghold', team: 'dark' },
      { id: 'entity-6', kind: 'stronghold', team: 'light' },
    ]);
  });

  it('builds the structures from the definitions it is given, not a fixed set (B8)', () => {
    const catalogue = new ContentCatalogue<StructureDefinition>(
      STRUCTURE_DEFINITIONS.all().map((definition) =>
        definition.id === 'stronghold' ? { ...definition, baseHealth: 123 } : definition,
      ),
    );
    const simulation = new Simulation({
      config: createDefaultGameConfig(),
      seed: 1,
      logger: new MemoryLogger(),
      debug: TEST_DEBUG_CONFIG,
      map: TWO_LANE_MAP,
      structures: catalogue,
    });

    const strongholds = simulation.snapshot().entities.filter(({ kind }) => kind === 'stronghold');

    expect(strongholds).toHaveLength(2);
    expect(strongholds.every(({ health }) => health?.max === 123)).toBe(true);
  });
});
