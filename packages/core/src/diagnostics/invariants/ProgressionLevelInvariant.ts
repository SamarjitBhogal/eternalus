import { Progression } from '../../components/Progression';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * `progression-level` (Phase 4 sprint 4.5): every `Progression`'s level is the one its XP gives on
 * its curve, from 1 to the cap. Recomputed here from the curve, independently of `Progression`.
 */
export class ProgressionLevelInvariant implements Invariant {
  public readonly id = 'progression-level';

  public readonly severity = 'error';

  public readonly cadence = 'tick';

  /** Flags every entity whose level does not match its XP. */
  public check(state: GameState): readonly Violation[] {
    const violations: Violation[] = [];
    state.entities.forEach((entity) => {
      const progression = entity.findComponent(Progression);
      if (progression === undefined) {
        return;
      }
      const expected = ProgressionLevelInvariant.levelFor(progression);
      if (progression.level !== expected) {
        violations.push({
          invariantId: this.id,
          severity: this.severity,
          message: `Entity "${entity.id}" is level ${String(progression.level)} but its XP gives ${String(expected)}.`,
          entityId: entity.id,
          details: { level: progression.level, expected, xp: progression.xp },
        });
      }
    });
    return violations;
  }

  private static levelFor({ curve, xp }: Progression): number {
    let level = 1;
    let needed = 0;
    for (const step of curve.xpToNext) {
      needed += step;
      if (level >= curve.cap || xp < needed) {
        break;
      }
      level += 1;
    }
    return level;
  }
}
