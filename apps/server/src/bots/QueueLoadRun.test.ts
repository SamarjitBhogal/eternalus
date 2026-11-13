import { describe, expect, it } from 'vitest';
import { FakeClock } from '../time/FakeClock';
import { BotLogger } from './BotLogger';
import { BotRun } from './BotRun';
import { LoopbackBotLinks } from './LoopbackBotLinks.fixture';

const run = async (players: number, rounds: number, isPumping = true) => {
  const lines: string[] = [];
  const errors: string[] = [];
  const clock = new FakeClock();
  const links = new LoopbackBotLinks();
  const code = await new BotRun(
    { url: 'ws://x', players, seconds: 30, staggerMs: 1, mode: 'queue', rounds },
    {
      links,
      clock,
      navigators: {
        forSeed: () => {
          throw new Error('no navigation in queue mode');
        },
      },
      logger: new BotLogger(
        { out: (line) => lines.push(line), err: (line) => errors.push(line) },
        clock,
      ),
      sleep: (ms) => {
        clock.advance(ms);
        if (isPumping) links.pump();
        return Promise.resolve();
      },
    },
  ).run();
  return { code, out: lines.join('\n'), err: errors.join('\n') };
};

describe('QueueLoadRun', () => {
  it('pairs an even crowd round after round with no lost or duplicated player', async () => {
    const { code, out } = await run(8, 3);
    expect(code).toBe(0);
    expect(out).toContain('queue load: 8 bots x 3 rounds');
    // 8 bots x 3 joins = 24 joins = 12 matches, none left waiting.
    expect(out).toMatch(/\n\s+8\s+3\s+24\s+24\s+12\s+0\s+0\s+0\s/);
    expect(out).toContain('OK: 12 match(es)');
  });

  it('leaves one waiting player when the bots are odd, and it still passes', async () => {
    const { code, out } = await run(3, 3);
    expect(code).toBe(0);
    expect(out).toMatch(/\n\s+3\s+3\s+7\s+6\s+3\s+1\s+0\s+0\s/);
  });

  it('fails when the server never answers', async () => {
    const { code, err } = await run(2, 1, false);
    expect(code).toBe(1);
    expect(err).toContain('A: stuck in joining');
  });
});
