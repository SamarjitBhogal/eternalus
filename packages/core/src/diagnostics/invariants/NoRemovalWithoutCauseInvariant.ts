import type { RemovalRecord } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import type { Invariant, Violation } from '../Invariant.types';
import { REMOVAL_CAUSES } from './NoRemovalWithoutCauseInvariant.constants';

/**
 * `no-removal-without-cause` (architecture 15 §3): this tick's store removals and this tick's
 * `entity-removed` events are the same set, each with a valid `RemovalCause`; no removed entity is
 * still in the store; and the store's size changed by exactly spawned minus removed.
 */
export class NoRemovalWithoutCauseInvariant implements Invariant {
  public readonly id = 'no-removal-without-cause';

  public readonly severity = 'fatal';

  public readonly cadence = 'tick';

  /** Flags removals without a valid cause or event, events without a removal, and leftovers. */
  public check(state: GameState): readonly Violation[] {
    const removed = state.entities.removedThisTick();
    const announced = state.removalsAnnouncedThisTick();
    const { entities } = state;
    const expectedSize = entities.sizeAtTickStart() + entities.addedThisTick() - removed.length;

    return [
      ...removed
        .filter(({ cause }) => !REMOVAL_CAUSES.includes(cause))
        .map((record) => this.violation(record, 'was removed without a valid cause')),
      ...removed
        .filter((record) => !NoRemovalWithoutCauseInvariant.contains(announced, record))
        .map((record) => this.violation(record, 'was removed without an entity-removed event')),
      ...announced
        .filter((record) => !NoRemovalWithoutCauseInvariant.contains(removed, record))
        .map((record) => this.violation(record, 'was announced as removed but never removed')),
      ...removed
        .filter(({ entityId }) => state.entities.has(entityId))
        .map((record) => this.violation(record, 'is still in the store after its removal')),
      ...(entities.size === expectedSize ? [] : [this.sizeViolation(entities.size, expectedSize)]),
    ];
  }

  private sizeViolation(size: number, expected: number): Violation {
    return {
      invariantId: this.id,
      severity: this.severity,
      message: `The store holds ${String(size)} entities; spawns and removals this tick give ${String(expected)}.`,
      entityId: null,
      details: { size, expected },
    };
  }

  private violation({ entityId, cause }: RemovalRecord, problem: string): Violation {
    return {
      invariantId: this.id,
      severity: this.severity,
      message: `Entity "${entityId}" ${problem} (cause "${cause}").`,
      entityId,
      details: { cause },
    };
  }

  private static contains(records: readonly RemovalRecord[], wanted: RemovalRecord): boolean {
    return records.some(
      (record) => record.entityId === wanted.entityId && record.cause === wanted.cause,
    );
  }
}
