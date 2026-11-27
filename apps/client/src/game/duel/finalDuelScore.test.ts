import { describe, expect, it } from 'vitest';

import { snapshotAtTick } from './__fixtures__/snapshots';
import { finalDuelScore } from './finalDuelScore';

describe('finalDuelScore', () => {
  it('is null when the snapshot has no Duel score', () => {
    expect(finalDuelScore(snapshotAtTick(1), 'light')).toBeNull();
  });

  it('reads the kills from the given team side', () => {
    const snapshot = snapshotAtTick(1);
    const duel = { kills: { light: 3, dark: 10 }, killTarget: 10 };
    const withDuel = { ...snapshot, match: { ...snapshot.match, duel } };

    expect(finalDuelScore(withDuel, 'dark')).toEqual({
      ownKills: 10,
      opponentKills: 3,
      killTarget: 10,
    });
    expect(finalDuelScore(withDuel, 'light')).toEqual({
      ownKills: 3,
      opponentKills: 10,
      killTarget: 10,
    });
  });
});
