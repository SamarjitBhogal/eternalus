import { describe, expect, it } from 'vitest';

import type { LegendDefinition } from '../legends/legends.types';
import { MAGUS } from '../legends/magus';
import { LIGHT_MINION } from '../mobs/lightMinion';
import { KnownLevelCurveRule } from './KnownLevelCurveRule';

describe('KnownLevelCurveRule', () => {
  it('accepts a known curve and a unit that does not level', () => {
    expect(new KnownLevelCurveRule().check(MAGUS)).toEqual([]);
    expect(new KnownLevelCurveRule().check(LIGHT_MINION)).toEqual([]);
  });

  it('flags an unknown curve id', () => {
    const broken: LegendDefinition = { ...MAGUS, levelCurveId: 'nope' };

    expect(new KnownLevelCurveRule().check(broken)).toEqual([
      'levelCurveId "nope" is not a known curve',
    ]);
  });

  it('does not accept an inherited key such as "constructor"', () => {
    const broken: LegendDefinition = { ...MAGUS, levelCurveId: 'constructor' };

    expect(new KnownLevelCurveRule().check(broken)).toHaveLength(1);
  });
});
