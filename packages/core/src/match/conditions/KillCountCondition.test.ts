import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { GameState } from '../../state/GameState';
import type { PlayableTeam } from '../../teams/teams.types';
import type { DirectorContext } from '../DirectorContext.types';
import { KillCountCondition } from './KillCountCondition';

const setUp = (killTarget: number | null = 3) => {
  const state = new GameState(createDefaultGameConfig(), 1);
  if (killTarget !== null) state.match.startDuel(killTarget);
  const context: DirectorContext = { state, enterPhase: () => undefined };
  const kill = (team: PlayableTeam, times = 1): void => {
    for (let i = 0; i < times; i += 1) state.match.recordDuelKill(team);
  };
  return { check: () => new KillCountCondition().check(context), kill };
};

describe('KillCountCondition', () => {
  it('gives no verdict below the target', () => {
    const { check, kill } = setUp();
    kill('light', 2);
    kill('dark', 2);

    expect(check()).toBeNull();
  });

  it.each<PlayableTeam>(['light', 'dark'])('gives %s the win at the target', (team) => {
    const { check, kill } = setUp();
    kill(team, 3);

    expect(check()).toEqual({ winner: team, condition: 'kill-count' });
  });

  it('calls a draw when both teams reach the target together', () => {
    const { check, kill } = setUp(1);
    kill('light');
    kill('dark');

    expect(check()).toEqual({ winner: null, condition: 'kill-count' });
  });

  it('never ends a match that is not a Duel', () => {
    expect(setUp(null).check()).toBeNull();
  });
});
