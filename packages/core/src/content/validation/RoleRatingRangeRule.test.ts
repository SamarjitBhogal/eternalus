import { describe, expect, it } from 'vitest';

import type { LegendSpecDefinition, RoleRatings } from '../legends/specs/legendSpecs.types';
import { RoleRatingRangeRule } from './RoleRatingRangeRule';

const spec = (roleRatings: RoleRatings | null): LegendSpecDefinition => ({
  id: 'test-legend',
  classId: 'magus',
  isSelectable: true,
  displayName: 'Test Legend',
  legendName: null,
  roleLabel: null,
  description: null,
  roleRatings,
  detailNames: { signature: null, specialty: null, ultimate: null },
});

describe('RoleRatingRangeRule', () => {
  it('accepts ratings from 0 to 1, bounds included, and a spec with none', () => {
    const rule = new RoleRatingRangeRule();

    expect(rule.check(spec({ damage: 0, support: 0.5, control: 1 }))).toEqual([]);
    expect(rule.check(spec(null))).toEqual([]);
  });

  it('flags each rating below 0, above 1 or not a number, naming its role', () => {
    expect(
      new RoleRatingRangeRule().check(spec({ damage: -0.01, support: 1.2, control: Number.NaN })),
    ).toEqual([
      'roleRatings.damage must be a fraction from 0 to 1',
      'roleRatings.support must be a fraction from 0 to 1',
      'roleRatings.control must be a fraction from 0 to 1',
    ]);
  });
});
