import { describe, expect, it } from 'vitest';

import { Health } from '../../components/Health';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import { HordeMembershipConsistentInvariant } from './HordeMembershipConsistentInvariant';

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
  const memberIds = [0, 1, 2].map((x) => {
    const entity = factory.create('light-mob', 'light-minion', {
      team: 'light',
      position: { x, y: 0 },
    });
    state.entities.add(entity);
    return entity.id;
  });
  const horde = state.hordes.add({
    id: 'horde-1',
    team: 'light',
    weightClass: 'light',
    lane: 'lane-0',
    formationId: 'ranks',
    memberIds,
    progress: 0,
  });
  return { state, horde, memberIds };
};

const invariant = new HordeMembershipConsistentInvariant();
const messages = (state: GameState) => invariant.check(state).map(({ message }) => message);

describe('HordeMembershipConsistentInvariant', () => {
  it('holds for a fresh horde, and for a member removed this tick but not yet dropped', () => {
    const { state, memberIds } = setUp();
    expect(invariant.check(state)).toEqual([]);

    state.entities.remove(memberIds[1] ?? '', 'dev-removed');

    expect(invariant.check(state)).toEqual([]);
  });

  it('flags a dead member, a member gone since an earlier tick and a wrong leader (injected)', () => {
    const { state, horde, memberIds } = setUp();
    const [first = '', second = '', third = ''] = memberIds;
    state.entities.get(second)?.getComponent(Health).applyDamage(1e6);
    state.entities.remove(third, 'dev-removed');
    state.entities.beginTick();
    Reflect.set(horde, 'leaderId', second);

    expect(messages(state)).toEqual([
      `Horde "horde-1" is led by a member other than "${first}".`,
      `Horde "horde-1" lists "${second}", which is not a living mob.`,
      `Horde "horde-1" lists "${third}", which is not a living mob.`,
    ]);
  });

  it('flags an empty horde and a member the store files elsewhere (injected)', () => {
    const { state, horde, memberIds } = setUp();
    const stray = state.hordes.add({ ...horde, id: 'horde-2', memberIds: ['entity-x'] });
    Reflect.set(stray, 'memberIds', [memberIds[0]]);
    Reflect.set(stray, 'leaderId', memberIds[0]);
    Reflect.set(horde, 'memberIds', []);

    expect(messages(state)).toEqual([
      'Horde "horde-1" has no members and was not dissolved.',
      `Horde "horde-2" lists "${memberIds[0] ?? ''}", which the store files elsewhere.`,
    ]);
  });
});
