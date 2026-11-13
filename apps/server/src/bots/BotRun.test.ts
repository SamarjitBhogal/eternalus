import { describe, expect, it } from 'vitest';
import { BotLogger } from './BotLogger';
import { BotNavigator } from './BotNavigator';
import { BotRun } from './BotRun';
import { FakeBotLinks } from './FakeBotLinks';

const run = async (players: number, pairUp: boolean) => {
  const lines: string[] = [];
  const errors: string[] = [];
  const links = new FakeBotLinks();
  const sleeps: number[] = [];
  const navigator = new BotNavigator({ waypoint: () => false });
  const botRun = new BotRun(
    { url: 'ws://x', players, seconds: 2, staggerMs: 5 },
    {
      links,
      navigators: { forSeed: () => navigator },
      logger: new BotLogger(
        { out: (line) => lines.push(line), err: (line) => errors.push(line) },
        { nowMs: () => 0 },
      ),
      sleep: (ms) => {
        sleeps.push(ms);
        // The server pairs the first two bots while the run waits.
        if (pairUp && sleeps.length === players) {
          links.handlers.slice(0, 2).forEach((handlers, index) => {
            handlers.onMessage({
              type: 'match-found',
              opponentName: 'Rival',
              matchId: 'm1',
              seed: 1,
              team: index === 0 ? 'light' : 'dark',
              legendId: `e${String(index)}`,
            });
          });
          links.handlers.slice(2).forEach((handlers) => {
            handlers.onMessage({ type: 'queue-waiting' });
          });
        }
        return Promise.resolve();
      },
    },
  );
  const code = await botRun.run();
  return { code, lines, errors, sleeps, links };
};

describe('BotRun', () => {
  it('connects every bot staggered, runs for the time, closes them and fails when nobody paired', async () => {
    const { code, errors, sleeps, links } = await run(2, false);

    expect(sleeps).toEqual([5, 5, 2000, 300]);
    expect(links.closed).toBe(2);
    expect(code).toBe(1);
    expect(errors.join('\n')).toContain('0 players paired, expected 2');
  });

  it('names players past Z as P26', async () => {
    const { lines } = await run(27, false);

    expect(lines.join('\n')).toContain('P26');
  });
});
