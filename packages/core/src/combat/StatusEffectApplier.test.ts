import { describe, expect, it } from 'vitest';

import { casterState } from '../abilities/__fixtures__/casterState';
import { Abilities } from '../components/Abilities';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { ContentCatalogue } from '../content/ContentCatalogue';
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

  it('lands a status for the source’s own duration when given, the status’s otherwise', () => {
    const { state, dummy, applier } = setUp();
    for (let tick = 0; tick < 5; tick += 1) state.advanceTick();

    applier.apply(state, dummy.id, 'stun', 'entity-9', 15);
    applier.apply(state, dummy.id, 'concussion', 'entity-9');

    expect(
      dummy
        .getComponent(StatusEffects)
        .active.map(({ definition, expiresTick }) => [definition.id, expiresTick]),
    ).toEqual([
      ['stun', 20],
      ['concussion', 5 + 90],
    ]);
  });

  it('never shortens a status by reapplying it for less (Blade Runner’s 0.5 s stun on a stunned target)', () => {
    const { state, dummy, applier } = setUp();
    const stunEndsAt = () =>
      dummy.getComponent(StatusEffects).active.find(({ definition }) => definition.id === 'stun')
        ?.expiresTick;

    applier.apply(state, dummy.id, 'stun', 'entity-9'); // 2 s: ends at tick 60
    applier.apply(state, dummy.id, 'stun', 'entity-8', 15);
    expect(stunEndsAt()).toBe(60);

    for (let tick = 0; tick < 54; tick += 1) state.advanceTick(); // 0.2 s (6 ticks) left
    applier.apply(state, dummy.id, 'stun', 'entity-8', 15);
    expect(stunEndsAt()).toBe(54 + 15);
  });

  it.each([0, -3, 1.5])('throws on a duration override of %d ticks', (ticks) => {
    const { state, dummy, applier } = setUp();

    expect(() => applier.apply(state, dummy.id, 'stun', null, ticks)).toThrow(/positive whole/);
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

  it('takes stacks off with one event: status-stacks-lost while some stay, status-expired at none', () => {
    const { state, dummy, events, applier } = setUp();
    const lost: GameEventMap['status-stacks-lost'][] = [];
    state.events.on('status-stacks-lost', (payload) => lost.push(payload));
    applier.apply(state, dummy.id, 'enraged', 'entity-9');
    applier.apply(state, dummy.id, 'enraged', 'entity-9'); // 2 stacks: one per structure per lane
    const before = events.length;

    expect(applier.removeStacks(state, dummy.id, 'enraged', 1)).toBe(true);
    expect(lost).toEqual([
      { entityId: dummy.id, statusId: 'enraged', sourceId: 'entity-9', stacks: 1 },
    ]);
    expect(events).toHaveLength(before);

    expect(applier.removeStacks(state, dummy.id, 'enraged', 1)).toBe(true);
    expect(events.slice(before)).toEqual([
      ['expired', { entityId: dummy.id, statusId: 'enraged', sourceId: 'entity-9' }],
    ]);
    expect(lost).toHaveLength(1);
    expect(applier.removeStacks(state, dummy.id, 'enraged', 1)).toBe(false);
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

  describe('a status that grants an ability (Fury’s dash, DEC-270)', () => {
    const setUpLegend = () => {
      const { state, caster } = casterState();
      const applier = new StatusEffectApplier(loadStatusEffects(CONFIG.tickRate, 2));
      return { state, caster, applier, slot: caster.getComponent(Abilities).slot('granted') };
    };

    it('fills the holder’s granted slot while it lasts and empties it when removed', () => {
      const { state, caster, applier, slot } = setUpLegend();

      applier.apply(state, caster.id, 'fury', caster.id);

      expect(slot?.abilityId).toBe('fury-dash');

      applier.remove(state, caster.id, 'fury');

      expect(slot?.abilityId).toBeNull();
    });

    it('empties the slot when the status runs out', () => {
      const { state, caster, applier, slot } = setUpLegend();
      applier.apply(state, caster.id, 'fury', caster.id);

      for (let tick = 0; tick < 239; tick += 1) state.advanceTick();
      applier.expire(state, caster.id);

      expect(slot?.abilityId).toBe('fury-dash');

      state.advanceTick();
      applier.expire(state, caster.id);

      expect(slot?.abilityId).toBeNull();
    });

    it('leaves the slot alone when it holds another ability, or the status grants none', () => {
      const { state, caster, applier, slot } = setUpLegend();
      applier.apply(state, caster.id, 'fury', caster.id);
      applier.apply(state, caster.id, 'stun', null);
      slot?.hold('other-dash');

      applier.remove(state, caster.id, 'stun');
      applier.remove(state, caster.id, 'fury');

      expect(slot?.abilityId).toBe('other-dash');
    });

    it('empties the slot when the last stack of a stacking status is taken off', () => {
      const { state, caster } = casterState();
      const shipped = loadStatusEffects(CONFIG.tickRate, 2);
      /** Fury that stacks up to 2, as a minion level does. */
      const surge = {
        ...shipped.get('fury'),
        id: 'surge',
        stacking: 'intensity' as const,
        maxStacks: 2,
      };
      const applier = new StatusEffectApplier(new ContentCatalogue([...shipped.all(), surge]));
      const slot = caster.getComponent(Abilities).slot('granted');
      applier.apply(state, caster.id, 'surge', caster.id);
      applier.apply(state, caster.id, 'surge', caster.id);

      applier.removeStacks(state, caster.id, 'surge', 1);

      expect(slot?.abilityId).toBe('fury-dash');

      applier.removeStacks(state, caster.id, 'surge', 1);

      expect(slot?.abilityId).toBeNull();
    });

    describe('while two statuses grant an ability', () => {
      const shipped = loadStatusEffects(CONFIG.tickRate, 2);
      /** Fury, and a test status that grants another dash for 2 s (tick 60). */
      const twoGranting = () => {
        const { state, caster } = casterState();
        const frenzy = { ...shipped.get('fury'), id: 'frenzy', durationTicks: 60, grants: 'leap' };
        const applier = new StatusEffectApplier(new ContentCatalogue([...shipped.all(), frenzy]));
        return { state, caster, applier, slot: caster.getComponent(Abilities).slot('granted') };
      };

      it('gives the slot back to the other status’s ability when the one it holds is removed', () => {
        const { state, caster, applier, slot } = twoGranting();
        applier.apply(state, caster.id, 'fury', caster.id);
        applier.apply(state, caster.id, 'frenzy', caster.id);

        expect(slot?.abilityId).toBe('leap');

        applier.remove(state, caster.id, 'frenzy');

        expect(slot?.abilityId).toBe('fury-dash');
      });

      it('gives the slot back to the other status’s ability when the one it holds runs out', () => {
        const { state, caster, applier, slot } = twoGranting();
        applier.apply(state, caster.id, 'fury', caster.id);
        applier.apply(state, caster.id, 'frenzy', caster.id);

        for (let tick = 0; tick < 60; tick += 1) state.advanceTick();
        applier.expire(state, caster.id);

        expect(slot?.abilityId).toBe('fury-dash');
      });
    });

    describe('when the status that ends applies a granting status (onExpire)', () => {
      const shipped = loadStatusEffects(CONFIG.tickRate, 2);
      /**
       * `rage` grants `granted` for 2 s (tick 60), then applies `then`; `frenzy` grants `leap`.
       * Fury lasts a fixed 8 s (tick 240) here, not its TUNE value, so it always outlasts `rage`.
       */
      const withFollowUp = (granted: string, then = 'fury') => {
        const { state, caster } = casterState();
        const fury = { ...shipped.get('fury'), durationTicks: 240 };
        const rage = {
          ...fury,
          id: 'rage',
          durationTicks: 60,
          grants: granted,
          onExpire: [{ kind: 'apply-status', statusId: then }] as const,
        };
        const frenzy = { ...fury, id: 'frenzy', grants: 'leap' };
        const others = [...shipped.all()].filter(({ id }) => id !== 'fury');
        const applier = new StatusEffectApplier(
          new ContentCatalogue([...others, fury, rage, frenzy]),
        );
        return { state, caster, applier, slot: caster.getComponent(Abilities).slot('granted') };
      };

      it('keeps the cooldown when the follow-up grants the same ability', () => {
        const { state, caster, applier, slot } = withFollowUp('fury-dash');
        applier.apply(state, caster.id, 'rage', caster.id);
        slot?.recordCast(state.tick, 1000);

        for (let tick = 0; tick < 60; tick += 1) state.advanceTick();
        applier.expire(state, caster.id);

        expect(slot?.abilityId).toBe('fury-dash');
        expect(slot?.cooldownRemaining(state.tick)).toBe(940);
      });

      it('gives the slot to the follow-up’s grant, even when a later status grants another', () => {
        const { state, caster, applier, slot } = withFollowUp('charge');
        applier.apply(state, caster.id, 'fury', caster.id);
        applier.apply(state, caster.id, 'frenzy', caster.id);
        applier.apply(state, caster.id, 'rage', caster.id);

        for (let tick = 0; tick < 60; tick += 1) state.advanceTick();
        applier.expire(state, caster.id);

        expect(slot?.abilityId).toBe('fury-dash');
      });

      it('empties the slot when the follow-up does not land', () => {
        const { state, caster, applier, slot } = withFollowUp('fury-dash');
        applier.apply(state, caster.id, 'rage', caster.id);
        caster.getComponent(Health).applyDamage(1_000_000);

        for (let tick = 0; tick < 60; tick += 1) state.advanceTick();
        applier.expire(state, caster.id);

        expect(slot?.abilityId).toBeNull();
      });

      it('empties the slot when the follow-up grants no ability', () => {
        const { state, caster, applier, slot } = withFollowUp('fury-dash', 'control-immune');
        applier.apply(state, caster.id, 'rage', caster.id);

        for (let tick = 0; tick < 60; tick += 1) state.advanceTick();
        applier.expire(state, caster.id);

        expect(caster.getComponent(StatusEffects).has('control-immune')).toBe(true);
        expect(slot?.abilityId).toBeNull();
      });
    });

    it('lands on a unit with no ability bar', () => {
      const { state, dummy, applier } = setUp();

      expect(applier.apply(state, dummy.id, 'fury', null)).toBe(true);
      expect(applier.remove(state, dummy.id, 'fury')).toBe(true);
    });
  });
});
