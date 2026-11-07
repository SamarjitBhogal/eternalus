import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { DeathSystem } from './DeathSystem';
import type { SystemContext } from './System.types';

const UNIT_DEFINITIONS = loadDefaultContent(createDefaultGameConfig().tickRate);

const setUp = (): SystemContext => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
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

  it('names the killer of a unit killed through the damage pipeline', () => {
    const context = setUp();
    const { state } = context;
    const killer = { attackerId: null, kind: 'environment', definitionId: 'lava' } as const;
    new DamagePipeline().apply(state, 'entity-1', 1000, killer);

    new DeathSystem().update(context);

    const removed = state.events.recentEvents().find((event) => event.type === 'entity-removed');
    expect(removed?.payload).toEqual({ entityId: 'entity-1', cause: 'died', killer });
  });

  it('does nothing when nobody died', () => {
    const context = setUp();

    new DeathSystem().update(context);

    expect(context.state.entities.size).toBe(3);
  });
});
