import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { UNIT_DEFINITIONS } from '../content/units/unitDefinitions';
import { NullLogger } from '../diagnostics/NullLogger';
import { DefaultEntityRegistry } from '../entities/DefaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { DeathSystem } from './DeathSystem';
import type { SystemContext } from './System.types';

const setUp = (): SystemContext => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(new DefaultEntityRegistry(), UNIT_DEFINITIONS);
  for (let index = 0; index < 3; index += 1) {
    state.entities.add(
      factory.create('light-mob', 'training-dummy', { position: { x: 0, y: 0 }, team: 'dark' }),
    );
  }
  return { state, logger: new NullLogger() };
};

describe('DeathSystem', () => {
  it('removes dead entities with the cause "died" and announces each with the tick', () => {
    const context = setUp();
    const { state } = context;
    state.advanceTick();
    state.entities.get('entity-1')?.getComponent(Health).applyDamage(1000);
    state.entities.get('entity-3')?.getComponent(Health).applyDamage(1000);

    new DeathSystem().update(context);

    expect(state.entities.has('entity-1')).toBe(false);
    expect(state.entities.has('entity-2')).toBe(true);
    expect(state.entities.has('entity-3')).toBe(false);
    expect(
      state.events
        .recentEvents()
        .filter((event) => event.type === 'entity-removed')
        .map(({ tick, payload }) => ({ tick, payload })),
    ).toEqual([
      { tick: 1, payload: { entityId: 'entity-1', cause: 'died' } },
      { tick: 1, payload: { entityId: 'entity-3', cause: 'died' } },
    ]);
    expect(state.entities.removedThisTick()).toEqual([
      { entityId: 'entity-1', cause: 'died' },
      { entityId: 'entity-3', cause: 'died' },
    ]);
  });

  it('does nothing when nobody died', () => {
    const context = setUp();

    new DeathSystem().update(context);

    expect(context.state.entities.size).toBe(3);
  });
});
