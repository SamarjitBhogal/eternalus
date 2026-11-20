import { describe, expect, it } from 'vitest';

import { casterState } from '../../abilities/__fixtures__/casterState';
import { StatusEffectApplier } from '../../combat/StatusEffectApplier';
import { Abilities } from '../../components/Abilities';
import { StatusEffects } from '../../components/StatusEffects';
import { loadStatusEffects } from '../../content/status-effects/loadStatusEffects';
import { GrantedSlotMatchesStatusInvariant } from './GrantedSlotMatchesStatusInvariant';

const STATUSES = loadStatusEffects(30, 2);

/** A Warrior (`entity-1`) with its kit, the shipped statuses and its `granted` slot. */
const setUp = () => {
  const { state, caster } = casterState();
  const applier = new StatusEffectApplier(STATUSES);
  const statuses = caster.getComponent(StatusEffects);
  const slot = caster.getComponent(Abilities).slot('granted');
  return { state, caster, applier, statuses, slot };
};

const check = (state: ReturnType<typeof setUp>['state']) =>
  new GrantedSlotMatchesStatusInvariant().check(state);

describe('GrantedSlotMatchesStatusInvariant', () => {
  it('holds while the applier keeps the slot and the statuses in step', () => {
    const { state, caster, applier } = setUp();

    expect(check(state)).toEqual([]);
    applier.apply(state, caster.id, 'fury', caster.id);
    applier.apply(state, caster.id, 'stun', null);
    expect(check(state)).toEqual([]);
    applier.remove(state, caster.id, 'fury');
    expect(check(state)).toEqual([]);
  });

  it('flags a granted ability left behind by a status ended around the applier', () => {
    const { state, caster, applier, statuses } = setUp();
    applier.apply(state, caster.id, 'fury', caster.id);

    statuses.remove('fury'); // the Duel reset's old bypass

    expect(check(state)).toEqual([
      expect.objectContaining({
        invariantId: 'granted-slot-matches-status',
        entityId: caster.id,
        details: { held: 'fury-dash' },
      }),
    ]);
  });

  it('flags an empty slot while a status grants an ability', () => {
    const { state, caster, statuses } = setUp();

    statuses.apply(STATUSES.get('fury'), caster.id, 0); // around the applier: the slot stays empty

    expect(check(state)).toEqual([
      expect.objectContaining({
        invariantId: 'granted-slot-matches-status',
        entityId: caster.id,
        details: { held: 'none' },
      }),
    ]);
  });

  it('flags a slot holding an ability no active status grants', () => {
    const { state, caster, applier, slot } = setUp();
    applier.apply(state, caster.id, 'fury', caster.id);

    slot?.hold('blade-runner');

    expect(check(state)).toEqual([
      expect.objectContaining({ entityId: caster.id, details: { held: 'blade-runner' } }),
    ]);
  });
});
