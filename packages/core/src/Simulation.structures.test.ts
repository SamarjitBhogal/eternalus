import { describe, expect, it } from 'vitest';

import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';
import { isMinion, match, run, STRONGHOLDS_ONLY } from './__fixtures__/hordeMatches';

describe('Simulation structures', () => {
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
    // A dark minion appears just outside the light Stronghold's guard ring (radius 40, posts at 42).
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'light-mob',
      definitionId: 'training-dummy',
      team: 'dark',
      at: { x: 10, y: 30 + 47 },
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

  it('holds a horde that cannot fight in front of the first enemy tower on its lane (18 §6.2)', () => {
    const { simulation } = match(TWO_LANE_MAP, 1, true);

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
  });

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
});
