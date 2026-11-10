import { Transform } from '../../components/Transform';
import type { GameState } from '../../state/GameState';
import { sqrt } from '../../utils/deterministicMath';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * `guard-within-leash` (architecture 15 §3, 18 §7): every living guard (tower guard, camp mob or
 * zone guard) stands within its guard plan's `leashRadius`, plus the post's `leashTolerance` (the
 * distance it can cover between two decisions plus the farthest it stands from a target in reach),
 * of its home's edge: a structure's collider edge, or a zone's anchor (home radius 0).
 */
export class GuardWithinLeashInvariant implements Invariant {
  public readonly id = 'guard-within-leash';

  public readonly severity = 'error';

  public readonly cadence = 'periodic';

  /** Flags each living guard farther from its home than its leash allows. */
  public check(state: GameState): readonly Violation[] {
    const violations: Violation[] = [];
    state.guards.forEach((post) => {
      const guardId = post.guardId;
      const position =
        guardId === null
          ? undefined
          : state.entities.get(guardId)?.findComponent(Transform)?.position;
      if (guardId === null || position === undefined || !state.entities.isAlive(guardId)) {
        return;
      }
      const dx = position.x - post.homeX;
      const dy = position.y - post.homeY;
      const beyond = sqrt(dx * dx + dy * dy) - post.homeRadius;
      const allowed = post.leashRadius + post.leashTolerance;
      if (beyond > allowed) {
        violations.push({
          invariantId: this.id,
          severity: this.severity,
          message: `Guard "${guardId}" is ${beyond.toFixed(2)} past the edge of "${post.homeId}"; its leash allows ${String(allowed)}.`,
          entityId: guardId,
          details: { homeId: post.homeId, beyond, allowed },
        });
      }
    });
    return violations;
  }
}
