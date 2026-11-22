import type { QueueLoadBot } from './QueueLoadBot';
import type { QueueLoadStats } from './QueueLoadSummary.types';

/**
 * The end-of-run invariants of a queue-load run: every join ends in exactly one pairing or is
 * left waiting; no player is lost or in two matches; every match has two different players.
 */
export class QueueLoadChecks {
  /** The failure messages for `bots`, empty when every invariant holds. */
  public failures(bots: readonly QueueLoadBot[], stats: QueueLoadStats): string[] {
    const failures: string[] = [];
    if (stats.lost > 0) failures.push(`${String(stats.lost)} joins were never answered`);
    if (stats.duplicates > 0) {
      failures.push(`${String(stats.duplicates)} match-found while not queued (two matches)`);
    }
    // DEC-36: at most one player waits, so at most one join can end the run unpaired.
    if (stats.timeouts > 1) failures.push(`${String(stats.timeouts)} players left waiting, max 1`);
    failures.push(...this.matchFailures(bots));
    for (const bot of bots) {
      if (bot.phase !== 'done' && bot.phase !== 'waiting') {
        failures.push(`${bot.name}: stuck in ${bot.phase}`);
      }
      if (bot.error !== null) failures.push(`${bot.name}: ${bot.error}`);
    }
    return failures;
  }

  private matchFailures(bots: readonly QueueLoadBot[]): string[] {
    const players = new Map<string, string[]>();
    for (const bot of bots) {
      for (const { matchId } of bot.joins) {
        if (matchId !== null) players.set(matchId, [...(players.get(matchId) ?? []), bot.name]);
      }
    }
    return [...players]
      .filter(([, names]) => names.length !== 2 || names[0] === names[1])
      .map(([matchId, names]) => `${matchId} has ${names.join(' and ')}, expected two players`);
  }
}
