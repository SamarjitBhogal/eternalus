/**
 * What a Legend brings into a match (architecture 05 §12, reference 08 "Loadout slots"): one
 * content id per slot. Only the slots content can fill so far: the class and the primary weapon.
 * The secondary weapon, passive, artifacts, abilities 1–3 and ultimate join as fields when their
 * content lands (05 §12 sketch), each with its rule in `defaultLoadoutRules`.
 */
export type Loadout = {
  /** The Legend class this loadout is for (a `LegendDefinition` id). */
  readonly classId: string;
  /** The weapon the Legend attacks with (a `WeaponDefinition` id; MVP). */
  readonly primaryWeaponId: string;
};
