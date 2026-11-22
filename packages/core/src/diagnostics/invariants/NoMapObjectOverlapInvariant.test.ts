import { describe, expect, it } from 'vitest';
import { NoMapObjectOverlapInvariant } from './NoMapObjectOverlapInvariant';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { GameState } from '../../state/GameState';
import { WorldObjectStore } from '../../state/WorldObjectStore';
import { EntityFactory } from '../../entities/EntityFactory';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { Deploying } from '../../components/Deploying';
import { Transform } from '../../components/Transform';
import { Health } from '../../components/Health';
import { MAP_OBJECT_DEFINITIONS } from '../../content/maps/mapObjectDefinitions';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { loadProjectiles } from '../../content/projectiles/loadProjectiles';
import { loadTurrets } from '../../content/structures/loadTurrets';
import { Projectile } from '../../entities/Projectile';
import { ProjectilePayload } from '../../components/ProjectilePayload';
import type { Vec2 } from '../../utils/geometry.types';
describe('NoMapObjectOverlapInvariant', () => {
  it('flags deliberately placing a unit inside a wall, unless it is deploying, and clears after destruction', () => {
    const config = createDefaultGameConfig();
    const state = new GameState(config, 1);
    const units = loadDefaultContent(config.tickRate);
    const definitions = new Map(Object.values(MAP_OBJECT_DEFINITIONS).map((d) => [d.id, d]));
    const factory = new EntityFactory(
      createDefaultEntityRegistry(),
      {
        has: (id) => definitions.has(id) || units.has(id),
        get: (id) => definitions.get(id) ?? units.get(id),
      },
      undefined,
      loadWeapons(config.tickRate),
    );
    state.worldObjects = new WorldObjectStore({
      objects: [
        {
          id: 'wall',
          kind: 'wall',
          isBlocking: true,
          footprints: [
            [
              { x: 5, y: 0 },
              { x: 6, y: 0 },
              { x: 6, y: 10 },
              { x: 5, y: 10 },
            ],
          ],
        },
      ],
      factory,
      entities: state.entities,
      definitions: MAP_OBJECT_DEFINITIONS,
    });
    const unit = factory.create('warrior', 'warrior', { team: 'light', position: { x: 0, y: 5 } });
    state.entities.add(unit);
    const invariant = new NoMapObjectOverlapInvariant();
    expect(invariant.check(state)).toEqual([]);
    unit.getComponent(Transform).moveTo({ x: 5.5, y: 5 });
    expect(invariant.check(state)[0]).toMatchObject({
      entityId: unit.id,
      details: { objectId: 'wall' },
    });
    // A mob walking out of the structure it spawned inside passes its walls (DEC-133).
    unit.addComponent(new Deploying({ x: 10, y: 5 }));
    expect(invariant.check(state)).toEqual([]);
    unit.removeComponent(Deploying);
    expect(invariant.check(state)).toHaveLength(1);
    const wall = state.worldObjects.snapshot()[0]?.entityId ?? '';
    state.entities.get(wall)?.getComponent(Health).applyDamage(2000);
    state.worldObjects.removed(wall);
    expect(invariant.check(state)).toEqual([]);
  });

  it('passes a shot inside a shape that holds its own launch point (DEC-334), and flags one that does not', () => {
    const config = createDefaultGameConfig();
    const state = new GameState(config, 1);
    const units = loadDefaultContent(config.tickRate);
    const definitions = new Map(Object.values(MAP_OBJECT_DEFINITIONS).map((d) => [d.id, d]));
    state.worldObjects = new WorldObjectStore({
      objects: [
        {
          id: 'wall',
          kind: 'wall',
          isBlocking: true,
          footprints: [
            [
              { x: 0, y: 0 },
              { x: 6, y: 0 },
              { x: 6, y: 10 },
              { x: 0, y: 10 },
            ],
          ],
        },
      ],
      factory: new EntityFactory(createDefaultEntityRegistry(), {
        has: (id) => definitions.has(id) || units.has(id),
        get: (id) => definitions.get(id) ?? units.get(id),
      }),
      entities: state.entities,
      definitions: MAP_OBJECT_DEFINITIONS,
    });
    const bolt = loadProjectiles(config.tickRate).get('turret-bolt');
    const ammo = loadTurrets(config.tickRate).ammo.get('bolt-default');
    /** A bolt at `at`, launched at `origin`. */
    const shotAt = (id: string, at: Vec2, origin: Vec2): Projectile => {
      const shot = new Projectile(id, bolt.id);
      shot.spawn({ definition: bolt, position: at, team: 'light' });
      shot.addComponent(
        new ProjectilePayload({
          ownerId: 'turret',
          team: 'light',
          source: { attackerId: 'turret', kind: 'weapon', definitionId: 'turret' },
          targetId: null,
          impact: { kind: 'weapon', attack: ammo.attack },
          origin,
        }),
      );
      state.entities.add(shot);
      return shot;
    };
    const invariant = new NoMapObjectOverlapInvariant();

    shotAt('leaving', { x: 3, y: 5 }, { x: 1, y: 5 });
    expect(invariant.check(state)).toEqual([]);

    shotAt('entering', { x: 3, y: 6 }, { x: -2, y: 6 });
    expect(invariant.check(state)).toEqual([
      expect.objectContaining({ entityId: 'entering', details: { objectId: 'wall' } }),
    ]);
  });
});
