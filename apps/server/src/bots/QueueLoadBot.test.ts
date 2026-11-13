import { describe, expect, it } from 'vitest';
import { FakeClock } from '../time/FakeClock';
import { FakeBotLinks } from './FakeBotLinks';
import { QueueLoadBot } from './QueueLoadBot';

const found = (team: 'light' | 'dark', matchId = 'm1') =>
  ({
    type: 'match-found',
    matchId,
    seed: 1,
    team,
    legendId: 'e',
    opponentName: 'Bot',
  }) as const;

function setup(rounds = 2) {
  const links = new FakeBotLinks();
  const clock = new FakeClock();
  const bot = new QueueLoadBot('A', 'ws://x', links, clock, rounds);
  bot.connect();
  links.lastHandlers().onOpen();
  return { links, clock, bot };
}

describe('QueueLoadBot', () => {
  it('joins on open and times the wait until match-found', () => {
    const { links, clock, bot } = setup();
    expect(links.lastSent()).toEqual([{ type: 'queue-join', name: 'Bot' }]);
    links.lastHandlers().onMessage({ type: 'queue-waiting' });
    expect(bot.phase).toBe('waiting');
    clock.advance(40);
    links.lastHandlers().onMessage(found('dark'));
    expect(bot.joins[0]).toMatchObject({ matchId: 'm1', timeToMatchMs: 40, isAnswered: true });
    expect(bot.phase).toBe('in-match');
  });

  it('forfeits as light at once and joins again on a new connection', () => {
    const { links, bot } = setup();
    links.lastHandlers().onMessage(found('light'));
    expect(links.closed).toBe(1);
    expect(links.handlers).toHaveLength(2);
    expect(bot.phase).toBe('joining');
  });

  it('requeues as dark only once the match ended, and is done after its rounds', () => {
    const { links, bot } = setup(1);
    links.lastHandlers().onMessage(found('dark'));
    expect(links.handlers).toHaveLength(1);
    links.lastHandlers().onMessage({ type: 'match-ended', reason: 'opponent-left', winner: null });
    expect(bot.phase).toBe('done');
    expect(links.handlers).toHaveLength(1);
  });

  it('counts a match-found while it is not queued, and ignores a closed connection', () => {
    const { links, bot } = setup(1);
    const first = links.lastHandlers();
    first.onMessage(found('dark'));
    first.onMessage(found('dark', 'm2'));
    expect(bot.duplicates).toBe(1);
    bot.close();
    first.onMessage({ type: 'match-ended', reason: 'opponent-left', winner: null });
    expect(bot.phase).toBe('in-match');
  });

  it('records a rejection and a socket error', () => {
    const { links, bot } = setup();
    links.lastHandlers().onError();
    links.lastHandlers().onMessage({ type: 'rejected', reason: 'in-match' });
    expect(bot.error).toBe('socket error');
  });
});
