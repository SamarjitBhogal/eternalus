import { describe, expect, it } from 'vitest';

import { countdownTicks } from './config/countdownTicks';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { GUARD_PLANS } from './content/structures/guardPlans';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { MapGenerator } from './map/MapGenerator';
import { Simulation } from './Simulation';
import { isPointInAnyPolygon } from './utils/geometry';
import { run } from './__fixtures__/hordeMatches';

// A one-second countdown keeps the run short; the boss's delay counts from its end.
const CONFIG = createDefaultGameConfig({ match: { countdownSeconds: 1 } });

describe('Simulation capture point bosses', () => {
  it.each([1, 2])(
    'puts one boss in each outer capture point once its delay has passed, none in the Cathedral (seed %i)',
    (seed) => {
      const logger = new MemoryLogger();
      const simulation = new Simulation({
        config: CONFIG,
        seed,
        logger,
        debug: TEST_DEBUG_CONFIG,
        map: new MapGenerator().generate(CONFIG, seed),
      });
      const { activation } = GUARD_PLANS['capture-point'] ?? {};
      const delay = activation?.at === 'countdown-end' ? activation.delaySeconds : 0;
      const firstTick =
        countdownTicks(CONFIG.match.countdownSeconds, CONFIG.tickRate) +
        Math.round(delay * CONFIG.tickRate);
      const bosses = () =>
        simulation
          .snapshot()
          .entities.filter(({ definitionId }) => definitionId === 'capture-point-boss');

      run(simulation, firstTick - 1);
      expect(delay).toBeGreaterThan(0);
      expect(bosses()).toEqual([]);

      run(simulation, 2);
      const zones = simulation.snapshot().entities.filter(({ kind }) => kind === 'capture-point');
      const living = bosses();
      // Each zone (the Cathedral too): how many neutral bosses stand on its floor.
      const census = zones.map(({ definitionId, area }) => ({
        definitionId,
        bosses: living.filter(
          ({ team, transform }) =>
            team === 'neutral' &&
            area !== null &&
            isPointInAnyPolygon({ x: transform?.x ?? 0, y: transform?.y ?? 0 }, area),
        ).length,
      }));

      expect(census.filter(({ definitionId }) => definitionId === 'capture-point')).toHaveLength(
        CONFIG.map.numLanes - 1,
      );
      expect(census).toEqual(
        zones.map(({ definitionId }) => ({
          definitionId,
          bosses: definitionId === 'capture-point' ? 1 : 0,
        })),
      );
      expect(living).toHaveLength(CONFIG.map.numLanes - 1);
      // TEST_DEBUG_CONFIG throws on any invariant violation; nothing else may warn either.
      expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
    },
  );
});
