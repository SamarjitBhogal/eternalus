import { ControllerBinding } from '../../components/ControllerBinding';
import type { GameState } from '../../state/GameState';
import type { Horde } from '../../state/Horde.types';
import { compareById } from '../../utils/compareById';
import type { Invariant, Violation } from '../Invariant.types';

/**
 * `horde-membership-consistent` (architecture 15 §3, 18 §4): every horde has members; each member
 * is listed once and is a living mob the store files under that horde, or one removed this tick
 * (`HordeSystem` drops it on its next pass); the leader is the lowest member id in string order;
 * and every living mob with the `minion` brain is in a horde (MS-25).
 *
 * @remarks Membership lives only in `state.hordes` (`hordeOf`), not in a `hordeId` field on each
 * mob, so "points back" is the store's own lookup (MS-29).
 */
export class HordeMembershipConsistentInvariant implements Invariant {
  public readonly id = 'horde-membership-consistent';

  public readonly severity = 'error';

  public readonly cadence = 'periodic';

  /**
   * Flags empty hordes, repeated, stray or dead members, a leader that is not the lowest id, and
   * lane minions in no horde.
   */
  public check(state: GameState): readonly Violation[] {
    const removed = new Set(state.entities.removedThisTick().map(({ entityId }) => entityId));
    const violations: Violation[] = [];
    state.hordes.forEach((horde) => {
      const lowest = [...horde.memberIds].sort(compareById)[0];
      if (lowest === undefined) {
        violations.push(this.violation(horde, null, 'has no members and was not dissolved'));
        return;
      }
      if (horde.leaderId !== lowest) {
        violations.push(
          this.violation(horde, horde.leaderId, `is led by a member other than "${lowest}"`),
        );
      }
      const listed = new Set<string>();
      for (const id of horde.memberIds) {
        if (listed.has(id)) {
          violations.push(this.violation(horde, id, `lists "${id}" twice`));
          continue;
        }
        listed.add(id);
        const entity = state.entities.get(id);
        const isLivingMob = entity?.family === 'mob' && state.entities.isAlive(id);
        if (!removed.has(id) && !isLivingMob) {
          violations.push(this.violation(horde, id, `lists "${id}", which is not a living mob`));
        } else if (state.hordes.hordeOf(id)?.id !== horde.id) {
          violations.push(
            this.violation(horde, id, `lists "${id}", which the store files elsewhere`),
          );
        }
      }
    });
    state.entities.forEach((entity) => {
      const { id } = entity;
      if (
        entity.findComponent(ControllerBinding)?.controllerId === 'minion' &&
        state.entities.isAlive(id) &&
        state.hordes.hordeOf(id) === undefined
      ) {
        violations.push(this.violation(null, id, `Mob "${id}" is a lane minion in no horde`));
      }
    });
    return violations;
  }

  private violation(horde: Horde | null, entityId: string | null, problem: string): Violation {
    return {
      invariantId: this.id,
      severity: this.severity,
      message: horde === null ? `${problem}.` : `Horde "${horde.id}" ${problem}.`,
      entityId,
      details: horde === null ? {} : { hordeId: horde.id },
    };
  }
}
