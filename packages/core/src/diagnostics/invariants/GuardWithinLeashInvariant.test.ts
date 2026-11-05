import { describe, expect, it } from 'vitest';

import { Transform } from '../../components/Transform';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import { GuardWithinLeashInvariant } from './GuardWithinLeashInvariant';

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
  const guard = factory.create('light-mob', 'light-guard', {
    team: 'light',
    position: { x: 16, y: 0 },
  });
  state.entities.add(guard);
  // A home of radius 14 at the origin, leash 8 plus tolerance 2: the guard may stand up to 24 out.
  state.guards.add({
    id: 'entity-0:0',
    homeId: 'entity-0',
    team: 'light',
    mobId: 'light-guard',
    row: 0,
    indexInRow: 0,
    postX: 16,
    postY: 0,
    homeX: 0,
    homeY: 0,
    homeRadius: 14,
    leashRadius: 8,
    leashTolerance: 2,
    respawnTicks: 3600,
  });
  state.guards.fill(0, guard.id);
  return { state, guard };
};

const invariant = new GuardWithinLeashInvariant();

describe('GuardWithinLeashInvariant', () => {
  it('holds for a guard at its post and one at the edge of its leash', () => {
    const { state, guard } = setUp();
    expect(invariant.check(state)).toEqual([]);

    guard.getComponent(Transform).moveBy({ x: 8, y: 0 });
    expect(invariant.check(state)).toEqual([]);
  });

  it('flags a guard dragged past its leash (injected)', () => {
    const { state, guard } = setUp();

    guard.getComponent(Transform).moveBy({ x: 9, y: 0 });

    expect(invariant.check(state)).toEqual([
      expect.objectContaining({
        invariantId: 'guard-within-leash',
        entityId: guard.id,
        details: { homeId: 'entity-0', beyond: 11, allowed: 10 },
      }),
    ]);
  });
});
