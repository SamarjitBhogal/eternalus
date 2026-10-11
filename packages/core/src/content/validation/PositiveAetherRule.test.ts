import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import type { LegendDefinition } from '../legends/legends.types';
import { TRAINING_DUMMY } from '../mobs/trainingDummy';
import { PositiveAetherRule } from './PositiveAetherRule';

const MAGUS = LEGEND_CLASSES.get('magus');

describe('PositiveAetherRule', () => {
  it('accepts a positive finite aether pool', () => {
    expect(new PositiveAetherRule().check(MAGUS)).toEqual([]);
  });

  it('flags an aether pool that is zero, negative, infinite or NaN', () => {
    for (const bad of [0, -5, Number.POSITIVE_INFINITY, Number.NaN]) {
      const broken: LegendDefinition = { ...MAGUS, baseAether: bad };
      expect(new PositiveAetherRule().check(broken)).toEqual([
        'baseAether must be a positive finite number',
      ]);
    }
  });

  it('ignores units that have no aether, such as mobs', () => {
    expect(new PositiveAetherRule().check(TRAINING_DUMMY)).toEqual([]);
  });
});
