import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import { casterState } from './__fixtures__/casterState';
import { testAbilityRegistry } from './__fixtures__/fakeAbilities';
import { TargetQuery } from './TargetQuery';

const DISC = { kind: 'circle', radius: 5 } as const;
const ON_CASTER = { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };

const setUp = () => {
  const { state, factory, caster } = casterState();
  const add = (kind: string, definitionId: string, team: Team, position: Vec2) => {
    const entity = factory.create(kind, definitionId, { position, team });
    state.entities.add(entity);
    return entity;
  };
  const query = new TargetQuery(testAbilityRegistry([]));
  return { state, caster, add, query };
};

describe('TargetQuery', () => {
  it('finds the live entities in the shape, enemies or allies of the caster, sorted by id', () => {
    const { state, caster, add, query } = setUp();
    const enemies = Array.from({ length: 10 }, () =>
      add('light-mob', 'training-dummy', 'dark', { x: 1, y: 0 }),
    ).map(({ id }) => id); // entity-2 .. entity-11
    const ally = add('warrior', 'warrior', 'light', { x: 0, y: 1 });
    add('light-mob', 'training-dummy', 'dark', { x: 20, y: 0 }); // out of reach
    const tower = add('buff-tower', 'buff-tower', 'dark', { x: 2, y: 2 });
    add('light-mob', 'training-dummy', 'dark', { x: 2, y: 0 })
      .getComponent(Health)
      .applyDamage(1e9);

    const foes = query.find(state, caster.id, DISC, ON_CASTER, { team: 'enemies' });
    const friends = query.find(state, caster.id, DISC, ON_CASTER, { team: 'allies' });
    const everyone = query.find(state, caster.id, DISC, ON_CASTER, {
      team: 'all',
      includeSelf: true,
    });

    // String order: entity-10 and entity-11 sort before entity-2.
    expect(foes).toEqual([...enemies, tower.id].sort());
    expect(foes[0]).toBe('entity-10');
    expect(friends).toEqual([ally.id]);
    expect(everyone).toContain(caster.id);
    expect(everyone).toHaveLength(foes.length + 2);
  });

  it('leaves the caster out unless the filter includes it', () => {
    const { state, caster, query } = setUp();

    expect(query.find(state, caster.id, DISC, ON_CASTER, { team: 'all' })).toEqual([]);
    expect(
      query.find(state, caster.id, DISC, ON_CASTER, { team: 'allies', includeSelf: true }),
    ).toEqual([caster.id]);
  });
});
