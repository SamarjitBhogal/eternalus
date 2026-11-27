import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
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
      movementProfile: { maxSpeed: Number.POSITIVE_INFINITY, acceleration: Number.NaN, mass: 1 },
    };

    expect(new PositiveStatsRule().check(broken)).toEqual([
      'baseHealth must be a positive finite number',
      'footprintRadius must be a positive finite number',
      'maxSpeed must be a positive finite number',
      'acceleration must be a positive finite number',
    ]);
  });

  it('checks the momentum numbers of a unit that has them (the Sentinel)', () => {
    const sentinel = LEGEND_CLASSES.get('sentinel');
    const { momentum } = sentinel.movementProfile;
    if (momentum === undefined) throw new Error('The shipped Sentinel has momentum.');
    const broken = {
      ...sentinel,
      movementProfile: { ...sentinel.movementProfile, momentum: { ...momentum, grip: 0 } },
    };

    expect(new PositiveStatsRule().check(sentinel)).toEqual([]);
    expect(new PositiveStatsRule().check(broken)).toEqual([
      'momentum.grip must be a positive finite number',
    ]);
  });
});
