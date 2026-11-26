import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { MOB_DEFINITIONS } from '../mobs/mobCatalogue';
import { WEAPONS } from '../weapons/weaponCatalogue';
import { DefaultWeaponAllowedRule } from './DefaultWeaponAllowedRule';

const RULE = new DefaultWeaponAllowedRule(WEAPONS);
const WARRIOR = LEGEND_CLASSES.get('warrior');

describe('DefaultWeaponAllowedRule', () => {
  it('accepts every shipped Legend class and a mob, which names no weapon', () => {
    expect(LEGEND_CLASSES.all().flatMap((legend) => RULE.check(legend))).toEqual([]);
    expect(RULE.check(MOB_DEFINITIONS.get('light-minion'))).toEqual([]);
  });

  it('rejects a class whose default weapon it may not use', () => {
    const armed = { ...WARRIOR, defaultLoadout: { primaryWeaponId: 'magus-staff' } };

    expect(RULE.check(armed)).toEqual([
      'defaultLoadout.primaryWeaponId "magus-staff" is not allowed for class "warrior"',
    ]);
  });

  it('skips a default weapon id that names no weapon (KnownWeaponRule reports it)', () => {
    const armed = { ...WARRIOR, defaultLoadout: { primaryWeaponId: 'nope' } };

    expect(RULE.check(armed)).toEqual([]);
  });
});
