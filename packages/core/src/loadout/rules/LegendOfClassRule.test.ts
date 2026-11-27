import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../../content/legends/legendCatalogue';
import { LEGEND_SPECS } from '../../content/legends/specs/legendSpecCatalogue';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import type { LoadoutContent } from '../LoadoutValidator.types';
import { LegendOfClassRule } from './LegendOfClassRule';

const CONTENT: LoadoutContent = {
  legends: LEGEND_CLASSES,
  specs: LEGEND_SPECS,
  weapons: loadWeapons(30),
};

const rule = new LegendOfClassRule();

const problemsOf = (classId: string, specId: string | null) =>
  rule.check({ classId, specId, primaryWeaponId: 'wuuthrad' }, CONTENT);

describe('LegendOfClassRule', () => {
  it.each(LEGEND_SPECS.all().map(({ id, classId }) => [id, classId]))(
    'passes the Legend %s in a loadout of its class %s',
    (specId, classId) => {
      expect(problemsOf(classId, specId)).toEqual([]);
    },
  );

  it('flags a Legend of another class', () => {
    expect(problemsOf('sentinel', 'knight')).toEqual([
      {
        field: 'class',
        ruleId: 'legend-of-class',
        message: 'Legend "knight" is of class "warrior", not "sentinel"',
      },
    ]);
  });

  it('passes a loadout of no Legend (the class default)', () => {
    expect(problemsOf('magus', null)).toEqual([]);
  });

  it('leaves an unknown Legend or class to ContentExistsRule', () => {
    expect(problemsOf('warrior', 'nobody')).toEqual([]);
    expect(problemsOf('harbinger', 'knight')).toEqual([]);
  });
});
