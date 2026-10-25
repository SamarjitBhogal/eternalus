import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import type { LegendDefinition } from '../legends/legends.types';
import { LIGHT_MINION } from '../mobs/lightMinion';
import { KnownLevelCurveRule } from './KnownLevelCurveRule';

const MAGUS = LEGEND_CLASSES.get('magus');
const CURVES = { has: (id: string): boolean => id === 'legend' };

describe('KnownLevelCurveRule', () => {
  it('accepts a Legend whose curve is in the given catalogue, and ignores mobs', () => {
    expect(new KnownLevelCurveRule(CURVES).check(MAGUS)).toEqual([]);
    expect(new KnownLevelCurveRule(CURVES).check(LIGHT_MINION)).toEqual([]);
  });

  it('flags a Legend curve id the catalogue does not have', () => {
    const broken: LegendDefinition = { ...MAGUS, levelCurveId: 'nope' };

    expect(new KnownLevelCurveRule(CURVES).check(broken)).toEqual([
      'levelCurveId "nope" is not a known curve',
    ]);
  });

  it('checks against the injected catalogue, not the shipped curves', () => {
    expect(new KnownLevelCurveRule({ has: () => false }).check(MAGUS)).toEqual([
      'levelCurveId "legend" is not a known curve',
    ]);
  });

  it('flags a Legend that names no curve at all', () => {
    const unlevelled = { ...LIGHT_MINION, kind: 'magus' };

    expect(new KnownLevelCurveRule(CURVES).check(unlevelled)).toEqual([
      'levelCurveId "undefined" is not a known curve',
    ]);
  });
});
