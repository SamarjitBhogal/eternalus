import { describe, expect, it } from 'vitest';
import { FakeClock } from '../time/FakeClock';
import { FakeBotLinks } from './FakeBotLinks';
import { QueueLoadBot } from './QueueLoadBot';
import { QueueLoadSummary } from './QueueLoadSummary';

describe('QueueLoadSummary', () => {
  it('counts joins and reports time-to-match percentiles and queue sizes', () => {
    const summary = new QueueLoadSummary();
    const bot = new QueueLoadBot('A', 'ws://x', new FakeBotLinks(), new FakeClock(), 1);
    bot.joins.push(
      { sentAtMs: 0, isAnswered: true, matchId: 'm1', timeToMatchMs: 10 },
      { sentAtMs: 0, isAnswered: true, matchId: 'm1', timeToMatchMs: 30 },
      { sentAtMs: 0, isAnswered: true, matchId: null, timeToMatchMs: null },
      { sentAtMs: 0, isAnswered: false, matchId: null, timeToMatchMs: null },
    );
    const stats = summary.stats([bot], 4, [0, 2, 4], 3);
    expect(stats).toMatchObject({
      joins: 4,
      paired: 2,
      matches: 1,
      timeouts: 1,
      lost: 1,
      timeToMatchP50Ms: 10,
      timeToMatchP99Ms: 30,
      queueMax: 4,
      queueMean: 2,
      seconds: 3,
    });
    expect(summary.lines(stats)).toHaveLength(2);
  });

  it('prints dashes when nothing paired', () => {
    const summary = new QueueLoadSummary();
    const stats = summary.stats([], 1, [], 0);
    expect(summary.lines(stats)[1]).toContain('-');
  });
});
