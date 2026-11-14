import { describe, expect, it } from 'vitest';
import { MapObjectBuilder } from '../map/MapObjectBuilder';
import { staticCollisionIndexOf } from '../map/staticCollisionIndexOf';
import { CollisionSystem } from './CollisionSystem';
import { GameState } from '../state/GameState';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { EntityFactory } from '../entities/EntityFactory';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { NullLogger } from '../diagnostics/NullLogger';
import { Deploying } from '../components/Deploying';
import { Transform } from '../components/Transform';
import type { MapDefinition, MapPresentation } from '../content/maps/maps.types';

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
      EMPTY_MAP,
      staticCollisionIndexOf(
        EMPTY_MAP,
        new MapObjectBuilder().build(EMPTY_MAP, HOUSE_PRESENTATION),
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
      EMPTY_MAP,
      staticCollisionIndexOf(
        EMPTY_MAP,
        new MapObjectBuilder().build(EMPTY_MAP, HOUSE_PRESENTATION),
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
});
