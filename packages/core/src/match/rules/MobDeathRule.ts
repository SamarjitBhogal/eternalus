import type { MobKind } from '../../content/mobs/mobs.types';
import type { ScoringWeights } from '../../content/match/scoring.types';
import type { ScoreBook } from '../../state/ScoreBook';
import type { DeathRule, ScoredDeath } from '../ScoringRule.types';

/**
 * A mob's death (architecture 12 §5, DEC-79): a Legend's last hit on an enemy team mob (Host units
 * and tower guards, DEC-211 (2)) counts as a `minionKills`, on a neutral mob as a `neutralKills`,
 * each with the points of the mob's weight class. A last hit by a non-Legend, on a mob of the
 * killer's own team or on a kind with no weight scores nothing.
 */
export class MobDeathRule implements DeathRule {
  /** @param minionKill - The points for a mob kill, by weight class. */
  public constructor(private readonly minionKill: ScoringWeights['minionKill']) {}

  /** Awards the Legend killer's mob kill and its points. */
  public score(book: ScoreBook, { kind, team, killerId }: ScoredDeath): void {
    const killer = killerId === null ? undefined : book.rowOf(killerId);
    if (killer === undefined || killer.team === team || !this.isMobKind(kind)) {
      return;
    }
    book.award(killer.entityId, {
      counter: team === 'neutral' ? 'neutralKills' : 'minionKills',
      by: 1,
      points: this.minionKill[kind],
    });
  }

  private isMobKind(kind: string): kind is MobKind {
    return Object.hasOwn(this.minionKill, kind);
  }
}
