import { describe, expect, it } from 'vitest';

import { ContentCatalogue } from '../ContentCatalogue';
import { LEGEND_CLASSES } from '../legends/legendClasses';
import { UNIT_DEFINITIONS } from '../units/unitDefinitions';
import { ContentValidator } from './ContentValidator';
import { DefaultContentValidator } from './DefaultContentValidator';

describe('DefaultContentValidator', () => {
  it('accepts every shipped unit definition', () => {
    expect(() => {
      new DefaultContentValidator().validate(UNIT_DEFINITIONS);
    }).not.toThrow();
  });

  it('is a ContentValidator that runs both shipped rules', () => {
    const broken = new ContentCatalogue([
      { ...LEGEND_CLASSES.get('warrior'), id: 'Bad_Id', baseHealth: 0 },
    ]);
    const validator = new DefaultContentValidator();

    expect(validator).toBeInstanceOf(ContentValidator);
    expect(() => {
      validator.validate(broken);
    }).toThrow(
      'Invalid content: Bad_Id: id must be kebab-case; ' +
        'Bad_Id: baseHealth must be a positive finite number',
    );
  });
});
