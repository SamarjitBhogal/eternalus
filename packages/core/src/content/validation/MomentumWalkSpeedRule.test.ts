import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import type { LegendDefinition } from '../legends/legends.types';
import { MomentumWalkSpeedRule } from './MomentumWalkSpeedRule';

const SENTINEL = LEGEND_CLASSES.get('sentinel');

/** The Sentinel with its momentum `walkSpeed` set to `walkSpeed`. */
const withWalkSpeed = (walkSpeed: number): LegendDefinition => {
  const { movementProfile } = SENTINEL;
  if (!movementProfile.momentum) throw new Error('The shipped Sentinel has momentum.');
  return {
    ...SENTINEL,
    movementProfile: { ...movementProfile, momentum: { ...movementProfile.momentum, walkSpeed } },
  };
};

describe('MomentumWalkSpeedRule', () => {
  it('accepts the shipped Sentinel and units without momentum', () => {
    expect(new MomentumWalkSpeedRule().check(SENTINEL)).toEqual([]);
    expect(new MomentumWalkSpeedRule().check(LEGEND_CLASSES.get('warrior'))).toEqual([]);
  });

  it('flags a walk speed at or above the top speed', () => {
    const { maxSpeed } = SENTINEL.movementProfile;
    for (const walkSpeed of [maxSpeed, maxSpeed + 1]) {
      expect(new MomentumWalkSpeedRule().check(withWalkSpeed(walkSpeed))).toEqual([
        'momentum.walkSpeed must be below maxSpeed',
      ]);
    }
  });
});
