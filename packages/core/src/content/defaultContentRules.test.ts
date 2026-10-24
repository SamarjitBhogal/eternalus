import { describe, expect, it } from 'vitest';

import { ContentCatalogue } from './ContentCatalogue';
import {
  createDefaultContentRules,
  createLegendSpecRules,
  createLockedClassRules,
} from './defaultContentRules';
import { LEGEND_CLASSES } from './legends/legendCatalogue';
import { LEGEND_SPECS } from './legends/specs/legendSpecCatalogue';
import { ContentValidator } from './validation/ContentValidator';
import { KebabCaseIdRule } from './validation/KebabCaseIdRule';
import { KnownLevelCurveRule } from './validation/KnownLevelCurveRule';
import { LevelScalingRule } from './validation/LevelScalingRule';
import { PositiveAetherRule } from './validation/PositiveAetherRule';
import { PositiveStatsRule } from './validation/PositiveStatsRule';
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

    expect(rules.map((rule) => rule.constructor)).toEqual([KebabCaseIdRule, SpecClassExistsRule]);
  });

  it('accepts every shipped Legend and reports each broken rule of a bad spec', () => {
    const validator = new ContentValidator(createLegendSpecRules(LEGEND_CLASSES));
    const broken = new ContentCatalogue([
      { ...LEGEND_SPECS.get('oracle'), id: 'Bad_Id', classId: 'flying' },
    ]);

    expect(() => {
      validator.validate(LEGEND_SPECS);
    }).not.toThrow();
    expect(() => {
      validator.validate(broken);
    }).toThrow(
      'Invalid content: Bad_Id: id must be kebab-case; ' +
        'Bad_Id: classId "flying" is not a Legend class',
    );
  });
});

describe('createLockedClassRules', () => {
  it('lists every shipped locked-class rule', () => {
    expect(createLockedClassRules().map((rule) => rule.constructor)).toEqual([KebabCaseIdRule]);
  });
});
