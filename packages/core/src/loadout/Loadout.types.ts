/**
 * A slot of a `Loadout` (architecture 05 §12, DEC-354 (3)): only the primary weapon so far. Each
 * slot the `Loadout` gains joins this union, and `repairLoadout` maps it to its field.
 */
export type LoadoutSlot = 'primary-weapon';

/**
 * What a Legend brings into a match (architecture 05 §12, reference 08 "Loadout slots"): its class,
 * its Legend and one content id per slot. Only the slots content can fill so far: the primary
 * weapon. The secondary weapon, passive, artifacts, abilities 1–3 and ultimate join as fields when
 * their content lands (05 §12 sketch), each with its rule in `defaultLoadoutRules`.
 */
export type Loadout = {
  /**
   * The Legend class this loadout is for (a `LegendDefinition` id). The class rules key on it.
   * For a loadout of a Legend, it is that Legend's class (`LegendOfClassRule`).
   */
  readonly classId: string;
  /**
   * The Legend this loadout is for (a `LegendSpecDefinition` id; a saved loadout is per Legend,
   * DEC-354 (1)). `null` when the loadout names no Legend: the class default. Nothing in the
   * simulation reads it yet (ADR 0018); the loadout rules check it.
   */
  readonly specId: string | null;
  /** The weapon the Legend attacks with (a `WeaponDefinition` id; MVP). */
  readonly primaryWeaponId: string;
};
