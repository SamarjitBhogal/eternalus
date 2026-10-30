/**
 * A horde formation (architecture 18 §5.1): the leader at the front centre, the other members in
 * ranks of `ranksWidth` abreast behind it, `slotSpacing` apart. Distances are world units.
 */
export type FormationDefinition = {
  readonly id: string;
  readonly ranksWidth: number;
  readonly slotSpacing: number;
};
