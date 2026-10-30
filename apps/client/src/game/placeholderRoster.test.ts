import { describe, expect, it } from 'vitest';

import { placeholderRoster } from './placeholderRoster';

describe('placeholderRoster', () => {
  it.each(['light', 'dark'] as const)(
    'makes every Legend but each Rover a normal bot laner, classes in turn: player on %s',
    (playerTeam) => {
      const roster = placeholderRoster(10, playerTeam);
      const laners = roster.filter(({ role }) => role === 'laner');

      expect(roster).toHaveLength(19);
      expect(laners).toHaveLength(18);
      expect(laners.filter(({ team }) => team === 'dark')).toHaveLength(9);
      expect(laners.every(({ difficulty }) => difficulty === 'normal')).toBe(true);
      expect(roster.slice(0, 4).map(({ definitionId }) => definitionId)).toEqual([
        'warrior',
        'sentinel',
        'magus',
        'warrior',
      ]);
    },
  );

  it.each([
    ['light', 'dark'],
    ['dark', 'light'],
  ] as const)(
    'gives only the other team a bot Rover: the player on %s is their own team’s Rover',
    (playerTeam, botTeam) => {
      const rovers = placeholderRoster(10, playerTeam).filter(({ role }) => role !== 'laner');

      expect(rovers).toEqual([
        { team: botTeam, definitionId: 'warrior', role: 'rover', difficulty: 'rover' },
      ]);
    },
  );
});
