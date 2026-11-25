import { describe, expect, it } from 'vitest';
import { FakeClock } from '../time/FakeClock';
import { FakeBotLinks } from './FakeBotLinks';
import { QueueLoadBot } from './QueueLoadBot';
import { QueueLoadChecks } from './QueueLoadChecks';
import { QueueLoadSummary } from './QueueLoadSummary';

const botWith = (name: string, matchIds: readonly (string | null)[], isAnswered = true) => {
  const bot = new QueueLoadBot(name, 'ws://x', new FakeBotLinks(), new FakeClock(), 1);
  bot.joins.push(
    ...matchIds.map((matchId) => ({
      sentAtMs: 0,
      isAnswered,
      matchId,
      timeToMatchMs: matchId === null ? null : 10,
    })),
  );
  return bot;
};

const allFailuresOf = (bots: readonly QueueLoadBot[]) =>
  new QueueLoadChecks().failures(bots, new QueueLoadSummary().stats(bots, 1, [1], 1));

// The helper bots never ran, so their phase is idle; the match and join checks are what is tested.
const failuresOf = (bots: readonly QueueLoadBot[]) =>
  allFailuresOf(bots).filter((failure) => !failure.includes('stuck in'));

describe('QueueLoadChecks', () => {
  it('passes when every match has two different players', () => {
    expect(failuresOf([botWith('A', ['m1']), botWith('B', ['m1'])])).toEqual([]);
  });

  it('flags a match with one player, one with the same player twice, and a lost join', () => {
    expect(failuresOf([botWith('A', ['m1'])])).toEqual(['m1 has A, expected two players']);
    expect(failuresOf([botWith('A', ['m1', 'm1'])])).toHaveLength(1);
    expect(failuresOf([botWith('A', [null], false)])).toContain('1 joins were never answered');
  });

  it('flags more than one player left waiting', () => {
    expect(failuresOf([botWith('A', [null]), botWith('B', [null])])).toContain(
      '2 players left waiting, max 1',
    );
  });

  it('flags a bot that is neither done nor waiting', () => {
    expect(allFailuresOf([botWith('A', [])])).toEqual(['A: stuck in idle']);
  });
});
