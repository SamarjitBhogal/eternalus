import { describe, expect, it } from 'vitest';

import { MARCHING_ONLY } from './__fixtures__/hordeMatches';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { countdownTicks } from './config/countdownTicks';
import { NullLogger } from './diagnostics/NullLogger';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import { LaneRoutes } from './state/LaneRoutes';

describe('Simulation lane routes through lane tower courts (DEC-315)', () => {
  it.each([
    // The steepest lane at a tower (about 37 degrees), where a route by the south doorway is shorter.
    ['light-buff-tower-lane-0-0', 'lane-0'],
    ['light-spawner-tower-lane-1-0', 'lane-1'],
  ])(
    // A horde holds in front of a standing enemy tower (18 §6.2), so it marches through its own.
    'marches a light horde through the court of its own %s, in by its west doorway and out by its east',
    (towerId, lane) => {
      const config = createDefaultGameConfig();
      const map = new MapGenerator().generate(config, 1);
      const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
      const simulation = new Simulation({
        config,
        seed: 1,
        logger: new NullLogger(),
        map,
        mapObjects,
        content: MARCHING_ONLY,
      });
      const tower = map.features.find(({ id }) => id === towerId);
      const points = mapObjects
        .filter((object) => object.id === towerId || object.partOf === towerId)
        .flatMap(({ footprints }) => footprints.flat());
      const left = Math.min(...points.map(({ x }) => x));
      const right = Math.max(...points.map(({ x }) => x));
      const top = Math.min(...points.map(({ y }) => y));
      const bottom = Math.max(...points.map(({ y }) => y));
      const centre = { x: (left + right) / 2, y: (top + bottom) / 2 };
      const isInside = ({ x, y }: { x: number; y: number }): boolean =>
        x > left && x < right && y > top && y < bottom;
      // The side of the fort a point just inside or outside its box is nearest to.
      const sideOf = ({ x, y }: { x: number; y: number }): string => {
        const dx = (x - centre.x) / (right - left);
        const dy = (y - centre.y) / (bottom - top);
        if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'west' : 'east';
        return dy < 0 ? 'north' : 'south';
      };
      for (let tick = 0; tick < countdownTicks(config.match.countdownSeconds, config.tickRate);) {
        simulation.step();
        tick += 1;
      }
      const routes = new LaneRoutes(map);
      const at = routes.distanceAlong(lane, 'light', tower?.position ?? { x: 0, y: 0 });
      const members = new Set<string>();
      simulation.on('horde-spawned', ({ memberIds, team }) => {
        if (team === 'light' && members.size === 0) for (const id of memberIds) members.add(id);
      });
      simulation.enqueueCommand({
        type: 'dev-spawn-mobs',
        team: 'light',
        definitionId: 'light-minion',
        count: config.match.hordeSizes.light,
        origin: { kind: 'lane', lane, t: (at - 40) / routes.length(lane) },
      });
      const last = new Map<string, { x: number; y: number }>();
      const crossings = new Map<string, string[]>();
      for (let tick = 0; tick < 60 * config.tickRate; tick += 1) {
        simulation.step();
        for (const { id, transform } of simulation.snapshot().entities) {
          if (!members.has(id) || transform === null) continue;
          const now = { x: transform.x, y: transform.y };
          const before = last.get(id);
          if (before !== undefined && isInside(now) !== isInside(before)) {
            const side = sideOf(isInside(now) ? now : before);
            crossings.set(id, [
              ...(crossings.get(id) ?? []),
              `${isInside(now) ? 'in' : 'out'} ${side}`,
            ]);
          }
          last.set(id, now);
        }
      }

      expect(tower).toBeDefined();
      expect(members.size).toBe(config.match.hordeSizes.light);
      expect([...crossings.values()]).toEqual([...members].map(() => ['in west', 'out east']));
    },
  );
});
