import { describe, expect, it } from 'vitest';

import { countdownTicks } from './config/countdownTicks';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { GUARD_PLANS } from './content/structures/guardPlans';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import { findUnitAt } from './state/findUnitAt';
import { isPointInAnyPolygon } from './utils/geometry';
import { run } from './__fixtures__/hordeMatches';

// A one-second countdown and a two-second boss delay (from the countdown's end) keep the run short;
// the shipped plan's other terms (the boss and its support mobs) are kept.
const CONFIG = createDefaultGameConfig({ match: { countdownSeconds: 1 } });
const SHIPPED_PLAN = GUARD_PLANS['capture-point'];
const DELAY_SECONDS = 2;
const PLANS = {
  ...GUARD_PLANS,
  ...(SHIPPED_PLAN === undefined
    ? {}
    : {
        'capture-point': {
          ...SHIPPED_PLAN,
          activation: { at: 'countdown-end', delaySeconds: DELAY_SECONDS },
        },
      }),
} as const satisfies typeof GUARD_PLANS;

/** Each mob id in the shipped capture point plan and how many of it one zone keeps. */
const ZONE_TABLE = Object.fromEntries(
  (SHIPPED_PLAN?.table ?? []).map(({ mobId, count }) => [mobId, count]),
);

describe('Simulation capture point bosses', () => {
  it('erupts at the configured mid-game, clears the Cathedral and locks capture around the Eternal', () => {
    const config = createDefaultGameConfig({
      match: { countdownSeconds: 1, plannedMatchSeconds: 4 },
    });
    const map = new MapGenerator().generate(config, 1);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const simulation = new Simulation({
      config,
      seed: 1,
      logger: new MemoryLogger(),
      map,
      mapObjects,
    });
    const before = simulation.snapshot();
    const gem = before.entities.find(({ kind }) => kind === 'cathedral-gem');
    const area = before.entities.find(
      ({ definitionId }) => definitionId === 'cathedral-capture-point',
    );
    if (gem?.transform == null || area?.transform == null)
      throw new Error('Missing Cathedral setup');
    const spawnDummy = (at: { x: number; y: number }) => {
      simulation.enqueueCommand({
        type: 'dev-spawn',
        team: 'light',
        kind: 'heavy-mob',
        definitionId: 'corner-boss',
        count: 1,
        at,
      });
    };
    spawnDummy(gem.transform);
    spawnDummy({ x: 150, y: 450 });
    simulation.step();
    const dummies = simulation
      .snapshot()
      .entities.filter(
        ({ definitionId, team }) => definitionId === 'corner-boss' && team === 'light',
      );
    expect(dummies).toHaveLength(2);
    const midpoint = before.match.upcoming.find(({ entryId }) => entryId === 'mid-game')?.tick;
    if (midpoint === undefined) throw new Error('Missing midpoint');
    while (simulation.tick < midpoint) simulation.step();
    expect(simulation.snapshot().entities.some(({ kind }) => kind === 'cathedral-gem')).toBe(true);
    const summoned: string[] = [];
    simulation.on('boss-summoned', ({ entityId }) => {
      summoned.push(entityId);
    });
    simulation.step();
    const after = simulation.snapshot();
    const boss = after.entities.find(({ definitionId }) => definitionId === 'cathedral-boss');
    expect(boss).toBeDefined();
    expect(summoned).toEqual([boss?.id]);
    expect(after.entities.some(({ id }) => id === gem.id || id === dummies[0]?.id)).toBe(false);
    expect(after.entities.some(({ id }) => id === dummies[1]?.id)).toBe(true);
    expect(after.entities.find(({ id }) => id === area.id)?.capture?.lockedBy).toBe(boss?.id);
    expect(
      after.mapObjects?.find(({ id }) => id === 'cathedral-interior-gem-plinth')?.isDestroyed,
    ).toBe(true);
    const spawn = boss?.transform;
    if (spawn == null) throw new Error('Missing boss position');
    run(simulation, 2 * config.tickRate);
    const roamingBoss = simulation.snapshot().entities.find(({ id }) => id === boss?.id);
    expect(roamingBoss?.transform).not.toMatchObject({ x: spawn.x, y: spawn.y });
  });
  it('does not spawn a Cathedral boss in a Duel, even after its activation or a dev command', () => {
    const seed = 1;
    const cathedral = GUARD_PLANS['cathedral-capture-point'];
    if (cathedral === undefined) throw new Error('missing Cathedral boss plan');
    const simulation = new Simulation({
      config: CONFIG,
      seed,
      logger: new MemoryLogger(),
      map: new MapGenerator().generate(CONFIG, seed),
      duel: { killTarget: 3 },
      guardPlans: {
        ...PLANS,
        'cathedral-capture-point': {
          ...cathedral,
          activation: { at: 'countdown-end', delaySeconds: DELAY_SECONDS },
        },
      },
    });
    simulation.enqueueCommand({ type: 'dev-spawn-boss', definitionId: 'cathedral-boss' });
    run(simulation, CONFIG.tickRate * 4);
    expect(
      simulation.snapshot().entities.some(({ definitionId }) => definitionId === 'cathedral-boss'),
    ).toBe(false);
  });

  it('brings forward the Cathedral boss once and replays the same state', () => {
    const seed = 1;
    const map = new MapGenerator().generate(CONFIG, seed);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const cathedral = GUARD_PLANS['cathedral-capture-point'];
    if (cathedral === undefined) throw new Error('missing Cathedral boss plan');
    const guardPlans = {
      ...PLANS,
      'cathedral-capture-point': {
        ...cathedral,
        activation: { at: 'countdown-end', delaySeconds: DELAY_SECONDS },
      },
    } as const satisfies typeof GUARD_PLANS;
    const create = () =>
      new Simulation({
        config: CONFIG,
        seed,
        logger: new MemoryLogger(),
        map,
        mapObjects,
        guardPlans,
      });
    const first = create();
    const replay = create();
    for (const simulation of [first, replay]) {
      const bosses = () =>
        simulation
          .snapshot()
          .entities.filter(({ definitionId }) => definitionId === 'cathedral-boss');
      expect(bosses()).toHaveLength(0);
      simulation.enqueueCommand({ type: 'dev-spawn-boss', definitionId: 'cathedral-boss' });
      simulation.step();
      expect(bosses()).toHaveLength(1);
      const zone = simulation
        .snapshot()
        .entities.find(({ definitionId }) => definitionId === 'cathedral-capture-point');
      const body = bosses()[0]?.transform;
      expect(zone?.area).toBeDefined();
      expect(body).toBeDefined();
      if (body == null || zone?.area == null) throw new Error('missing Cathedral or boss position');
      expect(isPointInAnyPolygon(body, zone.area)).toBe(true);
      expect(bosses()[0]?.team).toBe('neutral');
      const snapshot = simulation.snapshot();
      const actor = snapshot.entities.find(({ team }) => team === 'light');
      if (actor === undefined) throw new Error('missing Light entity for targeting');
      expect(findUnitAt(snapshot.entities, actor.id, { x: body.x + 18, y: body.y - 5 })).toBe(
        bosses()[0]?.id,
      );
      expect(findUnitAt(snapshot.entities, actor.id, { x: body.x + 23, y: body.y + 15 })).not.toBe(
        bosses()[0]?.id,
      );
      simulation.enqueueCommand({ type: 'dev-spawn-boss', definitionId: 'cathedral-boss' });
      simulation.step();
      expect(bosses()).toHaveLength(1);
      run(simulation, CONFIG.tickRate * 4);
      expect(bosses()).toHaveLength(1);
    }
    expect(first.snapshot()).toEqual(replay.snapshot());
    const scheduled = create();
    run(scheduled, CONFIG.tickRate * 4);
    expect(
      scheduled.snapshot().entities.filter(({ definitionId }) => definitionId === 'cathedral-boss'),
    ).toHaveLength(1);
  });

  it.each([1, 2])(
    'puts one boss and its support mobs in each outer capture point once its delay has passed, off the keep and scenery, none in the Cathedral (seed %i)',
    (seed) => {
      const logger = new MemoryLogger();
      const map = new MapGenerator().generate(CONFIG, seed);
      // The real objects (each fort's keep, walls, trees, rocks), so a post inside one shows.
      const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
      const solids = mapObjects.filter(({ isBlocking }) => isBlocking).flatMap((o) => o.footprints);
      const simulation = new Simulation({
        config: CONFIG,
        seed,
        logger,
        debug: TEST_DEBUG_CONFIG,
        map,
        mapObjects,
        guardPlans: PLANS,
      });
      const firstTick =
        countdownTicks(CONFIG.match.countdownSeconds, CONFIG.tickRate) +
        DELAY_SECONDS * CONFIG.tickRate;
      const at = (transform: { x: number; y: number } | null | undefined) => ({
        x: transform?.x ?? 0,
        y: transform?.y ?? 0,
      });
      // Tower guards share the support mobs' ids, so only mobs on a capture point floor count.
      const zoneMobs = () => {
        const { entities } = simulation.snapshot();
        const floors = entities.flatMap(({ kind, area }) =>
          kind === 'capture-point' && area !== null ? [area] : [],
        );
        return entities.filter(
          ({ definitionId, transform }) =>
            ZONE_TABLE[definitionId] !== undefined &&
            floors.some((area) => isPointInAnyPolygon(at(transform), area)),
        );
      };

      run(simulation, firstTick - 1);
      expect(zoneMobs()).toEqual([]);

      run(simulation, 2);
      const zones = simulation.snapshot().entities.filter(({ kind }) => kind === 'capture-point');
      const living = zoneMobs();
      // Each zone (the Cathedral too): how many neutral mobs of each id stand on its floor.
      const census = zones.map(({ definitionId, area }) => ({
        definitionId,
        mobs: Object.fromEntries(
          Object.keys(ZONE_TABLE).map((mobId) => [
            mobId,
            living.filter(
              ({ definitionId: id, team, transform }) =>
                id === mobId &&
                team === 'neutral' &&
                area !== null &&
                isPointInAnyPolygon(at(transform), area),
            ).length,
          ]),
        ),
      }));
      const outer = CONFIG.map.numLanes - 1;
      const perZone = Object.values(ZONE_TABLE).reduce((sum, count) => sum + count, 0);

      expect(ZONE_TABLE['capture-point-boss']).toBe(1);
      expect(perZone).toBeGreaterThan(1);
      expect(census.filter(({ definitionId }) => definitionId === 'capture-point')).toHaveLength(
        outer,
      );
      expect(census).toEqual(
        zones.map(({ definitionId }) => ({
          definitionId,
          mobs: Object.fromEntries(
            Object.entries(ZONE_TABLE).map(([mobId, count]) => [
              mobId,
              definitionId === 'capture-point' ? count : 0,
            ]),
          ),
        })),
      );
      expect(living).toHaveLength(outer * perZone);
      expect(living.filter(({ transform }) => isPointInAnyPolygon(at(transform), solids))).toEqual(
        [],
      );
      // TEST_DEBUG_CONFIG throws on any invariant violation; nothing else may warn either.
      expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
    },
  );
});
