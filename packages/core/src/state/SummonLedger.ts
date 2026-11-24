import type { EntityId } from './EntityStore.types';
import type { GameEvents } from './GameEvents';
import type { Placed } from './SummonLedger.types';

/**
 * Which bodies each caster has placed and that still stand, oldest first (architecture 05 §3
 * `summon`; DEC-330 (7): each Legend has at most 2 Shield Walls deployed). `SummonEffect` records
 * a body when it places it and reads `placedBy` to remove the oldest over its cap; a body leaves
 * the ledger when it leaves the world (`entity-removed`, any cause), so a destroyed body frees its
 * place. Part of the match state: `StateHasher` hashes it.
 */
export class SummonLedger {
  /** Each caster's standing bodies, oldest first; a caster with none has no entry. */
  private readonly byOwner = new Map<EntityId, Placed[]>();

  /**
   * Subscribes to `events`; lives as long as the match.
   *
   * @param events - The channel removals arrive on.
   */
  public constructor(events: GameEvents) {
    events.on('entity-removed', ({ entityId }) => {
      this.forget(entityId);
    });
  }

  /** How many casters have a body standing. */
  public get size(): number {
    return this.byOwner.size;
  }

  /** Records that `ownerId` placed the body `entityId`, built from `definitionId`, as its newest. */
  public record(ownerId: EntityId, definitionId: string, entityId: EntityId): void {
    this.byOwner.set(ownerId, [...(this.byOwner.get(ownerId) ?? []), { definitionId, entityId }]);
  }

  /** The bodies built from `definitionId` that `ownerId` placed and that still stand, oldest first. */
  public placedBy(ownerId: EntityId, definitionId: string): readonly EntityId[] {
    return (this.byOwner.get(ownerId) ?? [])
      .filter((placed) => placed.definitionId === definitionId)
      .map(({ entityId }) => entityId);
  }

  /** Visits each caster in the order it first placed a body, with its standing bodies, oldest first. */
  public forEach(visit: (ownerId: EntityId, placed: readonly Placed[]) => void): void {
    this.byOwner.forEach((placed, ownerId) => {
      visit(ownerId, placed);
    });
  }

  /** Drops the body `entityId` from its caster's list, and the caster once it has none. */
  private forget(entityId: EntityId): void {
    for (const [ownerId, placed] of this.byOwner) {
      const standing = placed.filter((body) => body.entityId !== entityId);
      if (standing.length === placed.length) continue;
      if (standing.length === 0) this.byOwner.delete(ownerId);
      else this.byOwner.set(ownerId, standing);
      return;
    }
  }
}
