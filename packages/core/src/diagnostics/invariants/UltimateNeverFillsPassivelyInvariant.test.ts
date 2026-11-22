import { describe, expect, it } from 'vitest';

import { casterState, TEST_KIT } from '../../abilities/__fixtures__/casterState';
import { Abilities } from '../../components/Abilities';
import { UltimateNeverFillsPassivelyInvariant } from './UltimateNeverFillsPassivelyInvariant';

const setUp = () => {
  const { state, caster } = casterState(TEST_KIT);
  const meter = caster.getComponent(Abilities).slot('ability-4');
  if (meter === undefined) {
    throw new Error('The Warrior has an ultimate slot.');
  }
  const check = () => new UltimateNeverFillsPassivelyInvariant().check(state);
  return { state, caster, meter, check };
};

describe('UltimateNeverFillsPassivelyInvariant', () => {
  it('holds for an empty meter and for a meter that matches its announcement', () => {
    const { state, caster, meter, check } = setUp();
    expect(check()).toEqual([]);

    meter.charge = 0.25;
    state.events.emit('ultimate-charged', {
      entityId: caster.id,
      amount: 0.25,
      charge: 0.25,
      cause: 'legend-kill',
    });

    expect(check()).toEqual([]);
  });

  it('flags a meter written by hand, without an announcement', () => {
    const { caster, meter, check } = setUp();
    meter.charge = 0.5;

    expect(check()).toEqual([
      expect.objectContaining({
        invariantId: 'ultimate-never-fills-passively',
        entityId: caster.id,
        details: { charge: 0.5, announced: 0 },
      }),
    ]);
  });

  it("holds after an ultimate's cast empties an announced meter", () => {
    const { state, caster, meter, check } = setUp();
    meter.charge = 1;
    state.events.emit('ultimate-charged', {
      entityId: caster.id,
      amount: 1,
      charge: 1,
      cause: 'legend-kill',
    });

    meter.recordCast(state.tick, 0);
    state.events.emit('ability-cast', {
      casterId: caster.id,
      abilityId: 'fake-ultimate',
      slot: 'ability-4',
    });

    expect(check()).toEqual([]);
  });
});
