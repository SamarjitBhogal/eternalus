import { describe, expect, it } from 'vitest';

import { ABILITIES } from '../abilities/abilityCatalogue';
import { ASSASSIN } from '../legends/specs/assassin';
import { KNIGHT } from '../legends/specs/knight';
import { WEAPONS } from '../weapons/weaponCatalogue';
import { SecondaryWeaponRule } from './SecondaryWeaponRule';

const rule = new SecondaryWeaponRule(WEAPONS, ABILITIES);

describe('SecondaryWeaponRule (DEC-303)', () => {
  it('accepts the shipped specs: the Zealot with its bow and swap, the Knight with neither', () => {
    expect(rule.check(ASSASSIN)).toEqual([]);
    expect(rule.check(KNIGHT)).toEqual([]);
  });

  it('flags a second weapon that names no weapon', () => {
    expect(rule.check({ ...ASSASSIN, secondaryWeaponId: 'obsidian-bw' })).toEqual([
      'secondaryWeaponId "obsidian-bw" names no weapon',
    ]);
  });

  it('flags a swap artifact on a spec with no second weapon', () => {
    expect(rule.check({ ...ASSASSIN, secondaryWeaponId: null })).toEqual([
      'artifacts "weapon-swap" swaps weapons, but secondaryWeaponId is null',
    ]);
  });

  it('flags a second weapon that no artifact swaps to, wherever the swap would sit', () => {
    expect(rule.check({ ...ASSASSIN, artifacts: [null, null] })).toEqual([
      'secondaryWeaponId "obsidian-bow" is never in hand: no artifact swaps weapons',
    ]);
    expect(rule.check({ ...ASSASSIN, artifacts: [null, 'weapon-swap'] })).toEqual([]);
  });

  it('leaves an artifact that names no ability to KnownAbilityRefsRule', () => {
    expect(rule.check({ ...KNIGHT, artifacts: ['nope', null] })).toEqual([]);
  });
});
