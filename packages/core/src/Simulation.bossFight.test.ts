import { describe, expect, it } from 'vitest';

import { countdownTicks } from './config/countdownTicks';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { GUARD_PLANS } from './content/structures/guardPlans';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { MapGenerator } from './map/MapGenerator';
import { Simulation } from './Simulation';
import type { EntitySnapshot } from './state/Snapshot.types';
import { run } from './__fixtures__/hordeMatches';

// A one-second countdown and a two-second boss delay keep the run short. The shipped plan keeps
// only its boss row, so the support mobs do not join the fight; every other term is the shipped one.
const CONFIG = createDefaultGameConfig({ match: { countdownSeconds: 1 } });
const SHIPPED_PLAN = GUARD_PLANS['capture-point'];
if (SHIPPED_PLAN === undefined) throw new Error('no capture-point plan');
const BOSS_ROW = SHIPPED_PLAN.table.filter(({ mobId }) => mobId === 'capture-point-boss');
const PLANS = {
  ...GUARD_PLANS,
  'capture-point': {
    ...SHIPPED_PLAN,
    table: BOSS_ROW,
    activation: { at: 'countdown-end', delaySeconds: 2 },
  },
} as const satisfies typeof GUARD_PLANS;
const FIRST_TICK = countdownTicks(1, CONFIG.tickRate) + 2 * CONFIG.tickRate;
const SECOND = CONFIG.tickRate;
const { leashRadius, leashTolerance } = SHIPPED_PLAN;

type Point = { readonly x: number; readonly y: number };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const at = ({ transform }: EntitySnapshot): Point => ({
  x: transform?.x ?? Number.NaN,
  y: transform?.y ?? Number.NaN,
});

/** A match whose first outer capture point has its boss: the boss, its zone and helpers. */
const setUp = () => {
  const logger = new MemoryLogger();
  const simulation = new Simulation({
    config: CONFIG,
    seed: 1,
    logger,
    debug: TEST_DEBUG_CONFIG,
    map: new MapGenerator().generate(CONFIG, 1),
    guardPlans: PLANS,
  });
  const spawned: string[] = [];
  simulation.on('entity-spawned', ({ entityId }) => spawned.push(entityId));
  run(simulation, FIRST_TICK + 1);
  const entity = (id: string) => simulation.snapshot().entities.find((e) => e.id === id);
  const boss = simulation.snapshot().entities.find((e) => e.definitionId === 'capture-point-boss');
  if (boss === undefined) throw new Error('no boss');
  const zone = simulation
    .snapshot()
    .entities.filter(({ definitionId }) => definitionId === 'capture-point')
    .sort((a, b) => distance(at(a), at(boss)) - distance(at(b), at(boss)))[0];
  if (zone === undefined) throw new Error('no zone');
  const centre = at(zone);
  /** Spawns light warriors at `points` (applied next tick) and returns their ids. */
  const warriors = (points: readonly Point[]): string[] => {
    const before = spawned.length;
    for (const point of points) {
      simulation.enqueueCommand({
        type: 'dev-spawn',
        kind: 'warrior',
        definitionId: 'warrior',
        team: 'light',
        at: point,
        count: 1,
      });
    }
    run(simulation, 1);
    return spawned.slice(before);
  };
  /** The point `metres` from the zone centre, through the boss's post. */
  const outward = (metres: number): Point => {
    const post = at(boss);
    const length = distance(post, centre);
    return {
      x: centre.x + ((post.x - centre.x) / length) * metres,
      y: centre.y + ((post.y - centre.y) / length) * metres,
    };
  };
  return {
    simulation,
    logger,
    entity,
    bossId: boss.id,
    zoneId: zone.id,
    centre,
    warriors,
    outward,
  };
};

describe('Simulation capture point boss fight', () => {
  it('goes for an enemy Legend inside its court and hits it', () => {
    const { simulation, entity, bossId, warriors, outward } = setUp();
    const [warriorId = ''] = warriors([outward(5)]);
    const start = entity(bossId);
    const warrior = entity(warriorId);
    if (start === undefined || warrior === undefined) throw new Error('missing');

    let lowest = warrior.health?.max ?? 0;
    let closest = distance(at(start), at(warrior));
    for (let second = 0; second < 15; second += 1) {
      run(simulation, SECOND);
      const boss = entity(bossId);
      // A warrior the boss killed is gone from the snapshot: health 0.
      lowest = Math.min(lowest, entity(warriorId)?.health?.current ?? 0);
      closest = Math.min(closest, boss === undefined ? closest : distance(at(boss), at(warrior)));
    }

    expect(closest).toBeLessThan(5);
    expect(lowest).toBeLessThan(warrior.health?.max ?? 0);
  });

  it('chases an enemy Legend that runs out of the court only as far as its leash', () => {
    const { simulation, entity, bossId, centre, warriors, outward } = setUp();
    const [warriorId = ''] = warriors([outward(leashRadius - 5)]);
    const away = outward(1);
    // The warrior (6 m/s, faster than the boss) runs straight out of the court and keeps going.
    simulation.enqueueCommand({
      type: 'move',
      actorId: warriorId,
      direction: { x: away.x - centre.x, y: away.y - centre.y },
    });
    let farthest = 0;

    for (let tick = 0; tick < 15 * SECOND; tick += 1) {
      run(simulation, 1);
      const boss = entity(bossId);
      farthest = Math.max(farthest, boss === undefined ? 0 : distance(at(boss), centre));
    }

    const warrior = entity(warriorId);
    expect(warrior === undefined ? 0 : distance(at(warrior), centre)).toBeGreaterThan(
      leashRadius + leashTolerance,
    );
    // It went past its post toward the leash's edge, and no farther than the leash allows.
    expect(farthest).toBeGreaterThan(SHIPPED_PLAN.postGap);
    expect(farthest).toBeLessThanOrEqual(leashRadius + leashTolerance);
  });

  it('locks its zone while it lives; after a real kill it never respawns and the zone can be captured', () => {
    const { simulation, logger, entity, bossId, zoneId, warriors, outward } = setUp();
    const deaths: { entityId: string; attackerId: string | null }[] = [];
    simulation.on('entity-died', ({ entityId, killer }) =>
      deaths.push({ entityId, attackerId: killer.attackerId }),
    );
    /** Sends up to four more warriors at the boss (the unit cap may refuse some). */
    const reinforce = () => {
      for (const actorId of warriors([20, 21, 22, 23].map(outward))) {
        simulation.enqueueCommand({ type: 'attack-target', actorId, targetId: bossId });
      }
      run(simulation, SECOND);
    };
    reinforce();
    // Warriors stand in the court, but the living boss holds the zone neutral.
    expect(entity(zoneId)?.capture?.lockedBy).toBe(bossId);
    expect(entity(zoneId)?.capture?.progress).toBe(0);

    for (let second = 0; second < 120 && entity(bossId) !== undefined; second += 1) {
      reinforce();
    }
    // Keep a few warriors standing in the court so they can capture it.
    reinforce();

    const bossDeath = deaths.find(({ entityId }) => entityId === bossId);
    expect(bossDeath?.attackerId ?? null).not.toBeNull();
    expect(entity(zoneId)?.capture?.lockedBy).toBeNull();
    // Past any guard respawn time (120 s): no boss comes back.
    run(simulation, 130 * SECOND);
    const bosses = simulation
      .snapshot()
      .entities.filter(({ definitionId }) => definitionId === 'capture-point-boss');
    expect(bosses.every(({ id }) => id !== bossId)).toBe(true);
    // Every other outer capture point keeps its boss.
    const outerZones = simulation
      .snapshot()
      .entities.filter(({ definitionId }) => definitionId === 'capture-point');
    expect(bosses).toHaveLength(outerZones.length - 1);
    expect(entity(zoneId)?.capture?.owner).toBe('light');
    expect(logger.records.filter(({ severityText }) => severityText === 'ERROR')).toEqual([]);
  }, 120_000); // a real 8,200 HP kill in a full match takes about 20 s of test time
});
