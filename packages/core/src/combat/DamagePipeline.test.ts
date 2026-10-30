import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import type { MapDefinition } from '../content/maps/maps.types';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import { DamagePipeline } from './DamagePipeline';
import type { DamageSource } from '../state/GameEvents.types';

const SOURCE: DamageSource = { attackerId: 'entity-9', kind: 'weapon', definitionId: 'sword' };

const setUp = (map: MapDefinition | null = null): GameState => {
  const state = new GameState(createDefaultGameConfig(), 1, map);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(createDefaultGameConfig().tickRate),
  );
  state.entities.add(
    factory.create('light-mob', 'training-dummy', { position: { x: 0, y: 0 }, team: 'dark' }),
  );
  state.entities.add(
    factory.create('light-mob', 'training-dummy', { position: { x: 0, y: 0 }, team: 'light' }),
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

  it("counts a lethal hit, before the body is removed, as its team's ally damage (DEC-89)", () => {
    const state = setUp(TWO_LANE_MAP);

    new DamagePipeline().apply(state, 'entity-1', 1_000_000, { ...SOURCE, attackerId: 'entity-2' });

    const counted: string[] = [];
    state.allyDamage.forEach((team, lane, amount) => {
      counted.push(`${team} ${lane} ${String(amount)}`);
    });
    expect(counted).toEqual([`dark lane-0 ${String(healthOf(state).max)}`]);
  });

  it('blocks a hit between teammates (friendly fire)', () => {
    const state = setUp();
    const ally = { attackerId: 'entity-1', kind: 'weapon', definitionId: 'sword' } as const;

    expect(new DamagePipeline().apply(state, 'entity-1', 15, ally)).toEqual({
      applied: false,
      reason: 'blocked',
    });
    expect(healthOf(state).current).toBe(healthOf(state).max);
  });

  it('applies nothing for a zero-damage hit', () => {
    const state = setUp();

    expect(new DamagePipeline().apply(state, 'entity-1', 0, SOURCE)).toEqual({
      applied: false,
      reason: 'zero-damage',
    });
    expect(state.events.recentEvents()).toEqual([]);
  });

  it('rejects a missing target without throwing', () => {
    expect(new DamagePipeline().apply(setUp(), 'entity-404', 5, SOURCE)).toEqual({
      applied: false,
      reason: 'no-target',
    });
  });
});
