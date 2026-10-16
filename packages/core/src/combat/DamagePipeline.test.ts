import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { DamagePipeline } from './DamagePipeline';
import type { DamageSource } from './DamageSource.types';

const SOURCE: DamageSource = { attackerId: 'entity-9', kind: 'weapon', definitionId: 'sword' };

const setUp = (): GameState => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(createDefaultGameConfig().tickRate),
  );
  state.entities.add(
    factory.create('light-mob', 'training-dummy', { position: { x: 0, y: 0 }, team: 'dark' }),
  );
  return state;
};

const healthOf = (state: GameState): Health => {
  const target = state.entities.get('entity-1');
  if (target === undefined) {
    throw new Error('The dummy was not spawned.');
  }
  return target.getComponent(Health);
};

describe('DamagePipeline', () => {
  it('drains shields before health and announces the hit with its source', () => {
    const state = setUp();
    healthOf(state).addShield('entity-50', 10);

    const result = new DamagePipeline().apply(state, 'entity-1', 15, SOURCE);

    expect(result).toEqual({ applied: true, amount: 5, absorbed: 10, killed: false });
    expect(healthOf(state).current).toBe(healthOf(state).max - 5);
    expect(state.events.recentEvents().map((event) => event.type)).toEqual(['damage-applied']);
  });

  it('names the killer on the hit that takes health to 0, and only that hit', () => {
    const state = setUp();
    const pipeline = new DamagePipeline();

    const lethal = pipeline.apply(state, 'entity-1', 1_000_000, SOURCE);
    const after = pipeline.apply(state, 'entity-1', 1, SOURCE);

    expect(lethal).toMatchObject({ applied: true, killed: true });
    expect(after).toEqual({ applied: false, reason: 'already-dead' });
    const died = state.events.recentEvents().filter((event) => event.type === 'entity-died');
    expect(died).toHaveLength(1);
    expect(died[0]?.payload).toEqual({ entityId: 'entity-1', killer: SOURCE });
  });

  it('rejects a missing target without throwing', () => {
    expect(new DamagePipeline().apply(setUp(), 'entity-404', 5, SOURCE)).toEqual({
      applied: false,
      reason: 'no-target',
    });
  });
});
