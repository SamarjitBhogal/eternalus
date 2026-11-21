import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { Simulation } from './Simulation';
import { TWO_LANE_MAP } from './state/__fixtures__/twoLaneMap';

/** A match on the two-lane map: in sim mode (no human) unless `withHuman` seats a dark one. */
const newMatch = (withHuman = false): Simulation => {
  const config = createDefaultGameConfig({
    match: { countdownSeconds: 0, ...(withHuman ? { playerTeam: 'dark' as const } : {}) },
  });
  return new Simulation({
    config,
    seed: 1,
    logger: new MemoryLogger(),
    debug: TEST_DEBUG_CONFIG,
    map: TWO_LANE_MAP,
    ...(withHuman
      ? { roster: [{ pilot: 'human', team: 'dark', definitionId: 'warrior', role: 'rover' }] }
      : {}),
  });
};

const legendsOf = (simulation: Simulation, team: string) =>
  simulation
    .snapshot()
    .entities.filter((entity) => entity.kind === 'warrior' && entity.team === team);

describe('Simulation with developer-menu Legends (FR-097)', () => {
  it('adds a Legend at the Stronghold, refuses a Legend past the team cap and removes a bot Legend', () => {
    const simulation = newMatch();
    const rejected: string[] = [];
    const removed: unknown[] = [];
    simulation.on('command-rejected', ({ reason }) => rejected.push(reason));
    simulation.on('entity-removed', (payload) => removed.push(payload));
    const { maxLegendsPerTeam } = createDefaultGameConfig().limits;

    for (let added = 0; added < maxLegendsPerTeam + 1; added += 1) {
      simulation.enqueueCommand({
        type: 'dev-spawn-legend',
        team: 'light',
        definitionId: 'warrior',
      });
    }
    simulation.step();

    const legends = legendsOf(simulation, 'light');
    expect(legends).toHaveLength(maxLegendsPerTeam);
    expect(legends[0]?.transform).toMatchObject({ x: 10, y: 30 });
    expect(rejected).toEqual(['cap-exceeded']);

    const [victim] = legends;
    simulation.enqueueCommand({ type: 'dev-remove-entity', entityId: victim?.id ?? '' });
    simulation.step();

    expect(legendsOf(simulation, 'light')).toHaveLength(maxLegendsPerTeam - 1);
    expect(removed).toEqual([{ entityId: victim?.id, cause: 'dev-removed' }]);
  });

  it('refuses a definition that is not a Legend', () => {
    const simulation = newMatch();
    const rejected: string[] = [];
    simulation.on('command-rejected', ({ reason }) => rejected.push(reason));

    simulation.enqueueCommand({
      type: 'dev-spawn-legend',
      team: 'dark',
      definitionId: 'light-minion',
    });
    simulation.step();

    expect(rejected).toEqual(['not-a-legend']);
    expect(legendsOf(simulation, 'dark')).toHaveLength(0);
  });

  it('plays the added Legend: it leaves the Stronghold, and the same way twice (same hash)', () => {
    const run = (isAdded: boolean) => {
      const simulation = newMatch();
      if (isAdded) {
        simulation.enqueueCommand({
          type: 'dev-spawn-legend',
          team: 'dark',
          definitionId: 'warrior',
        });
      }
      for (let tick = 0; tick < 300; tick += 1) {
        simulation.step();
      }
      return { hash: simulation.hash(), legends: legendsOf(simulation, 'dark') };
    };

    const [first, second, without] = [run(true), run(true), run(false)];

    expect(first.hash).toBe(second.hash);
    expect(first.hash).not.toBe(without.hash);
    expect(first.legends).toHaveLength(1);
    expect(first.legends[0]?.transform?.x).not.toBe(190);
  });

  it("removes a Legend by dev-remove-legend in sim mode, and refuses the human's Legend outside it (DEC-293)", () => {
    const simMode = newMatch();
    simMode.enqueueCommand({ type: 'dev-spawn-legend', team: 'dark', definitionId: 'warrior' });
    simMode.step();
    const [bot] = legendsOf(simMode, 'dark');
    simMode.enqueueCommand({ type: 'dev-remove-legend', entityId: bot?.id ?? '' });
    simMode.step();
    expect(simMode.snapshot().match.humanLegendId).toBeNull();
    expect(legendsOf(simMode, 'dark')).toHaveLength(0);

    const withHuman = newMatch(true);
    const humanId = withHuman.snapshot().match.humanLegendId;
    const rejected: string[] = [];
    withHuman.on('command-rejected', ({ reason }) => rejected.push(reason));
    withHuman.enqueueCommand({ type: 'dev-remove-legend', entityId: humanId ?? '' });
    withHuman.step();
    expect(humanId).not.toBeNull();
    expect(rejected).toEqual(['human-legend']);
    expect(legendsOf(withHuman, 'dark').map(({ id }) => id)).toEqual([humanId]);
    expect(withHuman.snapshot().match.humanLegendId).toBe(humanId);
  });
});
