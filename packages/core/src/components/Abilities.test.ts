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

  it('ends every cooldown but the ultimate, and leaves the ultimate charge alone (FR-117)', () => {
    const bar = new Abilities(KIT);
    for (const runtime of bar.slots) {
      runtime.cooldownUntilTick = 900;
      runtime.charge = 0.4;
    }

    bar.endCooldownsButUltimate();

    expect(bar.slots.map(({ slot, cooldownUntilTick }) => [slot, cooldownUntilTick])).toEqual([
      ['ability-1', 0],
      ['ability-2', 0],
      ['ability-3', 0],
      ['ability-4', 900],
      ['gadget-1', 0],
      ['gadget-2', 0],
      ['default-action', 0],
    ]);
    expect(bar.slot('ability-4')?.charge).toBe(0.4);
  });
});
