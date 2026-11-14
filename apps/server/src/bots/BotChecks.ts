import type { BotReport } from './BotReport.types';

/** The end-of-run checks over every bot's report (ADR 0016): the failures, empty when all pass. */
export class BotChecks {
  /** The failure messages for `reports`, one bot per requested player. */
  public failures(reports: readonly BotReport[]): string[] {
    const failures: string[] = [];
    const paired = reports.filter(({ matchId }) => matchId !== null);
    const expectedPaired = reports.length - (reports.length % 2);
    if (paired.length !== expectedPaired) {
      failures.push(`${String(paired.length)} players paired, expected ${String(expectedPaired)}`);
    }
    const last = reports.at(-1);
    if (
      reports.length % 2 === 1 &&
      last !== undefined &&
      (last.matchId !== null || !last.isWaiting)
    ) {
      failures.push(`${last.name} should still be waiting`);
    }
    for (const matchId of new Set(paired.map((report) => report.matchId))) {
      const pair = paired.filter((report) => report.matchId === matchId);
      failures.push(...this.pairFailures(String(matchId), pair));
    }
    for (const report of paired) {
      failures.push(...this.botFailures(report));
    }
    for (const { name, error } of reports) {
      if (error !== null) {
        failures.push(`${name}: ${error}`);
      }
    }
    return failures;
  }

  /** The number of matches the paired bots are in. */
  public matchCount(reports: readonly BotReport[]): number {
    return new Set(reports.flatMap(({ matchId }) => (matchId === null ? [] : [matchId]))).size;
  }

  private pairFailures(matchId: string, pair: readonly BotReport[]): string[] {
    const [a, b] = pair;
    if (a === undefined || b === undefined || pair.length !== 2) {
      return [
        `${matchId} has ${String(pair.length)} players (${pair.map((r) => r.name).join(' vs ')})`,
      ];
    }
    const failures: string[] = [];
    if (a.team === b.team) {
      failures.push(`${matchId}: both on ${String(a.team)}`);
    }
    if (a.seed !== b.seed) {
      failures.push(`${matchId}: seeds differ`);
    }
    if (a.legendId === b.legendId) {
      failures.push(`${matchId}: same Legend`);
    }
    return failures;
  }

  private botFailures(report: BotReport): string[] {
    const { name } = report;
    const failures: string[] = [];
    if (report.states === 0) {
      failures.push(`${name}: no state after match-found`);
    }
    if (report.ticksOutOfOrder > 0) {
      failures.push(`${name}: ${String(report.ticksOutOfOrder)} states out of tick order`);
    }
    if (report.firstMoveTick === null && report.ended === null) {
      failures.push(`${name}: never moved`);
    }
    return failures;
  }
}
