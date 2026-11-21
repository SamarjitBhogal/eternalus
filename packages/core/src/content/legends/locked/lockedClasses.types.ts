/**
 * A class the selection screen shows as a locked card (DEC-48): shown, never selectable, never
 * given to a bot. Display data only: it is not a `LegendDefinition`, has no entity class and no
 * gameplay. When the class becomes playable (17 R1), its `LegendDefinition` carries these fields
 * and this record goes.
 */
export type LockedClassDefinition = {
  /**
   * Kebab-case content id the playable class will keep. No save, loadout, replay or release stores
   * it yet, so renaming it is a content refactor whose missed references must fail the checks, as
   * for a Legend id (ADR 0018 point 5; ADR 0023; DEC-59); once a save or
   * a release references it, it is never renamed (17 R26).
   */
  readonly id: string;
  /** The name on the card. */
  readonly displayName: string;
  /** One line for the Loadout screen, like `LegendDefinition.roleBlurb`. */
  readonly roleBlurb: string;
  /** Role tag on the card, like `LegendDefinition.roleLabel`. */
  readonly roleLabel: string;
};
