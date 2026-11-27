import type { StructureAuraDefinition } from '../content/structures/structures.types';

/**
 * An entity's aura (architecture 07 §1; DEC-315 (4): the BuffTower): how far it reaches and the
 * status each side gets inside it. The radius is measured beyond the outline box (DEC-323 (3),
 * `outlineBoxOf`: the `Footprint` box, else the centre). `StructureAuraSystem` spreads it, and the
 * snapshot carries the radius and that box, so the client draws the field without knowing a
 * number. One source for both.
 */
export class Aura {
  /**
   * @param definition - The aura, from the entity's definition.
   * @throws Error when `definition.radius` is not a positive finite number.
   */
  public constructor(public readonly definition: StructureAuraDefinition) {
    const { radius } = definition;
    if (!(Number.isFinite(radius) && radius > 0)) {
      throw new Error(`An aura needs a positive finite radius, got ${String(radius)}.`);
    }
  }
}
