/** The layouts a formation can take; each has one slot function (architecture 18 §5.1). */
export type FormationShape = 'ranks';

/**
 * A horde formation (architecture 18 §5.1): the leader at the front centre, the other members in
 * ranks of `ranksWidth` abreast behind it, `slotSpacing` apart. Distances are world units.
 */
export type FormationDefinition = {
  readonly id: string;
  /** Picks the slot function that lays the members out. */
  readonly shape: FormationShape;
  readonly ranksWidth: number;
  readonly slotSpacing: number;
};
