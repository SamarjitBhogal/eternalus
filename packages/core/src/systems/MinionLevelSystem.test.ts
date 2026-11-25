import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { Veterancy } from '../components/Veterancy';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadMinionVeterancy } from '../content/mobs/loadMinionVeterancy';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { MinionLevelSystem } from './MinionLevelSystem';

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const units = loadDefaultContent(30);
  const factory = new EntityFactory(createDefaultEntityRegistry(), units);
  const statuses = new StatusEffectApplier(loadStatusEffects(30, 2));
  const system = new MinionLevelSystem(state, statuses, units, loadMinionVeterancy(30));
  const minion = factory.create('light-mob', 'light-minion', {
    team: 'light',
    position: { x: 0, y: 0 },
  });
  state.entities.add(minion);
  const step = () => {
    system.update({ state, logger: new NullLogger() });
  };
  const veteranStacks = () =>
    minion
      .getComponent(StatusEffects)
      .active.filter(({ definition }) => definition.id === 'veteran')
      .reduce((sum, { stacks }) => sum + stacks, 0);
  return { state, minion, step, veteranStacks };
};

describe('MinionLevelSystem (DEC-168, DEC-353 (a))', () => {
  it('applies a level on its own pass, not in the event handler', () => {
    const { state, minion, step } = setUp();
    state.events.emit('minion-level-earned', { entityId: minion.id });
    expect(minion.findComponent(Veterancy)).toBeUndefined();

    step();

    expect(minion.getComponent(Veterancy).level).toBe(1);
    expect(minion.getComponent(Health).max).toBeCloseTo(165);
  });

  it('applies a granted level and takes it back with its effects, keeping the kill levels (DEC-258)', () => {
    const { state, minion, step, veteranStacks } = setUp();
    state.events.emit('minion-level-earned', { entityId: minion.id });
    state.events.emit('minion-level-earned', { entityId: minion.id });
    step();
    const killMax = minion.getComponent(Health).max;

    state.events.emit('minion-levels-granted', {
      entityId: minion.id,
      levels: 1,
      sourceId: 'zone-1',
    });
    step();
    expect(minion.getComponent(Veterancy).level).toBe(3);
    expect(minion.getComponent(Health).max).toBeCloseTo(killMax + 15);
    expect(veteranStacks()).toBe(3);
    expect(minion.getComponent(Veterancy).grantedBy).toBe('zone-1');

    state.events.emit('minion-levels-granted', {
      entityId: minion.id,
      levels: -1,
      sourceId: 'zone-1',
    });
    step();
    expect(minion.getComponent(Veterancy).level).toBe(2);
    expect(minion.getComponent(Health).max).toBeCloseTo(killMax);
    expect(veteranStacks()).toBe(2);
    expect(minion.getComponent(Veterancy).grantedBy).toBeNull();
  });

  it('takes a lost level off with one status event, not a re-application per level (DEC-353 (b))', () => {
    const { state, minion, step } = setUp();
    for (let level = 0; level < 2; level += 1) {
      state.events.emit('minion-level-earned', { entityId: minion.id });
    }
    state.events.emit('minion-levels-granted', {
      entityId: minion.id,
      levels: 1,
      sourceId: 'zone-1',
    });
    step();
    const events: string[] = [];
    state.events.on('status-applied', () => events.push('applied'));
    state.events.on('status-expired', () => events.push('expired'));
    state.events.on('status-stacks-lost', ({ stacks }) =>
      events.push(`lost, ${String(stacks)} left`),
    );

    state.events.emit('minion-levels-granted', {
      entityId: minion.id,
      levels: -1,
      sourceId: 'zone-1',
    });
    step();

    expect(events).toEqual(['lost, 2 left']);
  });

  it('ignores a level for a dead or unknown entity', () => {
    const { state, minion, step } = setUp();
    minion.getComponent(Health).applyDamage(1e6);
    state.events.emit('minion-levels-granted', {
      entityId: minion.id,
      levels: 1,
      sourceId: 'zone-1',
    });
    state.events.emit('minion-level-earned', { entityId: 'nobody' });
    step();
    expect(minion.findComponent(Veterancy)).toBeUndefined();
  });
});
