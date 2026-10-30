import type { EntityId } from './EntityStore.types';
import type { Brain } from './AiState.types';

/**
 * The AI's share of the state (architecture 11 §2, §6): one brain per controlled entity, and the
 * entities whose decision the last tick's budget deferred, in the order they go first.
 */
export class AiState {
  private readonly brains = new Map<EntityId, Brain>();
  private waiting: readonly EntityId[] = [];

  /** Number of brains. */
  public get size(): number {
    return this.brains.size;
  }

  /** The entities deferred by the last tick's budget, in the order they decide next. */
  public get deferred(): readonly EntityId[] {
    return this.waiting;
  }

  /** The brain of `id`, or `undefined`. */
  public get(id: EntityId): Brain | undefined {
    return this.brains.get(id);
  }

  /** Gives `id` a brain, replacing any it had. */
  public set(id: EntityId, brain: Brain): void {
    this.brains.set(id, brain);
  }

  /** Drops the brain of `id`, and its place in the deferred queue. */
  public delete(id: EntityId): void {
    this.brains.delete(id);
    this.waiting = this.waiting.filter((waiting) => waiting !== id);
  }

  /** Replaces the deferred queue. */
  public defer(ids: readonly EntityId[]): void {
    this.waiting = ids;
  }

  /**
   * Visits every brain in creation order. For hashing only: decisions run in id order
   * (`AiSystem`), never in this order.
   */
  public forEach(visit: (id: EntityId, brain: Brain) => void): void {
    this.brains.forEach((brain, id) => {
      visit(id, brain);
    });
  }
}
