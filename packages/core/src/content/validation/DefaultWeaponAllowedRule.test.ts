import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import { WEAPONS } from '../weapons/weaponCatalogue';
import { ContentValidationError } from '../ContentValidationError';
import { loadDefaultContent } from '../loadDefaultContent';
import { DefaultWeaponAllowedRule } from './DefaultWeaponAllowedRule';

const WARRIOR = LEGEND_CLASSES.get('warrior');
const rule = new DefaultWeaponAllowedRule(WEAPONS);

describe('DefaultWeaponAllowedRule', () => {
  it('accepts every shipped Legend and a mob that names no weapon', () => {
    for (const legend of LEGEND_CLASSES.all()) {
      expect(rule.check(legend)).toEqual([]);
    }
    expect(rule.check(MOB_DEFINITIONS.get('light-minion'))).toEqual([]);
  });

  it('flags a default weapon the class may not carry', () => {
    const wrong = { ...WARRIOR, defaultLoadout: { primaryWeaponId: 'magus-staff' } };

    expect(rule.check(wrong)).toEqual([
      'defaultLoadout.primaryWeaponId "magus-staff" may not be carried by class "warrior"',
    ]);
  });

  it('leaves a missing or unknown default weapon to KnownWeaponRule', () => {
    const unarmed = { ...WARRIOR, defaultLoadout: undefined };
    const unknown = { ...WARRIOR, defaultLoadout: { primaryWeaponId: 'nope' } };

    expect(rule.check(unarmed)).toEqual([]);
    expect(rule.check(unknown)).toEqual([]);
  });

  it('refuses, at load, content whose class default weapon breaks it', () => {
    const weapons = {
      has: (id: string) => WEAPONS.has(id),
      get: (id: string) => ({ ...WEAPONS.get(id), uniqueTo: 'magus' as const }),
    };

    expect(() => loadDefaultContent(30, undefined, weapons)).toThrow(ContentValidationError);
  });
});
