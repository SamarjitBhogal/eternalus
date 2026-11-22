import { describe, expect, it } from 'vitest';
import { MapObjectBuilder } from '../map/MapObjectBuilder';
import { staticCollisionIndexOf } from '../map/staticCollisionIndexOf';
import { CollisionResolver } from '../physics/CollisionResolver';
import { CollisionSystem } from './CollisionSystem';
import { GameState } from '../state/GameState';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { EntityFactory } from '../entities/EntityFactory';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { NullLogger } from '../diagnostics/NullLogger';
import { Deploying } from '../components/Deploying';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { MAGUS_BOLT } from '../content/projectiles/magusBolt';
import { Projectile } from '../entities/Projectile';
import type { MapDefinition, MapPresentation } from '../content/maps/maps.types';
import { cos, sin } from '../utils/deterministicMath';

export const EMPTY_MAP: MapDefinition = {
  id: 'collision-test',
  displayName: 'Test',
  width: 100,
  height: 100,
  seed: 1,
  features: [],
  lanes: [],
  terrain: [],
};
export const HOUSE_PRESENTATION: MapPresentation = {
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
  ],
};

describe('CollisionSystem', () => {
  it('sweeps the full displacement, keeps the player radius outside walls and clamps bounds', () => {
    const config = createDefaultGameConfig();
    const state = new GameState(config, 1);
    const unit = new EntityFactory(
      createDefaultEntityRegistry(),
      loadDefaultContent(config.tickRate),
      undefined,
      loadWeapons(config.tickRate),
    ).create('warrior', 'warrior', { team: 'light', position: { x: 1, y: 5 } });
    state.entities.add(unit);
    const transform = unit.getComponent(Transform);
    transform.moveBy({ x: 50, y: 0 });
    const collision = new CollisionSystem(
      new CollisionResolver(
        staticCollisionIndexOf(
          EMPTY_MAP,
          new MapObjectBuilder().build(EMPTY_MAP, HOUSE_PRESENTATION),
        ),
        { x: 0, y: 0, width: EMPTY_MAP.width, height: EMPTY_MAP.height },
      ),
    );
    collision.update({ state, logger: new NullLogger() });
    expect(transform.position.x).toBeCloseTo(4.5);
    transform.moveTo({ x: 1, y: 50 });
    transform.moveBy({ x: -100, y: 0 });
    collision.update({ state, logger: new NullLogger() });
    expect(transform.position.x).toBe(0.5);
  });

  it('lets a deploying mover cross a wall that stops the same mover otherwise', () => {
    const config = createDefaultGameConfig();
    const factory = new EntityFactory(
      createDefaultEntityRegistry(),
      loadDefaultContent(config.tickRate),
      undefined,
      loadWeapons(config.tickRate),
    );
    const collision = new CollisionSystem(
      new CollisionResolver(
        staticCollisionIndexOf(
          EMPTY_MAP,
          new MapObjectBuilder().build(EMPTY_MAP, HOUSE_PRESENTATION),
        ),
        { x: 0, y: 0, width: EMPTY_MAP.width, height: EMPTY_MAP.height },
      ),
    );
    const walk = (isDeploying: boolean): number => {
      const state = new GameState(config, 1);
      const unit = factory.create('warrior', 'warrior', {
        team: 'light',
        position: { x: 1, y: 5 },
      });
      if (isDeploying) {
        unit.addComponent(new Deploying({ x: 20, y: 5 }));
      }
      state.entities.add(unit);
      const transform = unit.getComponent(Transform);
      transform.moveBy({ x: 20, y: 0 });
      collision.update({ state, logger: new NullLogger() });
      return transform.position.x;
    };

    expect(walk(false)).toBeCloseTo(4.5);
    expect(walk(true)).toBeCloseTo(21);
  });

  it('leaves a projectile where its move put it, a wall does not slide or stop it', () => {
    const config = createDefaultGameConfig();
    const state = new GameState(config, 1);
    const bolt = new Projectile('shot-1', 'magus-bolt');
    bolt.spawn({ definition: MAGUS_BOLT, position: { x: 1, y: 5 }, team: 'light' });
    state.entities.add(bolt);
    const transform = bolt.getComponent(Transform);
    transform.moveBy({ x: 50, y: 0 });
    new CollisionSystem(
      new CollisionResolver(
        staticCollisionIndexOf(
          EMPTY_MAP,
          new MapObjectBuilder().build(EMPTY_MAP, HOUSE_PRESENTATION),
        ),
        { x: 0, y: 0, width: EMPTY_MAP.width, height: EMPTY_MAP.height },
      ),
    ).update({ state, logger: new NullLogger() });

    expect(transform.position.x).toBe(51);
  });

  describe('a unit with momentum (Wrecking Run, DEC-307)', () => {
    /**
     * Runs `kind` from `start` toward the house wall at x = 5 for `ticks` ticks, as the movement and
     * collision systems do, and returns its movement and transform.
     */
    const run = (
      kind: 'sentinel' | 'warrior',
      heading: { x: number; y: number },
      ticks: number,
      start = { x: 1, y: 5 },
    ) => {
      const config = createDefaultGameConfig();
      const state = new GameState(config, 1);
      const unit = new EntityFactory(
        createDefaultEntityRegistry(),
        loadDefaultContent(config.tickRate),
        undefined,
        loadWeapons(config.tickRate),
      ).create(kind, kind, { team: 'light', position: start });
      state.entities.add(unit);
      const collision = new CollisionSystem(
        new CollisionResolver(
          staticCollisionIndexOf(
            EMPTY_MAP,
            new MapObjectBuilder().build(EMPTY_MAP, HOUSE_PRESENTATION),
          ),
          { x: 0, y: 0, width: EMPTY_MAP.width, height: EMPTY_MAP.height },
        ),
      );
      const movement = unit.getComponent(Movement);
      const transform = unit.getComponent(Transform);
      movement.steer(heading);
      for (let tick = 0; tick < ticks; tick += 1) {
        movement.advance();
        transform.moveBy(movement.velocity);
        collision.update({ state, logger: new NullLogger() });
      }
      return { movement, transform };
    };

    it('stops the Sentinel dead on a wall it runs into head-on', () => {
      const { movement, transform } = run('sentinel', { x: 1, y: 0 }, 120);

      expect(transform.position.x).toBeCloseTo(5 - 1.25);
      // Rounding and the contact gap leave below 1e-6; one tick of rebuilt speed is ~3e-3.
      expect(movement.speed).toBeCloseTo(0, 6);
    });

    it.each([30, 45])(
      'builds the Sentinel past walk speed along a wall it steers %i° into from a standstill',
      (degrees) => {
        const radians = (degrees * Math.PI) / 180;
        const ticksPerSecond = createDefaultGameConfig().tickRate;
        // Starts beside the wall's south end: 2 s of build-up stays on the 8 m wall (y 1 to 9).
        const { movement, transform } = run(
          'sentinel',
          { x: sin(radians), y: cos(radians) },
          2 * ticksPerSecond,
          { x: 3.7, y: 1.5 },
        );

        expect(transform.position.x).toBeCloseTo(5 - 1.25);
        expect(Math.abs(movement.velocity.x * ticksPerSecond)).toBeLessThan(0.01);
        expect(movement.velocity.y * ticksPerSecond).toBeGreaterThanOrEqual(3.5);
      },
    );

    it('leaves the speed of a unit without momentum alone (the Warrior)', () => {
      const { movement, transform } = run('warrior', { x: 1, y: 0 }, 120);

      expect(transform.position.x).toBeCloseTo(5 - 0.5);
      expect(movement.speed).toBe(movement.topSpeed);
    });
  });
});
