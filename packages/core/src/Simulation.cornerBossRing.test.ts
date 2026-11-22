import { describe, expect, it } from 'vitest';

import { countdownTicks } from './config/countdownTicks';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { CORNER_CAMP_RING } from './content/structures/cornerCampRing';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { NullLogger } from './diagnostics/NullLogger';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import { atan2, cos, sin } from './utils/deterministicMath';
import { distance, isPointInPolygon } from './utils/geometry';
import type { Vec2 } from './utils/geometry.types';

/** Room kept around the intruder, in metres: a Legend's body with a margin. */
const LEGEND_ROOM = 1.5;
const NOWHERE = { x: Number.NaN, y: Number.NaN };

/**
 * The corner boss on a generated map, where the camp's own objects push its post away from the
 * camp (PR #91 B6): it must still see an intruder anywhere inside its ring.
 */
describe('Simulation corner boss on a generated map', () => {
  it("leaves its post for an enemy Legend inside the ring on the side opposite the boss's post", () => {
    const seed = 1;
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, seed);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const simulation = new Simulation({
      config,
      seed,
      logger: new NullLogger(),
      map,
      mapObjects,
      debug: TEST_DEBUG_CONFIG,
    });
    const countdown = countdownTicks(config.match.countdownSeconds, config.tickRate);
    for (let tick = 0; tick <= countdown; tick += 1) {
      simulation.step();
    }
    const bossNear = (home: Vec2) =>
      simulation
        .snapshot()
        .entities.filter(({ definitionId }) => definitionId === 'corner-boss')
        .map(({ transform }) => transform ?? NOWHERE)
        .find((at) => distance(at, home) <= CORNER_CAMP_RING.radius);
    // A spot just inside the ring, straight across the camp from the post, clear of every
    // blocking object with room for a Legend's body; the first camp that has one.
    const blocking = mapObjects.filter(({ isBlocking }) => isBlocking).flatMap((o) => o.footprints);
    const isClear = (point: Vec2) =>
      Array.from({ length: 9 }, (_, i) => ({
        x: point.x + (i === 0 ? 0 : LEGEND_ROOM * cos((i * Math.PI) / 4)),
        y: point.y + (i === 0 ? 0 : LEGEND_ROOM * sin((i * Math.PI) / 4)),
      })).every((p) => !blocking.some((polygon) => isPointInPolygon(p, polygon)));
    const camps = map.features
      .filter(({ kind }) => kind === 'corner-camp')
      .map(({ position: home }) => {
        const post = bossNear(home) ?? NOWHERE;
        const across = atan2(home.y - post.y, home.x - post.x);
        const reach = CORNER_CAMP_RING.radius - LEGEND_ROOM;
        const at = { x: home.x + reach * cos(across), y: home.y + reach * sin(across) };
        return { home, post, intruder: isClear(at) ? at : null };
      });
    const camp = camps.find(({ intruder }) => intruder !== null);
    expect(camp).toBeDefined();
    const { home, post, intruder } = camp ?? { home: NOWHERE, post: NOWHERE, intruder: NOWHERE };
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'light',
      at: intruder ?? NOWHERE,
      count: 1,
    });
    simulation.step();
    const legend = simulation.snapshot().entities.find(({ family }) => family === 'legend');
    const at = legend?.transform ?? NOWHERE;
    // The case B6 is about: the camp's objects push the post out, so the intruder is inside the
    // ring yet further from the post than the ring's far side is from the camp's edge.
    const campEdge = STRUCTURE_DEFINITIONS.get('corner-camp').footprintRadius;
    expect(distance(at, home)).toBeLessThan(CORNER_CAMP_RING.radius);
    expect(distance(at, post)).toBeGreaterThan(
      CORNER_CAMP_RING.radius + campEdge + CORNER_CAMP_RING.postGap,
    );

    let farthest = 0;
    for (let tick = 0; tick < 5 * config.tickRate; tick += 1) {
      simulation.step();
      farthest = Math.max(farthest, distance(bossNear(home) ?? post, post));
    }

    expect(farthest).toBeGreaterThan(1);
  });
});
