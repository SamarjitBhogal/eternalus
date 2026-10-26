import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { LEGEND_SPECS } from '../legends/specs/legendSpecCatalogue';
import { ORACLE } from '../legends/specs/oracle';
import { KebabCaseIdRule } from './KebabCaseIdRule';

const WARRIOR = LEGEND_CLASSES.get('warrior');

describe('KebabCaseIdRule', () => {
  it('accepts kebab-case ids with words and digits', () => {
    const rule = new KebabCaseIdRule();

    expect(rule.check(WARRIOR)).toEqual([]);
    expect(rule.check({ ...WARRIOR, id: 'mini-boss-2' })).toEqual([]);
  });

  it('flags upper case, underscores, spaces and stray hyphens', () => {
    const rule = new KebabCaseIdRule();

    for (const id of ['Warrior', 'light_mob', 'light mob', '-mob', 'mob-', 'light--mob', '']) {
      expect(rule.check({ ...WARRIOR, id })).toEqual(['id must be kebab-case']);
    }
  });

  it('checks any definition with an id, such as a Legend spec', () => {
    const rule = new KebabCaseIdRule();

    expect(rule.check(LEGEND_SPECS.get(ORACLE.id))).toEqual([]);
    expect(rule.check({ ...LEGEND_SPECS.get(ORACLE.id), id: 'Bad_Id' })).toEqual([
      'id must be kebab-case',
    ]);
  });
});
