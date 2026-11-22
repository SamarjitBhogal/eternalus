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

  it('puts the artifacts on the gadget slots, an empty one left empty (05 §11, DEC-303)', () => {
    const bar = new Abilities(KIT, [null, 'weapon-swap']);

    expect(bar.slot('gadget-1')?.abilityId).toBeNull();
    expect(bar.slot('gadget-2')?.abilityId).toBe('weapon-swap');
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
});
