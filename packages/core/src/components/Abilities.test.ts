import { describe, expect, it } from 'vitest';

import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import { Abilities } from './Abilities';

const KIT = { abilities: ['slam', 'rip-and-tear', 'shield-wall'], ultimate: 'berserk' } as const;

describe('Abilities', () => {
  it('puts the kit on keys 1-3 and the ultimate on key 4, the other slots empty, in bar order', () => {
    const bar = new Abilities(KIT);

    expect(bar.slots.map(({ slot, abilityId }) => [slot, abilityId])).toEqual([
      ['ability-1', 'slam'],
      ['ability-2', 'rip-and-tear'],
      ['ability-3', 'shield-wall'],
      ['ability-4', 'berserk'],
      ['gadget-1', null],
      ['gadget-2', null],
      ['default-action', null],
      ['granted', null],
    ]);
  });

  it('finds a slot by name, and nothing for a name that is no slot', () => {
    const bar = new Abilities(KIT);

    expect(bar.slot('ability-4')?.abilityId).toBe('berserk');
    expect(bar.slot('ability-9' as AbilitySlot)).toBeUndefined();
  });

  it('knows whether any slot has a cast waiting', () => {
    const bar = new Abilities(KIT);
    expect(bar.hasPendingCast).toBe(false);

    bar.slot('ability-3')?.queue({ point: { x: 0, y: 0 }, targetId: null });

    expect(bar.hasPendingCast).toBe(true);
  });
  describe('the passive (05 §7, DEC-338)', () => {
    it('is due at once and given out once, then due again after a rearm', () => {
      const bar = new Abilities(KIT, 'necromancy');

      expect(bar.isPassiveDue).toBe(true);
      expect(bar.takeDuePassive()).toBe('necromancy');
      expect(bar.isPassiveDue).toBe(false);
      expect(bar.takeDuePassive()).toBeNull();

      bar.rearmPassive();

      expect(bar.isPassiveDue).toBe(true);
      expect(bar.takeDuePassive()).toBe('necromancy');
    });

    it('is never due for a Legend with no passive, even after a rearm', () => {
      const bar = new Abilities(KIT);

      expect(bar.passiveId).toBeNull();
      expect(bar.isPassiveDue).toBe(false);
      bar.rearmPassive();
      expect(bar.isPassiveDue).toBe(false);
      expect(bar.takeDuePassive()).toBeNull();
    });
  });
});
