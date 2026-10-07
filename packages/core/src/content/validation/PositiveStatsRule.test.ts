import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendClasses';
import { PositiveStatsRule } from './PositiveStatsRule';

const WARRIOR = LEGEND_CLASSES.get('warrior');

describe('PositiveStatsRule', () => {
  it('accepts positive finite stats', () => {
    expect(new PositiveStatsRule().check(WARRIOR)).toEqual([]);
  });

  it('flags every stat that is zero, negative, infinite or NaN', () => {
    const broken = {
      ...WARRIOR,
      baseHealth: 0,
      footprintRadius: -1,
      movement: { maxSpeed: Number.POSITIVE_INFINITY, acceleration: Number.NaN, mass: 1 },
    };

    expect(new PositiveStatsRule().check(broken)).toEqual([
      'baseHealth must be a positive finite number',
      'footprintRadius must be a positive finite number',
      'maxSpeed must be a positive finite number',
      'acceleration must be a positive finite number',
    ]);
  });
});
