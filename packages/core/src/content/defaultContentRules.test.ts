import { describe, expect, it } from 'vitest';

import { ContentCatalogue } from './ContentCatalogue';
import {
  createDefaultContentRules,
  createLegendSpecRules,
  createLockedClassRules,
} from './defaultContentRules';
import { LEGEND_CLASSES } from './legends/legendCatalogue';
import { LEGEND_SPECS } from './legends/specs/legendSpecCatalogue';
import { ORACLE } from './legends/specs/oracle';
import { ContentValidator } from './validation/ContentValidator';
import { KebabCaseIdRule } from './validation/KebabCaseIdRule';
import { KnownLevelCurveRule } from './validation/KnownLevelCurveRule';
import { LevelScalingRule } from './validation/LevelScalingRule';
import { PositiveAetherRule } from './validation/PositiveAetherRule';
import { PositiveStatsRule } from './validation/PositiveStatsRule';
import { RoleRatingRangeRule } from './validation/RoleRatingRangeRule';
import { SpecClassExistsRule } from './validation/SpecClassExistsRule';

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

describe('createLegendSpecRules', () => {
  it('lists every shipped Legend-spec rule', () => {
    const rules = createLegendSpecRules(LEGEND_CLASSES);

    expect(rules.map((rule) => rule.constructor)).toEqual([
      KebabCaseIdRule,
      SpecClassExistsRule,
      RoleRatingRangeRule,
    ]);
  });

  it('accepts every shipped Legend and reports each broken rule of a bad spec', () => {
    const validator = new ContentValidator(createLegendSpecRules(LEGEND_CLASSES));
    const broken = new ContentCatalogue([
      {
        ...LEGEND_SPECS.get(ORACLE.id),
        id: 'Bad_Id',
        classId: 'harbinger',
        roleRatings: { damage: 0.5, support: 1.5, control: 0.5 },
      },
    ]);

    expect(() => {
      validator.validate(LEGEND_SPECS);
    }).not.toThrow();
    expect(() => {
      validator.validate(broken);
    }).toThrow(
      'Invalid content: Bad_Id: id must be kebab-case; ' +
        'Bad_Id: classId "harbinger" is not a Legend class; ' +
        'Bad_Id: roleRatings.support must be a fraction from 0 to 1',
    );
  });
});

describe('createLockedClassRules', () => {
  it('lists every shipped locked-class rule', () => {
    expect(createLockedClassRules().map((rule) => rule.constructor)).toEqual([KebabCaseIdRule]);
  });
});
