import { describe, expect, it } from 'vitest';

import { ContentCatalogue } from './ContentCatalogue';
import { createDefaultContentRules } from './defaultContentRules';
import { LEGEND_CLASSES } from './legends/legendCatalogue';
import { ContentValidator } from './validation/ContentValidator';
import { KebabCaseIdRule } from './validation/KebabCaseIdRule';
import { KnownWeaponRule } from './validation/KnownWeaponRule';
import { PositiveStatsRule } from './validation/PositiveStatsRule';

describe('createDefaultContentRules', () => {
  it('lists every shipped rule', () => {
    const rules = createDefaultContentRules();

    expect(rules.map((rule) => rule.constructor)).toEqual([
      KebabCaseIdRule,
      PositiveStatsRule,
      KnownWeaponRule,
    ]);
  });

  it('accepts every shipped Legend and reports each broken rule of a bad definition', () => {
    const validator = new ContentValidator(createDefaultContentRules());
    const broken = new ContentCatalogue([
      { ...LEGEND_CLASSES.get('warrior'), id: 'Bad_Id', baseHealth: 0 },
    ]);

    expect(() => {
      validator.validate(LEGEND_CLASSES);
    }).not.toThrow();
    expect(() => {
      validator.validate(broken);
    }).toThrow(
      'Invalid content: Bad_Id: id must be kebab-case; ' +
        'Bad_Id: baseHealth must be a positive finite number',
    );
  });

  it('rejects a Legend whose default weapon is not among the given weapons', () => {
    const validator = new ContentValidator(createDefaultContentRules({ has: () => false }));
    const armed = new ContentCatalogue([
      { ...LEGEND_CLASSES.get('warrior'), defaultLoadout: { primaryWeaponId: 'test-talons' } },
    ]);

    expect(() => {
      validator.validate(armed);
    }).toThrow('warrior: defaultLoadout.primaryWeaponId "test-talons" names no weapon');
  });
});
