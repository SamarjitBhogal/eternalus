import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { UnknownDefinitionError } from '../content/UnknownDefinitionError';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { Entity } from '../entities/Entity';
import type { GameEventMap } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { StatusEffectApplier } from './StatusEffectApplier';

const CONFIG = createDefaultGameConfig();

/** Health but no StatusEffects, like a structure. */
class Wall extends Entity {
  public readonly kind = 'wall';
  public readonly family = 'test';

  protected installComponents(): void {
    this.addComponent(new Health(100));
  }
}

const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
  );
  const dummy = factory.create('light-mob', 'training-dummy', {
    position: { x: 0, y: 0 },
    team: 'dark',
  });
  state.entities.add(dummy);
  const events: [string, GameEventMap['status-applied']][] = [];
  state.events.on('status-applied', (payload) => events.push(['applied', payload]));
  state.events.on('status-expired', (payload) => events.push(['expired', payload]));
  const applier = new StatusEffectApplier(loadStatusEffects(CONFIG.tickRate, 2));
  return { state, dummy, events, applier };
};

describe('StatusEffectApplier', () => {
  it('lands a status by id and emits status-applied with the source', () => {
    const { state, dummy, events, applier } = setUp();

    expect(applier.apply(state, dummy.id, 'stun', 'entity-9')).toBe(true);
    expect(dummy.getComponent(StatusEffects).has('cannot-move')).toBe(true);
    expect(events).toEqual([
      ['applied', { entityId: dummy.id, statusId: 'stun', sourceId: 'entity-9' }],
    ]);
  });

  it('refuses a missing or dead target, and one without StatusEffects, with no event', () => {
    const { state, dummy, events, applier } = setUp();
    dummy.getComponent(Health).applyDamage(1_000_000);

    expect(applier.apply(state, dummy.id, 'stun', null)).toBe(false);
    expect(applier.apply(state, 'nobody', 'stun', null)).toBe(false);
    const wall = new Wall('entity-50', 'wall');
    wall.spawn({});
    state.entities.add(wall);
    expect(applier.apply(state, wall.id, 'stun', null)).toBe(false);
    expect(events).toEqual([]);
  });

  it('throws on an unknown status id (a dangling content reference)', () => {
    const { state, dummy, applier } = setUp();

    expect(() => applier.apply(state, dummy.id, 'frozen', null)).toThrow(UnknownDefinitionError);
  });

  it('removes a status on demand and emits status-expired; removing an absent one is a no-op', () => {
    const { state, dummy, events, applier } = setUp();
    applier.apply(state, dummy.id, 'enraged', 'entity-9');

    expect(applier.remove(state, dummy.id, 'enraged')).toBe(true);
    expect(applier.remove(state, dummy.id, 'enraged')).toBe(false);
    expect(events.at(-1)).toEqual([
      'expired',
      { entityId: dummy.id, statusId: 'enraged', sourceId: 'entity-9' },
    ]);
    expect(dummy.getComponent(StatusEffects).active).toHaveLength(0);
  });
});
