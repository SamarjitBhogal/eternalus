import type { BotOptions } from './BotOptions.types';
import type { BotRunDeps } from './BotRun.types';
import { CLOSE_GRACE_MS, EXIT_FAIL, EXIT_OK, MS_PER_SECOND } from './BotRun.constants';
import { QueueLoadBot } from './QueueLoadBot';
import { QueueLoadChecks } from './QueueLoadChecks';
import { QUEUE_POLL_MS, SETTLE_POLLS } from './QueueLoadRun.constants';
import { QueueLoadSummary } from './QueueLoadSummary';
import { BotNames } from './BotNames';

/**
 * Loads the matchmaking queue (SCRUM-432): `players` bots each join `rounds` times, forfeit or
 * wait out the forfeit, and requeue. Ends when every bot is done (or one waits with nobody left
 * to pair with) or after `seconds`; then checks the invariants and prints time-to-match and
 * queue-size numbers. The queue size is what the bots see: joined and not yet paired.
 */
export class QueueLoadRun {
  public constructor(
    private readonly options: BotOptions,
    private readonly deps: BotRunDeps,
  ) {}

  /** Runs the load; resolves with the exit code (0 when every invariant holds). */
  public async run(): Promise<number> {
    const { options, deps } = this;
    const { logger, sleep, clock } = deps;
    logger.plain(
      `[duel-bots] queue load: ${String(options.players)} bots x ${String(options.rounds)} rounds -> ${options.url}`,
    );
    const bots = Array.from(
      { length: options.players },
      (_, index) =>
        new QueueLoadBot(new BotNames().of(index), options.url, deps.links, clock, options.rounds),
    );
    const queueSizes: number[] = [];
    const sample = (): void => {
      queueSizes.push(bots.filter((bot) => bot.isQueued).length);
    };
    const startedMs = clock.nowMs();
    const deadlineMs = startedMs + options.seconds * MS_PER_SECOND;
    for (const bot of bots) {
      bot.connect();
      await sleep(options.staggerMs);
      sample();
    }
    let calmPolls = 0;
    while (clock.nowMs() < deadlineMs && calmPolls < SETTLE_POLLS) {
      await sleep(QUEUE_POLL_MS);
      sample();
      calmPolls = this.isSettled(bots) ? calmPolls + 1 : 0;
    }
    bots.forEach((bot) => {
      bot.close();
    });
    await sleep(CLOSE_GRACE_MS);
    return this.finish(bots, queueSizes, (clock.nowMs() - startedMs) / MS_PER_SECOND);
  }

  /** Nothing left to pair: every bot is done, or a single bot waits alone. */
  private isSettled(bots: readonly QueueLoadBot[]): boolean {
    const active = bots.filter((bot) => bot.phase !== 'done');
    return active.length === 0 || (active.length === 1 && active[0]?.phase === 'waiting');
  }

  private finish(
    bots: readonly QueueLoadBot[],
    queueSizes: readonly number[],
    seconds: number,
  ): number {
    const { logger } = this.deps;
    const summary = new QueueLoadSummary();
    const stats = summary.stats(bots, this.options.rounds, queueSizes, seconds);
    const failures = new QueueLoadChecks().failures(bots, stats);
    logger.plain('');
    summary.lines(stats).forEach((line) => {
      logger.plain(line);
    });
    if (failures.length > 0) {
      logger.fail(`\n[duel-bots] FAIL\n  ${failures.join('\n  ')}`);
      return EXIT_FAIL;
    }
    logger.plain(
      `\n[duel-bots] OK: ${String(stats.matches)} match(es), no lost or duplicated players`,
    );
    return EXIT_OK;
  }
}
