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
