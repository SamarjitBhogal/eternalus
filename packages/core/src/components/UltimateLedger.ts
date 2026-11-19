/** Bounded damage-assist history owned by the Legend, never hidden in a system. */
export class UltimateLedger {
  public readonly hits = new Map<string, number>();
  /** Removes entries that can no longer earn assist credit. */
  public prune(tick: number, windowTicks: number): void {
    for (const [id, last] of this.hits) if (tick - last > windowTicks) this.hits.delete(id);
  }
}
