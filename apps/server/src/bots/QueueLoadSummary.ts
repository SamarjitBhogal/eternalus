import { Percentile } from './Percentile';
import type { QueueLoadBot } from './QueueLoadBot';
import type { QueueLoadStats } from './QueueLoadSummary.types';

const HEADER =
  'bots  rounds  joins  paired  matches  timeouts  lost  dupes  ttm p50 (ms)  ttm p99 (ms)  ttm max (ms)  queue max  queue mean  run (s)';

const text = (value: number | null): string => (value === null ? '-' : value.toFixed(1));

/** Counts a queue-load run's joins and prints them as a header and one row. */
export class QueueLoadSummary {
  private readonly percentile = new Percentile();

  /** The run's numbers from the bots' records and the queue sizes sampled while it ran. */
  public stats(
    bots: readonly QueueLoadBot[],
    rounds: number,
    queueSizes: readonly number[],
    seconds: number,
  ): QueueLoadStats {
    const joins = bots.flatMap((bot) => bot.joins);
    const paired = joins.filter(({ matchId }) => matchId !== null);
    const times = joins.flatMap(({ timeToMatchMs }) =>
      timeToMatchMs === null ? [] : [timeToMatchMs],
    );
    const open = joins.filter(({ matchId }) => matchId === null);
    return {
      bots: bots.length,
      rounds,
      joins: joins.length,
      paired: paired.length,
      matches: new Set(paired.map(({ matchId }) => matchId)).size,
      timeouts: open.filter(({ isAnswered }) => isAnswered).length,
      lost: open.filter(({ isAnswered }) => !isAnswered).length,
      duplicates: bots.reduce((sum, bot) => sum + bot.duplicates, 0),
      timeToMatchP50Ms: this.percentile.of(times, 50),
      timeToMatchP99Ms: this.percentile.of(times, 99),
      timeToMatchMaxMs: this.percentile.of(times, 100),
      seconds,
      queueMax: Math.max(0, ...queueSizes),
      queueMean:
        queueSizes.length === 0 ? 0 : queueSizes.reduce((a, b) => a + b, 0) / queueSizes.length,
    };
  }

  /** The table lines for `stats`, header first. */
  public lines(stats: QueueLoadStats): string[] {
    const row = [
      String(stats.bots).padStart(4),
      String(stats.rounds).padStart(7),
      String(stats.joins).padStart(6),
      String(stats.paired).padStart(7),
      String(stats.matches).padStart(8),
      String(stats.timeouts).padStart(9),
      String(stats.lost).padStart(5),
      String(stats.duplicates).padStart(6),
      text(stats.timeToMatchP50Ms).padStart(13),
      text(stats.timeToMatchP99Ms).padStart(13),
      text(stats.timeToMatchMaxMs).padStart(13),
      String(stats.queueMax).padStart(10),
      stats.queueMean.toFixed(1).padStart(11),
      stats.seconds.toFixed(1).padStart(8),
    ].join(' ');
    return [HEADER, row];
  }
}
