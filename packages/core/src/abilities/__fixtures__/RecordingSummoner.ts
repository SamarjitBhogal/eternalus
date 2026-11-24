import type { EntityId } from '../../state/EntityStore.types';
import type { GameState } from '../../state/GameState';
import type { SummonPlacement, Summoner } from '../../state/Summoner.types';

/**
 * A test double for `Summoner`: it records each body asked for (giving it the id `summoned-<n>`)
 * and each one taken out, and puts nothing in the state.
 */
export class RecordingSummoner implements Summoner {
  /** Every body asked for, in order. */
  public readonly summoned: {
    readonly definitionId: string;
    readonly placement: SummonPlacement;
  }[] = [];
  /** Every body taken out, in order. */
  public readonly despawned: EntityId[] = [];

  /** Records the body and names it. */
  public summon(_state: GameState, definitionId: string, placement: SummonPlacement): EntityId {
    this.summoned.push({ definitionId, placement });
    return `summoned-${String(this.summoned.length)}`;
  }

  /** Records the removal. */
  public despawn(_state: GameState, entityId: EntityId): void {
    this.despawned.push(entityId);
  }
}
