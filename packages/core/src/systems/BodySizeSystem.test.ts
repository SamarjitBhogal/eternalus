import { describe, expect, it } from 'vitest';

import { Deploying } from '../components/Deploying';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import type { MapDefinition, MapPresentation } from '../content/maps/maps.types';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { MapObjectBuilder } from '../map/MapObjectBuilder';
import { staticCollisionIndexOf } from '../map/staticCollisionIndexOf';
import { CollisionResolver } from '../physics/CollisionResolver';
import { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';
import { BodySizeSystem } from './BodySizeSystem';

/**
 * A 100 x 100 map with one house wall from x = 5 to x = 7, y = 1 to y = 9, and a second wall from
 * x = 9.6 to x = 11.6: the gap between them is 2.6 m.
 */
const MAP: MapDefinition = {
  id: 'body-size-test',
  displayName: 'Test',
  width: 100,
  height: 100,
  seed: 1,
  features: [],
  lanes: [],
  terrain: [],
};
const HOUSE: MapPresentation = {
  buildings: [],
  scenery: [
    {
      id: 'house-wall',
      shape: [
        { x: 5, y: 1 },
        { x: 7, y: 1 },
        { x: 7, y: 9 },
        { x: 5, y: 9 },
      ],
      layer: 'detail',
      color: 'stone',
      object: { id: 'house', kind: 'house', isFootprint: true },
    },
    {
      id: 'second-wall',
      shape: [
        { x: 9.6, y: 1 },
        { x: 11.6, y: 1 },
        { x: 11.6, y: 9 },
        { x: 9.6, y: 9 },
      ],
      layer: 'detail',
      color: 'stone',
      object: { id: 'second-house', kind: 'house', isFootprint: true },
    },
  ],
};
const CONFIG = createDefaultGameConfig();
const BERSERK = loadStatusEffects(CONFIG.tickRate, 2).get('berserk');
const FACTORY = new EntityFactory(
  createDefaultEntityRegistry(),
  loadDefaultContent(CONFIG.tickRate),
  undefined,
  loadWeapons(CONFIG.tickRate),
);

/**
 * A Sentinel (radius 1.25, DEC-06) at `at` in a state whose collision rule holds `HOUSE`, or no
 * collision rule (`isWalled` false), and one `BodySizeSystem` pass.
 */
const setUp = (at: Vec2, isWalled = true) => {
  const resolver = new CollisionResolver(
    staticCollisionIndexOf(MAP, new MapObjectBuilder().build(MAP, HOUSE)),
    { x: 0, y: 0, width: MAP.width, height: MAP.height },
  );
  const state = new GameState(CONFIG, 1, null, isWalled ? { collisions: resolver } : {});
  const sentinel = FACTORY.create('sentinel', 'sentinel', { team: 'light', position: at });
  state.entities.add(sentinel);
  const system = new BodySizeSystem();
  const run = (): void => {
    system.update({ state, logger: new NullLogger() });
  };
  return {
    sentinel,
    transform: sentinel.getComponent(Transform),
    statuses: sentinel.getComponent(StatusEffects),
    run,
  };
};

describe('BodySizeSystem', () => {
  it('scales the radius to the `size` stat while a status sets it, and back when it ends', () => {
    const { transform, statuses, run } = setUp({ x: 50, y: 50 }, false);

    run();
    const before = transform.radius;
    statuses.apply(BERSERK, null, 0);
    run();
    const during = transform.radius;
    statuses.remove('berserk');
    run();

    expect(before).toBe(1.25);
    expect(during).toBeCloseTo(1.25 * 1.3, 12);
    expect(transform.radius).toBe(1.25);
    expect(transform.position).toEqual({ x: 50, y: 50 });
  });

  it('pushes a body that grew beside a wall out of it, and leaves it where it is when it shrinks', () => {
    const { transform, statuses, run } = setUp({ x: 3.5, y: 5 }); // 0.25 m clear of the wall

    statuses.apply(BERSERK, null, 0);
    run();
    const grown = { ...transform.position };
    statuses.remove('berserk');
    run();

    expect(grown.x).toBeCloseTo(5 - 1.25 * 1.3, 6); // touching the wall, not in it
    expect(grown.x).toBeLessThan(5 - 1.25 * 1.3);
    expect(grown.y).toBe(5);
    expect(transform.position).toEqual(grown);
  });

  it('keeps a body small where the grown body has no room, and grows it once it has', () => {
    // The 2.6 m gap holds the Sentinel (2.5 m wide), not the Berserk Sentinel (3.25 m wide).
    const { transform, statuses, run } = setUp({ x: 8.3, y: 5 });

    statuses.apply(BERSERK, null, 0);
    run();
    run();
    const inGap = { radius: transform.radius, position: { ...transform.position } };
    transform.moveTo({ x: 8.3, y: 10.5 }); // out of the gap: 1.98 m from each wall corner
    run();

    expect(inGap).toEqual({ radius: 1.25, position: { x: 8.3, y: 5 } });
    expect(transform.radius).toBeCloseTo(1.25 * 1.3, 12);
    expect(transform.position).toEqual({ x: 8.3, y: 10.5 });
  });

  it('leaves a body that did not grow where it is, even one placed inside a wall', () => {
    const { transform, run } = setUp({ x: 4, y: 5 }); // 0.25 m into the wall

    run();

    expect(transform.position).toEqual({ x: 4, y: 5 });
  });

  it('grows a deploying mob in place: it passes the walls of the structure it walks out of', () => {
    const { sentinel, transform, statuses, run } = setUp({ x: 3.5, y: 5 });
    sentinel.addComponent(new Deploying({ x: 20, y: 5 }));

    statuses.apply(BERSERK, null, 0);
    run();

    expect(transform.radius).toBeCloseTo(1.25 * 1.3, 12);
    expect(transform.position).toEqual({ x: 3.5, y: 5 });
  });
});
