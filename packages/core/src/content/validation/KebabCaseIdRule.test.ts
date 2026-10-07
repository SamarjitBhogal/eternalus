import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendClasses';
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
});
