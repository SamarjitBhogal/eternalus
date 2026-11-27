import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import type { SummonPlacement, SummonResult, Summoner } from '../../state/Summoner.types';

/**
 * A test double for `Summoner`: it records each body asked for (giving it the id `summoned-<n>`)
 * and each one taken out, puts nothing in the state, and says each summon pinned `pinnedIds`.
 */
export class RecordingSummoner implements Summoner {
  /** @param pinnedIds - The units every summon says its push could not free; none by default. */
  public constructor(private readonly pinnedIds: readonly EntityId[] = []) {}

  /** Every body asked for, in order, with the caster that owns it. */
  public readonly summoned: {
    readonly definitionId: string;
    readonly placement: SummonPlacement;
    readonly ownerId: EntityId;
  }[] = [];
  /** Every body taken out, in order. */
  public readonly despawned: EntityId[] = [];

  /** Records the body, names it, and returns it with `pinnedIds`. */
  public summon(
    _state: GameState,
    definitionId: string,
    placement: SummonPlacement,
    ownerId: EntityId,
  ): SummonResult {
    this.summoned.push({ definitionId, placement, ownerId });
    return { bodyId: `summoned-${String(this.summoned.length)}`, pinnedIds: this.pinnedIds };
  }

  /** Records the removal. */
  public despawn(_state: GameState, entityId: EntityId): void {
    this.despawned.push(entityId);
  }
}
