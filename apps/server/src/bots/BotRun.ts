import { BotChecks } from './BotChecks';
import type { BotOptions } from './BotOptions.types';
import type { BotRunDeps } from './BotRun.types';
import { BotSummary } from './BotSummary';
import { DuelBot } from './DuelBot';
import { QueueLoadRun } from './QueueLoadRun';
import { BotNames } from './BotNames';
import { CLOSE_GRACE_MS, EXIT_FAIL, EXIT_OK, MS_PER_SECOND } from './BotRun.constants';

/**
 * Plays the online Duel with scripted players to check the server end to end (ADR 0016): every
 * bot joins the queue and chases and attacks the enemy Legend; the run then checks the matchmaking
 * (each pair shares a match id and seed, on opposite teams; an odd last player still waits), the
 * state stream and that Legends moved, and reports whether damage and a kill happened.
 */
export class BotRun {
  public constructor(
    private readonly options: BotOptions,
    private readonly deps: BotRunDeps,
  ) {}

  /** Runs for the configured time (or, in `queue` mode, the queue load); resolves with the process exit code (0 when every check passes). */
  public async run(): Promise<number> {
    if (this.options.mode === 'queue') return new QueueLoadRun(this.options, this.deps).run();
    const { options, deps } = this;
    const { logger, sleep } = deps;
    logger.plain(
      `[duel-bots] ${String(options.players)} players -> ${options.url} for ${String(options.seconds)} s`,
    );
    const bots = Array.from(
      { length: options.players },
      (_, index) =>
        new DuelBot(new BotNames().of(index), options.url, deps.links, deps.navigators, logger),
    );
    for (const bot of bots) {
      bot.connect();
      await sleep(options.staggerMs);
    }
    await sleep(options.seconds * MS_PER_SECOND);
    bots.forEach((bot) => {
      bot.close();
    });
    await sleep(CLOSE_GRACE_MS);
    return this.finish(bots.map(({ report }) => report));
  }

  private finish(reports: DuelBot['report'][]): number {
    const { logger } = this.deps;
    const checks = new BotChecks();
    const summary = new BotSummary();
    const failures = checks.failures(reports);
    logger.plain('');
    summary.lines(reports).forEach((line) => {
      logger.plain(line);
    });
    const damage = summary.isDamageDealt(reports) ? 'yes' : 'no';
    const kills = reports.filter(({ hasKilled }) => hasKilled).map(({ name }) => name);
    const deaths = reports.filter(({ hasDied }) => hasDied).map(({ name }) => name);
    logger.plain(
      `\n[duel-bots] damage dealt: ${damage}; kills by: ${kills.join(', ') || 'none'}; ` +
        `deaths: ${deaths.join(', ') || 'none'}`,
    );
    if (failures.length > 0) {
      logger.fail(`\n[duel-bots] FAIL\n  ${failures.join('\n  ')}`);
      return EXIT_FAIL;
    }
    logger.plain(
      `\n[duel-bots] OK: ${String(checks.matchCount(reports))} match(es), every check passed`,
    );
    return EXIT_OK;
  }
}
