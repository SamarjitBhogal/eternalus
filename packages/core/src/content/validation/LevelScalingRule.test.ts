import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import type { LegendDefinition } from '../legends/legends.types';
import { TRAINING_DUMMY } from '../mobs/trainingDummy';
import { LevelScalingRule } from './LevelScalingRule';

const WARRIOR = LEGEND_CLASSES.get('warrior');

describe('LevelScalingRule', () => {
  it('accepts finite scaling of at least 0, and ignores mobs', () => {
    expect(new LevelScalingRule().check(WARRIOR)).toEqual([]);
    const flat: LegendDefinition = {
      ...WARRIOR,
      levelScaling: { healthPerLevel: 0, aetherPerLevel: 0 },
    };
    expect(new LevelScalingRule().check(flat)).toEqual([]);
    expect(new LevelScalingRule().check(TRAINING_DUMMY)).toEqual([]);
  });

  it('flags negative or non-finite per-level scaling', () => {
    const broken: LegendDefinition = {
      ...WARRIOR,
      levelScaling: { healthPerLevel: -0.08, aetherPerLevel: Number.NaN },
    };

    expect(new LevelScalingRule().check(broken)).toEqual([
      'levelScaling.healthPerLevel must be a finite number of at least 0',
      'levelScaling.aetherPerLevel must be a finite number of at least 0',
    ]);
  });
});
