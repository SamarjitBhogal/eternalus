import { describe, expect, it } from 'vitest';

import { placeholderRoster } from './placeholderRoster';

describe('placeholderRoster', () => {
  it('makes every Legend but each Rover a normal bot laner, classes in turn', () => {
    const laners = placeholderRoster(10, 'light').filter(({ role }) => role === 'laner');

    expect(laners).toHaveLength(18);
    expect(laners.filter(({ team }) => team === 'dark')).toHaveLength(9);
    expect(laners.every(({ difficulty }) => difficulty === 'normal')).toBe(true);
    expect(laners.slice(0, 4).map(({ definitionId }) => definitionId)).toEqual([
      'warrior',
      'sentinel',
      'magus',
      'warrior',
    ]);
  });

  it('gives only the other team a bot Rover: the player is their own team’s Rover', () => {
    const rovers = placeholderRoster(10, 'light').filter(({ role }) => role === 'rover');

    expect(rovers).toEqual([
      { team: 'dark', definitionId: 'warrior', role: 'rover', difficulty: 'rover' },
    ]);
    expect(placeholderRoster(10, 'dark').find(({ role }) => role === 'rover')?.team).toBe('light');
  });
});
