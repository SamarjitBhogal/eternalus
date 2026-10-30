import { describe, expect, it } from 'vitest';
import { NoMapObjectOverlapInvariant } from './NoMapObjectOverlapInvariant';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { GameState } from '../../state/GameState';
import { WorldObjectStore } from '../../state/WorldObjectStore';
import { EntityFactory } from '../../entities/EntityFactory';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { Transform } from '../../components/Transform';
import { Health } from '../../components/Health';
import { MAP_OBJECT_DEFINITIONS } from '../../content/maps/mapObjectDefinitions';
import { loadWeapons } from '../../content/weapons/loadWeapons';
describe('NoMapObjectOverlapInvariant', () => {
  it('flags deliberately placing a unit inside a wall, and clears after destruction', () => {
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
    state.worldObjects = new WorldObjectStore(
      [
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
      state.entities,
      MAP_OBJECT_DEFINITIONS,
    );
    const unit = factory.create('warrior', 'warrior', { team: 'light', position: { x: 0, y: 5 } });
    state.entities.add(unit);
    const invariant = new NoMapObjectOverlapInvariant();
    expect(invariant.check(state)).toEqual([]);
    unit.getComponent(Transform).moveTo({ x: 5.5, y: 5 });
    expect(invariant.check(state)[0]).toMatchObject({
      entityId: unit.id,
      details: { objectId: 'wall' },
    });
    const wall = state.worldObjects.snapshot()[0]?.entityId ?? '';
    state.entities.get(wall)?.getComponent(Health).applyDamage(2000);
    state.worldObjects.removed(wall);
    expect(invariant.check(state)).toEqual([]);
  });
});
