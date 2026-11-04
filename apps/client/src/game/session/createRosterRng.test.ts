import { SeededRandom } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { createRosterRng } from './createRosterRng';

const draws = (rng: Pick<SeededRandom, 'nextInt'>): number[] =>
  Array.from({ length: 20 }, () => rng.nextInt(0, 999));

describe('createRosterRng', () => {
  it('repeats its stream for the same seed', () => {
    expect(draws(createRosterRng(42))).toEqual(draws(createRosterRng(42)));
  });

  it('draws apart from the match seed’s own stream, so the roster never follows the team draw', () => {
    expect(draws(createRosterRng(42))).not.toEqual(draws(new SeededRandom(42)));
  });
});
