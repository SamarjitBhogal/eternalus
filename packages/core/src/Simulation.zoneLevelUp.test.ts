import { describe, expect, it } from 'vitest';
import { clearCheckpointDefenders } from './__fixtures__/clearCheckpointDefenders';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { ZONE_LEVEL_UP } from './content/zones/zoneLevelUp';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { MapGenerator } from './map/MapGenerator';
import { Simulation } from './Simulation';
import type { GameEventMap } from './state/GameEvents.types';

// A long countdown, so no wave hordes march through the point: only the test's own.
const CONFIG = createDefaultGameConfig({
  match: { countdownSeconds: 600, plannedMatchSeconds: 3600 },
});
const MAP = new MapGenerator().generate(CONFIG, 1);
const POINT = MAP.features.find(({ kind }) => kind === 'capture-point');
const LANE = POINT?.laneId ?? '';
const TICK_RATE = CONFIG.tickRate;

/**
 * The whole pipeline (CaptureSystem → SpawnSystem → ZoneLevelUpSystem → VeterancySystem): a Light
 * Legend takes an outer capture point, holds it past the hold time, a Light horde spawns on its
 * lane, then two Dark Legends take the point back.
 */
const play = () => {
  const simulation = new Simulation({
    config: CONFIG,
    seed: 1,
    logger: new MemoryLogger(),
    debug: TEST_DEBUG_CONFIG,
    map: MAP,
  });
  // The zone level-up is under test: the checkpoint defenders (M6b) would hold the point.
  clearCheckpointDefenders(simulation);
  const at = POINT?.position ?? { x: 0, y: 0 };
  const grants: (GameEventMap['minion-levels-granted'] & { readonly tick: number })[] = [];
  const owners: (GameEventMap['capture-point-owner-changed'] & { readonly tick: number })[] = [];
  const legends: string[] = [];
  simulation.on('minion-levels-granted', (grant) =>
    grants.push({ ...grant, tick: simulation.tick }),
  );
  simulation.on('capture-point-owner-changed', (change) =>
    owners.push({ ...change, tick: simulation.tick }),
  );
  simulation.on('entity-spawned', ({ entityId, kind }) => {
    if (kind === 'warrior') legends.push(entityId);
  });
  const stepUntil = (isDone: () => boolean, seconds: number) => {
    for (let tick = 0; tick < seconds * TICK_RATE && !isDone(); tick += 1) simulation.step();
  };
  const spawnLegend = (team: 'light' | 'dark') => {
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team,
      at,
      count: 1,
    });
  };

  spawnLegend('light');
  stepUntil(() => owners.some(({ to }) => to === 'light'), 60);
  const taken = owners.find(({ to }) => to === 'light')?.tick ?? 0;
  // Held past the hold time, then a Light horde on the point's lane.
  stepUntil(() => false, ZONE_LEVEL_UP.holdSeconds + 1);
  simulation.enqueueCommand({
    type: 'dev-spawn-mobs',
    team: 'light',
    definitionId: 'light-minion',
    count: 3,
    origin: { kind: 'lane', lane: LANE, t: 0 },
  });
  stepUntil(() => grants.length > 0, 2);
  const lightLegend = legends[0] ?? '';
  simulation.enqueueCommand({ type: 'dev-remove-entity', entityId: lightLegend });
  spawnLegend('dark');
  spawnLegend('dark');
  stepUntil(() => owners.some(({ to }) => to === 'dark'), 120);
  return { simulation, grants, owners, taken };
};

/**
 * One match is shared by both tests, so each plays at most one (a match takes up to ~19 s on the
 * Windows CI runner, against core's 60 s `testTimeout`).
 */
let firstRun: ReturnType<typeof play> | undefined;
const playOnce = () => (firstRun ??= play());

describe('Simulation: zone level-up (07 §7, DEC-258)', () => {
  it("levels the holder's horde on the point's lane and takes it back on the loss tick", () => {
    const first = playOnce();
    const lost = first.owners.find(({ to }) => to === 'dark');
    const given = first.grants.filter(({ levels }) => levels > 0);
    const takenBack = first.grants.filter(({ levels }) => levels < 0);

    expect(first.taken).toBeGreaterThan(0);
    expect(given).toHaveLength(3);
    expect(given.every(({ levels }) => levels === ZONE_LEVEL_UP.levels)).toBe(true);
    expect(given[0]?.tick ?? 0).toBeGreaterThanOrEqual(
      first.taken + ZONE_LEVEL_UP.holdSeconds * TICK_RATE,
    );
    expect(lost).toBeDefined();
    // Every living levelled minion loses it on the tick the point changes owner.
    expect(takenBack.length).toBeGreaterThan(0);
    expect(takenBack.every(({ tick }) => tick === lost?.tick)).toBe(true);
  });

  it('plays the same way every run (same seed and commands, same hash)', () => {
    expect(play().simulation.hash()).toBe(playOnce().simulation.hash());
  });
});
