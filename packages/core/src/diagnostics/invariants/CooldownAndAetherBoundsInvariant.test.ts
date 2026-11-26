import { describe, expect, it } from 'vitest';

import { casterState, TEST_KIT } from '../../abilities/__fixtures__/casterState';
import { ABILITIES_WITH_FAKES } from '../../abilities/__fixtures__/fakeAbilities';
import { Abilities } from '../../components/Abilities';
import { Aether } from '../../components/Aether';
import { CooldownAndAetherBoundsInvariant } from './CooldownAndAetherBoundsInvariant';

const setUp = () => {
  const { state, caster } = casterState(TEST_KIT);
  const abilities = caster.getComponent(Abilities);
  return {
    state,
    aether: caster.getComponent(Aether),
    strike: abilities.slot('ability-1'),
    gadget: abilities.slot('gadget-1'),
    check: () => new CooldownAndAetherBoundsInvariant(ABILITIES_WITH_FAKES).check(state),
  };
};

describe('CooldownAndAetherBoundsInvariant', () => {
  it('holds for a fresh Legend and for one that just cast (cooldown exactly its ability’s)', () => {
    const { state, strike, aether, check } = setUp();
    expect(check()).toEqual([]);

    aether.spend(30);
    strike?.recordCast(state.tick, 90);

    expect(check()).toEqual([]);
  });

  it('flags a cooldown longer than the ability’s own (a stamping bug)', () => {
    const { state, strike, check } = setUp();
    strike?.recordCast(state.tick, 91);

    expect(check()).toEqual([
      expect.objectContaining({
        invariantId: 'cooldown-and-aether-bounds',
        entityId: 'entity-1',
        details: { slot: 'ability-1', cooldownUntilTick: 91, longest: 90 },
      }),
    ]);
  });

  it('flags a fractional cooldown tick and a cooling empty slot', () => {
    const { strike, gadget, check } = setUp();
    if (strike !== undefined) strike.cooldownUntilTick = 1.5;
    if (gadget !== undefined) gadget.cooldownUntilTick = 1;

    expect(check().map(({ details }) => details.slot)).toEqual(['ability-1', 'gadget-1']);
  });

  it('flags a charge outside 0..1', () => {
    const { strike, check } = setUp();
    if (strike !== undefined) strike.charge = 1.2;

    expect(check()).toEqual([
      expect.objectContaining({ details: { slot: 'ability-1', charge: 1.2 } }),
    ]);
  });

  it('flags an aether pool above its max (a refill that ignored the cap)', () => {
    const { aether, check } = setUp();
    // Aether itself never goes above max, so the bug is simulated by overriding the reading.
    Object.defineProperty(aether, 'current', { get: () => 101 });

    expect(check()).toEqual([expect.objectContaining({ details: { current: 101, max: 100 } })]);
  });
});
