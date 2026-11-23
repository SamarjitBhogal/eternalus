import { describe, expect, it } from 'vitest';

import { StatusEffects } from '../../components/StatusEffects';
import { loadStatusEffects } from '../../content/status-effects/loadStatusEffects';
import { STATUS_EFFECTS } from '../../content/status-effects/statusEffectCatalogue';
import type { Entity } from '../../entities/Entity';
import type { GameEventMap } from '../../state/GameEvents.types';
import { casterState } from '../__fixtures__/casterState';
import { castSteps } from '../__fixtures__/castSteps';
import { BuffEffect } from './BuffEffect';

const setUp = () => {
  const { state, factory, caster } = casterState();
  const at = (x: number, team: 'light' | 'dark') => {
    state.entities.add(
      factory.create('light-mob', 'training-dummy', { position: { x, y: 0 }, team }),
    );
  };
  const applied: GameEventMap['status-applied'][] = [];
  state.events.on('status-applied', (payload) => applied.push(payload));
  const expiryOf = (entity: Entity, statusId: string) =>
    entity.getComponent(StatusEffects).active.find(({ definition }) => definition.id === statusId)
      ?.expiresTick;
  return { state, caster, at, applied, expiryOf };
};

describe('BuffEffect', () => {
  it('has the kind it is registered under', () => {
    expect(new BuffEffect(STATUS_EFFECTS).kind).toBe('buff');
  });

  it('applies its status to the caster only, credited to the caster', () => {
    const { state, caster, at, applied } = setUp();
    at(1, 'light');
    at(-1, 'dark');

    castSteps(state, caster.id, [{ kind: 'buff', statusId: 'fury' }]);

    expect(applied).toEqual([{ entityId: caster.id, statusId: 'fury', sourceId: caster.id }]);
  });

  it('lasts the step’s own duration when it has one, the status’s otherwise', () => {
    const { state, caster, expiryOf } = setUp();

    castSteps(state, caster.id, [
      { kind: 'buff', statusId: 'rallied', durationTicks: 15 },
      { kind: 'buff', statusId: 'fury' },
    ]);

    expect(expiryOf(caster, 'rallied')).toBe(state.tick + 15);
    expect(expiryOf(caster, 'fury')).toBe(state.tick + 240);
  });

  it('checks its own fields: a known status, a duration override of at least one tick', () => {
    const buff = new BuffEffect(STATUS_EFFECTS);
    const fury = { kind: 'buff', statusId: 'fury' } as const;

    expect(buff.validate(fury)).toEqual([]);
    expect(buff.validate({ ...fury, durationTicks: 15 })).toEqual([]);
    expect(buff.validate({ ...fury, statusId: 'frenzy', durationTicks: 0 })).toEqual([
      'buff status "frenzy" is unknown',
      'buff duration must be positive',
    ]);
  });

  it('draws nothing on the aim overlay: it has no area', () => {
    expect(new BuffEffect(STATUS_EFFECTS).describe()).toEqual([]);
  });

  describe('with Erudition on the caster (abilityDuration x1.2)', () => {
    const withErudition = () => {
      const context = setUp();
      context.caster
        .getComponent(StatusEffects)
        .apply(loadStatusEffects(30, 2).get('erudition'), null, 0);
      return context;
    };

    it('stretches a timed buff: fury’s 240 ticks last 288, a 15-tick override 18', () => {
      const { state, caster, expiryOf } = withErudition();

      castSteps(state, caster.id, [
        { kind: 'buff', statusId: 'rallied', durationTicks: 15 },
        { kind: 'buff', statusId: 'fury' },
      ]);

      expect(expiryOf(caster, 'rallied')).toBe(state.tick + 18);
      expect(expiryOf(caster, 'fury')).toBe(state.tick + 288);
    });

    it('keeps a permanent status permanent', () => {
      const { state, caster, expiryOf } = withErudition();

      castSteps(state, caster.id, [{ kind: 'buff', statusId: 'enraged' }]);

      expect(expiryOf(caster, 'enraged')).toBeNull();
    });
  });
});
