/** The three role-rating bars (Figma 58:323), each a fraction from 0 to 1. */
export type RoleRatings = {
  readonly damage: number;
  readonly support: number;
  readonly control: number;
};

/** Display names of a Legend's selection-screen detail rows (Figma 56:47); `null` until named. */
export type SpecDetailNames = {
  readonly signature: string | null;
  readonly specialty: string | null;
  readonly ultimate: string | null;
};

/**
 * A Legend's own name on each team (OA3): the factions are mirror universes, so the Dark name is
 * the Light name spelled backwards. Both are stored; nothing computes one from the other.
 */
export type LegendName = {
  readonly light: string;
  readonly dark: string;
};

/**
 * A Legend: a named specialisation of a class (DEC-49; 17 R2). Display and setup data only (ADR
 * 0018, proposed): no stat modifiers or ability overrides until R2's gameplay lands, so picking
 * one changes nothing in the simulation.
 *
 * @remarks The sub-class title (`displayName`) and the Legend's name (`legendName`) are two
 * different things: the title is the same on both teams, the name is per team.
 */
export type LegendSpecDefinition = {
  /** Kebab-case content id; never renamed once used (17 R26). */
  readonly id: string;
  /**
   * The class's content id (kebab-case, like every id reference in content); `SpecClassExistsRule`
   * checks that it names a loaded Legend class.
   */
  readonly classId: string;
  /** The sub-class title players see ("Oracle"), the same on both teams; never mirrored. */
  readonly displayName: string;
  /**
   * The Legend's name per team; `null` while the owner has named none (every Legionnaire and
   * Sentinel Legend today).
   */
  readonly legendName: LegendName | null;
  /** Role line after the title ("Support"); `null` until written. */
  readonly roleLabel: string | null;
  /** Selection-screen lore paragraph; `null` until written. */
  readonly description: string | null;
  /** `null` while the owner has given none. */
  readonly roleRatings: RoleRatings | null;
  readonly detailNames: SpecDetailNames;
};
