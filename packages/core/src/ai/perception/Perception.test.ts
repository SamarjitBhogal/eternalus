import { describe, expect, it } from 'vitest';

import { Health } from '../../components/Health';
import { Transform } from '../../components/Transform';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { SpaceIndex } from '../../physics/SpaceIndex';
import { TWO_LANE_MAP } from '../../state/__fixtures__/twoLaneMap';
import { GameState } from '../../state/GameState';
import { matchWorldOf } from '../../state/__fixtures__/matchWorld';
import { Perception } from './Perception';

const setUp = () => {
  const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
  const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP), { space });
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
  const add = (team: 'light' | 'dark', x: number, kind = 'light-mob', id = 'light-minion') => {
    const entity = factory.create(kind, id, { team, position: { x, y: 10 } });
    state.entities.add(entity);
    return entity;
  };
  /** Refills the index the way `SpaceSystem` does: every unit, in store order. */
  const index = () => {
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      const { x, y } = entity.getComponent(Transform).position;
      space.add(entity.id, x, y);
    });
    space.commit();
  };
  return { state, add, index };
};

describe('Perception', () => {
  it('finds the units in range that pass the filter', () => {
    const { state, add, index } = setUp();
    const near = add('dark', 12);
    add('light', 11);
    const heavy = add('dark', 9, 'heavy-mob', 'heavy-minion');
    const dead = add('dark', 10);
    add('dark', 40);
    dead.getComponent(Health).applyDamage(1e6);
    index();
    const perception = new Perception(state);
    const center = { x: 10, y: 10 };

    expect(perception.unitsWithin(center, 5, { hostileTo: 'light', aliveOnly: true })).toEqual([
      near.id,
      heavy.id,
    ]);
    expect(perception.unitsWithin(center, 5, { kinds: ['heavy-mob'] })).toEqual([heavy.id]);
    expect(perception.nearest(center, 5, { hostileTo: 'light', aliveOnly: true })).toBe(heavy.id);
    expect(perception.nearest(center, 0.5, { hostileTo: 'dark' })).toBeNull();
  });

  it('returns ids in string order, and breaks a nearest tie toward the lower id', () => {
    const { state, add, index } = setUp();
    // Eight fillers far away, so the two near units get the ids entity-9 and entity-10.
    Array.from({ length: 8 }, () => add('dark', 80));
    const created = add('dark', 8);
    const later = add('dark', 12);
    index();
    const perception = new Perception(state);

    expect([created.id, later.id]).toEqual(['entity-9', 'entity-10']);
    // Store order would give entity-9 first; string order puts entity-10 first.
    expect(perception.unitsWithin({ x: 10, y: 10 }, 5, {})).toEqual(['entity-10', 'entity-9']);
    expect(perception.nearest({ x: 10, y: 10 }, 5, {})).toBe('entity-10');
  });

  it('sees nothing without a neighbour index, and skips units removed since the rebuild', () => {
    const { state, add, index } = setUp();
    const gone = add('dark', 10);
    index();
    state.entities.remove(gone.id, 'dev-removed');
    const blind = new Perception(new GameState(createDefaultGameConfig(), 1));

    expect(new Perception(state).unitsWithin({ x: 10, y: 10 }, 5, {})).toEqual([]);
    expect(blind.unitsWithin({ x: 10, y: 10 }, 5, {})).toEqual([]);
  });
});
