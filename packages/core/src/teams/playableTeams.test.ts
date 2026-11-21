import { describe, expect, it } from 'vitest';
import type { Team } from './teams.types';
import { isPlayableTeam, opponentOf, PLAYABLE_TEAMS } from './playableTeams';

describe('playableTeams', () => {
  it('lists Light then Dark', () => {
    expect(PLAYABLE_TEAMS).toEqual(['light', 'dark']);
  });

  it('accepts the two playable teams only', () => {
    const teams: readonly Team[] = ['light', 'dark', 'neutral'];
    expect(teams.map((team) => isPlayableTeam(team))).toEqual([true, true, false]);
    expect(isPlayableTeam(undefined)).toBe(false);
    expect(isPlayableTeam('medium')).toBe(false);
  });

  it('names the other team, and is its own inverse', () => {
    expect(opponentOf('light')).toBe('dark');
    expect(opponentOf('dark')).toBe('light');
    for (const team of PLAYABLE_TEAMS) {
      expect(opponentOf(opponentOf(team))).toBe(team);
    }
  });
});
