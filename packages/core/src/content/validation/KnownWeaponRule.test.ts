import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { ASSASSIN } from '../legends/specs/assassin';
import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import { KnownWeaponRule } from './KnownWeaponRule';

const WARRIOR = LEGEND_CLASSES.get('warrior');
const WEAPONS = { has: (id: string): boolean => id === 'test-talons' };

describe('KnownWeaponRule', () => {
  it('accepts a mob that names no weapon', () => {
    expect(new KnownWeaponRule(WEAPONS).check(MOB_DEFINITIONS.get('light-minion'))).toEqual([]);
  });

  it('flags a Legend that names no weapon', () => {
    const unarmed = { ...WARRIOR, defaultLoadout: undefined };

    expect(new KnownWeaponRule(WEAPONS).check(unarmed)).toEqual([
      'defaultLoadout.primaryWeaponId is required',
    ]);
  });

  it('accepts a Legend whose default weapon exists', () => {
    const armed = { ...WARRIOR, defaultLoadout: { primaryWeaponId: 'test-talons' } };

    expect(new KnownWeaponRule(WEAPONS).check(armed)).toEqual([]);
  });

  it('flags a default weapon that names no weapon', () => {
    const armed = { ...WARRIOR, defaultLoadout: { primaryWeaponId: 'nope' } };

    expect(new KnownWeaponRule(WEAPONS).check(armed)).toEqual([
      'defaultLoadout.primaryWeaponId "nope" names no weapon',
    ]);
  });

  it('accepts a spec with no second weapon or a known one, and flags one that names no weapon (DEC-303)', () => {
    const rule = new KnownWeaponRule(WEAPONS);

    expect(rule.check({ ...ASSASSIN, secondaryWeaponId: null })).toEqual([]);
    expect(rule.check({ ...ASSASSIN, secondaryWeaponId: 'test-talons' })).toEqual([]);
    expect(rule.check({ ...ASSASSIN, secondaryWeaponId: 'obsidian-bw' })).toEqual([
      'secondaryWeaponId "obsidian-bw" names no weapon',
    ]);
  });
});
