import { describe, expect, it } from 'vitest';

import { placeholderRoster } from './placeholderRoster';

describe('placeholderRoster', () => {
  it('makes every Legend but each team’s Rover a normal bot laner, classes in turn', () => {
    const roster = placeholderRoster(10);

    expect(roster).toHaveLength(18);
    expect(roster.filter(({ team }) => team === 'dark')).toHaveLength(9);
    expect(
      roster.every(({ role, difficulty }) => role === 'laner' && difficulty === 'normal'),
    ).toBe(true);
    expect(roster.slice(0, 4).map(({ definitionId }) => definitionId)).toEqual([
      'warrior',
      'sentinel',
      'magus',
      'warrior',
    ]);
  });
});
