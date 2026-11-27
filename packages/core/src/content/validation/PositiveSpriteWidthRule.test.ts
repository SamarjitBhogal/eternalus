import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import type { LegendDefinition } from '../legends/legends.types';
import { TRAINING_DUMMY } from '../mobs/trainingDummy';
import { PositiveSpriteWidthRule } from './PositiveSpriteWidthRule';

const SENTINEL = LEGEND_CLASSES.get('sentinel');

describe('PositiveSpriteWidthRule', () => {
  it('accepts the shipped Legends: the body ratio of DEC-06, the Warrior at 5.2 m (DEC-424)', () => {
    const widths = ['warrior', 'magus', 'sentinel'].map((id) => LEGEND_CLASSES.get(id).spriteWidth);

    expect(widths).toEqual([5.2, 7.8, 13]);
    expect(
      LEGEND_CLASSES.all().flatMap((legend) => new PositiveSpriteWidthRule().check(legend)),
    ).toEqual([]);
  });

  it('flags a sprite width that is zero, negative, infinite or NaN', () => {
    for (const bad of [0, -5, Number.POSITIVE_INFINITY, Number.NaN]) {
      const broken: LegendDefinition = { ...SENTINEL, spriteWidth: bad };
      expect(new PositiveSpriteWidthRule().check(broken)).toEqual([
        'spriteWidth must be a positive finite number',
      ]);
    }
  });

  it('ignores units that are not Legends, such as mobs', () => {
    expect(new PositiveSpriteWidthRule().check(TRAINING_DUMMY)).toEqual([]);
  });

  it('flags a Legend that has no sprite width at all', () => {
    expect(new PositiveSpriteWidthRule().check({ ...TRAINING_DUMMY, kind: 'sentinel' })).toEqual([
      'spriteWidth must be a positive finite number',
    ]);
  });
});
