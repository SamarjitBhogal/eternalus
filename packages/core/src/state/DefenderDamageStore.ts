import type { EntityId } from './EntityStore.types';

/**
 * The damage each Legend dealt to each checkpoint defender set (07 §7), by `GuardSlot.defenceId`:
 * what the damage-biased share of a cleared checkpoint's XP is weighed by. Plain data in
 * `GameState`, hashed by `StateHasher`. Changed only through `add` and `take`.
 */
export class DefenderDamageStore {
  private readonly tallies = new Map<string, Map<EntityId, number>>();

  /** How many defender sets hold damage. */
  public get size(): number {
    return this.tallies.size;
  }

  /** Adds `amount` dealt by Legend `legendId` to set `defenceId`; nothing for 0 or less. */
  public add(defenceId: string, legendId: EntityId, amount: number): void {
    if (amount <= 0) {
      return;
    }
    const tally = this.tallies.get(defenceId) ?? new Map<EntityId, number>();
    tally.set(legendId, (tally.get(legendId) ?? 0) + amount);
    this.tallies.set(defenceId, tally);
  }

  /** Set `defenceId`'s damage by Legend id, which the store then forgets (the set is cleared). */
  public take(defenceId: string): ReadonlyMap<EntityId, number> {
    const tally = this.tallies.get(defenceId) ?? new Map<EntityId, number>();
    this.tallies.delete(defenceId);
    return tally;
  }

  /** Every tally: sets in the order first hit, each set's Legends in the order they hit it. */
  public forEach(visit: (defenceId: string, legendId: EntityId, amount: number) => void): void {
    this.tallies.forEach((tally, defenceId) => {
      tally.forEach((amount, legendId) => {
        visit(defenceId, legendId, amount);
      });
    });
  }
}
