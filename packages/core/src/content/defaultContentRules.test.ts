import { describe, expect, it } from 'vitest';

import { ContentCatalogue } from './ContentCatalogue';
import { createDefaultContentRules } from './defaultContentRules';
import { LEGEND_CLASSES } from './legends/legendCatalogue';
import { ContentValidator } from './validation/ContentValidator';
import { KebabCaseIdRule } from './validation/KebabCaseIdRule';
import { KnownLevelCurveRule } from './validation/KnownLevelCurveRule';
import { LevelScalingRule } from './validation/LevelScalingRule';
import { PositiveAetherRule } from './validation/PositiveAetherRule';
import { PositiveStatsRule } from './validation/PositiveStatsRule';

describe('createDefaultContentRules', () => {
  it('lists every shipped rule', () => {
    const rules = createDefaultContentRules();

    expect(rules.map((rule) => rule.constructor)).toEqual([
      KebabCaseIdRule,
      PositiveStatsRule,
      PositiveAetherRule,
      KnownLevelCurveRule,
      LevelScalingRule,
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
});
