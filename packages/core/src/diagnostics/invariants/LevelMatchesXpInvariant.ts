import { Progression } from '../../components/Progression';
import { TeamMembership } from '../../components/TeamMembership';
import type { ContentCatalogue } from '../../content/ContentCatalogue';
import type { LevelCurveDefinition } from '../../content/progression/progression.types';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * `level-matches-xp` (architecture 05 §16, 15 §3): (1) every `Progression`'s level is the one its XP
 * gives on its curve; and every `xp-gained` of this tick (2) is backed by an `entity-died` this tick
 * whose killer is the recipient, (3) is the only award for that kill, and (4) is not for a self-kill
 * or an ally kill (O5). It keeps no scratch: everything comes from the state and this tick's events.
 * Runs every tick, since rules 2–4 read this tick's events.
 */
export class LevelMatchesXpInvariant implements Invariant {
  public readonly id = 'level-matches-xp';

  public readonly severity = 'error';

  public readonly cadence = 'tick';

  /** @param curves - The level curves, injected (the same catalogue `ProgressionSystem` uses). */
  public constructor(
    private readonly curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'get'>,
  ) {}

  /** Flags every broken rule, levels first, then awards in event order. */
  public check(state: GameState): readonly Violation[] {
    return [...this.levelViolations(state), ...this.awardViolations(state)];
  }

  private levelViolations(state: GameState): Violation[] {
    const violations: Violation[] = [];
    state.entities.forEach((entity) => {
      const progression = entity.findComponent(Progression);
      if (progression === undefined) {
        return;
      }
      const expected = LevelMatchesXpInvariant.levelFor(
        this.curves.get(progression.curveId),
        progression.xp,
      );
      if (progression.level !== expected) {
        violations.push(
          this.violation(
            entity.id,
            `Entity "${entity.id}" is level ${String(progression.level)} but its XP (${String(progression.xp)}) gives ${String(expected)}.`,
          ),
        );
      }
    });
    return violations;
  }

  private awardViolations(state: GameState): Violation[] {
    const violations: Violation[] = [];
    const seen = new Set<string>();
    for (const award of state.xpAwardsThisTick()) {
      const { entityId, victimId, victimTeam } = award;
      const recipientTeam = state.entities.get(entityId)?.findComponent(TeamMembership)?.team;
      if (entityId === victimId || victimTeam === recipientTeam) {
        violations.push(
          this.violation(
            entityId,
            `Entity "${entityId}" gained XP for killing itself or an ally ("${victimId}").`,
          ),
        );
      } else if (state.killerOf(victimId)?.attackerId !== entityId) {
        violations.push(
          this.violation(
            entityId,
            `Entity "${entityId}" gained XP for "${victimId}" without killing it this tick.`,
          ),
        );
      }
      const key = `${entityId}\u0000${victimId}`;
      if (seen.has(key)) {
        violations.push(
          this.violation(
            entityId,
            `Entity "${entityId}" gained XP twice for "${victimId}" this tick.`,
          ),
        );
      }
      seen.add(key);
    }
    return violations;
  }

  private violation(entityId: string, message: string): Violation {
    return { invariantId: this.id, severity: this.severity, message, entityId, details: {} };
  }

  /** The level `xp` gives on `curve`, recomputed independently of `Progression`. */
  private static levelFor(curve: LevelCurveDefinition, xp: number): number {
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
