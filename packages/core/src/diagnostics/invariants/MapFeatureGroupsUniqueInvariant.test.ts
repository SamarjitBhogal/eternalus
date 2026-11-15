import { describe, expect, it } from 'vitest';

import { Capturable } from '../../components/Capturable';
import { Health } from '../../components/Health';
import { MapFeatureLink } from '../../components/MapFeatureLink';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { Entity } from '../../entities/Entity';
import { GameState } from '../../state/GameState';
import { MapFeatureGroupsUniqueInvariant } from './MapFeatureGroupsUniqueInvariant';

class Bare extends Entity {
  public readonly kind = 'bare';
  public readonly family = 'test';

  protected installComponents(): void {
    // Each test adds its own components.
  }
}

/** An entity linked to `featureId`, carrying `components`. */
const linked = (id: string, featureId: string, ...components: object[]): Bare => {
  const entity = new Bare(id, 'bare');
  entity.addComponent(new MapFeatureLink(featureId));
  components.forEach((component) => {
    entity.addComponent(component);
  });
  return entity;
};

const stateWith = (...entities: Entity[]): GameState => {
  const state = new GameState(createDefaultGameConfig(), 1);
  entities.forEach((entity) => {
    state.entities.add(entity);
  });
  return state;
};

describe('MapFeatureGroupsUniqueInvariant', () => {
  const invariant = new MapFeatureGroupsUniqueInvariant();

  it('holds for one feature backing a capture zone and a structure, and for unlinked entities (DEC-233)', () => {
    const state = stateWith(
      linked('entity-1', 'cathedral', new Capturable()),
      linked('entity-2', 'cathedral', new Health(100)),
      linked('entity-3', 'light-gate-lane-0', new Health(50)),
      new Bare('entity-4', 'bare'),
    );

    expect(invariant.check(state)).toEqual([]);
  });

  it('flags two entities of one feature that carry the same group (injected corruption, DEC-252)', () => {
    const state = stateWith(
      linked('entity-1', 'cathedral', new Health(100), new Capturable()),
      linked('entity-2', 'cathedral', new Health(80)),
    );

    expect(invariant.check(state)).toEqual([
      {
        invariantId: 'map-feature-groups-unique',
        severity: 'error',
        message:
          'Map feature "cathedral" has 2 entities with the health group (entity-1, entity-2); at most one may carry it.',
        entityId: 'entity-1',
        details: { featureId: 'cathedral', group: 'health', entityIds: 'entity-1,entity-2' },
      },
    ]);
  });
});
