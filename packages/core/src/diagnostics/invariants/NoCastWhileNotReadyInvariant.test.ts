import { describe, expect, it } from 'vitest';

import { casterState, TEST_KIT } from '../../abilities/__fixtures__/casterState';
import { Abilities } from '../../components/Abilities';
import { NoCastWhileNotReadyInvariant } from './NoCastWhileNotReadyInvariant';

const setUp = () => {
  const { state, caster } = casterState(TEST_KIT);
  const abilities = caster.getComponent(Abilities);
  return {
    state,
    strike: abilities.slot('ability-1'),
    ultimate: abilities.slot('ability-4'),
    gadget: abilities.slot('gadget-1'),
    check: () => new NoCastWhileNotReadyInvariant().check(state),
  };
};

describe('NoCastWhileNotReadyInvariant', () => {
  it('holds for a cast on a ready slot, and for a full ultimate', () => {
    const { state, strike, ultimate, check } = setUp();
    strike?.recordCast(state.tick, 90);
    if (ultimate !== undefined) ultimate.charge = 1;
    ultimate?.recordCast(state.tick, 0);

    expect(check()).toEqual([]);
  });

  it('flags a cast that began while the cooldown still ran (a skipped check)', () => {
    const { state, strike, check } = setUp();
    strike?.recordCast(state.tick, 90);
    state.advanceTick();
    strike?.recordCast(state.tick, 90);

    expect(check()).toEqual([
      expect.objectContaining({
        invariantId: 'no-cast-while-not-ready',
        entityId: 'entity-1',
        details: { slot: 'ability-1', problem: 'its cooldown ran until tick 90' },
      }),
    ]);
  });

  it('flags an ultimate cast on a meter that was not full, and a cast on an empty slot', () => {
    const { state, ultimate, gadget, check } = setUp();
    ultimate?.recordCast(state.tick, 0);
    gadget?.recordCast(state.tick, 0);

    expect(check().map(({ details }) => details.problem)).toEqual([
      'its meter was at 0',
      'the slot is empty',
    ]);
  });

  it('only audits the casts of this tick', () => {
    const { state, strike, check } = setUp();
    strike?.recordCast(state.tick, 90);
    strike?.recordCast(state.tick, 90); // a bad recast, flagged this tick ...
    expect(check()).toHaveLength(1);

    state.advanceTick();

    expect(check()).toEqual([]); // ... and forgotten the next
  });
});
