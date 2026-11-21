/**
 * Marks an entity that keeps an aura (DEC-315 (4): the BuffTower) and how far it reaches. Read
 * by the snapshot, so the client draws the aura's ring without knowing a number; the effect
 * itself is `StructureAuraSystem`'s, from the structure's definition.
 */
export class AuraEmitter {
  /**
   * @param radius - World units from the entity's centre.
   * @throws Error when `radius` is not a positive finite number.
   */
  public constructor(public readonly radius: number) {
    if (!(Number.isFinite(radius) && radius > 0)) {
      throw new Error(`An aura needs a positive finite radius, got ${String(radius)}.`);
    }
  }
}
