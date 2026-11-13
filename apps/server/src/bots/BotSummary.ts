import type { BotReport } from './BotReport.types';

const HEADER =
  'player  match     team   states  last-tick  moved@  attacks  hp own (first/low)  hp enemy (first/low)  kill  rejected';

const text = (value: number | string | null): string => String(value ?? '-');

/** The summary table of a run: one row per bot, including whether damage and a kill happened. */
export class BotSummary {
  /** The table lines for `reports`, header first. */
  public lines(reports: readonly BotReport[]): string[] {
    return [HEADER, ...reports.map((report) => this.row(report))];
  }

  /** Whether any bot saw the enemy Legend's health drop. */
  public isDamageDealt(reports: readonly BotReport[]): boolean {
    return reports.some(
      ({ enemyHealthFirst, enemyHealthLow }) =>
        enemyHealthFirst !== null && enemyHealthLow !== null && enemyHealthLow < enemyHealthFirst,
    );
  }

  private row(report: BotReport): string {
    const waiting = report.isWaiting ? 'waiting' : '-';
    const rejected = report.rejected.length === 0 ? '-' : [...new Set(report.rejected)].join(',');
    return [
      report.name.padEnd(7),
      (report.matchId ?? waiting).padEnd(9),
      text(report.team).padEnd(6),
      text(report.states).padStart(6),
      text(report.lastTick).padStart(10),
      text(report.firstMoveTick).padStart(7),
      text(report.attackTicks).padStart(8),
      `${text(report.ownHealthFirst)}/${text(report.ownHealthLow)}`.padStart(19),
      `${text(report.enemyHealthFirst)}/${text(report.enemyHealthLow)}`.padStart(21),
      (report.hasKilled ? 'yes' : 'no').padStart(5),
      ` ${rejected}`,
    ].join(' ');
  }
}
