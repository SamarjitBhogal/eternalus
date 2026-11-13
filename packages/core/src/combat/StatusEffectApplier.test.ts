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
import { StateHasher } from '../state/StateHasher';
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

  it.each(['stun', 'crushed'])(
    'follows %s that runs out with control-immune, credited to the same source',
    (hardControlId) => {
      const { state, dummy, events, applier } = setUp();
      applier.apply(state, dummy.id, hardControlId, 'entity-9');
      const statuses = dummy.getComponent(StatusEffects);
      const ticks = statuses.active[0]?.definition.durationTicks ?? 0;

      for (let tick = 0; tick < ticks; tick += 1) {
        state.advanceTick();
      }
      applier.expire(state, dummy.id);

      expect(statuses.has('cannot-move')).toBe(false);
      expect(statuses.has('control-immune')).toBe(true);
      expect(events.slice(-2)).toEqual([
        ['expired', { entityId: dummy.id, statusId: hardControlId, sourceId: 'entity-9' }],
        ['applied', { entityId: dummy.id, statusId: 'control-immune', sourceId: 'entity-9' }],
      ]);
    },
  );

  it('hashes a hard status that expired into control-immune the same on every run', () => {
    const runHash = (isStunned: boolean): number => {
      const { state, dummy, applier } = setUp();
      if (isStunned) {
        applier.apply(state, dummy.id, 'stun', 'entity-9');
      }
      const sameTicks = CONFIG.tickRate * 2;
      for (let tick = 0; tick < sameTicks; tick += 1) {
        state.advanceTick();
      }
      applier.expire(state, dummy.id);
      return new StateHasher().hash(state);
    };

    expect(runHash(true)).toBe(runHash(true));
    expect(runHash(true)).not.toBe(runHash(false));
  });

  it('refuses hard control on a control-immune target, but not soft control', () => {
    const { state, dummy, applier } = setUp();
    applier.apply(state, dummy.id, 'control-immune', null);

    expect(applier.apply(state, dummy.id, 'stun', 'entity-9')).toBe(false);
    expect(applier.apply(state, dummy.id, 'crushed', 'entity-9')).toBe(false);
    expect(applier.apply(state, dummy.id, 'concussion', 'entity-9')).toBe(true);
    expect(dummy.getComponent(StatusEffects).has('cannot-move')).toBe(false);
  });

  it('runs onExpire only when a status times out, not when it is removed early', () => {
    const { state, dummy, applier } = setUp();
    applier.apply(state, dummy.id, 'stun', null);
    applier.remove(state, dummy.id, 'stun');

    expect(dummy.getComponent(StatusEffects).has('control-immune')).toBe(false);
  });

  it('lets hard control land again once control-immune has run out', () => {
    const { state, dummy, applier } = setUp();
    applier.apply(state, dummy.id, 'control-immune', null);
    const statuses = dummy.getComponent(StatusEffects);
    const immuneTicks = statuses.active[0]?.definition.durationTicks ?? 0;

    for (let tick = 0; tick < immuneTicks; tick += 1) {
      state.advanceTick();
    }
    applier.expire(state, dummy.id);

    expect(applier.apply(state, dummy.id, 'stun', 'entity-9')).toBe(true);
  });
});
